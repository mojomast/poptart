# Hermes integration — 0.2.5

Targets **Hermes Agent >=0.22.7** and **Node 22+**. Registration uses keyword
arguments and signature-gates `output_schema` for host compatibility. The native
plugin exposes one tool, `poptart_studio`, plus the opt-in Desktop/Webapp pane.

## Install and regenerate

The catalog installs **only `integration/hermes`**, not the repository root.
That directory is self-contained in Git: Python adapters, service source, bundled
skill, notices, and the prebuilt guest HTML/metadata are committed. **Catalog
users need Node at runtime, but do not need npm, a build step, or node_modules.**
The catalog submission is pending; the catalog SHA must be updated separately
after review of this version.

For a source checkout:

```sh
npm ci --ignore-scripts
npm run build
npm run build:check
python -m pytest -q tests/plugin  # pytest, jsonschema, ruamel.yaml, fastapi, httpx
hermes plugins doctor integration/hermes --ci
hermes plugins validate integration/hermes --install-deps
```

`npm run build` typechecks and builds standalone `dist/`, then runs
`scripts/package-plugin.mjs`. The packager copies `server/` (excluding tests),
`skills/`, and license notices into the plugin. Pinned esbuild bundles the two
`src/hermes-*.tsx` entrypoints into `guest-document.html`, including CSS, worklets
and original CC0 sample data URLs, and writes its SHA-256 to `guest-build.json`.
All generated installed files are text; no binary files or node_modules ship.
The standalone Vite assets are **not** needed or shipped in the native package.
Dependencies and bundler versions are pinned by `package-lock.json`.

Commit the regenerated files whenever source changes. `npm run build:check`
rebuilds into a temporary directory and compares the complete generated file list
and bytes against the committed package, without rewriting it. The package CI
runs this check plus service, registration, subdir-only install and strict YAML
tests. A stale/missing/extra generated file fails the check.

For local development, symlink the directory into the active profile's plugins:

```sh
mkdir -p ~/.hermes/plugins
ln -s "$PWD/integration/hermes" ~/.hermes/plugins/hermes-strudel-studio
hermes plugins enable hermes-strudel-studio
```

Backend and Desktop are independently opt-in; Desktop ships with
`defaultEnabled: false`. Enable the pane under Capabilities, then Rescan/reload.
Backend route changes on an already-mounted plugin may require a gateway restart;
frontend-only changes normally need only a Rescan/reload and pane reload. Perform
service maintenance deliberately and preserve profile data.

## Backend and tool

`poptart_studio` takes `op` and `input`. Exact fields are in the bundled
`hermes-strudel-studio:strudel-studio` skill. Draft 2020-12 validation rejects
unknown fields, invalid IDs/types, stale revisions, duplicate section IDs and
empty updates before authenticated requests. Results include
`{ok,error,code,fix}` and success adds `data`. There is no arbitrary shell,
delete, remote transport or audio-export operation.

The first valid call lazily starts one detached Node sidecar. Registration has
no process/network activity. Profile `plugin_data_dir('hermes-strudel-studio')`
holds tracks, service state, private logs and a random 256-bit token. A cross-process
startup lock uses `fcntl.flock` on POSIX and `msvcrt.locking` on Windows; absence of
both fails closed. Windows startup uses a pipe-reader thread rather than POSIX-only
pipe selection. POSIX token files must be owner-owned, regular and mode 0600;
Windows uses the profile directory's inherited ACL, which must be private to the
user. Symlinks and malformed tokens are rejected on both platforms. Windows
import/lock behavior is mock-tested; native Windows runtime testing remains open.

The token is never logged, returned or delivered to a guest. Node binds only
127.0.0.1 on an OS-selected port. API requests require a bearer token and reject
unrelated/opaque browser origins. The Python client bypasses HTTP proxies and the
sidecar environment excludes provider credentials. The native sidecar serves no
public UI assets; the guest comes through Hermes' authenticated bootstrap route.

A starting marker prevents uncertain startup from spawning a second store owner.
An unavailable existing service returns `SERVICE_UNAVAILABLE`, never an automatic
restart. During deliberate recovery, preserve tracks and token, reconcile the
PID/listener, then remove stale state only after the old owner is stopped. Never
run two sidecars against one store.

## Pane and security boundary

`desktop/plugin.js` imports only SDK/React APIs. It uses `SandboxedFrame` with
scripts-only opaque isolation, no referrer, no same-origin permission, and no
core DOM scraping, eval or prototype patching. `ctx.rest` reaches the authenticated
Python `/bootstrap` and `/tool` routes. The bootstrap contains the self-contained,
credential-free guest document, not a sidecar URL. Versioned messages are source-,
origin- and per-mount capability-checked, bounded in size/concurrency, and never
expose the service token. The nested audio guest receives no host capability.

The Hermes Webapp guest shell receives the editor document via the SDK. The host
inserts the frame capability and parent binding into that document. Sample data
and worklet blob sources are bundled, so opaque guests need no anonymous HTTP
asset fetches. The versioned `plugin_api_v2.py` preserves the backend namespace.
Three-second bounded refreshes preserve dirty edits. Reload/unmount stops audio.
Only the Hermes connection is needed; tunneling a sidecar port is unsupported.
Audio needs a secure context (HTTPS or localhost) and a human Play/apply gesture.
Strudel executes arbitrary JavaScript; browser isolation is **not an OS sandbox**.
Native Desktop data-document worklets and non-Chromium browsers remain unverified.

The documented SDK `useTheme()` hook supplies allowlisted palette/font values to
the isolated guests. Invalid or absent values fall back to dark, without changing
host preferences or scraping its DOM. Below 600px, the library stacks below the
editor. Scheduler-backed Strudel Drawer events paint mini-notation highlights;
Stop clears them and dirty buffers hide them until they match evaluated source.
Rejected edits retain the last-good playing pattern.

## Validation scope

The tests exercise production guests using a headless SDK-contract/Webapp-shell
fixture, not a signed-in Hermes session or physical speakers. See TEST_REPORT.md
for results. The isolated-install test copies only the installed subdirectory,
reads the actual skill during registration, starts a disposable sidecar, calls
the registered tool and stops only that fixture process. No live host deployment
or restart is performed by these checks.
