# Hermes integration — 0.2.1

Verified on moltussy-1 against **Hermes Agent v0.22.7**, source
`b200f5bc60e31588ba2cb60e288029c4a54ba5fa`, Python 3.14.9, Node 24.13.0.
The live source overrides older scaffold assumptions. `register_tool` still has
no `output_schema`; registration uses keywords and signature-gates that field.

## Build and install

```sh
npm ci
npm run build
# Build creates a self-contained plugin tree, including assets/service/skills/notices.
ln -s "$PWD/integration/hermes" ~/.hermes/plugins/hermes-strudel-studio
hermes plugins doctor integration/hermes --ci
hermes plugins validate integration/hermes --install-deps
```

Install **the built integration/hermes directory**, not the repository root.
Generated copies are deliberately gitignored: a raw checkout is not an installable
binary package until built. The cloned repository and lockfile supply corresponding
source. No tag, release, catalog entry or catalog admission claim is made.

The Python backend and Desktop half are separately opt-in. Follow-up: Python was enabled via the supported CLI on 2026-11-06 at 11:56 EST; Desktop activation and real-pane tests are blocked by unavailable authorized UI control (details in TEST_REPORT.md). Do not change existing
user enablement or theme preferences. The Desktop contribution declares
`defaultEnabled:false`. Initial isolated CLI validation did not change `plugins.enabled`. The subsequent approved enablement now permits normal new-session discovery; a native list dispatch passed without manually forcing this plugin to load.
The installed Desktop synchronizer created the app-level copy automatically.
Restarts: **`hermes-gateway` must be restarted after a backend route change on an
already-mounted plugin**, because v0.22.7 refuses to hot-remount an existing plugin API
namespace (confirmed on moltussy-1 for v0.2.1). On a first install, hot-mount on the first
authorized request after enablement may work; if the pane reports a backend error, restart
`hermes-gateway`. Frontend-only changes need only Desktop Rescan/Webapp reload plus a pane
reload. **Ask Kyle before any restart, including the Poptart sidecar.**

## Backend and tool

One native tool, `poptart_studio`, exposes `op` and `input`. Exact per-op fields are
in `hermes-strudel-studio:strudel-studio`. Draft 2020-12 validation rejects unknown
fields, wrong types, invalid IDs, stale revisions, duplicate section IDs and empty
updates before authenticated requests. Success and failure include
`{ok,error,code,fix}`; success also carries `data`. No arbitrary shell, delete,
remote transport or audio-export operation is exposed.

The first valid call lazily starts **one** detached Node sidecar, under a startup
file lock. No systemd unit is installed. `plugin_data_dir('hermes-strudel-studio')`
holds tracks, service.json, private service.log and a per-install random 256-bit
service.token (owner-owned regular mode 0600). The token is never logged, returned,
or sent to the Desktop renderer, editor or nested audio guest. All API requests
require its bearer value; opaque/unrelated browser origins are rejected independently.
The Python client bypasses ambient HTTP proxy settings. Node binds only 127.0.0.1
on an OS-selected port; subprocess environment excludes provider credentials.

A persisted starting marker prevents ambiguous failed startup from spawning a
second store owner. If an existing service becomes unavailable, calls return
`SERVICE_UNAVAILABLE`; **there is no automatic restart**. Obtain approval before
stopping/restarting it; preserve tracks and the token, reconcile the PID/listener,
and remove stale service.json only as part of that approved recovery. Do not
start another owner against the same store. Service code changes need an approved
sidecar restart; asset rebuilds do not restart it.

## Pane bridge

`desktop/plugin.js` uses the installed SDK `SandboxedFrame`, scripts-only opaque
origin, no same-origin token, no referrer and no permission delegation. It uses
only SDK/React imports; no core DOM scraping, eval or prototype patching.
`ctx.rest` reaches the gated Python namespace. `/bootstrap` returns a self-contained credential-free guest document, never a sidecar URL; `/tool` uses the same strict native-operation router. Guest envelopes
are version 1, source-checked, opaque-origin-checked and bound to a per-mount random
capability. Request types/size and concurrency are bounded. This capability is
not the service token. The audio guest never receives it.

SandboxedFrame removes referrers, and its Webapp implementation discards data-URL fragments. The trusted parent therefore inserts the frame capability and expected parent binding into the editor document before passing it to the SDK. The SDK uses the same-origin `/assets/webapp-guest.html` shell; the audio child is independently opaque srcdoc and receives no capability. The authenticated bundle includes JS/CSS, samples as data URLs and worklets as bundled blob sources. Neither guest requests loopback assets or receives credentials. The versioned `plugin_api_v2.py` entrypoint avoids the installed host's by-path ASGI cache without restarting it. Three-second refresh notifications fetch
authoritative state without replacing dirty edits. Polling is bounded by pane
lifetime; no WebSocket is implemented. Reload/unmount destroys playback.

**Remote Webapp transport:** only the Hermes connection is needed; tunneling a sidecar port is neither necessary nor supported by this pane. Audio still requires a secure context (HTTPS or a localhost tunnel). OAuth-specific routing, actual native Desktop data-document worklet support and non-Chromium browsers remain unverified. The regression uses the installed Webapp shell/CSP, not a real signed-in post-fix session.
The headless SDK-contract harness is not a real Hermes-pane test. Strudel code
requires a human Play/apply gesture; it is JavaScript, not an OS sandbox.

## Theme bridge (Hermes v0.22.7)

Read only the documented SDK `useTheme()` hook: `theme` is the painted palette, `renderedMode` the painted mode (fall back to resolvedMode/dark). SandboxedFrame does not automatically forward either. The host sends allowlisted colors/font families in the version-1 initial binding/init and live `theme` envelopes through the existing source/capability checks; player forwards version-1 `audio.theme` to its own audio child. The guest validates CSS colors/fonts, maps them to studio-owned variables and defaults to dark. No DOM scraping, settings writes, customCSS, external font URLs or remount on a theme change. Standalone uses the same stylesheet/layout and dark fallback. The shared textarea editor and entire right-hand sidebar stack editor-first below 600px.

Verified source: installed `website/docs/developer-guide/desktop-plugin-sdk.md` Themes/SandboxedFrame sections; `apps/desktop/src/themes/context.tsx` and `types.ts`; SDK uses `paintedTheme`/`renderedMode`. No backend route changes for v0.2.3, so reload/rescan is sufficient; no service restart.

## Validation

```sh
npm test
npm run build
python -m pytest -q tests/plugin  # jsonschema, ruamel.yaml, pytest installed
python scripts/measure-schema.py # tiktoken; 127 o200k_base tokens for [SCHEMA]
npx playwright install chromium
npm run test:desktop             # self-contained production-asset SDK-contract harness
hermes --run-module pdb -c continue -c quit scripts/validate-hermes.py integration/hermes
```

The last command exercises actual installed PluginManager/PluginContext/registry
dispatch and the exact backend router without enabling it in a running dashboard.
It creates a validation track and leaves the first-started sidecar running. The
PDB completion banner does not restart a service. See TEST_REPORT.md for evidence
and HANDOFF.md for the remaining mandatory checks.
