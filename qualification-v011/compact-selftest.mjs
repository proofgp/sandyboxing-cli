import test from 'node:test';
import assert from 'node:assert/strict';
import {equivalent,verifySearchPage,verifyExplanation} from './compact.mjs';
// Synthetic control fixtures only; these never stand in for installed results.
const providers=[
  {id:'c',name:'Charlie',status:'active',ownership:'third-party',adapter:'none',checkedAt:'dated',evidence:[{url:'https://example.invalid/c'}],runtimes:[{id:'c-1'}]},
  {id:'a',name:'Alpha',status:'active',ownership:'third-party',adapter:'none',checkedAt:'dated',evidence:[{url:'https://example.invalid/a'}],runtimes:[{id:'a-1'}]},
  {id:'b',name:'Bravo',status:'retiring',ownership:'third-party',adapter:'none',checkedAt:'dated',evidence:[{url:'https://example.invalid/b'}],runtimes:[]}
];
const page={mode:'catalogue',total:3,offset:0,limit:1,nextOffset:1,providers:[{id:'a',name:'Alpha',status:'active',ownership:'third-party',adapter:'none',checkedAt:'dated',evidence:[{url:'https://example.invalid/a'}],matchedRuntimeIds:['a-1']}],warnings:[
  'Packaged, dated catalogue; not live availability/pricing or connection proof.',
  'A summary is not full evidence. Use provider_details for complete provider evidence.',
  'Retiring providers remain visible here but are excluded from new-work planning.'
]};
const a={providerId:'a',runtimeId:'a-1'},b={providerId:'b',runtimeId:'b-1'},c={providerId:'c',runtimeId:'c-1',reasons:['synthetic exclusion']};
const plan={mode:'dry-run',objective:'balanced',catalogueAsOf:'dated',warnings:['original warning'],jobs:[{jobId:'fixture',status:'planned',selected:b,candidates:[a,b],excluded:[c,c],reasoning:['original reason']}]};
const explanation={...plan,detailsTool:'route_jobs',warnings:[...plan.warnings,
  'Candidate and exclusion arrays may be truncated; totals and omitted counts describe the full plan. Use route_jobs with the original request for full details.',
  'The deterministic ID tie-break is not a price, speed or security recommendation.'
],jobs:[{...plan.jobs[0],candidates:[a],excluded:[c],candidateTotal:2,excludedTotal:2,candidatesOmitted:1,exclusionsOmitted:1,evidence:[
  {providerId:'a',checkedAt:'dated',evidence:[{url:'https://example.invalid/a'}]},
  {providerId:'c',checkedAt:'dated',evidence:[{url:'https://example.invalid/c'}]},
  {providerId:'b',checkedAt:'dated',evidence:[{url:'https://example.invalid/b'}]}
]}]};
test('compact search positive preserves neutral order, runtime IDs and evidence',()=>verifySearchPage(page,providers,0,1));
for(const [name,mutate] of [
  ['omitted provider',p=>p.providers=[]],['wrong total',p=>p.total=2],['premature last page',p=>p.nextOffset=null],
  ['invented runtime',p=>p.providers[0].matchedRuntimeIds=['wrong']],['altered evidence',p=>p.providers[0].evidence=[]],['missing qualification',p=>p.warnings=[]]
]) test('compact search rejects '+name,()=>{const p=structuredClone(page);mutate(p);assert.throws(()=>verifySearchPage(p,providers,0,1));});
test('compact explanation preserves selected provider outside prefix and exact evidence union',()=>verifyExplanation(explanation,plan,providers,1,1));
for(const [name,mutate] of [
  ['missing jobs',p=>p.jobs=[]],['lost selection',p=>p.jobs[0].selected=null],['wrong omission count',p=>p.jobs[0].candidatesOmitted=0],
  ['lost selected evidence',p=>p.jobs[0].evidence.pop()],['altered reasoning',p=>p.jobs[0].reasoning=[]],['missing original warning',p=>p.warnings.shift()]
]) test('compact explanation rejects '+name,()=>{const p=structuredClone(explanation);mutate(p);assert.throws(()=>verifyExplanation(p,plan,providers,1,1));});
test('successful structured and text payloads must be equivalent',()=>{
  const response={content:[{type:'text',text:JSON.stringify(page)}],structuredContent:page};
  assert.deepEqual(equivalent(response),page);
  assert.throws(()=>equivalent({...response,isError:true}));
  assert.throws(()=>equivalent({...response,structuredContent:{}}));
  assert.throws(()=>equivalent({...response,content:[]}));
});
