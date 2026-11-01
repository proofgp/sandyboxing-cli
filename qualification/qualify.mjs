// Run only after website delivery AND independent approval of this public pack.
// GitHub standard hosted runners only; no secrets, paid machines, or private source.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifySha, verifyLaunch, requireGate } from './checks.mjs';

requireGate(process.env); // Before directories, network, child processes, or install.
assert.ok(['linux','win32'].includes(process.platform));
assert.equal(process.arch,'x64');
assert.equal(process.version,'v24.22.2');
const here=path.dirname(fileURLToPath(import.meta.url));
const pins=JSON.parse(fs.readFileSync(path.join(here,'pins.json'),'utf8'));
const root=path.resolve(process.argv[2] || 'qualification-run');
assert.equal(fs.existsSync(root),false,'Output root must be fresh; never reuse an install/cache');
const evidence=path.join(root,'evidence');
fs.mkdirSync(evidence,{recursive:true});
const work=path.join(root,'work with spaces');
for(const name of ['home','tmp','cache','prefix','cwd','download','appdata','localappdata']) fs.mkdirSync(path.join(work,name),{recursive:true});
for(const name of ['user.npmrc','global.npmrc']) fs.writeFileSync(path.join(work,name),'',{flag:'wx',mode:0o600});
const env={
  PATH:process.env.PATH, HOME:path.join(work,'home'), USERPROFILE:path.join(work,'home'),
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
for(const key of ['SYSTEMROOT','WINDIR']) if(process.env[key]) env[key]=process.env[key];
const deadline=Date.now()+600000; // Shared 10-minute harness ceiling; job is capped at 15.
function remaining(cap) { const left=Math.min(cap,deadline-Date.now()); assert.ok(left>0,'Aggregate deadline expired'); return left; }
function save(name,value) { fs.writeFileSync(path.join(evidence,name+'.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx'}); }
function present(executable) {
  const suffixes=process.platform==='win32'?['.exe','.cmd','.bat','']:[''];
  return (process.env.PATH||'').split(path.delimiter).some(dir=>suffixes.some(suffix=>fs.existsSync(path.join(dir,executable+suffix))));
}
const receipt={scope:'public-artifact-platform-qualification',status:'incomplete',platform:process.platform,arch:process.arch,osRelease:os.release(),node:process.version,archiveSha256:pins.archiveSha256,
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
    if(process.platform==='win32' && child.pid) {
      const killer=spawn(path.join(env.SYSTEMROOT,'System32','taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{env,stdio:'ignore',windowsHide:true});
      killer.on('error',()=>{child.kill();});
    } else if(child.pid) {
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
  let url=new URL('https://github.com/proofgp/sandyboxing-cli/releases/download/v0.1.0/'+name);
  const signal=AbortSignal.timeout(remaining(120000));
  const allowed=new Set(['github.com','release-assets.githubusercontent.com','objects.githubusercontent.com']);
  for(let redirect=0;redirect<=5;redirect++) {
    assert.equal(url.protocol,'https:'); assert.equal(url.username,''); assert.equal(url.password,''); assert.ok(allowed.has(url.hostname));
    const response=await fetch(url,{redirect:'manual',signal,headers:{'User-Agent':'sandyboxing-public-qualification/1'}});
    if([301,302,303,307,308].includes(response.status)) {
      const location=response.headers.get('location'); assert.ok(location); await response.body?.cancel(); url=new URL(location,url); continue;
    }
    assert.equal(response.status,200,'Download HTTP status');
    const chunks=[]; let bytes=0;
    for await(const chunk of response.body) {bytes+=chunk.length;assert.ok(bytes<=maxBytes,'Download size exceeded');chunks.push(chunk);}
    const content=Buffer.concat(chunks); fs.writeFileSync(path.join(work,'download',name),content,{flag:'wx'});
    // Never retain signed redirect query strings.
    save('download-'+name.replaceAll('.','-'),{name,bytes,finalHost:url.hostname,status:response.status,anonymous:true});
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
  assert.equal(checksums.toString('utf8').trim(),`${pins.archiveSha256}  ${pins.archive}`);
  const archive=await download(pins.archive,100000);
  assert.equal(archive.length,pins.archiveBytes); verifySha(archive,pins.archiveSha256);
  save('archive-check',{sha256:pins.archiveSha256,bytes:archive.length,matchedPinnedDigest:true});
  const prefix=path.join(work,'prefix'), archiveFile=path.join(work,'download',pins.archive);
  // An explicit root manifest makes npm-ls diagnostics meaningful, not an unmanaged-prefix extraneous tree.
  fs.writeFileSync(path.join(prefix,'package.json'),JSON.stringify({name:'sandyboxing-qualification-root',version:'0.0.0',private:true,dependencies:{sandyboxing:'file:../download/'+pins.archive}},null,2)+'\n',{flag:'wx'});
  await success('fresh-install',[npm,'install','--prefix',prefix,'--registry=https://registry.npmjs.org/','--ignore-scripts','--no-audit','--no-fund','--no-save','--no-package-lock','--omit=dev','--fetch-retries=0','--strict-ssl=true',archiveFile],300000);
  const packageRoot=path.join(prefix,'node_modules','sandyboxing');
  for(const [relative,sha] of Object.entries(pins.members)) verifySha(fs.readFileSync(path.join(packageRoot,relative)),sha);
  save('installed-own-files',{matched:Object.keys(pins.members)});
  const listing=JSON.parse(await success('dependency-list',[npm,'ls','--prefix',prefix,'--all','--json'],30000));
  const diagnostics=[]; function collect(node) {if(node.problems)diagnostics.push(...node.problems);for(const child of Object.values(node.dependencies||{}))collect(child);} collect(listing);
  assert.deepEqual(diagnostics,[]); assert.equal(listing.dependencies.sandyboxing.version,'0.1.0');
  const entry=path.join(packageRoot,'dist-cli','index.mjs');
  await success('sdk-selftests',['--test-reporter=tap',path.join(here,'sdk-selftest.mjs'),entry],30000);
  const help=await success('installed-help',[entry,'--help']); assert.match(help,/mcp-config/); assert.match(help,/--read-only/);
  const doctor=JSON.parse(await success('installed-doctor',[entry,'doctor','--json'],45000));
  assert.equal(doctor.status,'ok'); assert.equal(doctor.runtime.actual,pins.node); assert.equal(doctor.runtime.matchesDeclared,true);
  assert.equal(doctor.mode,'read-only'); assert.equal(doctor.liveExecution,'disabled'); assert.equal(doctor.credentials,'not-inspected');
  assert.deepEqual(doctor.checks.map(check=>check.id).sort(),['catalogue','discovery','planning','read-only','runtime','startup']);
  assert.ok(doctor.checks.every(check=>check.status==='pass'));
  const config=JSON.parse(await success('installed-config',[entry,'mcp-config','--json'])); verifyLaunch(config,process.execPath,entry);
  const configFile=path.join(work,'launch.json'); fs.writeFileSync(configFile,JSON.stringify(config),{flag:'wx'});
  const sdk=JSON.parse(await success('sdk-stdio',[path.join(here,'sdk-stdio.mjs'),entry,configFile,path.join(here,'public-result-pins.json')],45000));
  assert.equal(sdk.sdkCloseReturned,true); receipt.sdk=sdk;
  for(const [name,args] of [['invalid-combined',['mcp --read-only']],['invalid-live',['mcp','--live']],['invalid-extra',['mcp-config','--json','extra']]]) {
    const result=await run(name,[entry,...args]); assert.equal(result.code,2); assert.equal(result.signal,null);
  }
  // Same installed own-code bytes after runtime; dependencies are not claimed independently immutable.
  for(const [relative,sha] of Object.entries(pins.members)) verifySha(fs.readFileSync(path.join(packageRoot,relative)),sha);
  receipt.status='passed';
} catch(error) {
  receipt.status='failed'; receipt.failure=String(error); process.exitCode=1;
} finally {
  save('RESULT',receipt); console.log(JSON.stringify(receipt,null,2));
}
