# poptart — SCORE SHEET

**40 seconds · 1920×1080 · 60 fps · 126 BPM · 21 bars**

A music-led promo for poptart / Strudel Studio v0.2.4. Heavy grotesk typography,
mono score labels, ruled ink paper and the banner's lime asterisk. The soundtrack
is exclusively the supplied complex-demo recording. No voiceover or stock music.

- [720p H.264 preview](previews/poptart-preview-720p.mp4)
- [Eight-frame contact sheet](previews/keyframes/contact-sheet.jpg)
- [Design and exact beat sheet](STYLE.md)
- [Source and license details](ASSETS.md)

## Build

Node 22+, npm, FFmpeg/ffprobe, Python with NumPy and Pillow, and Linux `nice` /
`taskset`. The native app capture uses the repo's real React/Strudel dependencies.
Install those once from the repository root, then install the video tooling:

```sh
# repository root
npm ci
cd promo/poptart-video
npm ci
npm run build
npm run lint
npm run check
node scripts/seek-check.mjs
npm run stills
npm run render
npm run verify
```

HyperFrames **0.9.19** is pinned in both manifests (npm latest checked 2026-11-06).
Chromium is the cached HyperFrames `chrome-headless-shell`; the CLI can provision
it on first use. Source media is resolved from input commit `04e9d66`, fetching
`promo/poptart-video-input` if needed. No media-server URL or credentials are needed.
`build` creates a native capture if absent; `npm run capture` explicitly refreshes
it. The capture uses one browser and a disposable, authenticated local store.

The full-resolution master is `out/poptart-master.mp4`. The committed 720p preview
is capped at **25,000,000 bytes**. Eight PNG stills are in `previews/keyframes/`.

## Editorial choices

- The prompt's approximate 120 BPM times become exact 126 BPM bars. End-card
  space takes the remainder: 2.5 bars. The **1.5s fade is inside the 40s film**.
- The uninterrupted source excerpt is **1.610524–41.610524s**. It starts on the
  A-minor downbeat, includes the sparse Intro and full Main, and never changes speed.
- A fitted kick grid verifies the tempo. Harmonic measurements verify phrase
  alignment: Main starts on C (cycle 6), retaining the running Strudel clock.
- Audio is faded 20ms / 1.5s, gain-adjusted and peak-limited at 4× sample rate.
  Measured mastering preserves the quieter introduction; final AAC is measured
  independently for −14 LUFS integrated and true peak ≤−1dBTP.
- The banner uses **#A3E635**, so `palette.json` follows that exact lime. UI
  captures retain their original theme; native purple marks are not recoloured.
- The original banner has **eight arms**. The matching vector turns **60° per
  beat**, as requested, then stops on the last downbeat.

## Genuine media and sharp close-ups

The supplied Hermes hero is the real signed-in host screenshot. The old packaged
MP4 predates the right-side library and highlights; its code picture is used
without pixel enlargement, mapped to the same source time as its sound.

The two supplied v024 PNGs show a different 120 BPM example, so they are retained
as references rather than made to imply 126 BPM synchronization. Feature views
are recaptured from the **actual v024 Player/Audio DOM and stylesheet at DSF 3**:

- Native Strudel evaluates the supplied 126 BPM source. Its native Drawer is
  clock-driven for reproducible replay; the existing message bridge paints its
  own token marks. Screenshot frames and margin ticks derive from actual native
  ranges and measured rectangles. No code/UI repainting occurs in the film.
- An extra closing parenthesis is applied through the actual UI. The error,
  retained Playing state, unchanged last-good code, and ongoing audio beyond
  sample tails are checked. The film's music remains the original recording.
- Save actions create real revision 2, 3 and 4 states. The actual right-hand
  library and revision indicator are captured. Revisions and snapshots are
  supported operations; the film does not invent a revision-history sidebar.
- These recaptures are isolated product captures, **not a signed-in Hermes
  session**. No live user tracks, host theme settings or services are changed.

All feature regions contain code, chat, the library or real status. The source
pixel check in `photo()` rejects upscaling. The two code crops hold for two bars
each; the climax intentionally uses four one-beat cuts.

## Editable project

| File | Edits |
|---|---|
| `copy.json` | On-screen words |
| `palette.json` | Flat graphic colours |
| `settings.json` | Tempo, duration, bars, source offset, limits |
| `scenes/01-…08-*.js` | One drawing module per shot |
| `shared/draw.js` | Type, rules, asterisk, crop bounds and audio strips |
| `shared/runtime.js` | Awaited frame-source registration and bounded image cache |
| `scripts/media.py` | Original audio, measured master, waveform, FFmpeg frame cache |
| `scripts/capture.mjs` | Native high-resolution feature captures and evidence |
| `scripts/seek-check.mjs` | Exact-pixel random/reverse seek and cut-boundary checks |
| `scripts/verify.mjs` | Asset hashes, beat grid, timing, cache/preview budget, encode/loudness |

Render callbacks depend only on source time. No wall clock, remote fetch, shader
or unseeded randomness is used. `registerFrameSource` returns an awaited image
decode/draw promise. The cached source video is 60fps, nearest-frame duplication
of the original 25fps recording; no interpolated/invented frames.

## Resource limits

`render` runs **one job, two workers, nice 19, and two-core affinity**, which also
makes HyperFrames' internally selected FFmpeg encoder thread count two. All other
FFmpeg calls explicitly pass `-threads 2`; Python filters also use two threads.
Browser checks and capture run serially. A project-owned lock prevents overlapping
renders. Decoded frames are shared by `.build` symlinks rather than copied.

The rebuildable cache is about 0.35GB, under the asserted 1.8GB ceiling. To reclaim
space after finishing review, delete only this project's `.cache/source-frames/`
and `.cache/native/`; remove `.cache/media-stamp` too so the next build decodes.
The original media and committed preview remain intact.

Studio handoff, if desired:

```sh
npx hyperframes preview .build --background --port 4335
npx hyperframes preview .build --status
# after review
npx hyperframes preview .build --stop
```

Canvas text is not measurable by the framework's DOM contrast/layout analyzer;
the full check is supplemented by source-pixel bounds assertions, eight inspected
1080p stills and 29 exact-pixel seeks. The render is intended for an unmerged PR.
