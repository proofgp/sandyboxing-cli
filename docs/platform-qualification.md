# Platform qualification — v0.1.1

**Release qualification snapshot: v0.1.1 Linux draft qualification passed; post-publication anonymous acquisition remains PENDING at tagging.** Qualification is version/artifact/runtime/OS/architecture-specific. Client command guidance, a real SDK exchange and actual profile activation are separate evidence scopes.

## Frozen artifact

- Archive: `sandyboxing-read-only-0.1.1.tgz`, **80,233 bytes**.
- SHA-256: `a166ebde41b87ed5c66270db0d68bf0bbdf173ff72259721503703034b821f9a`.
- Node: **v24.22.2**; npm: **11.19.1**; SDK: **1.32.1**; Zod: **4.6.7**.
- Seven advertised tools, six read-only host-allowed tools, nine doctor checks. `forge_probe` is locally denied and excluded from the host allowlist.
- Exact accepted archive bytes are reused, not repacked. Its embedded private-candidate README and private-install timing text are historical; the version-tagged repository guide/release notes supersede distribution/qualification status only. Safety and licensing qualifications remain applicable.

## v0.1.1 results

<a id="v011-results"></a>

<!-- BEGIN V011_RESULTS: parent updates only from authenticated real receipts -->
| Gate | Status | Actual evidence / limitation |
|---|---|---|
| macOS arm64 installed-runtime qualification | **PASS — historical accepted local evidence** | Node v24.22.2 / npm 11.19.1; 85 independent installed SDK cases and nine doctor checks. Six SDK fault-observer controls and nine stream controls also passed. Durable-path replay repeats the same cases, not 170 unique SDK tests. |
| macOS acquisition mode | **Copied-cache offline install; not cold-cache/anonymous** | Fresh owned prefix from a copied pre-existing npm cache; script-disabled npm and OS network denial. Subsequent authenticated relocation preserves the installed tree. |
| Actual local Hermes activation | **PASS — one recorded local activation** | Operation `46313372305b`; v0.1.1 activated and all six permitted tools actually called. Sampling/resources/prompts/events disabled; no provider operations. Not a general client/platform qualification. |
| Linux x64 v0.1.1, draft-authenticated acquisition | **PASS** | [Run 41558143607](https://github.com/proofgp/sandyboxing-cli/actions/runs/41558143607), attempt 1; workflow commit `9c78948d2d94c2d23cc4aa9eab2fb567938cad9d`; both jobs succeeded; RESULT SHA-256 `72ec13c62e76956cc681324110c08ddd0c96f2d4dffe27bb496aa5548abec3b3`. Acquisition is `draft-authenticated-gh`, `anonymous:false`. |
| Linux OS and runner identity | **Runtime target verified; exact image build unresolved** | Requested `ubuntu-24.04`, actual Ubuntu 24.04.5 LTS, Linux x64, kernel `7.0.0-1017-azure`. Result environment: `ubuntu24` / `20261026.354.1`; setup log image: `ubuntu-24.04` / `20261025.353.1`. The discrepancy is retained, not normalized into exact image attestation. |
| Linux product runtime and installed checks | **PASS** | Node v24.22.2 / npm 11.19.1; SDK 1.32.1 / Zod 4.6.7. Exact archive and six owned files/modes, canonical application-root `npm ci` into a fresh prefix with empty cache, all 95 locked dependency identities, clean root npm-ls, nine passing doctor checks, print-only argv, three exit-2 negatives and 20 SDK observer controls. Actual SDK: seven tools, 16 providers across six search pages, 16 full details, one plan explanation, strict input refusals, local probe denial and clean schema/text exchange. SDK/transport close observed; independent server-child exit/reap not exposed. |
| Published release and anonymous fresh installation | **PENDING** | Release ID/tag commit, public asset identity, anonymous archive/checksum download, empty-cache install, doctor and SDK receipts: PENDING. A successful draft download cannot fill this row. |
| Hermes/Claude in hosted Linux job | **Unavailable; not client-qualified** | Both were `unavailable-on-PATH`. Neither client was bootstrapped or exercised in the job. |
| Claude Code profile/UI setup | **Guidance only; not exercised for v0.1.1** | Local command-help inspection is not a configured profile, connected server or model-tool-use result. |
| Native Windows v0.1.1 | **UNQUALIFIED / DEFERRED** | No v0.1.1 Windows work; preserve the v0.1.0 failed-doctor history below. WSL is separate and unqualified here. |
<!-- END V011_RESULTS -->

### Retained v0.1.1 attempts and installer correction

- [Run 41544394680](https://github.com/proofgp/sandyboxing-cli/actions/runs/41544394680) failed before installation: the read-only workflow token could not see the unpublished draft. The approved correction confines write-capable access to the short draft-download job; the runtime job remains read-only.
- [Run 41550614248](https://github.com/proofgp/sandyboxing-cli/actions/runs/41550614248) acquired the exact archive and completed npm installation, but correctly failed strict dependency validation: `@hono/node-server` 2.1.6 differed from the frozen 2.1.5. Doctor/SDK checks were not reached.
- Investigation with npm 11.19.1 showed the local-tarball manifest omitted the subtree-shrinkwrap marker. Removing `--no-package-lock` alone was not sufficient. The unchanged archive is now extracted into its own matching manifest/shrinkwrap root and installed using `npm ci`; dependency checks were not weakened. Use the current installation recipe, not historical ordinary-tarball install instructions.
- The successful draft run does not prove anonymous public availability. Post-publication results belong in a new documentation commit and release-note update; never move the immutable release tag or replace its archive.

The recorded macOS suite verified the actual installed CLI with network, source and build dependencies denied and checked actual child cleanup. Those confinement/cleanup results do not transfer to a hosted Linux job. The local Hermes activation followed an earlier timeout and restoration of the previous configuration; the successful authorized retry does not erase that historical failed attempt. These are existing accepted records, **not runs performed by this documentation preparation**.

The matching `24.x` engine range is a requirement, not blanket qualification of every Node 24 patch. No result here authenticates a provider, checks live prices/availability, executes a job or grants spending authority. Host applications can independently make model/telemetry requests.

## Linux and publication gates

The proposed Linux-only workflow is `.github/workflows/qualify-readonly-v011.yml`, with its own `qualification-v011/` implementation. It must preserve the v0.1.0 workflow and `qualification/` history. Only the separately reviewed, frozen implementation and real receipts can establish a PASS; this document is not permission to dispatch it.

1. **Draft qualification:** parent publishes only reviewed qualification files, creates an unpublished v0.1.1 release with the exact archive and `SHA256SUMS`, and authenticates downloaded draft asset bytes. Draft acquisition is explicitly **authenticated**, not public/anonymous. Repo-scoped `${{ github.token }}` may be passed as `GH_TOKEN` only to the draft asset download step, never to npm or test/runtime children.
2. **Native Linux run:** standard GitHub Ubuntu 24.04 x64 runner, exact reviewed action/Node pins, `contents: read`, no repository secrets, paid/self-hosted runners or Windows matrix. Job limit 15 minutes; shared harness limit ten minutes. Fresh prefix/cache, distinct empty npm configurations, external registry dependencies, lifecycle scripts/audit/funding disabled, TLS verified, no global install or automatic retry. Record actual command exits and every acceptance stage, not just the job badge.
3. **Runtime verification:** bind installed own files and dependency checks to the exact archive/lock; inspect help, nine-check doctor report, printed separate argv and malformed-argument exits. Run the actual installed SDK stdio checks with error observation before connection through completed close. Any retained protocol/transport error, failed calibration, missing stage or incomplete receipt prevents acceptance. Do not relabel in-memory controls as real product calls.
4. **Publication:** only after acceptance, publish the **same** draft and exact authenticated assets. Do not repack, replace an asset, move an existing tag or publish private history. A release tag binds its documentation commit; the committed checksum binds the archive.
5. **Anonymous replay:** reacquire archive and checksum without authentication after publication. Compare both to the tagged checksum and frozen archive identity, then perform a new empty-cache installation plus doctor/SDK checks. A private copied-cache install or draft-authenticated run cannot satisfy this gate. Update website onboarding only after it passes.

Keep the harness's actual observed SDK assertion count separate from the **85-case historical macOS suite**; never assign that number to Linux unless those exact cases actually ran. Distinguish controller-owned subprocess exits, SDK transport-close callbacks and independently observed server-child reaping. An awaited SDK `close()` is not independent child-reap proof.

Record the runner label, OS release, architecture, image version from the environment **and** setup log separately. Record the Node version used by the product separately from the Node runtime used by GitHub Actions. Do not claim OS-level egress denial, bandwidth enforcement, full image reproducibility or full upstream-code audit unless the actual harness supplies those observations.

After filling the results block, reconcile the README and release-note banners with it. Freeze/review the resulting documents before tagging. If anonymous evidence is acquired after the tag exists, add it in a new documentation commit and release-note update; retain the tagged snapshot and assets unchanged.

## v0.1.0 history

<a id="v010-history"></a>

These facts qualify **v0.1.0 only** and remain part of the record:

- Release: [v0.1.0](https://github.com/proofgp/sandyboxing-cli/releases/tag/v0.1.0); tag commit `182ae8fdc7f182af26aa333a4b65be0c66ffaf87`.
- Archive: `sandyboxing-read-only-0.1.0.tgz`, 79,015 bytes; SHA-256 `e85d7313e52f4e5e6800a635cac4162c89c68f9d897fb0ab5671bef1e0cd26e1`.
- macOS arm64 had accepted public-download/fresh-install/doctor/SDK evidence. Node v24.22.2 / npm 11.19.1 Linux x64 passed both recorded hosted jobs, with **six** doctor checks and **four** advertised tools, not v0.1.1's nine/seven.
- [Run 41490165600](https://github.com/proofgp/sandyboxing-cli/actions/runs/41490165600), commit `ec1cf8d6dbf16b68d18382817a2f320f79e86951`, and [run 41493419956](https://github.com/proofgp/sandyboxing-cli/actions/runs/41493419956), commit `66e4357161f25a275afb50a35ea644d387e74f7b`, remain **failed overall** because Windows failed. Linux's success is not an overall workflow PASS.
- Windows first stopped in source-framing calibration. After the LF checkout repair, 20 SDK controls passed but the installed doctor exited 1 at local MCP startup. Later installed checks were not reached. The startup cause remains unresolved; Windows stays unqualified and further work deferred. Historical repair allowances are not reopened by this version's docs.
- Both Linux result records reported image `20261026.354.1`, while setup logs reported `20261025.353.1`. Exact image-build identity remains unresolved. No Hermes/Claude executable was available on PATH in those hosted jobs; no actual client-profile setup was qualified there.

The [preserved pre-v0.1.1 qualification document](https://github.com/proofgp/sandyboxing-cli/blob/ae2e8c7089d0edb77e770ed82e002ab048dffdd8/docs/platform-qualification.md) retains the full historical procedure, failed attempts and limits. No v0.1.0 asset, tag or original qualification script is replaced by this documentation candidate.
