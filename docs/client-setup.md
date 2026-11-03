# Client setup — sandyboxing v0.1.1

**Setup guidance, not an automatic installer or a general client qualification.** First follow the [v0.1.1 installation guide](../README.md), including its publication/anonymous-install gate, and inspect the [current qualification record](https://github.com/proofgp/sandyboxing-cli/blob/main/docs/platform-qualification.md#v011-results). Linux runtime qualification passed; hosted client setup was not exercised. No provider credentials or provider operations are needed. The website and `mcp-config` do not modify client profiles.

Accepted local history includes actual Hermes activation and successful calls to all six permitted tools on macOS arm64. This is separate from the 85 installed SDK cases and nine doctor checks, and it does not qualify other profiles, hosts or versions. **Claude Code profile setup has not been exercised for v0.1.1.** During this documentation preparation, command help was inspected for Hermes **v0.22.5, local bf0203a794a0** and Claude Code **2.1.316**; no add/test/config-write command was run against a user profile. Check installed help before using another client version.

## Obtain the real launch values

Use paths on the machine hosting the MCP process. A remote gateway cannot use your laptop's local paths. Keep the runtime and versioned installation in durable storage, not a temporary directory. These commands assume the README's extracted application-root `npm ci` layout and invoke the actual entry with Node; that project does not create a wrapper `.bin/sandyboxing` link:

```sh
set -eu
ROOT="$HOME/.local/share/sandyboxing/0.1.1"
NODE_BIN=$(node -p 'process.execPath')
test "$("$NODE_BIN" --version)" = v24.22.2
CLI="$ROOT/installed/node_modules/sandyboxing/dist-cli/index.mjs"
"$NODE_BIN" "$CLI" --help
DOCTOR=$("$NODE_BIN" "$CLI" doctor --json)
printf '%s\n' "$DOCTOR"
printf '%s\n' "$DOCTOR" | node -e '
  const fs=require("node:fs"), d=JSON.parse(fs.readFileSync(0,"utf8"));
  const tools=["providers_list","route_jobs","forge_connection_status",
    "providers_search","provider_details","plan_explain","forge_probe"].sort();
  if(d.status!=="ok" || d.mode!=="read-only" || d.runtime.actual!=="v24.22.2" ||
     !d.runtime.matchesDeclared || d.liveExecution!=="disabled" ||
     d.credentials!=="not-inspected" || d.checks.length!==9 ||
     !d.checks.every(c=>c.status==="pass") ||
     JSON.stringify([...d.tools].sort())!==JSON.stringify(tools)) process.exit(1);
'
CONFIG=$("$NODE_BIN" "$CLI" mcp-config --json)
printf '%s\n' "$CONFIG"
NODE_BIN=$(printf '%s\n' "$CONFIG" | node -e '
  const fs=require("node:fs"), p=require("node:path");
  const s=JSON.parse(fs.readFileSync(0,"utf8")).mcpServers.sandyboxing;
  if(!p.isAbsolute(s.command) || s.args.length!==3 || !p.isAbsolute(s.args[0]) ||
     s.args[1]!=="mcp" || s.args[2]!=="--read-only") process.exit(1);
  process.stdout.write(s.command);
')
CLI_ENTRY=$(printf '%s\n' "$CONFIG" | node -e '
  const fs=require("node:fs"), s=JSON.parse(fs.readFileSync(0,"utf8")).mcpServers.sandyboxing;
  process.stdout.write(s.args[0]);
')
```

Stop on any failure. Keep the executable and three arguments separate: `"mcp --read-only"` is **not** one argument. Do not substitute `npx`, a guessed package name or a shell wrapper. A manually launched `mcp --read-only` waits for a protocol client; use doctor instead of treating that wait as a startup failure.

## Hermes: disabled-first staging

Hermes uses `mcp_servers`, not the generic printed JSON wrapper `mcpServers`. Native tool filtering belongs under `tools.include`; resources/prompts have separate controls and events are a server-level flag.[1]
Sampling is enabled by default in Hermes, so disable it **before the first discovery connection**, not after `mcp add` has already connected.[2]

The following is for a **new, absent server name only**. It writes to the selected existing profile, not a disposable profile. Choose the intended profile deliberately. Use supported config commands; do not hand-edit live YAML or use `--force` to bypass an unsupported setting.[4]

1. Check `hermes config get --help`, `hermes config set --help` and the selected connection in Hermes's settings/connection controls. The installed version must accept a JSON object for `config set` and JSON readback for `config get`.
2. Inspect **only** `mcp_servers.sandyboxing`. Confirm it is genuinely absent. A `Config key not set: mcp_servers.sandyboxing` result is absence; an arbitrary nonzero exit, permission failure or malformed configuration is **not**. If present, stop here and follow **Existing-server upgrade and rollback** below. Do not dump the whole profile or request raw/unmasked values.

```sh
PROFILE=default  # choose the intended EXISTING profile
if hermes -p "$PROFILE" config get mcp_servers.sandyboxing --json; then
  printf '%s\n' 'STOP: the server exists; use the upgrade/rollback section.'
else
  printf '%s\n' 'Inspect the diagnostic: only the explicit missing-key result establishes absence.'
fi
```

This is a manual inspection checkpoint, not an automated permission to write. The conditional keeps an expected missing-key exit from terminating a shell that uses `set -e`. Do not turn all command failures into an “absent” boolean.

3. Once absence is established, generate the **complete** entry from the CLI's printed argv, then recheck absence immediately before the write. Do not run this new-entry write against an existing working connection.

```sh
STAGED=$(printf '%s\n' "$CONFIG" | node -e '
  const fs=require("node:fs"), p=require("node:path");
  const s=JSON.parse(fs.readFileSync(0,"utf8")).mcpServers.sandyboxing;
  if(!p.isAbsolute(s.command) || s.args.length!==3 || !p.isAbsolute(s.args[0]) ||
     s.args[1]!=="mcp" || s.args[2]!=="--read-only") process.exit(1);
  process.stdout.write(JSON.stringify({
    command:s.command, args:s.args, env:{}, enabled:false,
    sampling:{enabled:false}, events:false,
    tools:{include:["providers_list","route_jobs","forge_connection_status",
      "providers_search","provider_details","plan_explain"],
      resources:false, prompts:false}
  }));
')
# Only after the explicit, immediately preceding name-absence check:
hermes -p "$PROFILE" config set mcp_servers.sandyboxing "$STAGED"
hermes -p "$PROFILE" config get mcp_servers.sandyboxing --json
```

Read back and compare the full selected entry: exact `command`, separate `args`, empty `env`, `enabled:false`, `sampling.enabled:false`, `events:false`, the exact six native names in `tools.include`, and `tools.resources:false` / `tools.prompts:false`. Do not activate if anything differs. Disabled means no connection/discovery/registration; the config remains for later activation.[1]

This intentionally avoids discovery-first `hermes mcp add` for the initial stage. No API key, provider login, model credential, environment-file import or `forge_probe` permission belongs in this entry. Exact per-tool inclusion is preferable to a wildcard. In Hermes, `include` takes precedence over `exclude`; do not assume an exclusion can override an overly broad include.[1]

### Activate and verify — no application restart

After the staged readback is accepted, use the supported Hermes connection manager to **enable the existing custom MCP server** named `sandyboxing`. On surfaces exposing `manage_connections`, the action is `enable` with `connectors:[{"name":"sandyboxing","mcp":true}]`; this is an agent-tool action, not a shell command. Do not try to reinstall an uncatalogued custom server as a catalog entry. Read the selected entry back after enable and confirm the only intended policy change is `enabled:true`.

Alternatively, where the installed version supports this route, set only `mcp_servers.sandyboxing.enabled` to `true` with `hermes config set`, read back the full entry, then use `/reload-mcp` in the same selected-profile session. Reload is a supported way to apply MCP configuration; a gateway/application restart is not required.[1][3]
**Choose one supported activation route.** A pending approval, timeout or refusal is not success and not permission to switch routes to bypass it.

After authorized activation, an optional shell-level connection check is:

```sh
hermes -p "$PROFILE" mcp test sandyboxing
```

`mcp test` connects and lists server-advertised tools; current docs specify exits `0` connected, `1` failed, `3` missing configuration and `2` usage error.[3]
It can list **seven** tools even when the model is allowed only **six**. This discovery result is not current-session activation proof.

In the actual session, inspect the returned host tool names rather than constructing prefixes. Confirm the six native names are available and `forge_probe` is excluded, then make explicit read-only calls through the registered tools (examples in [compact usage](compact-tools.md)). Successful actual calls establish that session's activation; a saved config or successful CLI discovery alone does not. No model prompt is needed for the CLI diagnostic; using an agent to call tools can involve the host's normal model traffic.

### Existing-server upgrade and rollback

1. Leave an already verified connection intact until the new, separate versioned installation passes doctor/argv checks. Do not apply the new-name staging recipe blindly or remove/re-add a working server to force it through onboarding.
2. Read only the selected server with supported controls. Capture an exact rollback value **only if established to be secret-free**. If it contains credentials, masked values or secret references, use the host's supported secure workflow; do not dump or replace them with redacted strings. Preserve the old installation.
3. Compare the current selected entry with the captured value immediately before an authorized replacement. If it changed, stop for reconciliation. This is an operational comparison, not an atomic compare-and-swap guarantee.
4. Through `hermes -p "$PROFILE" config set mcp_servers.sandyboxing '<complete-reviewed-JSON>'`, stage the separately reviewed replacement disabled, with the new printed argv and exactly the six read-only native tools; sampling/resources/prompts/events remain false and no credentials are added. Read it back, then use the supported activation and actual-call checks above.
5. If activation fails, restore the prior exact value through supported `config set` **only if** the current value still equals this operation's last verified staged/activated value, including any enable change. If another session changed it, stop rather than overwrite concurrent work. Read the restored entry back. Report **configuration restored**, not **old runtime reconnected**, until allowed calls actually verify the latter. Do not route around an unresolved activation approval.

For removal, first confirm the selected entry is still the one you intend to remove; then use `hermes -p "$PROFILE" mcp remove sandyboxing` and verify it is gone. Never delete another server or whole profile as cleanup.

## Claude Code: guidance only, explicit local scope

The following commands have **not** been executed against a user profile for this release. Use the target project's normal configuration/permission controls to inspect whether `sandyboxing` already exists; stop and compare if it does. Do not borrow Hermes-only policy keys and assume Claude enforces them.

From the intended project, `--scope local` makes the server private to you for that project; `project` would write a shared `.mcp.json`, and `user` would apply across projects.[5]

```sh
claude mcp add --transport stdio --scope local sandyboxing -- \
  "$NODE_BIN" "$CLI_ENTRY" mcp --read-only
claude mcp get sandyboxing
```

The `--` separates client options from server argv. Check **Connected**, not merely “Added”. Unapproved, disabled or blocked entries are not connection success; use normal trust/approval controls, never a bypass.[5]
In the client's `/mcp` and permission controls, permit only the same six read-only tool names, keep `forge_probe` unavailable, and decline unused sampling/resources/prompts/events if that installed host exposes them. This guide does not establish that Claude has an equivalent pre-discovery six-tool filter or sampling policy; if those controls are mandatory and cannot be verified **before connecting**, stop rather than claim the Hermes policy is reproduced. The release itself still denies probes locally.

After authorized setup, verify the actual tool registry/calls separately. A Claude health check is not six-tool model-use evidence. No Claude Desktop, Linux-client, Windows-client or arbitrary MCP-version qualification is implied.

Removal from the same project and explicit scope:

```sh
claude mcp remove --scope local sandyboxing
```

Check removal through the same client's controls. Do not erase shared project/user settings or credentials. Native Windows remains deferred and unqualified; no Windows installation/setup recipe is promoted by this guide.

## Sources

[1] https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference
[2] https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
[3] https://hermes-agent.nousresearch.com/docs/guides/use-mcp-with-hermes
[4] https://hermes-agent.nousresearch.com/docs/user-guide/configuration
[5] https://code.claude.com/docs/en/mcp
