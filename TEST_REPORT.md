# v0.2.3 — right-hand library and Hermes painted theme

Verified SDK: installed Hermes v0.22.7 (`b200f5bc60e31588ba2cb60e288029c4a54ba5fa`). The documented `useTheme()` returns the painted `theme` and `renderedMode` (including accent/previews). SandboxedFrame does not automatically forward theme data. The bridge allowlists color tokens and font-family names, sends theme version 1 in initial binding/init and live `theme` envelopes, and relays them to the independently opaque audio controls. No custom CSS/font URLs, host DOM reads, setting writes, same-origin permission or core imports. Theme updates do not remount the guest or stop audio. Studio-owned CSS variables cover backgrounds, surfaces, text/muted/accent, borders, errors, textarea/editor/gutter/caret, inputs and buttons; absent/invalid theme data falls back to dark. The editor is a textarea, not CodeMirror.

Shared Player DOM now places main/editor before the entire library/sidebar; wide panes display the library on the right, <=600px panes stack it below the editor without horizontal overflow. Standalone retains the dark fallback.

Local validation: production build passed; Node service 7/7; Python plugin 12/12 (one upstream Starlette/httpx deprecation warning); packaged Desktop SDK-contract and standalone Chromium harnesses passed. Packaged test imports the actual plugin bridge and uses a reactive `useTheme` fixture plus the installed SDK Webapp shell/CSP: right-side DOM/geometry, 400px stacking, dark/light token application in player and audio realm, live updates preferring renderedMode, no audio-realm replacement, malformed-color rejection and dark fallback. Sample peak 0.43778625, synth peak 0.06226953, mute peak 0; syntax/runtime/runtime-with-tempo-change errors retained Playing and sample output. No CSP violations/page errors. This is headless contract evidence, not a signed-in Hermes theme-switch test or physical speaker verification. Screenshot: `/workspace/poptart-video/layout-v023.png` (synthetic dark Hermes-like palette, packaged player).

Frontend-only: backend routes/service protocol unchanged. After rebuilding, running v2 bootstrap reads the new guest file without a gateway/sidecar restart. Desktop Rescan or Webapp reload is needed to load the updated SDK bridge; pane reload then loads updated guest assets (reload stops pane audio). Do not change Kyle's theme or other plugin switches. Deployment evidence and rollback path follow.

Deployment verified 2026-11-06 15:04 EST (America/Toronto): feature commit `7d8c55e0ee82cf7f6bf91845ab1d789641901e0b` fast-forwarded and built on `/home/clanker01/poptart`; clean worktree, existing plugin symlink unchanged. Backup: `/home/clanker01/.hermes/backups/poptart-theme-20261106-150307/` (0700; rollback SHA, git bundle, prior built plugin and served Desktop bridge). Authenticated running gateway 9120 `/api/plugins/hermes-strudel-studio/bootstrap` immediately returned the rebuilt theme document with matching SHA-256 `7ecbe6941f83051f74980a08583b78b042c0ba1c7ca879694503045031208e51`; no route remount required. Native HTTP used the documented one-use control-socket grant, never cookie/token-file scraping. Host doctor passed (1 tool, 0 hooks); validate passed, with the previously documented generated Strudel Unicode-table caution. Served Desktop bridge was copied to `~/.hermes/desktop-plugins/hermes-strudel-studio/plugin.js`. No service restarts, enablement/config/theme writes or track changes. Existing dashboard/gateway/sidecar PIDs 2140675/2689794/2560116 remained live. A signed-in Rescan/page reload is still required to pick up the new host bridge; no actual Hermes theme setting was changed or live theme-switch test claimed.

Rollback without rewriting history: in `~/poptart`, `git switch --detach 7c28ae8e1b13ef678a85d09fcd62e301b066f86e`, rebuild, copy `integration/hermes/desktop/plugin.js` to the served Desktop path, then Rescan/page reload. Alternatively restore the backed-up built plugin/served bridge before reloading. Do not restart services. Preserve any later unrelated edits and tracks.

---

# Test report — 2026-11-06

## Invalid-edit continuation — v0.2.2 (2026-11-06, EST)

Reported real Hermes Webapp retest after Kyle-approved gateway restart now passes
render, play/mute/stop, tool-driven revision 4 / Break-section synchronization and
reload persistence. The earlier claim that v0.2.1 necessarily hot-replaced an
already-mounted router was incorrect: that restart was required. No restart is
being performed by this fix.

The shared Audio component unconditionally replaced its transport label with
`Error` on any rejected apply. It now subscribes to actual engine state, keeps
`Playing` visible, and shows a separate error alert. Syntax is parsed before the
stateful Strudel REPL. Runtime eval failures restore the previous evaluated Pattern
object and tempo rather than re-running its source. This is not a rollback of
arbitrary JavaScript/global/audio-graph side effects.

A strengthened pre-fix packaged-Hermes regression reproduced the incorrect Error
label, while its sample continued producing output; the reported real-session
silence was not independently reproduced. The prior fixture only checked an
immediate peak and even expected Error as the status. Coverage now exercises the
actual bundled hermes-player/hermes-audio path through the installed SDK shell/CSP:
missing closing quote, runtime missing-method error, and tempo mutation followed
by a runtime error. Each waits 3 seconds (the sample lasts 0.28 seconds), then
requires output above 0.001 in two separate 1.5-second windows, a Playing status,
and a visible error alert. A disposable production-asset standalone regression
also verifies syntax-error continuation. Physical speaker playback is not measured.

Version bumped with the strict script (duplicate keys and wrong plugin names
refused). Production build, 7 Node tests, 12 Python tests and both browser paths
pass sequentially. Exact latest browser metrics and host deployment follow below.
The change is frontend-only: existing v2 bootstrap reads generated documents on
each request, so pane reload should obtain the new build without a gateway restart.
Real signed-in v0.2.2 retest remains pending.

### v0.2.2 deployment evidence — 2026-11-06, 14:33–14:35 EST

- Fix commit: `a54c02f1290d973ac9b4c558434f2dc32cc89d76`.
- Missing-quote, runtime missing-method, and `setcps(0)` then runtime-error cases
  each retained Playing plus a separate alert; both delayed audio windows in all
  three cases peaked at 0.4377862513. Synth peak 0.0622680448; muted peak 0;
  worklets loaded, zero CSP violations and page errors. Standalone syntax-error
  continuation also peaked at 0.4377862513. All test tracks were disposable.
- Host backup: `/home/clanker01/.hermes/backups/poptart-playback-20261106-143354/`.
  It contains rollback SHA `f8ff909dc52b8b9ff7876c42935a5cc61f3e74c0`, the source
  git bundle, prior built integration tree, prior served Desktop copy and PID
  records. No user config, theme, enablement or track data was modified.
- Host fast-forward and production rebuild succeeded. Doctor registered one tool;
  validate passed with the existing invisible-Unicode caution in a vendor chunk.
- Crucially, a read-only request to the RUNNING gateway on port 9120, using its
  documented one-use native HTTP grant, returned the fresh v2 document: HTTP 200,
  1,035,125 bytes, SHA256
  `e689200368029154213426d5bb51b5f0c46ee3bc9844892e9895201cb035e60c`.
  This matches the host's rebuilt file and contains the new error/rollback code.
  No credentials were read from storage, printed or persisted for this probe.
- Gateway PID 2689794, dashboard PID 2140675 and sidecar PID 2560116 stayed
  unchanged during deployment. This frontend-only update needs pane reload, not
  another gateway restart. Real signed-in v0.2.2 behavior still needs retesting.
- Rollback if requested: recover the recorded source with the saved git bundle
  and restore the prior built integration/Desktop artifacts from this backup,
  then reload the pane. Do not restart services or restore unrelated config.

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


## Origin-fix host deployment — 2026-11-06, 14:08–14:10 EST

- Host checkout fast-forwarded to `c4c48106f898fc8e01544a0ae1da1f607937ac47`
  and rebuilt successfully. The served Desktop copy matches the source SHA256.
- Backup: `/home/clanker01/.hermes/backups/poptart-origin-20261106-140754/`
  contains the previous source git bundle, rollback SHA, built plugin and served
  Desktop copy. No enablement or theme config was changed.
- Installed Hermes reports v0.22.7 / source `b200f5bc60e3`. Doctor passed with one
  registered tool; validate passed, with an invisible-Unicode caution in the
  bundled Strudel vendor chunk (not a validation failure).
- Fresh installed-runtime FastAPI TestClient returned the 1,034,506-byte v2
  bootstrap document without the sidecar URL, then successfully performed a
  read-only list through the authenticated sidecar. This proves the backend
  against the existing process, not the running gateway's cache or real pane.
- Dashboard PID 2140675, gateway PID 2140943 and sidecar PID 2560116 remained
  unchanged. No service was restarted. Existing user/validation tracks untouched.
- Hot renderer pickup remains unconfirmed: the new entrypoint had not been
  imported before the manual runtime check. Use supported Desktop Rescan/reload
  in the signed-in Webapp and confirm `/assets/webapp-guest.html` on its origin.
  No gateway/dashboard restart has been identified as required; obtain approval
  first if real-session testing reveals otherwise.
- Rollback, only if requested: restore the saved built plugin and served Desktop
  copy from this backup and use its `rollback-sha.txt` / git bundle to recover the
  previous source. Do not restore unrelated config or restart services implicitly.

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


## Hermes integration 0.2.0 — current evidence (America/Toronto, EST)

- Hermes Agent v0.22.7, installed source `b200f5bc60e31588ba2cb60e288029c4a54ba5fa`; Python 3.14.9, host Node 24.13.0 / npm 11.6.2.
- Fresh host clone: `npm ci`, production build and 7/7 Node service tests passed. Audit: zero advisories at install time. Vite emits a 659 kB chunk warning.
- Real host `hermes plugins doctor ... --ci`: runtime discovery/import/registration passed, exactly 1 tool and 0 hooks.
- `hermes plugins validate ... --install-deps`: passed, declaration/tool match and SDK surface checks passed. Caution `invisible_unicode` in generated Strudel/transpiler chunk: inspected four format characters (two each U+200C/U+200D) in Unicode character-class tables; not suppressed or silently removed.
- `tests/plugin`: 7 Python tests cover fake ctx with/without output_schema, all op inputs, strict failures, private token, authenticated sidecar workflow, no auto-restart, and strict duplicate-key YAML.
- Actual installed Hermes PluginManager/PluginContext/registry dispatch: all 11 native operations passed; snapshot/update/stale revision/restore/export/analyze/sections verified. Exact FastAPI router tested with TestClient: bootstrap/get passed, extra top-level field rejected HTTP 422. Persistent enablement settings unchanged.
- Host first-started sidecar: PID 2560116, 127.0.0.1:46691; later validation reused the same process. Unauthenticated POST returned 401; token mode asserted 0600 without printing its contents. Two disposable validation tracks left in plugin-data.
- `scripts/measure-schema.py`: compact JSON `[SCHEMA]` = **127 o200k_base tokens**, also 127 cl100k_base (tiktoken). Runtime per-op validation schemas are not exposed on every model turn; bundled skill teaches exact fields.
- Production-asset Chromium 141 SDK-contract harness loads actual desktop/plugin.js, with a small React iframe shim reproducing SDK scripts-only/no-referrer props. Real production modules, CSS, nested audio, sample fetch and worklets succeed. Final sample peak 0.4377864 before/after invalid evaluation, muted peak 0, hidden-frame peak 0.4377864; reload detached the old audio realm. Error displayed, dirty edits survive external revision polling, frame reload reconnects, malformed version/capability and nested-guest messages ignored, opaque API request blocked, zero page errors. This is **not** proof of actual Hermes Desktop rendering, host CSP, or speakers.
- No service restart or new systemd unit. Dashboard PID 2140675 since 04:44:11 EST and gateway PID 2140943 since 04:44:24 EST were unchanged. New plugin remains opt-in/not enabled. Desktop synchronizer created its app-level copy. Installed source supports hot API mounting and Rescan: no restart currently identified as necessary.
- Regex secret scan of every new commit snapshot before each push covers Orbit/OpenRouter, GitHub, Google Maps, Colab tokens and private keys. No findings.

Remaining mandatory gaps: real enabled Hermes pane and actual Desktop permissions/audio, speakers/quality, synth coverage, real UI/backend independent switches, service restart/reconnect (requires approval), remote gateways/WebSocket, non-Chromium, and exhaustive dependency notice/legal review. See HANDOFF.md status table.

## Original standalone foundation evidence (historical)


Environment: Node 22.19.0, npm 10.8.2, Linux, Playwright 1.56.1, Chromium Headless 141.0.7390.37 (`--no-sandbox`, browser process flag, not iframe sandbox). Hermes not installed.

- `npm test`: 5/5 passing. Actual on-disk service operations cover create/read/update, validation, revision conflict, persistence, snapshot/restore, HTTP, rejection of opaque and unrelated origins, and agent-style sections/export.
- `npm ci`, `npm test`, and `npm run build` also passed in a fresh local clone from the pinned lockfile.
- `npm run build`: passes, Vite 6.4.5. A 659 kB minified chunk triggers Vite's size warning.
- `npm audit`: 0 vulnerabilities at test time. This is not a license audit.
- `STUDIO_URL=http://127.0.0.1:5182/ npm run test:browser` with the service on 4311, `POPTART_UI_ORIGIN=http://127.0.0.1:5182` and a disposable workspace: passed. In nested opaque frames a user-like Playwright click started a real Strudel `s("bd*4")` pattern using the bundled generated sample. An AnalyserNode attached to the actual output measured peak 0.43783, and 0.43783 after an invalid edit; error was visible and previous audio continued. Browser request from the audio frame to the tool API was blocked. A host-issued service update changed the selected editor title; reload reconnected the outer frame. This measures samples in the browser graph, not sound at speakers or quality. AudioWorklet initialization logged `[superdough] AudioWorklets loaded`. This validates one sample in one headless browser, not all instruments or the Hermes implementation.
- Independent `sandbox-lab`: same browser, one `allow-scripts` opaque frame without `allow-same-origin`: secureContext true, user gesture resumed AudioContext, oscillator peak 0.99999946, blob-backed AudioWorklet loaded, synthetic AudioBuffer started; `postMessage` reached host as origin `null`; reload announced fresh ready. Reproduce with `cd sandbox-lab && python3 -m http.server 4179` and click inside the frame. Reload/unmount destroys the frame and its playback by design; hide-survival not measured.

Not tested: Hermes installation, plugin doctor, real device/audio quality, Desktop permission policy, remote gateway, hide/background throttling, cross-browser support, production build served with correct opaque-frame CORS, every dependency license/asset, recording, WebSocket, timeline arrangement and real Hermes tools. The sandbox does not provide a complete malicious-code security boundary.

- Pre-push tracked-file secret scan: `detect-secrets` 1.5.0 reported zero findings.
