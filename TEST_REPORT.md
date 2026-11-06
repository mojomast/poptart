# Test report — 2026-11-06

Environment: Node 22.19.0, npm 10.8.2, Linux, Playwright 1.56.1, Chromium Headless 141.0.7390.37 (`--no-sandbox`, browser process flag, not iframe sandbox). Hermes not installed.

- `npm test`: 5/5 passing. Actual on-disk service operations cover create/read/update, validation, revision conflict, persistence, snapshot/restore, HTTP, rejection of opaque and unrelated origins, and agent-style sections/export.
- `npm ci`, `npm test`, and `npm run build` also passed in a fresh local clone from the pinned lockfile.
- `npm run build`: passes, Vite 6.4.5. A 659 kB minified chunk triggers Vite's size warning.
- `npm audit`: 0 vulnerabilities at test time. This is not a license audit.
- `STUDIO_URL=http://127.0.0.1:5182/ npm run test:browser` with the service on 4311, `POPTART_UI_ORIGIN=http://127.0.0.1:5182` and a disposable workspace: passed. In nested opaque frames a user-like Playwright click started a real Strudel `s("bd*4")` pattern using the bundled generated sample. An AnalyserNode attached to the actual output measured peak 0.43783, and 0.43783 after an invalid edit; error was visible and previous audio continued. Browser request from the audio frame to the tool API was blocked. A host-issued service update changed the selected editor title; reload reconnected the outer frame. This measures samples in the browser graph, not sound at speakers or quality. AudioWorklet initialization logged `[superdough] AudioWorklets loaded`. This validates one sample in one headless browser, not all instruments or the Hermes implementation.
- Independent `sandbox-lab`: same browser, one `allow-scripts` opaque frame without `allow-same-origin`: secureContext true, user gesture resumed AudioContext, oscillator peak 0.99999946, blob-backed AudioWorklet loaded, synthetic AudioBuffer started; `postMessage` reached host as origin `null`; reload announced fresh ready. Reproduce with `cd sandbox-lab && python3 -m http.server 4179` and click inside the frame. Reload/unmount destroys the frame and its playback by design; hide-survival not measured.

Not tested: Hermes installation, plugin doctor, real device/audio quality, Desktop permission policy, remote gateway, hide/background throttling, cross-browser support, production build served with correct opaque-frame CORS, every dependency license/asset, recording, WebSocket, timeline arrangement and real Hermes tools. The sandbox does not provide a complete malicious-code security boundary.

- Pre-push tracked-file secret scan: `detect-secrets` 1.5.0 reported zero findings.
