import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export function verifyLaunch(config, node, entry) {
  assert.deepEqual(Object.keys(config), ['mcpServers']);
  assert.deepEqual(Object.keys(config.mcpServers), ['sandyboxing']);
  const server = config.mcpServers.sandyboxing;
  assert.deepEqual(Object.keys(server).sort(), ['args','command']);
  assert.equal(server.command, node);
  assert.deepEqual(server.args, [entry, 'mcp', '--read-only']);
  return server;
}
export function verifySha(bytes, expected) {
  assert.match(expected, /^[0-9a-f]{64}$/);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, 'SHA256 mismatch');
}
export function requireGate(env) {
  for (const [key,value] of Object.entries({GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:'proofgp/sandyboxing-cli',RUNNER_ENVIRONMENT:'github-hosted',SANDY_WEBSITE_GATE:'website-delivered',SANDY_RELEASE_REVIEW:'reviewed'})) {
    assert.equal(env[key], value, `Campaign gate missing: ${key}`);
  }
}
export function canonicalHash(value) {
  function sort(item) {
    if (Array.isArray(item)) return item.map(sort);
    if (item !== null && typeof item === 'object') return Object.fromEntries(Object.keys(item).sort().map(key=>[key,sort(item[key])]));
    return item;
  }
  return createHash('sha256').update(JSON.stringify(sort(value))).digest('hex');
}
