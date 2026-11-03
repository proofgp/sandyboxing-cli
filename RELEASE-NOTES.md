# v0.1.1 — read-only compact discovery and planning

> **Release qualification snapshot.** macOS arm64 installed-runtime qualification, one actual local Hermes activation, and native Linux x64 draft qualification passed for this exact archive. **Post-publication anonymous fresh-install verification is PENDING at tagging.** See the [current results block](https://github.com/proofgp/sandyboxing-cli/blob/main/docs/platform-qualification.md#v011-results) for later evidence; the immutable version tag preserves its original snapshot.

## Artifact identity

- Repository: `https://github.com/proofgp/sandyboxing-cli`.
- Intended release: `https://github.com/proofgp/sandyboxing-cli/releases/tag/v0.1.1`.
- Asset: **`sandyboxing-read-only-0.1.1.tgz` — 80,233 bytes**.
- SHA-256: **`a166ebde41b87ed5c66270db0d68bf0bbdf173ff72259721503703034b821f9a`**.
- Companion asset: `SHA256SUMS`, exactly one line for that archive, matching the version-tagged repository checksum. A checksum is not a publisher signature.

Use the attached archive, not GitHub's automatic source archives. No npm-registry publication, `npx` shortcut, global installation or mutable `latest` URL is part of this release.

## Added

- `providers_search`: compact, filtered and paginated provider summaries. Full-catalogue filtering precedes neutral name/ID sorting and paging; combined requirements apply to one runtime variant.
- `provider_details`: complete packaged evidence for one provider returned by discovery.
- `plan_explain`: bounded candidate/exclusion prefixes while preserving all jobs, selection, reasoning, warnings, full totals and omission counts. Use `route_jobs` with the same inner request for the full plan.
- Doctor now checks **seven advertised tools and nine checks**. Host configurations permit **six read-only tools**; `forge_probe` remains discoverable for compatibility but locally denied and excluded from the host allowlist.

The existing `providers_list`, `route_jobs`, `forge_connection_status` and locally denied `forge_probe` interfaces remain. See [compact-tool usage](https://github.com/proofgp/sandyboxing-cli/blob/v0.1.1/docs/compact-tools.md); these are additive tools, not a new execution path or claims of measured token savings.

## Preserved boundaries

- Read-only only: no provider credentials loaded, live probe/workload execution, catalogue refresh or provider-readiness certification.
- Node requirement remains 24.x; the exact qualified runtime is **v24.22.2 / npm 11.19.1** on the targets actually recorded. Other patches, OSes and architectures are not inferred.
- SDK **1.32.1**, Zod **4.6.7** and all **95 non-root shrinkwrap dependency entries** are unchanged from v0.1.0. External packages are installed separately; the archive is not a self-contained offline installer. First install requires network access for those dependencies.
- v0.1.0 archive, tag and installed rollback path are not replaced. Its archive SHA-256 remains `e85d7313e52f4e5e6800a635cac4162c89c68f9d897fb0ab5671bef1e0cd26e1`, tag commit `182ae8fdc7f182af26aa333a4b65be0c66ffaf87`.

## Historical archive README — explicit supersession

The frozen archive deliberately retains its **private-candidate README**, including the then-current statement that no public v0.1.1 download existed. Its dependency notice likewise retains historical private-install timing text. **Neither is the current public distribution/qualification guide.** The version-tagged repository README, client/platform documents and these release notes supersede those status statements only to the extent supported by actual recorded evidence. Their read-only, safety and licensing qualifications remain applicable.

**The archive is not repacked or silently replaced.** Documentation evolution must not change these accepted compressed bytes. If distributed bytes change, a new version is required. Later results may be added in new documentation commits/release-note updates without moving an existing release tag.

## Qualification summary

- **macOS arm64:** accepted fresh-prefix offline copied-cache installation; 85 independent installed SDK cases, nine doctor checks, six SDK observer controls and nine stream controls. The same checks passed again after authenticated durable relocation; not 170 distinct SDK cases. This was not anonymous acquisition or an empty-cache network install.
- **Hermes:** actual local activation and successful calls to all six permitted tools are recorded. Sampling, resources, prompts and events stayed disabled. That does not qualify other profiles, hosted clients, every Hermes version or Claude Code.
- **Linux x64 v0.1.1:** **PASS** in [run 41558143607, attempt 1](https://github.com/proofgp/sandyboxing-cli/actions/runs/41558143607), workflow commit `9c78948d2d94c2d23cc4aa9eab2fb567938cad9d`. Draft acquisition, fresh empty-cache application-root `npm ci`, all 95 locked identities, nine doctor checks and real SDK stdio passed. Use the canonical recipe: ordinary local-tarball installation failed to enforce the subtree lock with this npm version. A draft download is not anonymous availability; post-publication anonymous acquisition/install remains **PENDING at tagging**. Runner-image environment `20261026.354.1` differs from setup log `20261025.353.1`; no exact image-build attestation is claimed.
- **Native Windows:** unqualified and deferred. Historical v0.1.0 startup failure remains unresolved; v0.1.0 Linux success is preserved as history, not transferred to this archive.
- **Claude Code:** inspected command grammar and setup guidance only; no v0.1.1 profile/UI or actual-tool-use qualification.

[Installation](https://github.com/proofgp/sandyboxing-cli/blob/v0.1.1/README.md) · [Client setup and compare-before-rollback](https://github.com/proofgp/sandyboxing-cli/blob/v0.1.1/docs/client-setup.md) · [Version-specific evidence and historical runs](https://github.com/proofgp/sandyboxing-cli/blob/v0.1.1/docs/platform-qualification.md)

## Licensing

`LICENSE` covers Sandyboxing-owned code/documentation only. Keep separately installed packages' licenses and notices. `EXTERNAL-DEPENDENCIES.txt` retains unresolved upstream provenance/license qualifications; externalization is not legal clearance, an MIT-only claim for the entire installed graph or permission to ship a combined dependency bundle.
