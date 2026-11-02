import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const pins=JSON.parse(fs.readFileSync(path.join(here,'pins.json'),'utf8'));
const source=fs.readFileSync(path.join(here,'qualify.mjs'),'utf8');
const start='async function download(',end='try {\n  const nodeDir=';
assert.equal(source.split(start).length,2); assert.equal(source.split(end).length,2);
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const invoke=new AsyncFunction('assert','fetch','fs','path','work','pins','remaining','save','mode','draftRoot','name','maxBytes',source.slice(source.indexOf(start),source.indexOf(end))+'\nreturn download(name,maxBytes);');
function fixture() {
  const work=fs.mkdtempSync(path.join(os.tmpdir(),'v011-acquisition-'));
  fs.mkdirSync(path.join(work,'download'));
  const records=[];
  return {work,records,run:(fetch,mode='public',draftRoot=null,name=pins.archive,maxBytes=3)=>invoke(assert,fetch,fs,path,work,pins,()=>1000,(...r)=>records.push(r),mode,draftRoot,name,maxBytes)};
}
test('draft transport consumes gh-staged regular bytes without fetching',async()=>{
  const f=fixture(),draftRoot=path.join(f.work,'draft'); fs.mkdirSync(draftRoot);
  fs.writeFileSync(path.join(draftRoot,pins.archive),'abc');
  let calls=0;
  const bytes=await f.run(async()=>{calls++;throw Error('Draft must never fetch in runtime');},'draft',draftRoot);
  assert.equal(calls,0); assert.equal(bytes.toString(),'abc');
  assert.equal(f.records[0][1].anonymous,false);
  assert.equal(f.records[0][1].acquisition,'draft-authenticated-gh');
});
test('public transport requests v011 anonymously and retains no redirect query',async()=>{
  const f=fixture(),calls=[];
  const bytes=await f.run(async(url,options)=>{
    calls.push(String(url)); assert.equal(options.redirect,'manual');
    assert.equal(Object.keys(options.headers).some(k=>/authorization|cookie/i.test(k)),false);
    if(calls.length===1) return new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/example?signature=synthetic'}});
    return new Response('abc');
  });
  assert.deepEqual(calls,[`https://github.com/proofgp/sandyboxing-cli/releases/download/v0.1.1/${pins.archive}`,'https://release-assets.githubusercontent.com/example?signature=synthetic']);
  assert.equal(bytes.toString(),'abc');
  assert.equal(f.records[0][1].anonymous,true);
  assert.equal(JSON.stringify(f.records).includes('signature'),false);
});

for(const target of ['http://github.com/asset','https://foreign.invalid/asset','https://user:pass@github.com/asset','https://github.com:444/asset']) {
  test('public redirect refuses '+target+' before dialing it',async()=>{
    const f=fixture(); let calls=0;
    await assert.rejects(f.run(async()=>{calls++;return calls===1?new Response(null,{status:302,headers:{location:target}}):new Response('abc');}));
    assert.equal(calls,1); assert.deepEqual(f.records,[]);
  });
}
test('public transport refuses an oversize streamed body before writing',async()=>{
  const f=fixture();
  await assert.rejects(f.run(async()=>new Response('abcd')),/Download size exceeded/);
  assert.deepEqual(fs.readdirSync(path.join(f.work,'download')),[]); assert.deepEqual(f.records,[]);
});
test('public transport refuses HTTP failures',async()=>{
  const f=fixture(); await assert.rejects(f.run(async()=>new Response('no',{status:404})),/Download HTTP status/);
  assert.deepEqual(f.records,[]);
});
test('public redirect loop is bounded',async()=>{
  const f=fixture();let calls=0;
  await assert.rejects(f.run(async()=>{calls++;return new Response(null,{status:302,headers:{location:'https://github.com/again'}});}),/Redirect limit/);
  assert.equal(calls,6); assert.deepEqual(f.records,[]);
});
for(const kind of ['oversize','symlink','missing']) {
  test('draft transport refuses '+kind+' without network fallback',async()=>{
    const f=fixture(),draftRoot=path.join(f.work,'draft');fs.mkdirSync(draftRoot);
    if(kind==='oversize')fs.writeFileSync(path.join(draftRoot,pins.archive),'abcd');
    if(kind==='symlink'){fs.writeFileSync(path.join(f.work,'target'),'abc');fs.symlinkSync(path.join(f.work,'target'),path.join(draftRoot,pins.archive));}
    let calls=0;
    await assert.rejects(f.run(async()=>{calls++;return new Response('abc');},'draft',draftRoot));
    assert.equal(calls,0); assert.deepEqual(f.records,[]);
  });
}

const {verifySha}=await import('./checks.mjs');
const archiveStart='  const checksums=await download(',archiveEnd='  const prefix=';
assert.equal(source.split(archiveStart).length,2);assert.equal(source.split(archiveEnd).length,2);
const verifyAssetCut=new AsyncFunction('download','assert','pins','verifySha','save',source.slice(source.indexOf(archiveStart),source.indexOf(archiveEnd)));
const fixturePins={archive:'sandyboxing-read-only-0.1.1.tgz',archiveBytes:3,archiveSha256:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'};
async function verifyFixture({archive='abc',sums=fixturePins.archiveSha256+'  '+fixturePins.archive+'\n'}={}) {
  const records=[];
  await verifyAssetCut(async name=>Buffer.from(name==='SHA256SUMS'?sums:archive),assert,fixturePins,verifySha,(...r)=>records.push(r));
  return records;
}
test('actual pre-install archive acceptance cut accepts exact bytes and checksum',async()=>assert.equal((await verifyFixture()).length,1));
for(const [name,change] of [
  ['wrong digest',{archive:'abd'}],['wrong size',{archive:'abcd'}],['extra checksum entry',{sums:fixturePins.archiveSha256+'  '+fixturePins.archive+'\nextra\n'}],
  ['old release name',{sums:fixturePins.archiveSha256+'  sandyboxing-read-only-0.1.0.tgz\n'}],['missing checksum newline',{sums:fixturePins.archiveSha256+'  '+fixturePins.archive}]
])test('pre-install acceptance refuses '+name,async()=>assert.rejects(verifyFixture(change)));
