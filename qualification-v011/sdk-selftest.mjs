// In-memory public-SDK controls; never imports or executes the product entry.
// Run: node qualification/sdk-selftest.mjs /absolute/installed/dist-cli/index.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const entry=process.argv[2];
assert.ok(entry && path.isAbsolute(entry),'Supply the installed entry as an absolute SDK-resolution anchor');
const require=createRequire(entry);
const sdkClient=require.resolve('@modelcontextprotocol/sdk/client/index.js');
const sdkPackage=path.resolve(path.dirname(sdkClient),'../../..','package.json');
assert.equal(JSON.parse(fs.readFileSync(sdkPackage,'utf8')).version,'1.32.1');
const { Client }=require(sdkClient);
const source=fs.readFileSync(path.join(here,'sdk-stdio.mjs'),'utf8');
const controller=fs.readFileSync(path.join(here,'qualify.mjs'),'utf8');
function cut(text,start,end) {
  assert.equal(text.split(start).length,2,'Source start must be unique: '+start);
  if(end!==undefined) assert.equal(text.split(end).length,2,'Source end must be unique: '+end);
  const begin=text.indexOf(start), finish=end===undefined?text.length:text.indexOf(end);
  assert.ok(finish>begin,'Source cut must preserve ordering');
  return text.slice(begin,finish);
}
// Same boundaries as the original reviewer control, with no substituted observer.
const declarations=cut(source,'const client =','try {\n');
const connectCut=cut(source,'  await client.connect(','  assert.deepEqual(client.getServerVersion()');
assert.match(declarations,/let stderrBytes=0, protocolErrors=0/);
assert.match(connectCut,/await client.connect\(transport,opts\);/);
// Execute the actual finally/close and every final acceptance assertion/output.
const shutdownCut=cut(source,'} finally {');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const attach=new AsyncFunction('Client','transport','assert','console',declarations+'\n'+connectCut+`
return {client, observed:()=>({protocolErrors,closeObserved,stderrBytes,pid}),
  finish:async()=>{try {\n${shutdownCut}\n}};`);
const successCut=cut(controller,'async function success(','async function download(');
const invokeSuccess=new AsyncFunction('run','assert','name','args','cap',successCut+'\nreturn success(name,args,cap);');
const callerCut=cut(controller,'  const sdk=JSON.parse(await success(','  for(const [name,args]');
const invokeCaller=new AsyncFunction('success','assert','path','here','entry','configFile','receipt',callerCut+'\nreturn receipt;');

class MemoryTransport {
  constructor(kind) {this.kind=kind;this.stderr=new EventEmitter();this.pid=null;this.sessionId=undefined;this.events=[];}
  fault(layer,phase) {
    this.events.push(phase+':'+layer);
    if(layer==='transport') this.onerror(new SyntaxError('in-memory control: '+phase));
    else this.onmessage({jsonrpc:'2.0',id:'no-such-request',result:{}});
  }
  async start() {
    this.sdkOnerror=this.onerror;
    if(this.kind==='early-transport') this.fault('transport','start');
  }
  async send(message) {
    if(message.method==='initialize') {
      if(this.kind==='initializing-transport') this.fault('transport','initialize');
      queueMicrotask(()=>this.onmessage({jsonrpc:'2.0',id:message.id,result:{protocolVersion:message.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'qualification-memory-fixture',version:'1'}}}));
    } else if(message.method==='tools/list') {
      queueMicrotask(()=>this.onmessage({jsonrpc:'2.0',id:message.id,result:{tools:[]}}));
    }
  }
  async close() {
    this.events.push('close-enter');
    for(const layer of ['transport','protocol']) if(this.kind==='close-'+layer) this.fault(layer,'close-before-callback');
    if(this.kind!=='missing-close') this.onclose?.();
    // The close promise is still pending after the callback: no premature PASS.
    await Promise.resolve();
    for(const layer of ['transport','protocol']) if(this.kind==='after-close-'+layer) this.fault(layer,'close-after-callback');
    this.events.push('close-return');
  }
}
async function scenario(kind='healthy') {
  const transport=new MemoryTransport(kind), output=[];
  const bound=await attach(Client,transport,assert,{log:value=>output.push(value)});
  assert.deepEqual((await bound.client.listTools({}, {timeout:1000})).tools,[]);
  if(kind==='late-transport') transport.fault('transport','after-list');
  if(kind==='late-protocol') transport.fault('protocol','after-list');
  if(kind==='stderr') transport.stderr.emit('data',Buffer.from('x'));
  return {...bound,transport,output};
}
async function rejectedSession(kind,expectedEvents) {
  const session=await scenario(kind);
  await assert.rejects(session.finish,{code:'ERR_ASSERTION',actual:expectedEvents.length,expected:0});
  assert.equal(session.observed().protocolErrors,expectedEvents.length);
  assert.equal(session.observed().stderrBytes,0);
  assert.equal(session.observed().closeObserved,true);
  assert.deepEqual(session.transport.events.filter(event=>event.includes(':')),expectedEvents);
  assert.equal(session.transport.events.at(-1),'close-return');
  assert.deepEqual(session.output,[],'An error-bearing session must emit no accepted SDK receipt');
}

test('healthy initialize/list/close passes the exact final SDK guards',async()=>{
  const session=await scenario();
  await session.finish();
  assert.deepEqual(session.observed(),{protocolErrors:0,closeObserved:true,stderrBytes:0,pid:null});
  assert.equal(session.output.length,1);
  assert.equal(JSON.parse(session.output[0]).sdkCloseReturned,true);
});
test('early transport error before initialize remains sticky through shutdown',async()=>{
  await rejectedSession('early-transport',['start:transport']);
});
test('transport error while initialize is pending cannot pass final acceptance',async()=>{
  await rejectedSession('initializing-transport',['initialize:transport']);
});
test('late protocol error after healthy tools/list cannot pass final acceptance',async()=>{
  await rejectedSession('late-protocol',['after-list:protocol']);
});
test('late transport error after healthy tools/list cannot pass final acceptance',async()=>{
  await rejectedSession('late-transport',['after-list:transport']);
});
for(const layer of ['transport','protocol']) {
  test(layer+' error during close cannot pass final acceptance',async()=>{
    await rejectedSession('close-'+layer,['close-before-callback:'+layer]);
  });
  test(layer+' error after close callback but before close resolves cannot pass',async()=>{
    await rejectedSession('after-close-'+layer,['close-after-callback:'+layer]);
  });
}
test('later healthy traffic cannot clear multiple observed errors',async()=>{
  const session=await scenario('early-transport');
  session.transport.fault('protocol','after-list');
  assert.deepEqual((await session.client.listTools({}, {timeout:1000})).tools,[]);
  await assert.rejects(session.finish,{code:'ERR_ASSERTION',actual:2,expected:0});
  assert.equal(session.observed().protocolErrors,2);
  assert.equal(session.observed().closeObserved,true);
  assert.deepEqual(session.output,[]);
});
test('qualification never replaces the SDK-owned transport error handler',async()=>{
  const session=await scenario();
  try {assert.equal(session.transport.onerror,session.transport.sdkOnerror);}
  finally {await session.finish();}
});
test('nonempty stderr rejects with other final SDK guards healthy',async()=>{
  const session=await scenario('stderr');
  await assert.rejects(session.finish,{code:'ERR_ASSERTION',actual:1,expected:0});
  assert.equal(session.observed().protocolErrors,0);
  assert.equal(session.observed().closeObserved,true);
  assert.deepEqual(session.output,[]);
});
test('missing transport close rejects with other final SDK guards healthy',async()=>{
  const session=await scenario('missing-close');
  await assert.rejects(session.finish,{code:'ERR_ASSERTION',actual:false,expected:true});
  assert.equal(session.observed().protocolErrors,0);
  assert.equal(session.observed().stderrBytes,0);
  assert.deepEqual(session.output,[]);
});
async function controllerAcceptance(overrides={}) {
  const runResult={code:0,signal:null,stdout:JSON.stringify({sdkCloseReturned:true}),...overrides};
  const success=(name,args,cap)=>invokeSuccess(async()=>runResult,assert,name,args,cap);
  return invokeCaller(success,assert,path,here,entry,'in-memory-config-only',{});
}
test('healthy SDK receipt passes the exact controller success and caller cuts',async()=>{
  assert.equal((await controllerAcceptance()).sdk.sdkCloseReturned,true);
});
test('controller rejects nonzero SDK exit even with valid-looking stdout',async()=>{
  await assert.rejects(controllerAcceptance({code:1}),{code:'ERR_ASSERTION',actual:1,expected:0});
});
test('controller rejects a signalled SDK result even with valid-looking stdout',async()=>{
  await assert.rejects(controllerAcceptance({signal:'SIGTERM'}),{code:'ERR_ASSERTION',actual:'SIGTERM',expected:null});
});
test('controller requires SDK close completion in a parsed successful receipt',async()=>{
  await assert.rejects(controllerAcceptance({stdout:JSON.stringify({sdkCloseReturned:false})}),{code:'ERR_ASSERTION',actual:false,expected:true});
});
test('controller stdout parser rejects trailing non-JSON output',async()=>{
  await assert.rejects(controllerAcceptance({stdout:'{"sdkCloseReturned":true}\nnoise'}),SyntaxError);
});
const calibrationCut=cut(controller,'  const entry=path.join(packageRoot','  const help=');
const invokeCalibration=new AsyncFunction('path','here','packageRoot','success',calibrationCut+'\nreturn entry;');
test('controller runs portable SDK calibration before installed behavior',async()=>{
  const calls=[], packageRoot=path.dirname(path.dirname(entry));
  const selected=await invokeCalibration(path,here,packageRoot,async(...args)=>{calls.push(args);return '';});
  assert.equal(selected,entry);
  assert.deepEqual(calls,[['sdk-selftests',['--test-reporter=tap',path.join(here,'sdk-selftest.mjs'),entry],30000]]);
});
test('failed portable SDK calibration stops the controller at the real caller cut',async()=>{
  const failure=new Error('in-memory calibration denial'), packageRoot=path.dirname(path.dirname(entry));
  await assert.rejects(invokeCalibration(path,here,packageRoot,async()=>{throw failure;}),error=>error===failure);
});
