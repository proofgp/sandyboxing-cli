// No filesystem writes, children or network before the native campaign gates.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {requireGate} from './checks.mjs';
requireGate(process.env);
assert.equal(process.platform,'linux');
assert.equal(process.arch,'x64');
assert.equal(process.version,'v24.22.2');
for(const key of ['GH_TOKEN','GITHUB_TOKEN','NODE_OPTIONS','NODE_PATH','NPM_TOKEN','NODE_AUTH_TOKEN']) assert.ok(!process.env[key],'Forbidden runtime environment key: '+key);
const distribution=fs.readFileSync('/etc/os-release','utf8');
assert.match(distribution,/^ID=ubuntu$/m);
assert.match(distribution,/^VERSION_ID="24\.04"$/m);
console.log('started-ms='+Date.now());
