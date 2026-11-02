// Public MCP SDK interfaces only. No model calls or client-profile writes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { canonicalHash, verifyLaunch } from './checks.mjs';
import { exerciseCompact } from './compact.mjs';

const [entry, configFile, oracleFile] = process.argv.slice(2);
assert.equal(process.version, 'v24.22.2');
const launch = verifyLaunch(JSON.parse(fs.readFileSync(configFile,'utf8')), process.execPath, entry);
const expected = JSON.parse(fs.readFileSync(oracleFile,'utf8'));
const require = createRequire(path.join(path.dirname(path.dirname(entry)), 'package.json'));
const sdkClient = require.resolve('@modelcontextprotocol/sdk/client/index.js');
const sdkStdio = require.resolve('@modelcontextprotocol/sdk/client/stdio.js');
const sdkPackage = path.resolve(path.dirname(sdkClient), '../../..', 'package.json');
assert.equal(JSON.parse(fs.readFileSync(sdkPackage,'utf8')).version, '1.32.1');
const { Client } = await import(pathToFileURL(sdkClient).href);
const { StdioClientTransport, DEFAULT_INHERITED_ENV_VARS } = await import(pathToFileURL(sdkStdio).href);
const env = Object.fromEntries(DEFAULT_INHERITED_ENV_VARS.map(key=>[key,'']));
for (const key of ['PATH','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','SYSTEMROOT','WINDIR','TMP','TEMP','TMPDIR','XDG_CACHE_HOME']) {
  if (process.env[key] !== undefined) env[key] = process.env[key];
}
const transport = new StdioClientTransport({...launch, cwd:process.cwd(), env, stderr:'pipe', maxBufferSize:2097152});
const client = new Client({name:'sandyboxing-platform-qualification',version:'1'});
const opts={timeout:5000};
let stderrBytes=0, protocolErrors=0, closeObserved=false, pid=null, result;
// The public client receives both transport and protocol errors, including during connect.
// Never reset this count: final acceptance follows the completed close below.
client.onerror=()=>{protocolErrors++;};
transport.stderr.on('data', chunk=>{stderrBytes+=chunk.length;});
try {
  await client.connect(transport,opts);
  pid=transport.pid;
  const onclose=transport.onclose;
  transport.onclose=()=>{closeObserved=true;onclose?.();};
  assert.deepEqual(client.getServerVersion(),{name:'sandyboxing',version:'0.1.1'});
  const listed=await client.listTools({},opts);
  const tools=listed.tools.map(tool=>tool.name).sort();
  assert.deepEqual(tools,['forge_connection_status','forge_probe','plan_explain','provider_details','providers_list','providers_search','route_jobs']);
  assert.equal(listed.nextCursor,undefined);
  assert.ok(listed.tools.every(tool=>tool.outputSchema));
  const catalogue=await client.callTool({name:'providers_list',arguments:{}},undefined,opts);
  const plan=await client.callTool({name:'route_jobs',arguments:expected.request},undefined,opts);
  const status=await client.callTool({name:'forge_connection_status',arguments:{}},undefined,opts);
  for(const response of [catalogue,plan,status]) {
    assert.notEqual(response.isError,true);
    assert.deepEqual(JSON.parse(response.content[0].text),response.structuredContent);
  }
  assert.equal(canonicalHash(catalogue.structuredContent),expected.catalogueSha256);
  assert.equal(canonicalHash(plan.structuredContent),expected.planSha256);
  assert.equal(plan.structuredContent.mode,'dry-run');
  assert.equal(status.structuredContent.liveEnabled,false);
  assert.match(status.structuredContent.message,/not inspected or loaded/);
  // This compatibility tool is locally denied by this exact read-only release.
  const denial=await client.callTool({name:'forge_probe',arguments:{confirm:true}},undefined,opts);
  assert.equal(denial.isError,true);
  assert.equal(denial.structuredContent,undefined);
  assert.deepEqual(JSON.parse(denial.content[0].text),{error:'read_only',message:'Live operations are disabled in this read-only session.'});
  const compact=await exerciseCompact(client,catalogue.structuredContent,plan.structuredContent,expected.request,opts);
  result={scope:'real-sdk-stdio-not-host-or-profile-qualification',compact,tools,catalogueSha256:expected.catalogueSha256,planSha256:expected.planSha256,structuredTextEquivalent:true,localProbeDenial:'read_only'};
} finally {
  await client.close();
}
assert.equal(stderrBytes,0);
assert.equal(protocolErrors,0);
assert.equal(closeObserved,true);
console.log(JSON.stringify({...result,pid,sdkCloseReturned:true,transportCloseObserved:true,childExitStatus:'not-exposed-by-public-sdk-interface',childReap:'not-independently-observed'}));
