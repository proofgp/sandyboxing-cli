# sandyboxing v0.1.1 — read-only CLI

> **Published and anonymously verified.** [v0.1.1](https://github.com/proofgp/sandyboxing-cli/releases/tag/v0.1.1) passed macOS arm64 installed-runtime checks and Linux x64 anonymous download, fresh empty-cache installation and runtime checks in [run 41561463919](https://github.com/proofgp/sandyboxing-cli/actions/runs/41561463919). Follow the canonical `npm ci` recipe below. The immutable tag preserves its pre-anonymous-check snapshot; this later documentation commit records the completed gate without moving the tag or changing the archive.

Browse the packaged provider catalogue and plan independent jobs through local MCP. This CLI has **no live execution switch**, does not load provider credentials, does not refresh the catalogue and does not contact providers. Catalogue inclusion is not a connected account, current availability check or executable offer.

## Version and qualification boundary

- Requires **Node.js 24.x** and npm; accepted v0.1.1 installed-runtime evidence is specifically **Node v24.22.2 / npm 11.19.1, macOS arm64**. It includes nine doctor checks and 85 independent installed SDK cases. The durable-path replay repeats those cases; it is not another 85 distinct cases.
- **Linux x64 v0.1.1 passed** on Ubuntu 24.04 with Node v24.22.2 / npm 11.19.1 in [draft-qualified run 41558143607](https://github.com/proofgp/sandyboxing-cli/actions/runs/41558143607). The canonical application-root `npm ci` recipe preserved all 95 locked dependency identities and passed nine doctor checks plus real SDK stdio. Draft acquisition is not anonymous public availability. **Native Windows remains unqualified and deferred**; WSL is separate and unqualified. Other Node versions/architectures are not inferred. Runner-image identifiers disagree; see the results qualifications.
- Actual local Hermes activation of v0.1.1 and successful calls to all six permitted tools were previously verified. That is one local activation, not general Hermes/platform/profile qualification. Claude Code below is setup guidance only.
- First installation requires HTTPS access to GitHub release assets and `registry.npmjs.org`. External dependencies are installed separately: this is **not a self-contained offline installer**. Installed read-only CLI operation is offline; the host client's own model/telemetry traffic is separate.
- Direct dependencies are `@modelcontextprotocol/sdk` **1.32.1** and `zod` **4.6.7**. `npm-shrinkwrap.json` preserves all **95 non-root dependency entries** from v0.1.0, including resolved URLs and integrity values. No dependency upgrade is claimed.

### Which README applies?

The exact v0.1.1 tarball was frozen during private-candidate preparation. Its embedded `README.md` still says **“private owned-code candidate”** and documents a local copied-cache install. That is **historical build-time guidance**, not the current public installation or qualification guide. The dependency notice also contains historical private-candidate timing text.

The version-tagged [repository README](https://github.com/proofgp/sandyboxing-cli/blob/v0.1.1/README.md), [client guide](https://github.com/proofgp/sandyboxing-cli/blob/v0.1.1/docs/client-setup.md), [qualification record](https://github.com/proofgp/sandyboxing-cli/blob/v0.1.1/docs/platform-qualification.md) and [release notes](https://github.com/proofgp/sandyboxing-cli/releases/tag/v0.1.1) supersede **distribution and qualification status only**, according to the evidence actually recorded there. These links become usable when published. The archive's safety, read-only and licensing qualifications remain in force. The accepted archive is **not repacked** to synchronize prose. Later evidence belongs in a new documentation commit, not a moved release tag or replaced asset.

## Download, verify, install — after the release gate

Use the attached **`sandyboxing-read-only-0.1.1.tgz`**, not GitHub's automatic “Source code” archives. This is a release-only repository; private development source/history is not published here. No GitHub account is needed for the public recipe once released.

| Artifact | Fixed value |
|---|---|
| Release | `https://github.com/proofgp/sandyboxing-cli/releases/tag/v0.1.1` |
| Archive | `sandyboxing-read-only-0.1.1.tgz` |
| Bytes | **80,233** |
| SHA-256 | `a166ebde41b87ed5c66270db0d68bf0bbdf173ff72259721503703034b821f9a` |

The POSIX-shell recipe below uses a fresh, user-owned version directory, fresh npm cache and system `/usr/bin/tar`. It authenticates the exact six-member archive before extraction, then runs **`npm ci` at the extracted application root** (`PREFIX/node_modules/sandyboxing`), where its unchanged shrinkwrap matches its package manifest. Dependencies live under that application root's `node_modules`; there is no wrapper `.bin/sandyboxing` promise. The old `npm install <tarball>` recipe did not reliably enforce the embedded lock with npm 11.19.1 and is superseded, not silently requalified. It does not install Node, change PATH permanently, use `sudo`, install globally or modify any client profile. On Linux, use it only after the v0.1.1 Linux row is qualified. A failed attempt leaves its directory for diagnosis; do not blindly delete or reuse it.

```sh
set -eu
umask 077
test "$(node --version)" = v24.22.2
NODE_BIN=$(node -p 'process.execPath')
# Use npm bundled with this Node runtime, not a global package-manager shim.
NPM_CLI=$("$NODE_BIN" -e '
  const fs=require("node:fs"), p=require("node:path"), d=p.dirname(process.execPath);
  const f=[p.join(d,"node_modules/npm/bin/npm-cli.js"),
    p.resolve(d,"../lib/node_modules/npm/bin/npm-cli.js")].find(f=>fs.existsSync(f));
  if(!f) throw new Error("Bundled npm unavailable"); process.stdout.write(f);
')
ROOT="$HOME/.local/share/sandyboxing/0.1.1"
test ! -e "$ROOT"
test ! -L "$ROOT"
mkdir -p "$(dirname "$ROOT")"
mkdir "$ROOT"
DOWNLOAD="$ROOT/download"
PREFIX="$ROOT/installed"
mkdir "$DOWNLOAD" "$PREFIX" "$ROOT/npm-home" "$ROOT/npm-cache" "$ROOT/tmp"
: > "$ROOT/npm-user.conf"
: > "$ROOT/npm-global.conf"
cd "$DOWNLOAD"
base='https://github.com/proofgp/sandyboxing-cli/releases/download/v0.1.1'
asset='sandyboxing-read-only-0.1.1.tgz'
curl -q --fail --location --proto '=https' --proto-redir '=https' \
  --max-redirs 5 --connect-timeout 10 --max-time 300 --max-filesize 1048576 \
  --output "$asset" "$base/$asset"
curl -q --fail --location --proto '=https' --proto-redir '=https' \
  --max-redirs 5 --connect-timeout 10 --max-time 60 --max-filesize 4096 \
  --output SHA256SUMS "$base/SHA256SUMS"
curl -q --fail --location --proto '=https' --proto-redir '=https' \
  --max-redirs 5 --connect-timeout 10 --max-time 60 --max-filesize 4096 \
  --output SHA256SUMS.tag \
  'https://raw.githubusercontent.com/proofgp/sandyboxing-cli/v0.1.1/SHA256SUMS'
"$NODE_BIN" -e '
  const fs = require("node:fs"), crypto = require("node:crypto");
  const asset = "sandyboxing-read-only-0.1.1.tgz";
  const hash = "a166ebde41b87ed5c66270db0d68bf0bbdf173ff72259721503703034b821f9a";
  const line = `${hash}  ${asset}\n`;
  const data = fs.readFileSync(asset);
  if (data.length !== 80233 ||
      crypto.createHash("sha256").update(data).digest("hex") !== hash ||
      fs.readFileSync("SHA256SUMS", "utf8") !== line ||
      fs.readFileSync("SHA256SUMS.tag", "utf8") !== line) {
    throw new Error("Archive/checksum mismatch: stop without installing");
  }
  console.log("Archive size, SHA-256 and both checksum copies match");
'
# Pin npm under isolated empty configuration before any package operation.
owned_npm() {
  env -i HOME="$ROOT/npm-home" TMPDIR="$ROOT/tmp" \
    PATH="$(dirname "$NODE_BIN"):/usr/bin:/bin" \
    "$NODE_BIN" "$NPM_CLI" --userconfig="$ROOT/npm-user.conf" \
    --globalconfig="$ROOT/npm-global.conf" --cache="$ROOT/npm-cache" "$@"
}
test "$(owned_npm --version)" = 11.19.1
# Only the exact hash-verified archive above is admitted, not arbitrary tar input.
/usr/bin/tar -tzf "$DOWNLOAD/$asset" > "$ROOT/archive-members.txt"
"$NODE_BIN" -e '
  const fs=require("node:fs"), a=require("node:assert/strict");
  const names=["LICENSE","npm-shrinkwrap.json","package.json","README.md",
    "dist-cli/index.mjs","EXTERNAL-DEPENDENCIES.txt"].map(n=>"package/"+n).sort();
  a.deepEqual(fs.readFileSync(process.argv[1],"utf8").trimEnd().split("\n").sort(),names);
' "$ROOT/archive-members.txt"
APP="$PREFIX/node_modules/sandyboxing"
mkdir "$PREFIX/node_modules"
mkdir "$APP"  # Must be fresh; do not reuse an existing application root.
/usr/bin/tar -xzpf "$DOWNLOAD/$asset" --no-same-owner --strip-components=1 -C "$APP" \
  package/LICENSE package/npm-shrinkwrap.json package/package.json package/README.md \
  package/dist-cli/index.mjs package/EXTERNAL-DEPENDENCIES.txt
verify_own() {
  "$NODE_BIN" - "$APP" <<'NODE'
const fs=require('node:fs'), p=require('node:path'), a=require('node:assert/strict'), crypto=require('node:crypto');
const members={
  'LICENSE':'508a77d2e7b51d98adeed32648ad124b7b30241a8e70b2e72c99f92d8e5874d1',
  'npm-shrinkwrap.json':'870653bd10bd9d232f4a55b960d87799c18b6143b254c12863518fdc7ccc2204',
  'package.json':'9bd1951b090ef154bd15fe88f10ba8cfac121a2f03d77d5cce0a9545f26bed7e',
  'README.md':'b3fa32d6b7f8bb9563ec8848739c6dd834572c51d0ab030961d3c084ab46a3b2',
  'dist-cli/index.mjs':'f07a6e2dd3060aa75c1dc7b209b987f68c076cd1c527bf8384a3848751cd1bac',
  'EXTERNAL-DEPENDENCIES.txt':'c2dbf4730f5ea8f5d3f5e19b6a7e0bf83ef482890bb53482081ec9046c1c86c9'
};
for(const [name,sha] of Object.entries(members)) {
  const f=p.join(process.argv[2],name), s=fs.lstatSync(f);
  a.ok(s.isFile()&&!s.isSymbolicLink());
  a.equal(s.mode&0o7777,name==='dist-cli/index.mjs'?0o755:0o644);
  a.equal(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),sha);
}
NODE
}
verify_own
owned_npm ci --prefix "$APP" --registry=https://registry.npmjs.org/ \
  --ignore-scripts --no-audit --no-fund --omit=dev --fetch-retries=0 --strict-ssl=true
verify_own
owned_npm ls --prefix "$APP" --offline --all --json > "$ROOT/dependency-list.json"
"$NODE_BIN" - "$APP" "$ROOT/dependency-list.json" <<'NODE'
const fs=require('node:fs'), p=require('node:path'), a=require('node:assert/strict');
const app=process.argv[2], read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const lock=read(p.join(app,'npm-shrinkwrap.json')).packages;
const installed=read(p.join(app,'node_modules/.package-lock.json')).packages;
const names=Object.keys(lock).filter(Boolean).sort(); a.equal(names.length,95);
a.deepEqual(Object.keys(installed).sort(),names);
for(const name of names) {
  for(const key of ['version','resolved','integrity']) a.equal(installed[name][key],lock[name][key]);
  const manifest=read(p.join(app,name,'package.json'));
  a.equal(manifest.name,name.split('node_modules/').at(-1)); a.equal(manifest.version,lock[name].version);
}
const listing=read(process.argv[3]), problems=[];
function collect(n){if(n.problems)problems.push(...n.problems);for(const c of Object.values(n.dependencies||{}))collect(c);}
collect(listing);a.deepEqual(problems,[]);a.equal(listing.name,'sandyboxing');a.equal(listing.version,'0.1.1');
console.log('All 95 locked dependency identities and manifest versions match; npm ls is clean');
NODE
CLI="$APP/dist-cli/index.mjs"
"$NODE_BIN" "$CLI" --help
"$NODE_BIN" "$CLI" doctor --json
"$NODE_BIN" "$CLI" mcp-config --json
verify_own
```

Stop on any failure. Check the doctor report using the [client guide's explicit assertions](docs/client-setup.md#obtain-the-real-launch-values). Checksums identify bytes, **not a publisher signature**: even agreement between a release asset and tagged checksum is not independent proof of publisher identity. Compare against a separately trusted digest when available.

This is not `npm install sandyboxing`, `npx sandyboxing`, `npm update sandyboxing` or an npm-registry publication. Package metadata's `private: true` prevents registry publication, not extraction and root-project `npm ci`. The archive size excludes separately installed dependencies.

## Verify, then connect

```text
sandyboxing --help
sandyboxing doctor [--json]
sandyboxing mcp --read-only
sandyboxing mcp-config [--json]
```

Doctor starts the installed real stdio entry, discovers **seven tools** and expects **nine passing checks** on the qualified runtime. It exercises the packaged catalogue, fixed dry-run planner, passive status and compact tools. It does **not** authenticate an account, execute a probe/workload or validate provider readiness. Exit `0` means diagnostic success (possibly a runtime warning), `1` failure, `2` invalid command/flags. A warning or matching engine major is not qualification of an untested exact runtime.

`mcp-config --json` is **print-only**. It prints the actual absolute Node executable and entry with separate `"mcp"`, `"--read-only"` arguments. It neither finds nor edits profiles. The website also does not configure a client. Use the [client guide](docs/client-setup.md) for disabled-first Hermes staging and supported enable/reload; **no application/gateway restart is required for that flow**.

| Advertised tool | Behavior | Host policy |
|---|---|---|
| `providers_list` | Full packaged catalogue | Allow |
| `route_jobs` | Full dry-run plan | Allow |
| `forge_connection_status` | Passive local status; credentials not inspected | Allow |
| `providers_search` | Compact filtered/paginated catalogue | Allow |
| `provider_details` | Complete packaged evidence for one provider | Allow |
| `plan_explain` | Bounded explanation of the same dry-run plan | Allow |
| `forge_probe` | Compatibility name; locally denied with `read_only` | **Exclude** |

Use exactly the **six read-only tools** in a host allowlist. Probe descriptions/annotations do not grant execution authority. [Compact-tool usage and limitations](docs/compact-tools.md) explains pagination, evidence and full-detail retrieval.

## Upgrade, roll back, remove

Install each explicit version into its own fresh prefix; do not overwrite v0.1.0 or a working v0.1.1 install. Verify help, doctor and printed argv before any client change. Retain the old installation and selected server's verified, secret-free configuration. Compare it again before replacement, and follow the client guide's compare-before-rollback procedure. Restored configuration is not proof that the old runtime reconnected; verify actual allowed calls.

For removal, use the host's supported controls to disconnect/remove only this server and stop its process first. Inspect the exact version directory `$HOME/.local/share/sandyboxing/0.1.1` and remove only that owned installation and its dedicated download/cache/config directories manually when no longer needed. This is an extracted application project, not a wrapper dependency: `npm uninstall --prefix ... sandyboxing` is **not** its removal procedure. Do not delete other versions, the runtime or a shared cache. There is no automatic updater or mutable `latest` URL in this guide.

## History and licenses

- [v0.1.0 release](https://github.com/proofgp/sandyboxing-cli/releases/tag/v0.1.0) and [tagged guide](https://github.com/proofgp/sandyboxing-cli/blob/v0.1.0/README.md) remain unchanged.
- [Platform history and exact evidence boundaries](docs/platform-qualification.md#v010-history) preserve v0.1.0 Linux success and the deferred Windows failure.
- `LICENSE` covers Sandyboxing-owned code/documentation only. See `EXTERNAL-DEPENDENCIES.txt` for separately installed dependencies' terms and unresolved upstream provenance/license qualifications. Externalization is **not upstream license clearance**, an MIT-only assertion about the installed graph or permission to distribute a combined offline dependency bundle.
