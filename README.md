# Hermes Strudel Studio / poptart

A standalone, human-operated Strudel live-coding workspace, revisioned music service and mock Hermes host. Hermes is not required. This is a foundation: the Hermes plugin is a **disconnected integration scaffold**, not a validated Hermes plugin.

## Start

Requires Node 22 and npm. In a checkout:

```sh
npm ci
npm run service
```

In a second terminal:

```sh
npm run dev:host
```

Open **http://127.0.0.1:5173/**. Create a track, edit code, and click **Play / apply** inside the audio controls (a browser gesture is required). Click it again to apply edits; Stop stops scheduling. Save persists to `data/tracks.json`. Add sections using the tabs. Use the host's operation and JSON fields to simulate agent tool calls; examples and schemas are in `server/README.md`. A successful write refreshes the selected track if it has no unsaved edits. Open the same URL for the mock host; its Compact/Expand and Reload controls exercise the iframe.

Loopback development only: the service trusts local processes and the browser host. Do not expose the service or Vite to a network, do not put secrets in the project, and do not run untrusted generated code without reviewing the limitations in ARCHITECTURE.md. No AI connection is required. Default sounds are three small original synthesized CC0 samples plus Strudel synths. The npm engine is bundled locally; Strudel code may explicitly reference remote resources. No hosted AI service is used.

## Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser  # service and dev host must already be running; creates a test track
```

For a disposable test workspace set `POPTART_DATA_FILE=/absolute/path/to/test.json` when starting the service. The browser test checks sample-driven nonzero audio in headless Chromium, invalid edits, an opaque-frame API denial and reload. See TEST_REPORT.md for what it does not prove. `npm run service` defaults to loopback port 4311, `npm run dev:host` to 5173; if changing the UI origin set `POPTART_UI_ORIGIN` on the service. A different service port also requires changing Vite's proxy target. Vite preview is not a production server or an API proxy.

## More

[Architecture](ARCHITECTURE.md) · [Research and licensing](RESEARCH.md) · [Hermes integration](INTEGRATION.md) · [Handoff](HANDOFF.md) · [Tests](TEST_REPORT.md) · [License](LICENSE) and [notices](NOTICE). AGPL-3.0-or-later; no warranty. Source: https://github.com/mojomast/poptart.
