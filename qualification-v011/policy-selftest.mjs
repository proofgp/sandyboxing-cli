import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
  assert.equal(actions.length,3);
  for(const action of actions)assert.match(action,/@[0-9a-f]{40}(?: |$)/);
  assert.equal((workflow.match(/GH_TOKEN:/g)||[]).length,1);
  assert.equal((workflow.match(/github\.token/g)||[]).length,1);
  const step=workflow.slice(workflow.indexOf('      - name: Download exact draft assets'),workflow.indexOf('      - name: Qualify exact bytes'));
  assert.match(step,/GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(step,/timeout --signal=KILL 120s/);
  assert.match(step,/gh release download v0\.1\.1/);
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
  const hidden={'node_modules/sandyboxing':{version:pins.version}};
  const files={};
  for(const [name,version] of Object.entries(dependencies)) {
    packages['node_modules/'+name]={version,resolved:'https://registry.npmjs.org/'+name,integrity:'synthetic-'+name};
    hidden['node_modules/'+name]={...packages['node_modules/'+name]};
    files['/prefix/node_modules/'+name+'/package.json']={name,version};
  }
  files['/prefix/node_modules/sandyboxing/npm-shrinkwrap.json']={packages};
  files['/prefix/node_modules/.package-lock.json']={packages:hidden};
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
  ['changed manifest version',f=>f.files['/prefix/node_modules/zod/package.json'].version='0.0.0'],
  ['changed manifest name',f=>f.files['/prefix/node_modules/zod/package.json'].name='other'],
  ['wrong package version',f=>f.packages[''].version='0.1.0'],['wrong declared count',f=>f.pins.dependencyEntries=95]
])test('dependency identity verifier refuses '+name,()=>{const f=dependencyFixture();mutate(f);assert.throws(()=>checkDependencies(f));});
