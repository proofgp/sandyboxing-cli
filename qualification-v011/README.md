# v0.1.1 Linux release qualification

This is a separate qualification pack; `qualification/` and the v0.1.0 workflow remain historical and unchanged. Preparing or locally calibrating this pack does **not** qualify Linux or publish a release.

## Fixed subject

- `sandyboxing-read-only-0.1.1.tgz`, exactly **80233 bytes**
- SHA256 `a166ebde41b87ed5c66270db0d68bf0bbdf173ff72259721503703034b821f9a`
- Ubuntu 24.04, Linux x64; Node **24.22.2**, bundled npm **11.19.1**
- SDK **1.32.1**, Zod **4.6.7**, **95** locked external dependency entries
- Six archive member hashes are in `pins.json`. The archive is not rebuilt or repacked.

## Two acquisition modes

The workflow is manual, defaults to `release_review=hold`, and accepts only the public `proofgp/sandyboxing-cli` repository on a GitHub-hosted Ubuntu 24.04 runner. Independent review must bind the exact workflow and complete harness before the parent changes the gate.

1. **`draft`**: the parent first creates an unpublished `v0.1.1` draft containing the exact archive and canonical `SHA256SUMS`. A separate `draft_download` job alone has `contents: write`, needed to see the unpublished draft; global and runtime-job permissions remain `contents: read`. This three-minute job has no checkout, npm, product execution or release mutation. Only its fixed, 120-second-bounded `gh release view/download` step receives `GH_TOKEN: github.token`. The producer verifies the exact tag/draft state, regular-file inventory, archive size/hash and canonical checksum. Both metadata checks require exactly one JSON object equal to `{isDraft:true,tagName:"v0.1.1"}`; empty, extra-field or multi-document input is refused. Validation retains the original `release.json` bytes, including valid whitespace and key order, without canonicalizing success or sanitizing rejected input. A one-day, run-and-attempt-scoped artifact transfers only the archive, `SHA256SUMS` and `release.json`. The read-only `qualify` job accepts draft mode only after producer success, receives no token environment, and independently rechecks the same fixed bytes before installation. It records `draft-authenticated-gh`, `anonymous:false`. The artifact transfer is not independent publisher authentication, anonymous/public acquisition evidence or permission to execute the archive in the privileged job.
2. **`public`**: after the parent publishes the same bytes, the privileged job is skipped entirely. The runtime job's explicit cancellation/status condition permits that skipped dependency, but never treats a failed draft producer as success. No transfer artifact is downloaded in public mode. The controller downloads both files anonymously over HTTPS, with a fixed GitHub-host allowlist, default HTTPS port, redirect count, per-download timeout and streamed-byte ceilings. A local-assets argument is forbidden; there is no draft/cache fallback. It records `public-anonymous`, `anonymous:true`.

Both modes create a new output root, empty npm cache, empty prefix, unrelated cwd and distinct empty npm config files. The pinned bundled npm installs with scripts/audit/funding/retries disabled and strict TLS. No global tools or dependencies are installed. Child environments are allowlisted and exclude tokens, ambient npm configuration, Node loader options and user environment files. After installation, npm is forced offline.

A shared ten-minute budget begins before the producer's draft download (or in runtime preflight before public acquisition). The producer exports that exact epoch-millisecond start through a job output. Draft preflight requires it unchanged: transfer, queue delay, checkout and runtime setup consume the original budget rather than starting another ten minutes. Missing, malformed, future or expired draft starts fail closed; public mode starts normally without producer output and rejects an unexpected inherited budget. The unchanged controller checks elapsed wall time again, then clamps all child/download deadlines to the remaining monotonic budget. The producer has a three-minute outer bound and the runtime job retains its fifteen-minute outer bound. A late job may fail without running qualification; no queue-time or cross-machine clock-synchronization guarantee is claimed. An OS that refuses to reap a killed child is bounded only by the job timeout; this is not a stronger OS-level lifecycle guarantee.

## Acceptance and receipts

The controller checks the six installed own-file hashes; all 95 dependency lock identities (version, resolved URL and integrity); actual dependency package names/versions; clean `npm ls`; the unchanged 20-case public-SDK observer calibration; installed help; exactly nine passing doctor checks; exact print-only launch argv; seven discovered SDK tools; unchanged pinned catalogue/planner results; and locally denied `forge_probe`.

Compact SDK checks traverse every unfiltered search page, reconcile every catalogue ID exactly once in neutral order, compare each full detail response with the pinned legacy catalogue, and verify explanation prefixes, totals, omission counts, selected candidate, reasoning, qualifications and the exact evidence union. Text and structured content must agree. Malformed input and an unknown provider ID must be rejected. Provider IDs are an enum in this archive: unknown-ID rejection is framework invalid-params text, not an application `not_found` result.

The six host-allowlisted read-only tools are `providers_list`, `route_jobs`, `forge_connection_status`, `providers_search`, `provider_details`, `plan_explain`. `forge_probe` remains advertised for compatibility but must not be enabled in a host allowlist; this harness calls it only to verify the exact archive's local denial.

The SDK observer remains attached before `connect()` and sticky until `close()` resolves. Protocol/transport errors or stderr cannot yield an accepted SDK receipt. Controller nonzero/signal/parse failures remain non-accepting. Results include workflow SHA/run identity, requested runner, actual distribution/kernel and separate runner-image environment fields. Compare these with the actual setup logs; do not rewrite a discrepancy into matching evidence.

The runtime job uploads only small `evidence/*.json` receipts. The separate draft-input transfer described above contains exactly three verified files; cache, dependency trees, other stage files and credentials are never artifacts. `RESULT.status=passed` requires all controller stages; a failed preflight has no result receipt and must not be treated as a pass. The parent must require the actual runtime job success **and** correct source/archive/acquisition bindings, not a green skipped job or an earlier release's receipt. Failed run `41544394680` remains an acquisition failure (`release not found` with read-only draft access), not Linux qualification. Local policy/shell calibration of the split-job correction does not change that result.

## Portable calibration commands

From the release-only repository, using Node 24.22.2:

```sh
node --test qualification-v011/selftest.mjs qualification-v011/acquisition-selftest.mjs qualification-v011/policy-selftest.mjs qualification-v011/compact-selftest.mjs
node qualification-v011/sdk-selftest.mjs /absolute/installed/node_modules/sandyboxing/dist-cli/index.mjs
```

The second command resolves the pinned SDK from that installation; it does not install anything. Policy calibration also requires Bash and `jq`: it executes both checked-in metadata shell boundaries with valid and malformed inputs, checks raw-byte retention, and invokes the unchanged consumer metadata guard. These metadata cuts do not execute archive verification, live `gh` or the artifact service. Use owned HOME/TMPDIR/cache and an allowlisted environment for local calibration. Transport doubles, simulated host-policy checks and existing-installation runs are explicitly not native Linux, fresh-install or anonymous-download evidence.

After independent approval and parent-owned publication of these files, the parent may manually dispatch `qualify-readonly-v011.yml` with `acquisition_mode=draft`, then later `acquisition_mode=public`, each with `release_review=reviewed`. Neither mode publishes, mutates a release, calls a provider/model, changes a client profile or enables live execution.

## Limits

No Windows qualification. No Hermes/Claude host or user-profile qualification. No Linux OS egress-denial claim. Lock identity/package-version checks are not independent byte provenance for every dependency file. Public SDK transport close is not independently observed server-child exit/reaping. A locally qualified private installation is not public distribution. The archived private-candidate README is historical build-time guidance; current version-tagged repository documentation and release notes supersede only its distribution/qualification status, not its safety or licensing qualifications.
