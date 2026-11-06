# Music service

Requires Node.js 18 or later; no dependencies. From `server/`, run `npm start` (or `node index.js`) and `npm test` (or `node --test`). The service listens on `127.0.0.1:3001`. Set `PORT` to change the port, `POPTART_DATA_FILE` to select the store file (default `data/tracks.json` relative to the working directory), and `POPTART_UI_ORIGIN` to the exact browser origin, e.g. `http://localhost:5173`, to enable CORS. Alternatively proxy `/api/tool` through the UI development server. Use one service process/store instance per data file; locking is in-process, not cross-process. Data is written via a temporary sibling file and atomic rename.

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
