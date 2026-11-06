# Handoff to the Hermes-equipped agent

## Repository

Public repository: https://github.com/mojomast/poptart. Branch: `feat/hermes-strudel-studio`. The implementation baseline immediately before the handoff/polish commit is `b6035ea`; get the exact checkout commit with `git rev-parse HEAD` (a commit cannot contain its own hash without changing it). Read DEVPLAN.md, TEST_REPORT.md, RESEARCH.md, ARCHITECTURE.md, INTEGRATION.md and server/README.md before changes.

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
