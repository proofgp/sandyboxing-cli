// Independent projections of already hash-pinned legacy SDK results.
// No product-source imports, provider operations or host/profile changes.
import assert from 'node:assert/strict';
const compare=(a,b)=>a<b?-1:a>b?1:0;
export function equivalent(response) {
  assert.notEqual(response.isError,true);
  assert.equal(response.content.length,1);
  assert.equal(response.content[0].type,'text');
  assert.deepEqual(JSON.parse(response.content[0].text),response.structuredContent);
  return response.structuredContent;
}
export function verifySearchPage(page,providers,offset,limit) {
  const sorted=[...providers].sort((a,b)=>compare(a.name.toLowerCase(),b.name.toLowerCase())||compare(a.id,b.id));
  assert.equal(page.mode,'catalogue');
  assert.equal(page.total,providers.length);
  assert.equal(page.offset,offset); assert.equal(page.limit,limit);
  assert.equal(page.nextOffset,offset+limit<providers.length?offset+limit:null);
  assert.deepEqual(page.providers,sorted.slice(offset,offset+limit).map(p=>({
    id:p.id,name:p.name,status:p.status,ownership:p.ownership,adapter:p.adapter,
    evidence:p.evidence,checkedAt:p.checkedAt,matchedRuntimeIds:p.runtimes.map(r=>r.id)
  })));
  assert.deepEqual(page.warnings,[
    'Packaged, dated catalogue; not live availability/pricing or connection proof.',
    'A summary is not full evidence. Use provider_details for complete provider evidence.',
    'Retiring providers remain visible here but are excluded from new-work planning.'
  ]);
}
export function verifyExplanation(explanation,plan,providers,candidateLimit,exclusionLimit) {
  const jobs=plan.jobs.map(job=>{
    const candidates=job.candidates.slice(0,candidateLimit),excluded=job.excluded.slice(0,exclusionLimit);
    const ids=[...new Set([...candidates,...excluded,...(job.selected?[job.selected]:[])].map(c=>c.providerId))];
    const evidence=ids.map(providerId=>{
      const p=providers.find(p=>p.id===providerId); assert.ok(p);
      return {providerId,checkedAt:p.checkedAt,evidence:p.evidence};
    });
    return {...job,candidates,excluded,candidateTotal:job.candidates.length,excludedTotal:job.excluded.length,
      candidatesOmitted:job.candidates.length-candidates.length,exclusionsOmitted:job.excluded.length-excluded.length,evidence};
  });
  assert.deepEqual(explanation,{...plan,detailsTool:'route_jobs',warnings:[...plan.warnings,
    'Candidate and exclusion arrays may be truncated; totals and omitted counts describe the full plan. Use route_jobs with the original request for full details.',
    'The deterministic ID tie-break is not a price, speed or security recommendation.'
  ],jobs});
}
export async function exerciseCompact(client,catalogue,plan,request,opts) {
  const providers=catalogue.providers;
  assert.ok(providers.length>0); assert.equal(new Set(providers.map(p=>p.id)).size,providers.length);
  const call=async(name,args)=>client.callTool({name,arguments:args},undefined,opts);
  const seen=[]; let pages=0;
  for(let offset=0;offset<providers.length;offset+=3) {
    const page=equivalent(await call('providers_search',{offset,limit:3}));
    verifySearchPage(page,providers,offset,3); seen.push(...page.providers.map(p=>p.id)); pages++;
  }
  assert.deepEqual([...seen].sort(),providers.map(p=>p.id).sort());
  for(const p of providers) assert.deepEqual(equivalent(await call('provider_details',{providerId:p.id})),{provider:p});
  const explanation=equivalent(await call('plan_explain',{request,candidateLimit:1,exclusionLimit:1}));
  verifyExplanation(explanation,plan,providers,1,1);
  const missing=await call('provider_details',{providerId:'qualification-missing'});
  assert.equal(missing.isError,true); assert.equal(missing.structuredContent,undefined);
  // Provider IDs are an enum in this archive: the framework rejects an unknown ID
  // before the application not_found branch, with text-only invalid-params output.
  assert.match(missing.content[0].text,/MCP error -32602: Input validation error/);
  for(const [name,args] of [
    ['providers_search',{limit:0}],
    ['provider_details',{providerId:providers[0].id,unexpected:true}],
    ['plan_explain',{request,candidateLimit:0}]
  ]) {
    const rejected=await call(name,args); assert.equal(rejected.isError,true); assert.equal(rejected.structuredContent,undefined);
  }
  return {allProvidersReachable:true,searchPages:pages,providersVerified:seen.length,detailsVerified:providers.length,
    planJobsVerified:plan.jobs.length,strictInputRejections:3,unknownProviderRejected:true,structuredTextEquivalent:true};
}
