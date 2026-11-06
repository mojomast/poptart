# Test report — 2026-11-06

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
