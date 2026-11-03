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
// Draft acquisition owns the start; cross-job scheduling must not renew it.
let started=process.env.SANDY_QUALIFICATION_STARTED_MS;
if(process.env.SANDY_ACQUISITION_MODE==='draft') {
  assert.ok(typeof started==='string' && started.length===13 && /^\d{13}$/.test(started),'Missing shared budget start');
  const elapsed=Date.now()-Number(started);
  assert.ok(elapsed>=0 && elapsed<600000,'Shared budget expired or invalid');
} else {
  assert.ok(!started,'Public mode must not inherit a draft budget');
  started=String(Date.now());
}
console.log('started-ms='+started);
