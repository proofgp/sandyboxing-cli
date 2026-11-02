import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { verifyLaunch, verifySha, requireGate, canonicalHash } from './checks.mjs';

const config = {mcpServers:{sandyboxing:{command:'/node path/node',args:['/cli path/index.mjs','mcp','--read-only']}}};
test('preserves distinct argv elements including spaces', () => {
  assert.deepEqual(verifyLaunch(config, '/node path/node', '/cli path/index.mjs'), config.mcpServers.sandyboxing);
});
test('rejects combined, reordered, extra, or live arguments', () => {
  for (const args of [['/cli path/index.mjs','mcp --read-only'],['/cli path/index.mjs','--read-only','mcp'],['/cli path/index.mjs','mcp','--read-only','--live'],['/cli path/index.mjs','mcp','--live']]) {
    assert.throws(() => verifyLaunch({mcpServers:{sandyboxing:{command:'/node path/node',args}}}, '/node path/node', '/cli path/index.mjs'));
  }
});
test('requires exact Node and entry identities', () => {
  assert.throws(() => verifyLaunch(config, '/other/node', '/cli path/index.mjs'));
  assert.throws(() => verifyLaunch(config, '/node path/node', '/other/index.mjs'));
});
test('rejects altered bytes against a literal digest', () => {
  const digest='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  verifySha(Buffer.from('abc'),digest);
  assert.throws(() => verifySha(Buffer.from('abd'),digest));
});
test('campaign requires parent gate on the exact public hosted repo', () => {
  const valid={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'proofgp/sandyboxing-cli',GITHUB_EVENT_NAME:'workflow_dispatch',RUNNER_ENVIRONMENT:'github-hosted',RUNNER_OS:'Linux',RUNNER_ARCH:'X64',SANDY_RELEASE_REVIEW:'reviewed',SANDY_ACQUISITION_MODE:'draft'};
  requireGate(valid);
  for (const key of Object.keys(valid)) assert.throws(() => requireGate({...valid,[key]:''}));
});
test('canonical public-result hash is insensitive only to object key order', () => {
  assert.equal(canonicalHash({b:[1,2],a:true}),canonicalHash({a:true,b:[1,2]}));
  assert.notEqual(canonicalHash({b:[1,2],a:true}),canonicalHash({a:true,b:[2,1]}));
});
test('Windows executable and entry paths stay literal', () => {
  const node='C:\\Program Files\\nodejs\\node.exe', entry='C:\\Owned Prefix\\dist-cli\\index.mjs';
  assert.deepEqual(verifyLaunch({mcpServers:{sandyboxing:{command:node,args:[entry,'mcp','--read-only']}}},node,entry).args,[entry,'mcp','--read-only']);
});
test('ungated controller exits before output creation or acquisition', () => {
  const here=path.dirname(fileURLToPath(import.meta.url));
  const output=path.join(here,'must-not-be-created');
  assert.equal(fs.existsSync(output),false);
  const env=Object.fromEntries(['SYSTEMROOT','WINDIR'].filter(key=>process.env[key]).map(key=>[key,process.env[key]]));
  const run=spawnSync(process.execPath,[path.join(here,'qualify.mjs'),output],{env,encoding:'utf8',timeout:5000});
  assert.equal(run.error,undefined);
  assert.notEqual(run.status,0);
  assert.match(run.stderr,/Campaign gate missing: GITHUB_ACTIONS/);
  assert.equal(fs.existsSync(output),false);
});
