# v0.2.3 — right-hand library and Hermes painted theme

Verified SDK: installed Hermes v0.22.7 (`b200f5bc60e31588ba2cb60e288029c4a54ba5fa`). The documented `useTheme()` returns the painted `theme` and `renderedMode` (including accent/previews). SandboxedFrame does not automatically forward theme data. The bridge allowlists color tokens and font-family names, sends theme version 1 in initial binding/init and live `theme` envelopes, and relays them to the independently opaque audio controls. No custom CSS/font URLs, host DOM reads, setting writes, same-origin permission or core imports. Theme updates do not remount the guest or stop audio. Studio-owned CSS variables cover backgrounds, surfaces, text/muted/accent, borders, errors, textarea/editor/gutter/caret, inputs and buttons; absent/invalid theme data falls back to dark. The editor is a textarea, not CodeMirror.

Shared Player DOM now places main/editor before the entire library/sidebar; wide panes display the library on the right, <=600px panes stack it below the editor without horizontal overflow. Standalone retains the dark fallback.

Local validation: production build passed; Node service 7/7; Python plugin 12/12 (one upstream Starlette/httpx deprecation warning); packaged Desktop SDK-contract and standalone Chromium harnesses passed. Packaged test imports the actual plugin bridge and uses a reactive `useTheme` fixture plus the installed SDK Webapp shell/CSP: right-side DOM/geometry, 400px stacking, dark/light token application in player and audio realm, live updates preferring renderedMode, no audio-realm replacement, malformed-color rejection and dark fallback. Sample peak 0.43778625, synth peak 0.06226953, mute peak 0; syntax/runtime/runtime-with-tempo-change errors retained Playing and sample output. No CSP violations/page errors. This is headless contract evidence, not a signed-in Hermes theme-switch test or physical speaker verification. Screenshot: `/workspace/poptart-video/layout-v023.png` (synthetic dark Hermes-like palette, packaged player).

Frontend-only: backend routes/service protocol unchanged. After rebuilding, running v2 bootstrap reads the new guest file without a gateway/sidecar restart. Desktop Rescan or Webapp reload is needed to load the updated SDK bridge; pane reload then loads updated guest assets (reload stops pane audio). Do not change Kyle's theme or other plugin switches. Deployment evidence and rollback path follow.

Deployment verified 2026-11-06 15:04 EST (America/Toronto): feature commit `7d8c55e0ee82cf7f6bf91845ab1d789641901e0b` fast-forwarded and built on `/home/clanker01/poptart`; clean worktree, existing plugin symlink unchanged. Backup: `/home/clanker01/.hermes/backups/poptart-theme-20261106-150307/` (0700; rollback SHA, git bundle, prior built plugin and served Desktop bridge). Authenticated running gateway 9120 `/api/plugins/hermes-strudel-studio/bootstrap` immediately returned the rebuilt theme document with matching SHA-256 `7ecbe6941f83051f74980a08583b78b042c0ba1c7ca879694503045031208e51`; no route remount required. Native HTTP used the documented one-use control-socket grant, never cookie/token-file scraping. Host doctor passed (1 tool, 0 hooks); validate passed, with the previously documented generated Strudel Unicode-table caution. Served Desktop bridge was copied to `~/.hermes/desktop-plugins/hermes-strudel-studio/plugin.js`. No service restarts, enablement/config/theme writes or track changes. Existing dashboard/gateway/sidecar PIDs 2140675/2689794/2560116 remained live. A signed-in Rescan/page reload is still required to pick up the new host bridge; no actual Hermes theme setting was changed or live theme-switch test claimed.

Rollback without rewriting history: in `~/poptart`, `git switch --detach 7c28ae8e1b13ef678a85d09fcd62e301b066f86e`, rebuild, copy `integration/hermes/desktop/plugin.js` to the served Desktop path, then Rescan/page reload. Alternatively restore the backed-up built plugin/served bridge before reloading. Do not restart services. Preserve any later unrelated edits and tracks.

---

# Handoff to the Hermes-equipped agent

## Current: v0.2.2 invalid-edit continuation (2026-11-06, EST)

The real Webapp v0.2.1 pane rendered and passed transport, revision-4/Break-section
sync and reload after Kyle approved a gateway restart. Its invalid-edit behavior
was rejected. The shared audio UI now derives transport from engine state and
shows errors independently; syntax is preflighted and runtime failures restore
the previous evaluated Pattern plus tempo. Packaged Hermes regression waits past
sample tails and checks two audio windows for quote errors, runtime errors and
tempo-changing runtime errors. Standalone shares the fix. See TEST_REPORT.md.

This patch changes frontend assets only; the already-mounted v2 bootstrap reads
the generated document per request. Reload the pane to pick it up. Do not restart
any service without a new explicit approval. Real signed-in v0.2.2 retest remains
pending; no speaker-output claim is made. Older sections below are historical.

## Hermes-origin transport fix — v0.2.1 (2026-11-06, EST)

Sequential validation on the recovered box passed: production build, 7/7 Node
service tests, 9/9 Python plugin/backend tests and the single bounded browser
regression. Browser sample peak 0.4378300, synth peak 0.0622659 after stopping the
previous pattern, muted peak 0.00000818, worklets initialized, zero CSP violations
and zero page errors. All browser HTTP requests used the simulated Hermes origin;
sidecar connections were blocked. Tool schema remains 127 o200k_base tokens.
Initial runs were interrupted by shared-box overload; no parallel heavy tests
were used for the final successful run. These are fixture results, not a claim
that a real signed-in Webapp session has rendered the post-fix pane yet.

Reported real Webapp results on gateway port 9120 supersede the earlier UI blocker:
Capabilities exposed independent master/Desktop/Agent switches, Desktop was enabled,
the pane appeared, and chat created `pane test` track
`4bf01bec-3512-479c-b9a9-556334e16743` and updated it to revision 2. The old pane
was blank because its iframe navigated to backend-only `127.0.0.1:46691`, unreachable
from a browser tunneling only the Hermes port. That was a real transport bug.

The pane now obtains its complete, credential-free guest document through
`ctx.rest('/bootstrap')` → `/api/plugins/hermes-strudel-studio/bootstrap` on the
Hermes connection. It supplies a data HTML document to SDK `SandboxedFrame`; on
Webapp the installed SDK renders this through the same-Hermes-origin
`/assets/webapp-guest.html` shell. No browser URL points to the sidecar. Editor CSS/JS,
independently opaque audio srcdoc and original CC0 samples are bundled in the
authenticated document (~1.04 MB); samples use data URLs and worklets use their
bundled blob sources. There are no anonymous module/sample requests requiring
cookies inside an opaque guest. All track operations still use authenticated
parent `ctx.rest('/tool')`; only the Python backend knows the sidecar address/token.

The installed SDK deliberately strips data-URL fragments. Frame capability and
parent binding are therefore inserted into the outer guest HTML by the trusted
host, never into the audio child. Both the SDK shell and player check message
source; the player accepts the opaque shell relay only with its bound capability.
Scripts-only sandboxing is retained, without allow-same-origin. Loading/error
states and the frame background are dark; old loopback bootstrap responses are
rejected rather than followed.

Hermes v0.22.7 caches hosted ASGI apps by API-file path without mtime invalidation.
The dashboard manifest now selects `plugin_api_v2.py`, so the existing namespace
wildcard proxy's normal per-request discovery loads a fresh app under a new key.
No new gateway route or sidecar restart is needed. This is a versioned plugin
entrypoint, not a core patch or cache manipulation. Renderer pickup must still be
checked in the real open pane; do not claim that a file-copy match proves rendering.

Regression coverage now uses the actual installed Webapp guest-shell HTML and CSP
fixture (b200f5bc60e3), authenticated-parent bootstrap/tool seams, and browser-side
blocking of every sidecar connection. It checks the shell URL is not the sidecar,
legacy bootstrap rejection, dark failure state, versioned opaque handshake,
sample and synth output, invalid-code continuation, mute, hiding, dirty refresh,
reload and hostile-message rejection. Backend tests verify bootstrap omits
sidecar URL/token and preserves the same route namespace. Actual real-Webapp
post-fix playback remains a separate check; physical speakers remain unverified.


## Enablement follow-up — 2026-11-06, 11:55–11:57 EST

Kyle approved enabling `hermes-strudel-studio` and real-pane testing. Before
activation, settings and the Desktop package copy were backed up under
`/home/clanker01/.hermes/backups/poptart-enable-20261106-115527/`:
`config.yaml`, `desktop-plugin/`, plus an absence record for `desktop-config.json`.
The directory is mode 0700. No secret values were read, printed or committed.

`hermes plugins enable hermes-strudel-studio --no-allow-tool-override` succeeded.
Hermes reported: "Gateway reloaded plugins — deferred: tools (next session)."
Normal enabled-plugin discovery in a new installed-runtime process then registered
`poptart_studio`, and a real native `list` dispatch succeeded (two pre-existing
validation tracks). This follow-up created/deleted no tracks.

**Real-pane test blocked, not passed:** the supplied CUA port 8000 has no listener;
`cua-computer-server` and `cua-xvfb` user units are both inactive/disabled. An
independent Xvfb :99 process exists, but no real Hermes/Chromium/Electron UI process
was found. The documented replacement CUA services are listening on authenticated
3211 and 6901. This executor has no authorized CUA/browser-control connector;
connector discovery confirmed none installed. Stored CUA credentials were not
read and no browser session/cookies or private API were used as a substitute.
The running dashboard `/api/plugins/hermes-strudel-studio/bootstrap` requires
Hermes authentication (unauthenticated HTTP 401); this does not prove hot mounting.

Consequently Desktop enable/Rescan, independent UI/backend toggles, actual pane
opening, opaque handshake, sample/synth playback, worklets/CSP/sample fetching,
stop/mute, tool-to-pane sync/conflicts, invalid-edit continuation and
hide/unmount/reload are **unrun inside real Hermes**. Prior SDK-contract harness
results still apply only to that harness. No PNG screenshots were fabricated;
`/workspace/poptart-pane/STATUS.txt` records the blocker.

Dashboard PID 2140675, gateway PID 2140943 and Poptart sidecar PID 2560116 remained
unchanged. No service restart, disabled CUA-unit start, theme change or other
plugin enablement was performed. The Python/backend selection is enabled; Desktop
activation remains unverified/unperformed. No Hermes service restart is currently
justified. To use the old requested route would require explicit approval to
start the disabled **cua-computer-server** user unit (port 8000) on the existing
display; do not also start cua-xvfb over the existing :99. Prefer providing a
supported authenticated controller for the already-running CUA 3211 service instead.

Rollback: run `hermes plugins disable hermes-strudel-studio` for the narrow supported
functional rollback. Desktop flags were not changed. For an exact settings rollback,
compare later edits before restoring the backed-up `config.yaml`; blindly restoring
it could overwrite unrelated concurrent settings. Do not restart services to roll back.


## Current integration update — 2026-11-06 (America/Toronto, EST)

The original scaffold below is historical. Version 0.2.0 now implements an
authenticated per-install backend, one strict composable `poptart_studio` tool,
lazy loopback Node startup, production-asset packaging, a gated API router and
an opt-in SDK SandboxedFrame Desktop bridge. See INTEGRATION.md and TEST_REPORT.md.
Verified live Hermes: v0.22.7 / b200f5bc60e31588ba2cb60e288029c4a54ba5fa.

Host checkout: `/home/clanker01/poptart`; linked plugin:
`/home/clanker01/.hermes/plugins/hermes-strudel-studio` → checkout `integration/hermes`.
Prechange backup: `/home/clanker01/.hermes/backups/poptart-20261106-114536`
(11:45:36 EST; records all three new paths as previously absent).
Data: `~/.hermes/plugin-data/hermes-strudel-studio`; service initially started
once as PID 2560116, loopback port 46691. Token is private mode 0600, never printed.
Two native validation tracks remain; no user tracks were removed.
No new unit, service restart, theme/preference change, existing-plugin enablement,
merge, tag, release or catalog change occurred. The new plugin remains not enabled
in persistent Hermes configuration; its Desktop copy was discovered automatically.
Actual enabled-pane validation is pending user activation. Installed source supports
hot API mounting and Desktop Rescan/hot reload, so no specific restart is proven
necessary. Ask before **any** restart; do not preemptively restart either Hermes unit.

### Mandatory validation status

| Mandatory item | Evidence / remaining gap |
|---|---|
| Install, doctor, package | Built directory linked on real host; doctor 1 tool / 0 hooks; validate --install-deps passed. Desktop copy exists. Catalog submission untouched. Independent enabled UI/backend switches not exercised. |
| Real Hermes pane, opaque handshake | Production bundle + actual plugin.js bridge passes a Chromium SDK-contract harness with opaque scripts-only and no-referrer. **Not a real Hermes pane**; pending opt-in activation and GUI test. |
| Sample/synth audio, worklets, speakers, gain/stop/mute | Sample graph output, muted zero gain, hide-survival, detached-on-reload and invalid-code continuation measured in harness; synth and real host CSP/permissions not verified. Physical speakers and quality cannot be verified by us. |
| Real Hermes tool, live edits/conflicts | All 11 ops exercised using installed native loader/context/registry dispatch; revision conflict and restore passed. Live-playing Hermes pane edit/apply not exercised. |
| Invalid code, dirty edits, reload, lifecycle/concurrency | Invalid evaluation preserves measured output; dirty poll refresh preserved editor text; reload reconnected; service concurrent-write test passed. Actual Hermes hide/unmount and process restart remain unverified. No process restart attempted without approval. |
| Remote/auth/disconnection/hostile messages | Host unauthenticated API gets 401; wrong/opaque origin gets 403; wrong-version/capability and nested-guest host requests ignored in harness. Three-second pane polling implemented; no WebSocket. Remote gateways explicitly unsupported/unverified. |
| Licenses / sample provenance | NOTICE, source link, AGPL/GPL declarations, lockfile metadata and original CC0 sample provenance reviewed/copied into built package. Exhaustive transitive notice/license/legal clearance remains incomplete. |

## Original foundation handoff (historical)


## Repository

Public repository: https://github.com/mojomast/poptart. Branch: `feat/hermes-strudel-studio`. The tested implementation baseline is `665f776c17cd69246e2918f449aeb2a189f8d698`; get the exact checkout commit with `git rev-parse HEAD` (a commit cannot contain its own hash without changing it). Read DEVPLAN.md, TEST_REPORT.md, RESEARCH.md, ARCHITECTURE.md, INTEGRATION.md and server/README.md before changes.

Implemented: local Strudel engine, CC0 drum samples, React editor with sections, save and revision conflicts, nested isolated audio controls, loopback JSON music service, snapshots/static analysis/code export, mock host and basic frame handshake/reload. Agent-style requests call the real service. Browser test measured sample-driven audio and invalid-edit continuation. Service operations and JSON schema exist but **no Hermes tools are registered**. Desktop pane is a setup stub. Human must click inside the audio frame; remote transport currently does not actuate it. No automatic section timeline, visualizer, recording, signal-analysis report, audio export, WebSocket, production static hosting or authenticated Hermes integration is implemented. Live updates require applying with Play. UI has no snapshot/revert control. Running code can have side effects before an error; only ordinary failed evaluations were tested.

## Runtime

Tested Node 22.19.0 / npm 10.8.2 and Chromium Headless 141.0.7390.37. `npm ci`; terminal 1 `npm run service`, terminal 2 `npm run dev:host`; browse http://127.0.0.1:5173/. No mandatory environment variables. `POPTART_DATA_FILE` sets an absolute workspace file, `POPTART_UI_ORIGIN` the exact allowed browser origin, `PORT` the service port (also change `vite.config.ts` proxy if changed). Do not use the workspace for unrelated files. No dependency/sample CDN at runtime for bundled basics; Strudel programs may explicitly request external sounds. For tests: `npm test`, `npm run build`, `npx playwright install chromium`, `npm run test:browser` with both processes running and a disposable store. Test evidence and caveats: TEST_REPORT.md.

## Hermes interfaces and exact files

Verified from Hermes source commit `486f4a6a9918a4054373e33a200260ffd501645e`, not from an installed runtime:

1. `integration/hermes/plugin.yaml` and `integration/hermes/__init__.py`: native loader calls `register(ctx)`; tools use `ctx.register_tool(name=...,toolset=...,schema=...,handler=...)`; handlers receive args and return JSON strings. Current register deliberately registers nothing. Implement narrow validated mappings to the service only after creating authenticated, authorized local IPC. `shared/tool-schema.json` is one 588-byte generic proposed schema, not an installed tool or complete per-operation contract.
2. `integration/hermes/desktop/plugin.js`: Desktop SDK pane contribution stub. Install a unified package according to the installed SDK; Desktop has its own `desktop/plugin.js` and `@hermes/plugin-sdk`, independent of the web dashboard. Replace stub with a `SandboxedFrame` host bridge, enforcing versioned messages and source checks. Desktop frame supports `allow-scripts` and removes `allow-same-origin`; it does not expose iframe `allow`. Test that nested frame, Vite replacement/packaged asset serving, CORS, worklets and sample fetch work in that actual configuration. Never pass service credentials into either guest. Keep editor alive if navigation must not interrupt playback.
3. Web dashboard uses a different `dashboard/manifest.json` and UI bundle. `dashboard/plugin_api.py` exports `router = APIRouter()`, mounted at `/api/plugins/<id>/`; it is separately enabled from the Desktop renderer. No router or dashboard UI is implemented. If using the Desktop pane, the shared backend namespace may still serve authenticated calls, subject to real version and permission checks.
4. Source persistence is local to the service. Reconnect must fetch authoritative revisions, preserve dirty user edits, and handle conflicts. No WebSocket or polling fallback is implemented. For remote gateways design authenticated routing and location-aware state; do not assume gateway and desktop share localhost. Follow upstream gateway WebSocket authentication if implementing streaming, and implement bounded polling of revisions when unavailable.

Installation validation: install a packaged plugin with `hermes plugins install <path-or-id>` and run `hermes plugins doctor <path-or-id>` as supported by that version; verify desktop discovery, backend enablement, catalog metadata and skills. Consult source/docs for the installed version before filling in packaging details. No Hermes core changes are needed.

## Mandatory validation

- [ ] Install, doctor and catalog packaging on real Hermes; verify plugin, Python backend and Desktop pane enable independently.
- [ ] Open the studio inside a real Hermes pane, observe opaque sandbox and versioned handshake.
- [ ] User gesture starts sample and synth audio; verify worklets, actual speakers, output gain, failure indicators, stop/mute.
- [ ] Invoke a real Hermes native tool to create a track; modify it while playing with user authorization, apply it and confirm state synchronization and revision conflict handling.
- [ ] Test invalid code, preserve last known good and unsaved edits; verify frame reload/reconnection, hiding, unmount, process restart and concurrent calls.
- [ ] Exercise remote gateway, authentication, disconnected/reconnected WebSocket and polling fallback if implemented, and hostile/malformed messages.
- [ ] Review all dependency licenses/notices and generated sample provenance; comply with GPL/AGPL network source obligations. The lockfile-derived THIRD_PARTY_LICENSES.md is metadata, not legal clearance.

## Priority blockers

1. Authenticated service IPC and user-approved tool mapping; current loopback service trusts local processes and is not ready to expose to Hermes or a network.
2. Real pane/asset bridge and strict per-message schemas; player-side transport, lifecycle and reliable reconnect are not complete.
3. Isolation hardening: Strudel is arbitrary JS, iframe is not resource/egress isolation, development server is not production hosting. A compromised editor has the host capability; audio child does not, but this has not been penetration tested.
4. Continuous user-approved live update, audio diagnostics, robust samples, visualizations, arrangements, snapshots/revert UI and missing regression tests.

Suggested continuation prompt: “Read HANDOFF.md and the installed Hermes plugin/desktop source. Implement a secure authenticated Studio backend bridge and native tool registration, connect the Desktop pane with the documented sandbox, then execute every applicable mandatory validation item and report actual results without modifying Hermes core.”
