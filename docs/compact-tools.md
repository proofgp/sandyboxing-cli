# Compact MCP tools — v0.1.1

Use these tools after verifying the exact [installed release](../README.md) and [client connection](client-setup.md). They are **MCP tool calls**, not new shell subcommands or a hosted HTTP API. The examples below are request arguments, not observed results or an execution approval. Use the exact registered host wrapper for each server-native name.

The server advertises seven tools. Permit only `providers_list`, `route_jobs`, `forge_connection_status`, `providers_search`, `provider_details` and `plan_explain`. Keep the compatibility `forge_probe` out of the allowlist; the CLI denies it locally with `read_only` regardless of its retained description/annotations.

## 1. Search summaries, then retrieve evidence

Call **`providers_search`** with:

```json
{"runtime":"node","isolation":"vm","requiredCapabilities":["network-isolation"],"status":"active","offset":0,"limit":8}
```

Or call it with `{}` for the first unfiltered page. Optional filters are:

| Argument | Contract |
|---|---|
| `query` | Trimmed, nonempty string, at most 120 characters; case-insensitive substring match against provider ID, name or tagline, not full evidence text |
| `providerIds` | One to 16 distinct packaged provider IDs; use IDs returned by the tools |
| `runtime` | `python`, `node` or `shell` |
| `isolation` | `any` or `vm`; `vm` accepts a qualifying VM or microVM variant |
| `requiredCapabilities` | Distinct entries from `network-isolation`, `snapshots`, `custom-images`, `gpu`; at most four |
| `status` | `active` or `retiring`; omitted means no status filter |
| `offset` | Integer 0–10000; default 0 |
| `limit` | Integer 1–16; default 8 |

Inputs are strict: unknown fields, duplicate IDs/capabilities, blank queries and out-of-range values are rejected rather than silently repaired. Combined runtime/isolation/capability requirements must hold in **one runtime variant**. Required capability `null`/unknown does not count as `true`. Providers without runtime records remain reachable in an unconstrained search; they cannot satisfy a required runtime filter.

Filtering and neutral name/ID sorting happen over the full catalogue **before pagination**. Returned `total` is the number matching all filters, not the page length. Continue with the returned `nextOffset`, keeping filters/limit unchanged, until it is `null`; reconcile unique provider IDs with `total` when collecting all matches. `matchedRuntimeIds` identifies the matching variants, in packaged runtime order, not a ranking. Retiring entries can remain visible in search but are excluded from new-work planning.

Each summary retains `id`, `name`, `status`, `ownership`, `adapter`, `evidence`, `checkedAt` and `matchedRuntimeIds`, alongside pagination fields and warnings. Summary evidence labels are **not** the full provider sources, per-capability proof, live pricing/availability, connected-account state or executable authority.

Call **`provider_details`** with a provider ID returned by search, for example:

```json
{"providerId":"e2b"}
```

It returns `{ "provider": ... }` with the complete packaged provider record, including source references, evidence dates, runtime-specific capabilities, pricing qualifications and limitations. It does not fetch those URLs, refresh evidence or authenticate an account. `providers_list` with `{}` remains available when the complete packaged catalogue is actually needed.

## 2. Explain a dry-run plan without hiding its limits

Call **`plan_explain`** with a nested, valid `route_jobs` request:

```json
{
  "request": {
    "objective": "balanced",
    "jobs": [{
      "id": "example-node-job",
      "name": "Example Node job",
      "runtime": "node",
      "isolation": "vm",
      "requiredCapabilities": ["network-isolation"]
    }]
  },
  "candidateLimit": 3,
  "exclusionLimit": 3
}
```

`candidateLimit` is an integer 1–16 (default 3); `exclusionLimit` is 1–32 (default 3). They bound **each job's** displayed candidate/exclusion prefixes, not the number of jobs. This is the existing planner's result projected compactly, not a different optimizer.

The explanation preserves every job, its status, selected candidate, reasoning and warnings. A selected candidate remains explicit even when it falls outside the displayed candidate prefix. Each job reports `candidateTotal`, `excludedTotal`, `candidatesOmitted` and `exclusionsOmitted`; do not interpret a short displayed list as the full eligible/excluded set. Dated provider evidence is attached for displayed candidates, displayed exclusions and the selected provider where applicable.

The returned `detailsTool` is `route_jobs`. To obtain the full plan, call **`route_jobs` with the original inner `request`**, not the `plan_explain` wrapper:

```json
{
  "objective": "balanced",
  "jobs": [{
    "id": "example-node-job",
    "name": "Example Node job",
    "runtime": "node",
    "isolation": "vm",
    "requiredCapabilities": ["network-isolation"]
  }]
}
```

Keep the original job IDs, objective and hard constraints. A deterministic ID tie-break is not a price, speed or security recommendation. A `needs-evidence` result or null selection is not successful optimization; cost/speed objectives cannot invent comparable verified evidence. No request above provisions or runs the job. Guest versions, resource sizes, installed packages, egress destinations, workload compatibility, budgets and live availability need separate evidence/authorization and are not established by capability matching.

## 3. Read passive status, not account readiness

Call **`forge_connection_status`** with `{}`. In this CLI it reports disabled live execution and that credentials were not inspected or loaded. Do not interpret a local `missing` state as proof that the user has no credentials/account. Do not supply a provider key or invoke the probe to “fix” read-only status.

## Result handling and compatibility

Successful tool results advertise output schemas and provide `structuredContent` with equivalent JSON text. Use either representation; do not concatenate both and count the duplicate payload as additional evidence. SDK 1.32.1 compatibility errors use sanitized JSON text with `isError:true` rather than forcing success-shaped `structuredContent` onto failures. Check `isError` before interpreting a result.

The original full catalogue/planning/status tool names remain available; compact calls are additive. Smaller bounded results are a response-size feature, **not a measured token/cost/speed guarantee**. The packaged catalogue is dated evidence, not a live benchmark, provider endorsement or refreshed market feed. See [release qualification](platform-qualification.md) for the actual tested boundaries.
