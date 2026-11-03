import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const controller=fs.readFileSync(path.join(here,'qualify.mjs'),'utf8');
test('controller is Linux-only before any output creation',()=>{
  assert.ok(controller.indexOf("assert.equal(process.platform,'linux')")>0,'Missing Linux-only native gate');
  assert.ok(controller.indexOf("assert.equal(process.platform,'linux')")<controller.indexOf('fs.mkdirSync'));
});
test('controller refuses tokens and injected Node loaders before directories',()=>{
  const cut=controller.slice(0,controller.indexOf('fs.mkdirSync'));
  assert.match(cut,/GH_TOKEN/); assert.match(cut,/GITHUB_TOKEN/); assert.match(cut,/NODE_OPTIONS/); assert.match(cut,/NODE_PATH/);
});

test('workflow exposes only reviewed Linux draft and anonymous public modes',()=>{
  const file=path.join(here,'../.github/workflows/qualify-readonly-v011.yml');
  assert.ok(fs.existsSync(file),'Missing v011 workflow');
  const workflow=fs.readFileSync(file,'utf8');
  assert.match(workflow,/runs-on: ubuntu-24\.04/);
  assert.match(workflow,/timeout-minutes: 15/);
  assert.match(workflow,/options: \[draft, public\]/);
  assert.match(workflow,/contents: read/);
  assert.doesNotMatch(workflow,/windows-|self-hosted|pull_request|push:|secrets\./);
  assert.match(workflow,/persist-credentials: false/);
  assert.match(workflow,/node-version: '24\.22\.2'/);
  const actions=[...workflow.matchAll(/uses: ([^\n]+)/g)].map(m=>m[1]);
  assert.equal(actions.length,5);
  for(const action of actions)assert.match(action,/@[0-9a-f]{40}(?: |$)/);
  assert.equal((workflow.match(/GH_TOKEN:/g)||[]).length,1);
  assert.equal((workflow.match(/github\.token/g)||[]).length,1);
  const step=workflow.slice(workflow.indexOf('      - name: Download exact draft assets'),workflow.indexOf('      - name: Qualify exact bytes'));
  assert.match(step,/GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(step,/timeout --signal=KILL 120s/);
  assert.match(step,/gh release download v0\.1\.1/);
});

const workflow=fs.readFileSync(path.join(here,'../.github/workflows/qualify-readonly-v011.yml'),'utf8');
function job(name) {
  const body=workflow.match(new RegExp('^  '+name+':\\n([\\s\\S]*?)(?=^  [a-z_]+:|$(?![\\s\\S]))','m'));
  assert.ok(body,'Missing separate job: '+name); return body[1];
}
function jobGate(body,{mode='draft',result='success',review='reviewed',cancelled=false,privateRepo=false,repo='proofgp/sandyboxing-cli'}={}) {
  const condition=body.match(/^    if: >-\n([\s\S]*?)(?=^    \S)/m)?.[1].trim();
  assert.ok(condition,'Missing explicit job condition');
  // Evaluate the exact checked-in Boolean expression, not a handwritten schedule.
  const expr=condition.replace(/^\$\{\{\s*|\s*\}\}$/g,'').replaceAll('!cancelled()','!isCancelled');
  assert.doesNotMatch(expr,/success\(\)|always\(\)/);
  return new Function('github','inputs','needs','isCancelled','return ('+expr+');')(
    {repository:repo,event:{repository:{private:privateRepo}}},
    {acquisition_mode:mode,release_review:review},{draft_download:{result}},cancelled);
}
test('draft write authority is isolated while the read-only consumer schedules both authorized modes',()=>{
  const producer=job('draft_download'),consumer=job('qualify');
  assert.match(workflow.split('jobs:')[0],/permissions:\n  contents: read/);
  assert.equal((workflow.match(/contents: write/g)||[]).length,1);
  assert.match(producer,/permissions:\n      contents: write/);
  assert.match(producer,/timeout-minutes: 3/);
  assert.doesNotMatch(producer,/actions\/checkout|actions\/setup-node|\bnpm\b|\bnode\b|qualification-v011\//);
  assert.match(consumer,/permissions:\n      contents: read/);
  assert.match(consumer,/needs: \[draft_download\]/);
  assert.match(consumer,/!cancelled\(\)/); // Defeats Actions' implicit success() on a skipped need.
  assert.doesNotMatch(consumer,/GH_TOKEN|GITHUB_TOKEN|github\.token|gh release/);
  assert.equal(jobGate(producer),true);
  assert.equal(jobGate(producer,{mode:'public'}),false);
  assert.equal(jobGate(consumer,{mode:'public',result:'skipped'}),true);
  assert.equal(jobGate(consumer,{mode:'draft',result:'success'}),true);
  for(const result of ['failure','cancelled','skipped']) assert.equal(jobGate(consumer,{result}),false);
  for(const result of ['success','failure','cancelled']) assert.equal(jobGate(consumer,{mode:'public',result}),false);
  for(const body of [producer,consumer]) for(const extra of [{review:'hold'},{privateRepo:true},{repo:'other/repo'},{mode:'other'},{cancelled:true}]) {
    assert.equal(jobGate(body,extra),false);
  }
  assert.match(producer,/uses: actions\/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02/);
  assert.match(consumer,/uses: actions\/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093/);
  const name='name: readonly-v011-draft-${{ github.run_id }}-${{ github.run_attempt }}';
  assert.ok(producer.includes(name)); assert.ok(consumer.includes(name));
  assert.match(producer,/if-no-files-found: error/);
  assert.match(producer,/retention-days: 1/);
  assert.match(producer,/overwrite: false/);
  assert.match(producer,/include-hidden-files: false/);
  const transfer=producer.slice(producer.indexOf('          path: |'),producer.indexOf('          if-no-files-found:'));
  assert.deepEqual(transfer.trim().split('\n').slice(1).map(s=>s.trim()),[
    '${{ runner.temp }}/sandy-v011-draft-${{ github.run_id }}-${{ github.run_attempt }}/SHA256SUMS',
    '${{ runner.temp }}/sandy-v011-draft-${{ github.run_id }}-${{ github.run_attempt }}/release.json',
    '${{ runner.temp }}/sandy-v011-draft-${{ github.run_id }}-${{ github.run_attempt }}/sandyboxing-read-only-0.1.1.tgz'
  ]);
});

test('privileged producer verifies fixed bytes and emits only safe release metadata before transfer',()=>{
  const producer=job('draft_download');
  const begin=producer.indexOf('      - name: Verify exact draft inputs before transfer');
  const end=producer.indexOf('      - name: Transfer only verified draft inputs');
  assert.ok(begin>producer.indexOf('gh release download') && begin<end,'Missing producer validation before upload');
  const verification=producer.slice(begin,end);
  assert.doesNotMatch(verification,/GH_TOKEN|github\.token|gh release|\bnpm\b|\bnode\b/);
  assert.match(verification,/80233/);
  assert.match(verification,/a166ebde41b87ed5c66270db0d68bf0bbdf173ff72259721503703034b821f9a/);
  assert.match(verification,/cmp -s/); assert.match(verification,/sha256sum --check --status/);
  assert.match(verification,/jq -e/);
  assert.match(verification,/isDraft/);assert.match(verification,/tagName/);
  assert.match(verification,/! -L/);assert.match(verification,/-f/);
  assert.doesNotMatch(verification,/>\s*"\$DRAFT_ASSETS\/release\.json"/,'Validation must retain the original metadata bytes');
});

// Execute the checked-in metadata shell statements, not a JS predicate model.
// Archive/inventory checks are separate; these cuts need no downloaded archive.
function metadataShell(boundary) {
  const producer=job('draft_download');
  if(boundary==='initial') {
    const line=producer.match(/^            jq[^\n]+$/m)?.[0].trim();
    assert.ok(line,'Missing initial metadata command');
    return "bash -euo pipefail -c '"+line+"'\n"; // Preserve the outer shell's quote handling.
  }
  const step=producer.split('      - name: Verify exact draft inputs before transfer\n')[1].split('      - name:')[0];
  const lines=step.split('        run: |\n')[1].split('\n').map(line=>line.slice(10));
  const metadata=lines.filter(line=>line.includes('"$DRAFT_ASSETS/release.json"') && !line.includes('wc -c'));
  assert.ok(metadata.some(line=>line.startsWith('jq ')),'Missing verification metadata command');
  return metadata.join('\n')+'\n'; // Includes any metadata overwrite, so retention is exercised.
}
const metadataBegin='let draftRelease=null;\n',metadataEnd='const here=';
assert.equal(controller.split(metadataBegin).length,2);assert.equal(controller.split(metadataEnd).length,2);
const consumeMetadata=new Function('draftRoot','fs','path','assert',controller.slice(controller.indexOf(metadataBegin),controller.indexOf(metadataEnd))+'\nreturn draftRelease;');
function metadataCase(boundary,raw,accept) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'v011-metadata-'));
  try {
    for(const name of ['SHA256SUMS','sandyboxing-read-only-0.1.1.tgz'])fs.writeFileSync(path.join(root,name),'');
    const file=path.join(root,'release.json');fs.writeFileSync(file,raw);
    const result=spawnSync('/bin/bash',['--noprofile','--norc','-e','-o','pipefail'],{
      input:metadataShell(boundary),encoding:'utf8',timeout:5000,cwd:root,
      env:{PATH:'/usr/bin:/bin:/sbin',HOME:root,TMPDIR:root,LANG:'C',LC_ALL:'C',DRAFT_ASSETS:root}
    });
    assert.ifError(result.error);assert.equal(result.signal,null);
    assert.deepEqual(fs.readFileSync(file),Buffer.from(raw),'Original release.json bytes must survive validation');
    if(accept) {
      assert.equal(result.status,0,result.stderr);
      assert.deepEqual(consumeMetadata(root,fs,path,assert),{isDraft:true,tagName:'v0.1.1'});
    } else {
      assert.notEqual(result.status,0,'Metadata shell falsely accepted '+JSON.stringify(raw));
      assert.throws(()=>consumeMetadata(root,fs,path,assert),'Unchanged consumer must reject retained invalid bytes');
    }
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
}
test('verification metadata shell retains noncanonical single-object bytes for the unchanged consumer',()=>{
  metadataCase('verification',' \n{\t"tagName" : "v0.1.1",\r\n "isDraft" : true }\n\t',true);
});
const validMetadata='{"isDraft":true,"tagName":"v0.1.1"}\n';
const wrongMetadata='{"isDraft":false,"tagName":"v0.1.0"}\n';
for(const boundary of ['initial','verification']) {
  test(boundary+' metadata shell accepts one exact-shape object',()=>metadataCase(boundary,validMetadata,true));
  for(const [name,raw] of [
    ['false-then-true',wrongMetadata+validMetadata],['two-true',validMetadata+validMetadata],
    ['true-then-false',validMetadata+wrongMetadata],['empty',''],['whitespace',' \n\t'],['invalid-json','{'],
    ['wrong-type','{"isDraft":"true","tagName":"v0.1.1"}\n'],['null','null\n'],
    ['wrong-tag','{"isDraft":true,"tagName":"v0.1.0"}\n'],['not-draft','{"isDraft":false,"tagName":"v0.1.1"}\n'],
    ['extra-key','{"isDraft":true,"tagName":"v0.1.1","extra":0}\n'],['array','['+validMetadata.trim()+']\n'],
    ['missing-key','{"isDraft":true}\n'],['number','1\n'],['boolean','true\n'],['string','"metadata"\n'],
    ['trailing-garbage',validMetadata+'junk']
  ]) test(boundary+' metadata shell rejects '+name+' without sanitizing consumer input',()=>metadataCase(boundary,raw,false));
}
test('initial metadata shell retains noncanonical single-object bytes for the unchanged consumer',()=>{
  metadataCase('initial',' \n{\t"tagName" : "v0.1.1",\r\n "isDraft" : true }\n\t',true);
});

const {requireGate}=await import('./checks.mjs');
const startup=controller.slice(controller.indexOf('requireGate(process.env);'),controller.indexOf('const here='));
const invokeStartup=new Function('process','requireGate','assert','fs','path',startup+'\nreturn true;');
function validProcess() {return {platform:'linux',arch:'x64',version:'v24.22.2',argv:['node','qualify','fresh-output'],env:{
  GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'proofgp/sandyboxing-cli',GITHUB_EVENT_NAME:'workflow_dispatch',RUNNER_ENVIRONMENT:'github-hosted',RUNNER_OS:'Linux',RUNNER_ARCH:'X64',SANDY_RELEASE_REVIEW:'reviewed',SANDY_ACQUISITION_MODE:'public',SANDY_QUALIFICATION_STARTED_MS:String(Date.now())
}};}
function startupCall(p,distribution='ID=ubuntu\nVERSION_ID="24.04"\n') {
  return invokeStartup(p,requireGate,assert,{readFileSync:file=>{assert.equal(file,'/etc/os-release');return distribution;}},path);
}
test('pure simulated hosted Linux startup positive (not native qualification)',()=>assert.equal(startupCall(validProcess()),true));
for(const [field,value] of [['platform','win32'],['platform','darwin'],['arch','arm64'],['version','v24.0.0']]) {
  test('startup refuses '+field+' '+value,()=>assert.throws(()=>startupCall({...validProcess(),[field]:value})));
}
for(const key of ['GH_TOKEN','GITHUB_TOKEN','NODE_OPTIONS','NODE_PATH','NPM_TOKEN','NODE_AUTH_TOKEN']) {
  test('startup refuses synthetic '+key+' before writes',()=>{
    const p=validProcess();p.env[key]='non-secret-test-canary';assert.throws(()=>startupCall(p),new RegExp('Forbidden runtime environment key: '+key));
  });
}
test('startup refuses wrong Ubuntu version',()=>assert.throws(()=>startupCall(validProcess(),'ID=ubuntu\nVERSION_ID="22.04"\n')));
for(const delta of [-600001,100000]) test('shared budget refuses expired or future start '+delta,()=>{
  const p=validProcess();p.env.SANDY_QUALIFICATION_STARTED_MS=String(Date.now()+delta);
  assert.throws(()=>startupCall(p),/Shared budget expired or invalid/);
});
test('public mode forbids a local-asset argument',()=>{const p=validProcess();p.argv.push('cached-assets');assert.throws(()=>startupCall(p),/Use qualify/);});
const preflight=fs.readFileSync(path.join(here,'preflight.mjs'),'utf8');
const invokePreflight=new Function('process','requireGate','assert','fs','console','Date',preflight.slice(preflight.indexOf('requireGate(process.env);')));
function preflightCall(mode,started,now=1800000000000) {
  const p=validProcess(),output=[];p.env.SANDY_ACQUISITION_MODE=mode;
  if(started===undefined)delete p.env.SANDY_QUALIFICATION_STARTED_MS;else p.env.SANDY_QUALIFICATION_STARTED_MS=started;
  invokePreflight(p,requireGate,assert,{readFileSync:()=> 'ID=ubuntu\nVERSION_ID="24.04"\n'}, {log:line=>output.push(line)}, {now:()=>now});
  assert.equal(output.length,1);return output[0];
}
test('preflight preserves the exact producer start across job delay, not a fresh ten minutes',()=>{
  const now=1800000000000,started=String(now-125000);
  assert.equal(preflightCall('draft',started,now),'started-ms='+started);
});
for(const started of [undefined,'','not-a-time','1800000000000\n','1800000000001','1799999400000','1799999399999']) {
  test('preflight refuses missing, malformed, future or exhausted draft budget '+JSON.stringify(started),()=>{
    assert.throws(()=>preflightCall('draft',started),/Missing shared budget start|Shared budget expired or invalid/);
  });
}
test('public preflight starts normally without a skipped producer output',()=>{
  assert.equal(preflightCall('public',undefined),'started-ms=1800000000000');
  assert.equal(preflightCall('public',''),'started-ms=1800000000000');
});
test('public preflight cannot reset an accidentally inherited budget',()=>{
  assert.throws(()=>preflightCall('public','1799999999999'),/Public mode must not inherit/);
});
test('workflow wires one start before draft acquisition through preflight to controller',()=>{
  const producer=job('draft_download'),consumer=job('qualify');
  assert.match(producer,/outputs:\n      started-ms: \$\{\{ steps.acquire.outputs.started-ms \}\}/);
  assert.match(producer,/id: acquire/);
  const start=producer.indexOf('printf \'started-ms=%s\\n\' "$(date +%s%3N)" >> "$GITHUB_OUTPUT"');
  assert.ok(start>0 && start<producer.indexOf('gh release view'));
  assert.match(consumer,/SANDY_QUALIFICATION_STARTED_MS: \$\{\{ needs.draft_download.outputs.started-ms \}\}/);
  assert.match(consumer,/SANDY_QUALIFICATION_STARTED_MS: \$\{\{ steps.preflight.outputs.started-ms \}\}/);
  assert.ok(consumer.indexOf('node qualification-v011/preflight.mjs')<consumer.indexOf('uses: actions/download-artifact'));
});

test('child environment is allowlisted, not copied from ambient secrets or npm config',()=>{
  const start=controller.indexOf('const env={'),end=controller.indexOf('function remaining(');
  const makeEnv=new Function('path','process','work',controller.slice(start,end)+'\nreturn env;');
  const env=makeEnv(path,{execPath:'/pinned/bin/node',env:{PATH:'/untrusted',GH_TOKEN:'synthetic',SANDY_FAKE_SECRET:'synthetic',NODE_OPTIONS:'synthetic',npm_config_proxy:'synthetic'}},'/owned');
  assert.equal(env.PATH,'/pinned/bin:/usr/bin:/bin');
  for(const key of ['GH_TOKEN','SANDY_FAKE_SECRET','NODE_OPTIONS','npm_config_proxy'])assert.equal(env[key],undefined);
  assert.equal(env.HOME,'/owned/home'); assert.equal(env.npm_config_registry,'https://registry.npmjs.org/');
  assert.equal(env.npm_config_ignore_scripts,'true');
  assert.notEqual(env.npm_config_userconfig,env.npm_config_globalconfig);
});

const dependencyBegin='  const shrinkwrap=',dependencyEnd='  const listing=';
assert.equal(controller.split(dependencyBegin).length,2);assert.equal(controller.split(dependencyEnd).length,2);
const dependencyCut=new Function('fs','path','assert','pins','packageRoot','prefix','save',controller.slice(controller.indexOf(dependencyBegin),controller.indexOf(dependencyEnd)));
function dependencyFixture() {
  const pins={version:'0.1.1',sdk:'1.32.1',zod:'4.6.7',dependencyEntries:2};
  const dependencies={'@modelcontextprotocol/sdk':pins.sdk,zod:pins.zod};
  const packages={'':{version:pins.version,dependencies}};
  const hidden={};
  const files={};
  for(const [name,version] of Object.entries(dependencies)) {
    packages['node_modules/'+name]={version,resolved:'https://registry.npmjs.org/'+name,integrity:'synthetic-'+name};
    hidden['node_modules/'+name]={...packages['node_modules/'+name]};
    files['/prefix/node_modules/sandyboxing/node_modules/'+name+'/package.json']={name,version};
  }
  files['/prefix/node_modules/sandyboxing/npm-shrinkwrap.json']={packages};
  files['/prefix/node_modules/sandyboxing/node_modules/.package-lock.json']={packages:hidden};
  return {pins,packages,hidden,files};
}
function checkDependencies(f) {
  const records=[];
  dependencyCut({readFileSync:file=>{assert.ok(file in f.files);return JSON.stringify(f.files[file]);}},path,assert,f.pins,'/prefix/node_modules/sandyboxing','/prefix',(...r)=>records.push(r));
  return records;
}
test('dependency identity verifier accepts an exact synthetic locked inventory',()=>assert.equal(checkDependencies(dependencyFixture())[0][1].dependencyEntries,2));
for(const [name,mutate] of [
  ['missing entry',f=>delete f.hidden['node_modules/zod']],['surplus entry',f=>f.hidden['node_modules/extra']={}],
  ['changed integrity',f=>f.hidden['node_modules/zod'].integrity='altered'],['changed origin',f=>f.hidden['node_modules/zod'].resolved='https://foreign.invalid'],
  ['changed manifest version',f=>f.files['/prefix/node_modules/sandyboxing/node_modules/zod/package.json'].version='0.0.0'],
  ['changed manifest name',f=>f.files['/prefix/node_modules/sandyboxing/node_modules/zod/package.json'].name='other'],
  ['wrong package version',f=>f.packages[''].version='0.1.0'],['wrong declared count',f=>f.pins.dependencyEntries=95]
])test('dependency identity verifier refuses '+name,()=>{const f=dependencyFixture();mutate(f);assert.throws(()=>checkDependencies(f));});
