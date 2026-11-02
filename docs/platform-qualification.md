# Platform qualification results and bounded manual procedure

## Current results — 2026-11-02

The accepted scope is **macOS arm64 and Linux x64 with Node v24.22.2 / npm 11.19.1**. **Native Windows is not qualified and further Windows work is deferred.** The v0.1.0 archive, tag and checksum assets are unchanged. The shell installation recipe in the main README remains the macOS recipe; Linux qualification used the explicit scripted acquisition/install procedure below.

| Target | Observed result | Scope |
|---|---|---|
| macOS arm64 | Previously accepted public-download, fresh-install, doctor and SDK evidence | Historical release qualification; not a new run in this campaign |
| GitHub Ubuntu 24.04 x64 | Passed both manual runs; doctor six checks, launch argv, three exit-2 negatives and real SDK stdio passed | CLI runtime only; neither Hermes nor Claude was available on PATH |
| GitHub Windows 2025 x64 | First run stopped in source-framing calibration. After the checkout repair, all 20 SDK controls passed, but installed doctor exited 1 at local MCP startup | Not qualified; later config/negative-argument/real-product-SDK checks were not reached |

Evidence: [first run 41490165600](https://github.com/proofgp/sandyboxing-cli/actions/runs/41490165600), commit `ec1cf8d6dbf16b68d18382817a2f320f79e86951`; [checkout-repaired run 41493419956](https://github.com/proofgp/sandyboxing-cli/actions/runs/41493419956), commit `66e4357161f25a275afb50a35ea644d387e74f7b`. Both workflows correctly remain failed overall because Windows failed; Linux success is not a campaign-wide PASS.

The one-line `.gitattributes` rule preserves LF in qualification MJS checkouts without changing test assertions or the CLI. A local Git CRLF checkout reproduced the first failure, but the original Windows raw checkout/config was not retained. The later native run demonstrates that the source-control stage passes; it does not establish the cause of the subsequently reached doctor failure. Doctor reported a matching runtime, failed local MCP startup, disabled execution and credentials not inspected. Its underlying startup cause remains unresolved.

Limitations: both Linux RESULT records reported image version `20261026.354.1`, while their runner setup logs reported `20261025.353.1`; exact image-build identity is unresolved. Qualification is scoped to the observed runner label, architecture and product runtime, not a claimed reproducible full VM image. GitHub also reported that the pinned v4 Actions declare Node 20 but are forced to run on Node 24; that Action runtime is separate from the observed product Node v24.22.2. SDK close callbacks are not independent child-reap evidence. No provider/model calls, actual client-profile setup or OS-level egress-denial claim is supplied by these runs.

The two qualification repair cycles are exhausted. This procedure does not authorize another repair, rerun, release replacement or live execution.

## Delivery order and authority

1. Parent verifies website delivery first.
2. Independent reviewer accepts the exact workflow, scripts, pins and guidance.
3. Parent separately approves publication of these **new release-only repository files** and the bounded manual workflow dispatch.
4. Only then run Linux x64 / Windows x64 qualification and review real receipts.

This work does not change v0.1.0, move a tag, rebuild the CLI, replace an asset, publish private development source, update provider data, configure a real user profile, or authorize paid/provider/model calls. The workflow is deliberately `workflow_dispatch` only. Both inputs default to `hold`; the harness also checks the gate and exact hosted repository before doing any work. These inputs record the parent's decision, not an independently enforced website deployment attestation.

## Available environments and present evidence

| Environment | Observed availability | Qualification status |
|---|---|---|
| Existing macOS arm64 | Actual local host; installed Hermes and Claude Code inspected through version/help commands | Existing v0.1.0 Node v24.22.2 / npm 11.19.1 doctor, SDK and disposable host-bridge receipts are historical accepted evidence. Not re-run here; not actual profile/UI setup. |
| Local default Node | v26.12.0 / npm 11.20.0 observed | Used only for pure harness checks and syntax. Does not qualify CLI on Node 26. |
| GitHub `ubuntu-24.04` x64 | Executed on the standard public-repository runner | CLI runtime qualified; see actual runs and image-identity qualification above. |
| GitHub `windows-2025` x64 | Executed on the standard public-repository runner | Not qualified: installed doctor failed MCP startup after source controls passed. Native Windows, not WSL. |
| Local Linux/Windows machinery | No `docker`, `podman`, `limactl`, `qemu-system-x86_64`, or `pwsh` on inspected PATH | No local target available from this bounded check. No daemon/SSH/credential discovery, provisioning or installs attempted. |
| Hermes / Claude on hosted images | Both reported `unavailable-on-PATH` in the actual jobs | Neither client is qualified by this campaign. No implicit host installation or profile changes. |

Official GitHub docs say standard hosted runners are free and unlimited **for public repositories**. This is not a guarantee of immediate scheduling, quota-policy eligibility, or availability for this account. No larger/self-hosted runner or paid VM is selected. `ubuntu-slim` is not used. The current image inventory is mutable; receipts record the actual image version and OS release.

## Published qualification files

Copy only the reviewed `public/` contents into the existing release-only repository. That contains `.github/workflows/qualify-readonly-v010.yml`, `qualification/` and these `docs/` files. Do **not** copy the parent workspace, local evidence, existing private test harnesses, installed dependency trees or the historical oracle's source metadata. A README link update is a separate prospective documentation change; retain existing platform limitations until results are accepted.

The workflow reads the public repository, uses only standard x64 runners, caps each job at 15 minutes, limits concurrency to two, does not automatically retry, and grants only `contents: read`. Checkout does not persist credentials. No repository secrets or provider credentials are referenced. Built-in GitHub checkout/artifact service authentication is not provider authorization.

Action commits were resolved from GitHub's API and their exact commits retrieved:

| Action | Commit |
|---|---|
| `actions/checkout` v4 | `11d5960a326750d5838078e36cf38b85af677262` |
| `actions/setup-node` v4 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `actions/upload-artifact` v4 | `ea165f8d65b6e75b540449e92b4886f43607fa02` |

Node is exactly `24.22.2`, x64, with no `latest` lookup or global tool/npm upgrade. Official Node release metadata lists npm `11.19.1` for it; the harness verifies the actual bundled npm and fails on mismatch.

## What the runnable harness checks

`node qualification/qualify.mjs qualification-run` is the literal workflow invocation. It refuses an existing output directory and refuses execution outside the approved exact hosted-repository gate.

1. **Anonymous public acquisition:** fixed v0.1.0 `SHA256SUMS` and `.tgz`; HTTPS only; limited redirects to GitHub release hosts; no Authorization header; no signed redirect query stored. Check the exact separately pinned digest `e85d7313e52f4e5e6800a635cac4162c89c68f9d897fb0ab5671bef1e0cd26e1` and 79,015-byte archive. A checksum is not a publisher signature.
2. **Fresh installation:** new owned prefix, HOME, npm cache, distinct empty npm user/global config files, explicit registry, TLS verification, scripts/audit/funding disabled, no retries, no global installation. Run Node's bundled `npm-cli.js` directly (avoids Windows `.cmd` invocation ambiguity). External dependencies are downloaded, not copied from the prior Mac installation.
3. **Installed identity:** compare all six installed own-file digests to the authenticated archive; inspect real `npm ls --all --json` with an explicit root manifest and reject dependency diagnostics. npm performs lock/integrity enforcement. This is not an independent complete transitive-code audit or proof that dependencies are immutable.
4. **Installed behavior:** from an unrelated cwd with spaces in the prefix, real help, doctor (`status:ok`, exact Node version, six passing checks, read-only, credentials not inspected), and exact printed Node+entry+`mcp`+`--read-only` argv. Unknown/combined/live-like arguments must exit `2`.
5. **Real SDK stdio:** use the installed pinned SDK 1.32.1 via public interfaces; initialize; discover exact four tools/output schemas; call catalogue, fixed dry-run planner, passive status and the locally denied compatibility probe; compare public-result fingerprints and structured/text equivalence. Observe public `client.onerror` before connection and retain every error through completed close; an early or late error prevents acceptance. No model inference or provider access.
6. **Shutdown / evidence:** observe controller-owned subprocess close and the SDK's public transport-close callback. Do not claim direct server-child exit status or independent reaping from SDK `close()`. Compare installed own files again. Save explicit passed/failed receipt and non-secret command logs.

The whole harness has a shared ten-minute deadline; acquisition has 120-second request deadlines and bounded artifact sizes, install 300 seconds, runtime subprocesses 30–45 seconds, captured command output 2 MiB. The 15-minute job cap is the final OS-stall bound. This is a small standard-runner campaign, not the prior Mac sandbox/loopback-broker confinement policy. No OS-level network denial or arbitrary npm dependency bandwidth ceiling is claimed. npm registry access is needed for installation; read-only runtime is expected not to contact providers, but that expectation is not a network-capture assertion here.

Only `qualification-run/evidence/*.json` is uploaded, retained seven days. It does not upload installed dependencies, downloaded archives, caches, user directories or source snapshots. Action infrastructure can still retain job logs according to repository settings. Timeout before a final receipt is an incomplete run, never a pass. No automatic rerun or broadened budgets.

## Host setup remains its own next gate

The hosted campaign must not bootstrap Hermes/Claude merely to make a support matrix green. Its SDK test is **not** a real-host test. When a supported client is already installed on an authorized target, use the client guide's supported add/test interfaces against an explicitly approved disposable config home, record exact client version and actual output, and leave real profiles untouched. Validate the client's documented config-home isolation on that platform before using it; HOME alone is not a proof of isolation. Do not launch `hermes chat`, `claude -p`, a model prompt, login, installer or auto-updater.

On this Mac, Hermes and Claude are present and their supported command help is captured. The existing disposable Hermes bridge receipt is historical evidence. A later bounded client-setup validation should use the printed config, `hermes mcp add`/`test` and `claude mcp add`/`get`, observe readback and cleanup of **only the newly owned disposable entry**, and inspect no token files. Actual desktop/UI profile setup requires its own explicit user selection and verification. On hosted Linux/Windows, absence stays an honest unavailable result; an unexpected installed client is `available-not-exercised`, not auto-qualified.

## Manual dispatch procedure — requires its own applicable authority

Prerequisites: website delivered; exact candidate review approved; intended release-only publication set approved; supported GitHub authentication can publish the workflow. These prerequisites were met for the recorded runs, including a normal authorized OAuth workflow-scope refresh. Future scope or authentication gaps must use the supported route, not credential discovery, account substitution or a bypass. The recorded runs do not authorize automatic retries.

After the parent has published and read back the reviewed new commit on the default branch, the proposed dispatch is:

```sh
gh workflow run qualify-readonly-v010.yml --repo proofgp/sandyboxing-cli --ref main \
  -f website_gate=website-delivered -f release_review=reviewed
```

Before dispatch, recheck the exact branch SHA against the approved candidate; don't trust a moving `main`. The workflow must exist on the default branch for manual dispatch. Parent retrieves the exact run ID, real job conclusions and evidence artifacts, reconciles all expected stages and host-unavailable distinctions, and reviews failures without rewriting them. Successful runs support only the exact artifact/runtime/OS/architecture tested. Update public qualification language only after acceptance, as a new docs commit; keep the original release tag/assets unchanged.

## Preparation checks actually run

Pure acceptance self-tests and JavaScript/YAML/shell syntax checks were preparation, not platform qualification. The actual campaign results above now separately cover acquisition, installation and the exercised runtime stages. Host add/test commands and the native PowerShell setup snippet still have **not** been exercised against user profiles; no such qualification is claimed.

## Portable SDK observation regressions

The original eight dependency-free tests remain unchanged in `qualification/selftest.mjs`. A separate test member, `qualification/sdk-selftest.mjs`, needs the public installed SDK, so the controller runs it after dependency verification and before installed CLI behavior. A nonzero test exit fails qualification through the existing `success` guard. This adds no installation, retry, output allowance, or time-budget reset.

```sh
node --test-reporter=tap qualification/sdk-selftest.mjs /absolute/installed/dist-cli/index.mjs
```

The entry argument is only a dependency-resolution anchor; this test never imports or executes that entry. It selects the neighboring `sdk-stdio.mjs` initialization/connect and final shutdown/acceptance cuts, and the actual controller success/caller cuts, without substituting an error observer or accepting parser. Twenty portable controls cover healthy traffic, transport errors before/during initialization, late protocol/transport errors, both error paths during and after the close callback while close remains pending, sticky multiple faults, SDK transport-handler ownership, stderr/close acceptance, controller exit/signal/receipt/JSON guards, and calibration invocation/failure propagation. These are in-memory SDK exchanges and caller controls, not a server process or target-platform qualification. The same eight pure tests still run before installation in the held workflow.

## Sources

- [GitHub hosted runner availability and public-repo pricing](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- [Ubuntu 24.04 software inventory at retrieved commit](https://github.com/actions/runner-images/blob/4da2307112a0fad2fd2ecaca8ba7d08683b8c581/images/ubuntu/Ubuntu2404-Readme.md)
- [Windows 2025 software inventory at retrieved commit](https://github.com/actions/runner-images/blob/4da2307112a0fad2fd2ecaca8ba7d08683b8c581/images/windows/Windows2025-Readme.md)
- [Node distribution metadata](https://nodejs.org/dist/index.json), [v24.22.2 checksums](https://nodejs.org/dist/v24.22.2/SHASUMS256.txt)
- [Immutable-by-policy v0.1.0 release](https://github.com/proofgp/sandyboxing-cli/releases/tag/v0.1.0)
