// Linux-only v0.1.1 qualification, after independent review of this exact pack.
// Draft bytes arrive from a separate gh step; this controller must never have a token.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifySha, verifyLaunch, requireGate } from './checks.mjs';

requireGate(process.env); // Before directories, network, child processes, or install.
assert.equal(process.platform,'linux');
assert.equal(process.arch,'x64');
assert.equal(process.version,'v24.22.2');
for(const key of ['GH_TOKEN','GITHUB_TOKEN','NODE_OPTIONS','NODE_PATH','NPM_TOKEN','NODE_AUTH_TOKEN']) assert.ok(!process.env[key],'Forbidden runtime environment key: '+key);
const distribution=fs.readFileSync('/etc/os-release','utf8');
assert.match(distribution,/^ID=ubuntu$/m); assert.match(distribution,/^VERSION_ID="24\.04"$/m);
const mode=process.env.SANDY_ACQUISITION_MODE;
assert.equal(process.argv.length,mode==='draft'?4:3,'Use qualify.mjs FRESH_OUTPUT [DRAFT_ASSET_DIRECTORY]');
const started=process.env.SANDY_QUALIFICATION_STARTED_MS;
assert.match(started||'',/^\d{13}$/,'Missing shared budget start');
const elapsed=Date.now()-Number(started); assert.ok(elapsed>=0 && elapsed<600000,'Shared budget expired or invalid');
const deadline=performance.now()+600000-elapsed;
const draftRoot=mode==='draft'?path.resolve(process.argv[3]):null;
let draftRelease=null;
if(draftRoot) {
  assert.ok(fs.lstatSync(draftRoot).isDirectory() && !fs.lstatSync(draftRoot).isSymbolicLink());
  assert.deepEqual(fs.readdirSync(draftRoot).sort(),['SHA256SUMS','release.json','sandyboxing-read-only-0.1.1.tgz']);
  const meta=fs.lstatSync(path.join(draftRoot,'release.json'));
  assert.ok(meta.isFile() && !meta.isSymbolicLink() && meta.size<=1024);
  draftRelease=JSON.parse(fs.readFileSync(path.join(draftRoot,'release.json'),'utf8'));
  assert.deepEqual(draftRelease,{isDraft:true,tagName:'v0.1.1'});
}
const here=path.dirname(fileURLToPath(import.meta.url));
const pins=JSON.parse(fs.readFileSync(path.join(here,'pins.json'),'utf8'));
const root=path.resolve(process.argv[2]);
assert.equal(fs.existsSync(root),false,'Output root must be fresh; never reuse an install/cache');
const evidence=path.join(root,'evidence');
fs.mkdirSync(evidence,{recursive:true});
const work=path.join(root,'work with spaces');
for(const name of ['home','tmp','cache','prefix','cwd','download','appdata','localappdata']) fs.mkdirSync(path.join(work,name),{recursive:true});
for(const name of ['user.npmrc','global.npmrc']) fs.writeFileSync(path.join(work,name),'',{flag:'wx',mode:0o600});
const env={
  PATH:[path.dirname(process.execPath),'/usr/bin','/bin'].join(path.delimiter), HOME:path.join(work,'home'), USERPROFILE:path.join(work,'home'),
  APPDATA:path.join(work,'appdata'), LOCALAPPDATA:path.join(work,'localappdata'),
  TMP:path.join(work,'tmp'), TEMP:path.join(work,'tmp'), TMPDIR:path.join(work,'tmp'),
  XDG_CACHE_HOME:path.join(work,'cache'), LANG:'C', LC_ALL:'C', NODE_DISABLE_COMPILE_CACHE:'1',
  npm_config_userconfig:path.join(work,'user.npmrc'), npm_config_globalconfig:path.join(work,'global.npmrc'),
  npm_config_cache:path.join(work,'cache','npm'), npm_config_update_notifier:'false',
  npm_config_registry:'https://registry.npmjs.org/', npm_config_ignore_scripts:'true',
  npm_config_audit:'false', npm_config_fund:'false', npm_config_fetch_retries:'0',
  npm_config_fetch_timeout:'60000', npm_config_logs_max:'0', npm_config_progress:'false',
  npm_config_strict_ssl:'true', npm_config_global:'false'
};
function remaining(cap) { const left=Math.floor(Math.min(cap,deadline-performance.now())); assert.ok(left>0,'Aggregate deadline expired'); return left; }
function save(name,value) { fs.writeFileSync(path.join(evidence,name+'.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx'}); }
function present(executable) {
  const suffixes=process.platform==='win32'?['.exe','.cmd','.bat','']:[''];
  return (process.env.PATH||'').split(path.delimiter).some(dir=>suffixes.some(suffix=>fs.existsSync(path.join(dir,executable+suffix))));
}
const receipt={scope:'v011-linux-release-qualification',status:'incomplete',acquisition:mode==='draft'?'draft-authenticated-gh':'public-anonymous',anonymous:mode==='public',draftRelease,sharedBudgetMs:600000,distribution,
  workflow:{sha:process.env.GITHUB_SHA,ref:process.env.GITHUB_REF,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,requestedRunner:'ubuntu-24.04'},
  platform:process.platform,arch:process.arch,osRelease:os.release(),node:process.version,archiveSha256:pins.archiveSha256,
  image:{os:process.env.ImageOS||null,version:process.env.ImageVersion||null},
  hosts:Object.fromEntries(['hermes','claude'].map(name=>[name,{status:present(name)?'available-not-exercised':'unavailable-on-PATH',qualified:false}])),
  caveats:['No user-profile/UI setup','No provider or model calls','No OS egress-denial claim','No private source or credentials supplied','SDK transport close is not independent server-child reap evidence']};
async function run(name,args,cap=30000,executable=process.execPath) {
  const started=Date.now(), timeout=remaining(cap), chunks={stdout:[],stderr:[]};
  let bytes=0, stopped=null, failure=null, closeResult=null;
  const child=spawn(executable,args,{cwd:path.join(work,'cwd'),env,stdio:['ignore','pipe','pipe'],shell:false,windowsHide:true,detached:process.platform!=='win32'});
  function stop(reason) {
    if(stopped || closeResult) return;
    stopped=reason;
    if(child.pid) {
      try { process.kill(-child.pid,'SIGKILL'); } catch { child.kill('SIGKILL'); }
    }
  }
  for(const stream of ['stdout','stderr']) child[stream].on('data',chunk=>{
    bytes+=chunk.length;
    if(bytes>2097152) stop('output-limit'); else chunks[stream].push(chunk);
  });
  child.on('error',error=>{failure=String(error);});
  const timer=setTimeout(()=>stop('timeout'),timeout);
  // The job-level timeout is the final bound if an OS refuses to reap a killed child.
  const result=await new Promise(resolve=>child.once('close',(code,signal)=>{closeResult={code,signal};resolve(closeResult);}));
  clearTimeout(timer);
  const output={argv:[executable,...args],cwd:path.join(work,'cwd'),...result,stopped,failure,pid:child.pid||null,closeObserved:true,milliseconds:Date.now()-started,
    stdout:Buffer.concat(chunks.stdout).toString('utf8'),stderr:Buffer.concat(chunks.stderr).toString('utf8')};
  save(name,output);
  assert.equal(stopped,null,name+' stopped'); assert.equal(failure,null,name+' spawn failure');
  return output;
}
async function success(name,args,cap) { const result=await run(name,args,cap); assert.equal(result.code,0,name+' exit'); assert.equal(result.signal,null); return result.stdout; }
async function download(name,maxBytes) {
  assert.ok(['SHA256SUMS',pins.archive].includes(name));
  if(mode==='draft') {
    const file=path.join(draftRoot,name), stat=fs.lstatSync(file);
    assert.ok(stat.isFile() && !stat.isSymbolicLink(),'Draft asset must be a regular file');
    assert.ok(stat.size<=maxBytes,'Draft asset size exceeded');
    const content=fs.readFileSync(file); assert.ok(content.length<=maxBytes);
    fs.writeFileSync(path.join(work,'download',name),content,{flag:'wx'});
    save('download-'+name.replaceAll('.','-'),{name,bytes:content.length,anonymous:false,acquisition:'draft-authenticated-gh'});
    return content;
  }
  assert.equal(mode,'public');
  let url=new URL('https://github.com/proofgp/sandyboxing-cli/releases/download/'+pins.release+'/'+name);
  const signal=AbortSignal.timeout(remaining(120000));
  const allowed=new Set(['github.com','release-assets.githubusercontent.com','objects.githubusercontent.com']);
  for(let redirect=0;redirect<=5;redirect++) {
    assert.equal(url.protocol,'https:'); assert.equal(url.port,''); assert.equal(url.username,''); assert.equal(url.password,''); assert.ok(allowed.has(url.hostname));
    const response=await fetch(url,{redirect:'manual',signal,headers:{'User-Agent':'sandyboxing-public-qualification/1'}});
    if([301,302,303,307,308].includes(response.status)) {
      const location=response.headers.get('location'); assert.ok(location); await response.body?.cancel(); url=new URL(location,url); continue;
    }
    assert.equal(response.status,200,'Download HTTP status');
    const chunks=[]; let bytes=0;
    for await(const chunk of response.body) {bytes+=chunk.length;assert.ok(bytes<=maxBytes,'Download size exceeded');chunks.push(chunk);}
    const content=Buffer.concat(chunks); fs.writeFileSync(path.join(work,'download',name),content,{flag:'wx'});
    // Never retain signed redirect query strings.
    save('download-'+name.replaceAll('.','-'),{name,bytes,finalHost:url.hostname,status:response.status,anonymous:true,acquisition:'public-anonymous'});
    return content;
  }
  throw Error('Redirect limit');
}
try {
  const nodeDir=path.dirname(process.execPath);
  const candidates=[path.join(nodeDir,'node_modules/npm/bin/npm-cli.js'),path.resolve(nodeDir,'../lib/node_modules/npm/bin/npm-cli.js')];
  const npm=candidates.find(candidate=>fs.existsSync(candidate)); assert.ok(npm,'Bundled npm CLI unavailable');
  receipt.npm=(await success('npm-version',[npm,'--version'])).trim(); assert.equal(receipt.npm,pins.npm);
  const checksums=await download('SHA256SUMS',512);
  assert.equal(checksums.toString('utf8'),`${pins.archiveSha256}  ${pins.archive}\n`);
  const archive=await download(pins.archive,100000);
  assert.equal(archive.length,pins.archiveBytes); verifySha(archive,pins.archiveSha256);
  save('archive-check',{sha256:pins.archiveSha256,bytes:archive.length,matchedPinnedDigest:true});
  const prefix=path.join(work,'prefix'), archiveFile=path.join(work,'download',pins.archive);
  // Only this exact, independently audited six-regular-member archive is admitted.
  // This is not a generic arbitrary-tar safety parser.
  const members=['LICENSE','npm-shrinkwrap.json','package.json','README.md','dist-cli/index.mjs','EXTERNAL-DEPENDENCIES.txt'];
  assert.deepEqual(Object.keys(pins.members).sort(),[...members].sort());
  const archiveStat=fs.lstatSync(archiveFile);
  assert.ok(archiveStat.isFile() && !archiveStat.isSymbolicLink());
  assert.equal(archiveStat.size,pins.archiveBytes); verifySha(fs.readFileSync(archiveFile),pins.archiveSha256);
  assert.ok(fs.lstatSync(prefix).isDirectory() && !fs.lstatSync(prefix).isSymbolicLink());
  assert.deepEqual(fs.readdirSync(prefix),[],'Installation prefix must be empty');
  const names=await run('archive-members',['-tzf',archiveFile],30000,'/usr/bin/tar');
  assert.equal(names.code,0); assert.equal(names.signal,null);
  assert.deepEqual(names.stdout.trimEnd().split('\n').sort(),members.map(name=>'package/'+name).sort());
  fs.mkdirSync(path.join(prefix,'node_modules'));
  const packageRoot=path.join(prefix,'node_modules','sandyboxing');
  fs.mkdirSync(packageRoot); // No recursive/reuse option: fresh owned application root.
  const extraction=await run('archive-extract',['-xzpf',archiveFile,'--no-same-owner','--strip-components=1','-C',packageRoot,...members.map(name=>'package/'+name)],30000,'/usr/bin/tar');
  assert.equal(extraction.code,0); assert.equal(extraction.signal,null);
  function verifyOwnFiles() {
    for(const [relative,sha] of Object.entries(pins.members)) {
      const file=path.join(packageRoot,relative), stat=fs.lstatSync(file);
      assert.ok(stat.isFile() && !stat.isSymbolicLink(),relative+' regular file');
      assert.equal(stat.mode&0o7777,relative==='dist-cli/index.mjs'?0o755:0o644,relative+' mode');
      verifySha(fs.readFileSync(file),sha);
    }
  }
  verifyOwnFiles();
  save('extracted-own-files',{matched:members,modesMatched:true});
  // The shipped shrinkwrap is authoritative at its matching application root.
  // No wrapper manifest, mismatched lock seed, or project .bin link is created.
  await success('fresh-install',[npm,'ci','--prefix',packageRoot,'--registry=https://registry.npmjs.org/','--ignore-scripts','--no-audit','--no-fund','--omit=dev','--fetch-retries=0','--strict-ssl=true'],300000);
  env.npm_config_offline='true'; // Installation is the only npm network stage.
  verifyOwnFiles();
  save('installed-own-files',{matched:members,modesMatched:true});
  const shrinkwrap=JSON.parse(fs.readFileSync(path.join(packageRoot,'npm-shrinkwrap.json'),'utf8'));
  const locked=Object.entries(shrinkwrap.packages).filter(([name])=>name!=='');
  assert.equal(locked.length,pins.dependencyEntries);
  assert.equal(shrinkwrap.packages[''].version,pins.version);
  assert.deepEqual(shrinkwrap.packages[''].dependencies,{'@modelcontextprotocol/sdk':pins.sdk,zod:pins.zod});
  const installedLock=JSON.parse(fs.readFileSync(path.join(packageRoot,'node_modules','.package-lock.json'),'utf8')).packages;
  assert.deepEqual(Object.keys(installedLock).sort(),locked.map(([name])=>name).sort());
  for(const [name,expected] of locked) {
    for(const key of ['version','resolved','integrity']) assert.equal(installedLock[name][key],expected[key],name+' '+key);
    const manifest=JSON.parse(fs.readFileSync(path.join(packageRoot,name,'package.json'),'utf8'));
    assert.equal(manifest.name,name.split('node_modules/').at(-1));
    assert.equal(manifest.version,expected.version);
  }
  save('dependency-lock-check',{dependencyEntries:locked.length,sdk:pins.sdk,zod:pins.zod,scope:'exact-lock-identities-and-manifest-versions-not-independent-file-provenance'});
  const listing=JSON.parse(await success('dependency-list',[npm,'ls','--prefix',packageRoot,'--all','--json'],30000));
  const diagnostics=[]; function collect(node) {if(node.problems)diagnostics.push(...node.problems);for(const child of Object.values(node.dependencies||{}))collect(child);} collect(listing);
  assert.deepEqual(diagnostics,[]); assert.equal(listing.name,'sandyboxing'); assert.equal(listing.version,pins.version);
  const entry=path.join(packageRoot,'dist-cli','index.mjs');
  await success('sdk-selftests',['--test-reporter=tap',path.join(here,'sdk-selftest.mjs'),entry],30000);
  const help=await success('installed-help',[entry,'--help']); assert.match(help,/mcp-config/); assert.match(help,/--read-only/);
  const doctor=JSON.parse(await success('installed-doctor',[entry,'doctor','--json'],45000));
  assert.equal(doctor.status,'ok'); assert.equal(doctor.runtime.actual,pins.node); assert.equal(doctor.runtime.matchesDeclared,true);
  assert.equal(doctor.mode,'read-only'); assert.equal(doctor.liveExecution,'disabled'); assert.equal(doctor.credentials,'not-inspected');
  assert.deepEqual(doctor.checks.map(check=>check.id).sort(),['catalogue','compact-planning','compact-search','discovery','planning','provider-details','read-only','runtime','startup']);
  assert.ok(doctor.checks.every(check=>check.status==='pass'));
  const config=JSON.parse(await success('installed-config',[entry,'mcp-config','--json'])); verifyLaunch(config,process.execPath,entry);
  const configFile=path.join(work,'launch.json'); fs.writeFileSync(configFile,JSON.stringify(config),{flag:'wx'});
  const sdk=JSON.parse(await success('sdk-stdio',[path.join(here,'sdk-stdio.mjs'),entry,configFile,path.join(here,'public-result-pins.json')],45000));
  assert.equal(sdk.sdkCloseReturned,true); receipt.sdk=sdk;
  for(const [name,args] of [['invalid-combined',['mcp --read-only']],['invalid-live',['mcp','--live']],['invalid-extra',['mcp-config','--json','extra']]]) {
    const result=await run(name,[entry,...args]); assert.equal(result.code,2); assert.equal(result.signal,null);
  }
  // Same installed own-code bytes after runtime; dependencies are not claimed independently immutable.
  verifyOwnFiles();
  remaining(1);
  receipt.status='passed';
} catch(error) {
  receipt.status='failed'; receipt.failure=String(error); process.exitCode=1;
} finally {
  save('RESULT',receipt); console.log(JSON.stringify(receipt,null,2));
}
