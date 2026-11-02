# Connect the read-only CLI to Hermes or Claude Code

**Setup guidance; not evidence of completed profile/UI setup.** First acquire and verify the [v0.1.0 release asset](https://github.com/proofgp/sandyboxing-cli/releases/tag/v0.1.0) using the repository's installation guide. Run doctor before configuring a client. No provider key, login, model call, or live execution is needed for the checks below.

CLI-runtime qualification covers **macOS arm64 and Linux x64, Node v24.22.2, npm 11.19.1**; Linux was tested on the GitHub Ubuntu 24.04 runner. **Native Windows remains unqualified** after a failed installed-doctor MCP startup check; see [actual results](platform-qualification.md). Neither Hermes nor Claude was available on PATH in the hosted jobs, so those jobs do not qualify client setup. During preparation, installed help was inspected for Hermes **v0.22.5, local bf0203a794a0** and Claude Code **2.1.314**. Documentation can be ahead of installed releases; use each client's `--help` if your version differs. The client command grammar is verified, but these add/test commands have **not been executed against a user profile** in this preparation.

## Obtain the real launch values (macOS / POSIX shell)

Run in the same environment that will host the MCP server. The installed runtime and prefix must remain available after setup. A remote Hermes gateway needs paths on that remote host, not paths on your laptop.

```sh
set -eu
PREFIX="$HOME/.local/share/sandyboxing/0.1.0"
CLI="$PREFIX/node_modules/.bin/sandyboxing"
"$CLI" --help
DOCTOR=$("$CLI" doctor --json)
printf '%s\n' "$DOCTOR"
printf '%s\n' "$DOCTOR" | node -e '
  const fs=require("node:fs"), d=JSON.parse(fs.readFileSync(0,"utf8"));
  if(d.status!=="ok" || d.runtime.actual!=="v24.22.2" || !d.runtime.matchesDeclared ||
     d.liveExecution!=="disabled" || d.credentials!=="not-inspected") process.exit(1);
'
CONFIG=$("$CLI" mcp-config --json)
printf '%s\n' "$CONFIG"
NODE_BIN=$(printf '%s\n' "$CONFIG" | node -e '
  const fs=require("node:fs"), s=JSON.parse(fs.readFileSync(0,"utf8")).mcpServers.sandyboxing;
  if(typeof s.command!=="string" || s.args.length!==3 || s.args[1]!=="mcp" || s.args[2]!=="--read-only") process.exit(1);
  process.stdout.write(s.command);
')
CLI_ENTRY=$(printf '%s\n' "$CONFIG" | node -e '
  const fs=require("node:fs"), s=JSON.parse(fs.readFileSync(0,"utf8")).mcpServers.sandyboxing;
  if(s.args.length!==3 || s.args[1]!=="mcp" || s.args[2]!=="--read-only") process.exit(1);
  process.stdout.write(s.args[0]);
')
```

Stop if any command fails. This reads the generated JSON, not a guessed Node/entry path. `mcp-config` is print-only. Keep the executable and all three arguments separate; **`"mcp --read-only"` is not one argument**. Do not use `npx sandyboxing`, replace the release with an npm package, or run the bare MCP process manually as a health check (it waits for a client).

## Hermes: use the supported MCP command

This step **writes to the selected existing Hermes profile**. Choose that profile deliberately; don't overwrite another server with the same name. Inspect existing connections through Hermes's own controls before adding it. If already present, stop and compare its configuration rather than removing it blindly.

```sh
PROFILE=default  # replace only if you intend a different EXISTING profile
hermes -p "$PROFILE" mcp add sandyboxing \
  --command "$NODE_BIN" --args "$CLI_ENTRY" mcp --read-only
```

`--args` must be the last Hermes option. Follow the discovery/selection prompt; select `providers_list`, `route_jobs`, and `forge_connection_status`. `forge_probe` is retained by the release for protocol compatibility but always returns a local `read_only` denial. It need not be exposed in the agent's tool selection.

Disable optional server-initiated sampling using the supported config command, then test the exact server:

```sh
hermes -p "$PROFILE" config set mcp_servers.sandyboxing.sampling.enabled false
hermes -p "$PROFILE" mcp test sandyboxing
```

Check the actual connection result and tool names. Current official docs specify test exits `0` connected, `1` failed, `3` missing configuration (`2` is usage error). Check your installed version rather than treating all zero-exit commands as setup success. Start a new session on that same profile, or use `/reload-mcp` where your installed client supports it. Do not restart an active gateway just to test this setup.

Hermes's config root is `mcp_servers`; the CLI's generic JSON uses `mcpServers`. The add command handles that mapping—do not paste the generic wrapper as an unknown root setting and do not hand-edit the live YAML. Client-side tool prefixes vary by version; verify the server-native names instead of guessing the prefix.

Removal, only for the entry you added:

```sh
hermes -p "$PROFILE" mcp remove sandyboxing
```

## Claude Code: explicit stdio and local scope

Run this from the project where you want the server. `--scope local` is private to you for that project; it is not a shared `.mcp.json` commit and not a global user-scoped entry. It still writes Claude's configuration. If `sandyboxing` already exists, stop and compare first.

```sh
claude mcp add --transport stdio --scope local sandyboxing -- \
  "$NODE_BIN" "$CLI_ENTRY" mcp --read-only
claude mcp get sandyboxing
```

The `--` separates Claude flags from server argv. Check **Connected**, not just the successful “Added” message. `get` performs a health check for an enabled, approved server. Pending approval or disabled/blocked status is not connection success; resolve it through the normal client UI without bypassing trust or managed policy. In a new or refreshed Claude Code session, `/mcp` shows the server and connection status. No prompt/model inference is necessary for the CLI health check.

For a deliberate different scope, read Claude's scope documentation first. `project` writes a shared `.mcp.json` and introduces a workspace approval step; `user` exposes the server across your projects. Neither is the default recommendation here.

Removal from the same project and scope:

```sh
claude mcp remove --scope local sandyboxing
```

## Windows PowerShell syntax — native Windows unqualified

This is a proposed native-Windows setup form, **not a Windows support claim**. Do not copy a macOS/WSL path into native Windows. After a separately verified native-Windows installation, set `$Entry` to that installation's real `dist-cli\index.mjs` and use the Node v24.22.2 executable from the same environment:

```powershell
$Entry = 'C:\replace-with-verified-prefix\node_modules\sandyboxing\dist-cli\index.mjs'
$DoctorText = & node $Entry doctor --json
if ($LASTEXITCODE -ne 0) { throw 'doctor failed' }
$Doctor = $DoctorText | ConvertFrom-Json
if ($Doctor.status -ne 'ok' -or $Doctor.runtime.actual -ne 'v24.22.2' -or -not $Doctor.runtime.matchesDeclared -or $Doctor.liveExecution -ne 'disabled') { throw 'runtime/read-only checks failed' }
$ConfigText = & node $Entry mcp-config --json
if ($LASTEXITCODE -ne 0) { throw 'mcp-config failed' }
$Server = ($ConfigText | ConvertFrom-Json).mcpServers.sandyboxing
if ($Server.args.Count -ne 3 -or $Server.args[1] -ne 'mcp' -or $Server.args[2] -ne '--read-only') { throw 'Unexpected launch argv' }
$NodeBin = $Server.command
$CliEntry = $Server.args[0]
```

Choose **one** client. These commands change its selected configuration.

Hermes (chosen existing profile):

```powershell
hermes -p default mcp add sandyboxing --command $NodeBin --args $CliEntry mcp --read-only
```

Or Claude Code (from the intended project):

```powershell
claude mcp add --transport stdio --scope local sandyboxing -- $NodeBin $CliEntry mcp --read-only
```

Use the same-client verification/removal steps above. A native `node.exe` launch avoids requiring an `npx.cmd`/`cmd /c` wrapper; do not add a shell wrapper to the printed argv. Native Windows and WSL are separate qualification targets. This PowerShell snippet has only static review, not Windows execution evidence.

## What success does—and does not—mean

- Doctor: the installed release initializes real local stdio, discovers four tools, matches its packaged catalogue and fixed planner, and observes disabled execution.
- `hermes mcp test` / `claude mcp get`: the selected installed client can connect and discover; neither is proof of a model successfully using every tool.
- Existing disposable host-bridge qualification is not proof that your real profile, desktop UI, gateway, or another version is configured.
- No provider account is authenticated or checked. `forge_connection_status` is passive/read-only. `forge_probe` cannot execute in this release, regardless of its general-purpose description.
- An MCP server being read-only does not turn the entire host application offline. Client telemetry/model traffic is separate; do not send a prompt if you want no model calls.

## Official references

- [Hermes MCP usage and CLI test](https://hermes-agent.nousresearch.com/docs/guides/use-mcp-with-hermes)
- [Hermes MCP behavior](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)
- [Hermes configuration roots, filtering and reload](https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference)
- [Claude Code local stdio, scope and health checks](https://code.claude.com/docs/en/mcp)
