// Actual installed-metadata and archive guards. Requires an owned test TMPDIR.
// Does not run npm, extract any archive, or mutate the supplied installation.
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifySha} from './checks.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const [entry,archiveFile]=process.argv.slice(2);
assert.ok(path.isAbsolute(entry) && path.isAbsolute(archiveFile),'Supply actual installed entry and exact archive');
const actualRoot=path.dirname(path.dirname(entry));
const source=fs.readFileSync(path.join(here,'qualify.mjs'),'utf8');
const pins=JSON.parse(fs.readFileSync(path.join(here,'pins.json'),'utf8'));
const archive=fs.readFileSync(archiveFile); assert.equal(archive.length,pins.archiveBytes); verifySha(archive,pins.archiveSha256);
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
function cut(start,end) {assert.equal(source.split(start).length,2);assert.equal(source.split(end).length,2);return source.slice(source.indexOf(start),source.indexOf(end));}
const dependencyCut=new Function('fs','path','assert','pins','packageRoot','save',cut('  const shrinkwrap=','  const listing='));
const listingCut=new AsyncFunction('success','npm','packageRoot','assert','pins',cut('  const listing=','  const entry=path.join(packageRoot'));
const archiveCut=new AsyncFunction('download','assert','pins','verifySha','save','fs','path','work','run','success','npm','env',cut('  const checksums=await download(','  const shrinkwrap='));
const ownCut=new Function('fs','path','assert','pins','packageRoot','verifySha',cut('  function verifyOwnFiles() {','  verifyOwnFiles();\n  save(\'extracted-own-files\'')+'\nreturn verifyOwnFiles;');
function metadataFixture() {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'v011-installed-metadata-'));
  const lock=JSON.parse(fs.readFileSync(path.join(actualRoot,'npm-shrinkwrap.json'),'utf8'));
  assert.equal(Object.keys(lock.packages).length,96);
  const names=['npm-shrinkwrap.json','node_modules/.package-lock.json',...Object.keys(lock.packages).filter(Boolean).map(name=>name+'/package.json')];
  for(const name of names) {const dest=path.join(root,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(actualRoot,name),dest);}
  return root;
}
function check(root) {const records=[];dependencyCut(fs,path,assert,pins,root,(...r)=>records.push(r));assert.equal(records[0][1].dependencyEntries,95);}
function changeJSON(root,name,mutate) {const f=path.join(root,name),obj=JSON.parse(fs.readFileSync(f,'utf8'));mutate(obj);fs.writeFileSync(f,JSON.stringify(obj));}
test('actual installed application-root inventory accepts all 95 unchanged identities',()=>check(actualRoot));
for(const [name,mutate,reason] of [
  ['missing hidden entry',r=>changeJSON(r,'node_modules/.package-lock.json',o=>delete o.packages['node_modules/zod']),/deep-equal/],
  ['surplus hidden entry',r=>changeJSON(r,'node_modules/.package-lock.json',o=>o.packages['node_modules/extra']={version:'0.0.0'}),/deep-equal/],
  ['wrong hidden version',r=>changeJSON(r,'node_modules/.package-lock.json',o=>o.packages['node_modules/@hono/node-server'].version='2.1.6'),/node_modules\/@hono\/node-server version/],
  ['missing integrity',r=>changeJSON(r,'node_modules/.package-lock.json',o=>delete o.packages['node_modules/zod'].integrity),/node_modules\/zod integrity/],
  ['wrong integrity',r=>changeJSON(r,'node_modules/.package-lock.json',o=>o.packages['node_modules/zod'].integrity='altered'),/node_modules\/zod integrity/],
  ['wrong resolved URL',r=>changeJSON(r,'node_modules/.package-lock.json',o=>o.packages['node_modules/zod'].resolved='https://foreign.invalid'),/node_modules\/zod resolved/],
  ['missing actual manifest',r=>fs.unlinkSync(path.join(r,'node_modules/zod/package.json')),e=>e.code==='ENOENT'],
  ['wrong actual manifest version',r=>changeJSON(r,'node_modules/zod/package.json',o=>o.version='0.0.0'),/0\.0\.0/],
  ['wrong actual manifest name',r=>changeJSON(r,'node_modules/zod/package.json',o=>o.name='wrong-name'),/wrong-name/],
  ['wrong root version',r=>changeJSON(r,'npm-shrinkwrap.json',o=>o.packages[''].version='0.1.0'),/0\.1\.0/],
  ['old wrapper-relative hidden lock',r=>fs.renameSync(path.join(r,'node_modules/.package-lock.json'),path.join(r,'.package-lock.json')),e=>e.code==='ENOENT']
]) test('real metadata guard refuses '+name,()=>{const root=metadataFixture();try {mutate(root);assert.throws(()=>check(root),reason);}finally{fs.rmSync(root,{recursive:true});}});
for(const field of ['name','version']) test('npm-ls root identity refuses wrong '+field,async()=>{
  const positive={name:'sandyboxing',version:pins.version,dependencies:{}};
  await listingCut(async()=>JSON.stringify(positive),'unused',actualRoot,assert,pins);
  await assert.rejects(listingCut(async()=>JSON.stringify({...positive,[field]:'wrong'}),'unused',actualRoot,assert,pins),/wrong/);
});
for(const name of ['changed archive byte','truncated archive','occupied prefix']) test('archive admission refuses '+name+' before tar/npm',async()=>{
  const work=fs.mkdtempSync(path.join(os.tmpdir(),'v011-archive-guard-'));
  try {
    fs.mkdirSync(path.join(work,'prefix'));fs.mkdirSync(path.join(work,'download'));
    const bytes=Buffer.from(archive);
    if(name==='changed archive byte')bytes[100]^=1;
    const input=name==='truncated archive'?bytes.subarray(0,-1):bytes;
    fs.writeFileSync(path.join(work,'download',pins.archive),input);
    if(name==='occupied prefix')fs.writeFileSync(path.join(work,'prefix','existing'),'owned existing input');
    let processes=0;
    const execute=async()=>{processes++;throw Error('Process must not run');};
    await assert.rejects(archiveCut(async n=>n==='SHA256SUMS'?Buffer.from(`${pins.archiveSha256}  ${pins.archive}\n`):input,assert,pins,verifySha,()=>{},fs,path,work,execute,execute,'unused',{}),name==='occupied prefix'?/Installation prefix must be empty/:/SHA|80232|80233|mismatch/i);
    assert.equal(processes,0);assert.equal(fs.existsSync(path.join(work,'prefix/node_modules')),false);
  } finally {fs.rmSync(work,{recursive:true});}
});
test('six real installed member bytes and modes accepted; changed mode refused',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'v011-ownfiles-'));
  try {
    for(const name of Object.keys(pins.members)) {const dest=path.join(root,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(actualRoot,name),dest);fs.chmodSync(dest,fs.statSync(path.join(actualRoot,name)).mode&0o7777);}
    const checkOwn=ownCut(fs,path,assert,pins,root,verifySha);checkOwn();
    fs.chmodSync(path.join(root,'dist-cli/index.mjs'),0o644);assert.throws(checkOwn,/dist-cli\/index.mjs mode/);
  } finally {fs.rmSync(root,{recursive:true});}
});
