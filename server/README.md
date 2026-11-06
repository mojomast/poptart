# Music service

**Authentication update:** all `/api/tool` requests now require `Authorization: Bearer <service token>`. The standalone CLI generates/reads `.workspace/service.token` (override `POPTART_TOKEN_FILE`), an owner-owned regular mode-0600 file. The Hermes adapter uses its profile plugin-data directory and never passes the token into a guest. Do not print tokens. Tests inject fixture tokens in memory. The Vite proxy injects the standalone token server-side; direct non-browser API clients must authenticate too. Read-only packaged assets may be served separately from the API with `POPTART_ASSETS`; they contain no track state or credentials.


Requires Node.js 18 or later; no dependencies. From `server/`, run `npm start` (or `node index.js`) and `npm test` (or `node --test`). The service listens on `127.0.0.1:4311`. Set `PORT` to change the port, `POPTART_DATA_FILE` to select the store file (default `data/tracks.json` relative to the working directory), and `POPTART_UI_ORIGIN` to the exact browser origin, e.g. `http://localhost:5173`, to enable CORS. Alternatively proxy `/api/tool` through the UI development server. Use one service process/store instance per data file; locking is in-process, not cross-process. Data is written via a temporary sibling file and atomic rename.

Send `POST /api/tool` with JSON `{ "operation": "...", "input": { ... } }`. Responses use `{ "ok": true, "data": ... }` or `{ "ok": false, "error": { "code": "...", "message": "..." } }`. Operation failures return HTTP 200; malformed JSON, oversized requests and unsupported methods use HTTP errors with the same result envelope. IDs are opaque server-generated UUIDs except section IDs, which are supplied by the client and unique within a track.

| Operation | Input | Data |
| --- | --- | --- |
| `track.list` | `{}` | Array of tracks |
| `track.get` | `{ trackId }` | Track |
| `track.create` | `{ title, code, tempo, sections }` | Created track |
| `track.update` | `{ trackId, expectedRevision, changes }` | Updated track; `changes` contains any of title, code, tempo, sections |
| `track.delete` | `{ trackId, expectedRevision }` | `{ id }` |
| `snapshot.create` | `{ trackId, expectedRevision }` | Snapshot |
| `snapshot.list` | `{ trackId }` | Array of snapshots |
| `snapshot.restore` | `{ trackId, snapshotId, expectedRevision }` | Restored track, with a new revision |
| `transport` | `{ action, trackId? }` | `{ action, trackId? }` request for the browser |

A track conforms to `shared/contracts.ts`. Sections are `{ id, name, code }`; tempo is 20–400 BPM. Track creation starts at revision 1; update and restore increment it. Every mutation of an existing track, including snapshot creation, requires its current `expectedRevision`; stale values return `CONFLICT`. Deleting a track also deletes its snapshots. Snapshots contain `{ id, trackId, createdAt, track }` and preserve the full captured track. Transport actions are `play`, `stop`, `mute`, and `unmute`; play requires an existing `trackId`. A transport result is only a request: the browser must actually perform playback and report its own state.

Additional aliases are `list_tracks`, `read_track`, `create_track`, `update_track`, `snapshot_track`, `restore_track`, and `request_transport`, using the same input as their dotted counterparts. `list_sections` takes `{trackId}`; `update_section` takes `{trackId, expectedRevision, sectionId, section:{name,code}}` and creates or replaces the section. `analyze_track` returns static counts only, and `export_track` returns code and sections. `get_playback_state` reports unknown: no browser state has been connected. The JSON schema in `shared/tool-schema.json` describes the registered `poptart_studio` tool; its Python bridge strictly validates per-op inputs before forwarding supported operations. Direct service aliases remain as documented here; operation-specific validation occurs in the service.

The service binds loopback and rejects browser Origin headers other than `POPTART_UI_ORIGIN` (default `http://127.0.0.1:5173`); opaque-origin audio is rejected. A local process without an Origin must still authenticate. This is not a remote production gateway; do not expose it to untrusted local processes, networks or a real Hermes installation. Multiple service processes against one file are unsafe.
