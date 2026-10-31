# sandyboxing — read-only CLI

> **Read-only release.** Install the versioned release asset below. This is not an offline installer or a provider execution client.

Browse the packaged provider catalogue and plan independent jobs locally through MCP. This release has no live execution switch, does not load provider credentials and does not contact providers. Catalogue entries are not connected accounts, current availability checks or executable offers.

## Requirements and scope

- **Node.js 24.x** and npm. Qualification is limited to **Node.js v24.22.2 / npm 11.19.1 on macOS arm64**; other Node versions and platforms are not qualified.
- First installation needs HTTPS access to GitHub release assets and `registry.npmjs.org` for external dependencies. This tarball is **not an offline installer**. Read-only CLI operation is offline after installation; a host client's own network activity is separate.
- The package pins `@modelcontextprotocol/sdk` to `1.32.1` and `zod` to `4.6.7`. Its `npm-shrinkwrap.json` binds transitive versions and integrity. Dependency code is installed separately, not bundled in this tarball.
- This is a release-only repository. Use the attached CLI `.tgz`, **not** GitHub's automatically generated “Source code” zip/tar archives. Development source and history are not published here.

## Download, verify, install

Use this macOS shell recipe with a fresh download directory. No GitHub account is required; this distribution uses release assets rather than an npm registry publication.

```sh
set -eu
node --version
npm --version

# Explicit version; do not substitute a latest URL.
base='https://github.com/proofgp/sandyboxing-cli/releases/download/v0.1.0'
asset='sandyboxing-read-only-0.1.0.tgz'
DOWNLOAD=$(mktemp -d "${TMPDIR:-.}/sandyboxing-download.XXXXXX")
cd "$DOWNLOAD"
curl -q --fail --location --proto '=https' --proto-redir '=https' \
  --max-time 300 --output "$asset" "$base/$asset"
curl -q --fail --location --proto '=https' --proto-redir '=https' \
  --max-time 300 --output SHA256SUMS "$base/SHA256SUMS"
shasum -a 256 -c SHA256SUMS

# A new, user-owned, version-specific prefix; no sudo or global installation.
PREFIX="$HOME/.local/share/sandyboxing/0.1.0"
test ! -e "$PREFIX"
mkdir -p "$PREFIX"
npm install --prefix "$PREFIX" --registry=https://registry.npmjs.org \
  --ignore-scripts --no-audit --no-fund --no-save --no-package-lock \
  --omit=dev --fetch-retries=0 --strict-ssl=true \
  "$DOWNLOAD/$asset"
CLI="$PREFIX/node_modules/.bin/sandyboxing"
"$CLI" --help
"$CLI" doctor --json
"$CLI" mcp-config --json
```

Stop on a download, checksum, installation or diagnostic failure. `SHA256SUMS` must contain exactly one entry for `sandyboxing-read-only-0.1.0.tgz`; the copy committed at tag `v0.1.0` and the attached checksum asset must agree. Compare with a separately trusted checksum when available. A checksum downloaded beside the tarball detects mismatches but is **not a signature or independent proof of publisher identity**. Never install after a mismatch.

No registry command such as `npm install sandyboxing`, `npx sandyboxing` or `npm update sandyboxing` is part of this distribution. The generated package's `private: true` prevents npm registry publication; it does **not** prevent installation from a downloaded tarball.

## Verify and connect a client

`doctor` starts the installed read-only stdio entry, discovers tools and checks the local catalogue, fixed dry-run planner and disabled execution. It does not authenticate an account or validate provider readiness. Exit `0` means those checks passed, possibly with a runtime warning; `1` means diagnostic failure; `2` means invalid command or flags. Inspect the runtime and report status, not only the exit code. A warning on another Node version does not qualify that version.

The public command grammar is:

```text
sandyboxing --help
sandyboxing doctor [--json]
sandyboxing mcp --read-only
sandyboxing mcp-config [--json]
```

`mcp-config --json` only prints configuration; it never finds or edits client profiles. It supplies the actual Node executable and installed entry as separate argv elements, ending in `"mcp", "--read-only"`. Follow your client's configuration instructions and preserve those separate arguments. Restart the client after changing configuration. Run `doctor` first; a successful diagnostic is not by itself qualification of every MCP host or protocol version.

The four MCP tool names remain unchanged:

| Tool | Behavior in this release |
| --- | --- |
| `providers_list` | Reads the packaged catalogue. |
| `route_jobs` | Plans jobs without executing them. |
| `forge_connection_status` | Returns local read-only status; credentials and provider availability are not inspected. |
| `forge_probe` | Remains discoverable for compatibility, but is denied locally with `read_only`; it cannot execute a probe in this release. |

Do not interpret the probe's retained general-purpose description or annotations as execution authority. No new provider pricing, limits or live capability claims are made by this guide.

## Update or roll back

Choose an explicit published version and read its release notes. Repeat download and checksum verification using that version's tag, exact asset name and checksum file. Install into a **new version-specific prefix** with the same script-disabled flags, then run its help, doctor and printed configuration. Do not overwrite the old installation or reuse another version's checksum. Configure the client with the new printed argv and restart it only after verification. Keep the previous verified prefix until the new client launch succeeds; rollback means restoring its printed argv and restarting the client.

There is no automatic updater or `latest` download URL in this recipe. A release asset must not be silently replaced under an existing version.

## Remove

First remove this server's entry from the MCP client using the client's own configuration controls and stop its running server. For the installation above:

```sh
PREFIX="$HOME/.local/share/sandyboxing/0.1.0"
npm uninstall --prefix "$PREFIX" --offline --ignore-scripts \
  --no-audit --no-fund --no-package-lock sandyboxing
```

Remove any now-unused version/download directories manually after checking their contents. This does not uninstall Node, edit client settings, remove other versions or delete npm's shared cache. No PATH or shell startup file was changed by the installation recipe.

## License and dependency notices

`LICENSE` applies to Sandyboxing-owned software and documentation only. Separately installed dependencies retain their own terms and notices; see `EXTERNAL-DEPENDENCIES.txt`. Externalization is not upstream license clearance or permission to redistribute a combined offline dependency bundle.
