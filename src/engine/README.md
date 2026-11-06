# Strudel audio engine

Browser-only singleton controller for a React player. Install the exact direct dependency `@strudel/web@1.3.0` (`npm install --save-exact @strudel/web@1.3.0`). It brings its own compatible Strudel core, mini, tonal, transpiler and webaudio dependencies. Bundlers such as Vite resolve the dynamic npm import locally; no JavaScript CDN or import map is needed. The package is AGPL-3.0-or-later. The engine uses the browser Web Audio API and must not be imported for server-side rendering without a client-only boundary.

```tsx
import { useEffect, useSyncExternalStore } from 'react';
import { engine } from './engine';

function Player({ code }: { code: string }) {
  const state = useSyncExternalStore(engine.subscribe, engine.getState);
  useEffect(() => {
    // Boot early so the AudioContext can be resumed directly in the click handler.
    void engine.boot({ sampleBanks: ['/samples/strudel.json'] }).catch(console.error);
    return () => engine.stop();
  }, []);
  return <>
    <button onClick={() => void engine.play(code).catch(console.error)}>Play</button>
    <button onClick={engine.stop}>Stop</button>
    <button onClick={() => engine.setMuted(!state.muted)}>{state.muted ? 'Unmute' : 'Mute'}</button>
    <input aria-label="Volume" type="range" min="0" max="1" step="0.01"
      value={state.gain} onChange={e => engine.setGain(Number(e.target.value))} />
    {state.error && <p role="alert">{state.error}</p>}
    {state.sampleErrors.map(error => <p key={error}>{error}</p>)}
  </>;
}
```

`boot` is shared and idempotent; only the first invocation's options apply. Await it before enabling Play if the browser requires the context to be resumed within a gesture. `play(code)` starts or live-replaces the current pattern and rejects on errors; Strudel's REPL normally swallows these, so the controller checks its evaluation state. Syntax is preflighted with the bundled Strudel transpiler before entering the stateful REPL. A runtime evaluation failure explicitly reinstalls the last successfully evaluated Pattern object and its tempo, without re-executing its source; `lastGoodCode` stays unchanged. Transport state and the error alert are independent, so a failed apply does not relabel ongoing playback as stopped/error. Arbitrary code can itself cause side effects, including changing definitions or the audio graph, before throwing; rollback of those side effects is not possible. Stop cancels pending play requests and stops scheduling; already sounding notes/effects can tail out. Mute and gain affect Strudel's output gain, not the source code. Gain is clamped to 0–1; mute preserves the selected gain. `dispose()` stops and removes all subscribers; use it only when the singleton is no longer shared. It does not close the global context, so remounting works.

`createEngine()` is an alias returning the singleton, also exported from `./engine/strudel`. `play(code, bpm)` optionally sets the tempo after successful evaluation, assuming four beats per cycle; it overrides tempo set by the code. Omitting BPM leaves Strudel's current tempo alone.

## Samples

Built-in synths are registered by Strudel. Drum samples such as `bd` require an explicitly provided bank. Host a Strudel-format JSON manifest and referenced audio files as static assets, for example `public/samples/strudel.json` and `public/samples/kick.wav` with `{"bd":["kick.wav"]}`. Relative sample paths resolve against the manifest's directory; an `_base` entry can instead point at an asset base URL. Alternatively pass `{ map: { bd: ['kick.wav'] }, baseUrl: '/samples/' }` in `sampleBanks`. Make sure the player frame can fetch these assets, including CORS where applicable. The engine ships no sample audio or soundfonts. Manifest registration is awaited and failures appear in `state.sampleErrors`; sample files are fetched lazily during playback, so registration does not guarantee that audio files exist or decode successfully. Strudel logs those later errors itself. External manifest URLs and `github:` shortcuts are supported by upstream but depend on network access.

Strudel executes JavaScript, not a restricted pattern language. Only evaluate code at the intended isolated player boundary. State and errors are local to the page; playback state does not prove that sound reached speakers.

## Mini-notation highlighting (0.2.4)

`subscribeHighlights(listener)` receives sorted `[start, end]` UTF-16 ranges from
Strudel haps' `context.locations`. This uses the actual `@strudel/draw` Drawer
already shipped transitively by Strudel, now directly pinned to 1.2.5, following
`@strudel/codemirror@1.2.6`'s StrudelMirror currentFrame/isActive pattern.
Drawer reads `scheduler.now()` (Web Audio time), not Date/performance time, with
`drawTime=[0,0]`. Only changed range sets cross the nested opaque-frame bridge;
RAF never updates React state. Successful evaluations restart/invalidate the
Drawer with the newly evaluated pattern; runtime recovery does the same with
the restored last-good Pattern. Syntax preflight errors leave it untouched.
Stop cancels RAF and clears ranges. Very brief events can be missed by RAF,
and browsers throttle painting in hidden/background frames; audio is separate.

The shared accessible textarea has an inert scroll-synced `<pre>` paint layer,
not a second evaluator or a new CodeMirror editor. The editor accepts only
bounded integer ranges and creates text nodes, never HTML supplied by a pattern.
Highlight styling uses `--studio-accent` from the existing theme bridge. Offsets
are used only when the editor buffer exactly matches `lastGoodCode`: dirty or
invalid buffers deliberately hide the old highlights, which resume if you restore
the last applied source or successfully apply new code. No position remapping is
claimed. Audio and last-good locations continue during failed applies.
