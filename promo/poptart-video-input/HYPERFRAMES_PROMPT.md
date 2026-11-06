# poptart / Strudel Studio — HyperFrames promo prompt (ready to run)

You are building a **40-second, 1920×1080, 60 fps HyperFrames promo** for **poptart / Strudel Studio** (repo `mojomast/poptart`, release v0.2.3+), a Strudel live-coding music studio that runs as a docked pane inside the Hermes web app. Build it as a new project folder `promo/poptart-video/` on a new branch `promo/poptart-video` (open a PR, don't merge). Do NOT reuse Hermagotchi's CRT/VHS look, shader, fonts or channel structure: this is a different style.

## 1. Style concept: "SCORE SHEET"
The video is **the music, drawn as a score**. Everything is locked to the beat of the real track. Each bar is a ruled line on a dark score sheet, code tokens are the notes, and the lime asterisk is the playhead or conductor. The look is a clean, confident, flat graphic. Think of an underground label's release poster that moves. It's calm and precise, and the type hits on the beat.
- **No CRT, no scanlines, no VHS, no glitch.** The only texture is a very subtle paper and riso grain, under 4% opacity.
- **Motion:** every cut and type hit lands on a beat or downbeat. Text moves in a hard step-in with no easing on the hit, then a gentle settle. UI captures slide in on rails like a tracker.
- **Graphic motifs:**
  - The lime asterisk logo spins exactly one sixth of a turn per beat.
  - Thin ruled bar lines run across the frame with bar numbers in mono micro-labels.
  - Token highlight boxes echo the app's own lit-up code tokens.
  - Waveform and step-grid strips are drawn from the real audio.
- **Type:**
  - Captions use a mono font, all uppercase, with wide letter-spacing, like the app's micro-labels.
  - Big headlines use a heavy grotesk.
  - Bundle the fonts locally with no remote loading, and use whatever the poptart repo already ships if it has one.

## 2. Palette (pull exact values from the poptart UI/banner if they differ)
| Role | Hex |
|---|---|
| Ink background | `#0B0D0A` |
| Raised panel | `#161A14` |
| Score lines / dim labels | `#2A3026` / `#6E7766` |
| Body text | `#E9EDE3` |
| **Lime (logo, playhead, hits)** | `#C6FF3D` |
| Accent for errors and kept-alive states, used sparingly | `#FF5A3C` |
| Token highlight | lime at 22% fill, plus a 1 px lime outline |

Use lime only for the playhead, active tokens and the single key word per card. Everything else stays in ink and off-white.

## 3. Audio
- **Soundtrack = the real track.** Extract the audio from `promo/poptart-video-input/complex-demo-packaged.mp4`, which is 56 s long. The music must be poptart's own output, with no stock music.
- Get the BPM and bar grid from `promo/poptart-video-input/complex-demo.json`, where the Strudel code holds the tempo. If it isn't there, detect it with onset analysis. Put every cut on that grid.
- Choose a 40 s excerpt, or two excerpts joined with a 1-bar crossfade, that starts on a downbeat. It should include a sparse intro and the full drop for the climax.
- Fade in over 20 ms. Fade out with a 1.5 s tail on the end card. There's no voiceover, so no ducking is needed.
- Master to −14 LUFS integrated with a true peak of −1 dBTP or lower.

## 4. Real assets (all on the shared box)
- `/workspace/poptart/docs/assets/banner.png`: the logo, the asterisk and the type reference. Cut the asterisk out as its own layer. Re-draw it as a vector if that's cleaner, matching it exactly.
- `/workspace/poptart/docs/assets/hermes-webapp.png`: poptart docked in the Hermes web app. This is the hero "it lives inside Hermes" shot.
- `promo/poptart-video-input/highlights-v024.png` and `highlights-standalone-v024.png`: the code-token highlight close-ups.
- `promo/poptart-video-input/complex-demo-packaged.mp4`: the 56 s screen capture with audio. Use its picture for the token-highlight and live-edit shots, with the audio exactly in sync.

Rules for the assets:
- Use them as they are: crop, zoom and pan, but never repaint the UI.
- Every crop must land on real content, meaning code, lit tokens, the library or Hermes chat. No crop may land on empty panels.
- Zoom to 1.6–2.5× on the feature being shown, and hold each one long enough to read, at least 1.5 s.
- Pan only between content-dense regions.
- If a crop softens the text, re-capture at a higher device scale factor instead of upscaling.
- No image generation, and no invented UI.

## 5. Shot list (≈40 s; lengths in bars. Convert with the real BPM; times assume ~120 BPM = 2 s/bar)
| # | Time | Bars | Shot | On-screen copy |
|---|---|---|---|---|
| 1 | 0:00–0:04 | 2 | Black ink. Score lines draw across the frame on beats 1–4. The asterisk drops in on the downbeat of bar 2 and starts its sixth-of-a-turn rotation. | `POPTART` (micro-label) then `LET'S MAKE SOME NOISE.` |
| 2 | 0:04–0:10 | 3 | **Hermes web app hero** (`hermes-webapp.png`). A slow push from the full window into the docked poptart pane. A lime bracket marks the pane. | `A STRUDEL STUDIO` / `DOCKED INSIDE HERMES` |
| 3 | 0:10–0:16 | 3 | **Hermes drives the track**: a crop on the Hermes chat side and the code. Kinetic type lists ops in time with each beat. | `ONE TOOL. ELEVEN OPS.` then on each beat `CREATE · EDIT · TEMPO · SECTIONS · REVISIONS` |
| 4 | 0:16–0:24 | 4 | **Tokens light up as they play**: the capture at 2× on the code, using the highlight shots. Overlay lime score-line ticks synced to the lit tokens. | `CODE THAT LIGHTS UP` / `AS IT PLAYS` |
| 5 | 0:24–0:28 | 2 | **Never drops a beat**: an edit breaks the pattern, a red-orange `ERROR` micro-label flashes, and the music keeps playing. Show the real behaviour from the capture, or re-capture it. | `BAD EDIT?` then `THE LAST GOOD PATTERN KEEPS PLAYING.` |
| 6 | 0:28–0:34 | 3 | **Library + revisions**: pan across the right-hand library. Each saved revision stamps in on a beat like a pressed record. | `KEEP EVERY REVISION.` / `A LITTLE EVERY DAY.` |
| 7 | 0:34–0:37 | 1.5 | **The drop**: a fast montage of three or four 1-beat cuts of the busiest capture moments. A full-frame waveform drawn from the real audio sweeps across. | `MADE TO BE PLAYED.` |
| 8 | 0:37–0:40 (+1.5 s tail) | 2 | **End card**: ink background, a large asterisk spinning to rest on the last downbeat, and the wordmark. | `POPTART — STRUDEL STUDIO FOR HERMES` / `github.com/mojomast/poptart` / micro-label `MADE BY SLOPTIMUS PRIME` |

All copy must use real features only: one tool `poptart_studio` with 11 ops, the token highlights, keeping the last good pattern on an invalid edit, the library on the right, the theme following Hermes, and docking in the Hermes web app. Don't add features.

## 6. Build & render (same pipeline as Hermagotchi)
- Pin the latest **HyperFrames** npm release, which was 0.9.19 on 2026-11-06, in `package.json` and the lockfile. Use the awaited **frame-source API**, with one module per scene and `copy.json`, `palette.json` and `settings.json` for edits.
- Make it deterministic: no wall-clock timers, no network fetches, no unseeded randomness. Every frame must be seekable on its own. Decode the MP4 with FFmpeg to a cached 60 fps frame sequence.
- Scripts are `npm ci`, `npm run build`, `npm run lint`, `npm run check`, `npm run render`, `npm run stills` and `npm run verify` (asset, timing, beat-grid and budget assertions), plus `node scripts/seek-check.mjs` (pixel equality after shuffled seeks).
- Render with `npx hyperframes render .build --fps 60 --quality draft --workers 2 --output out/poptart-master.mp4`. Then make an H.264 720p preview no larger than 25 MB in `previews/`, and eight keyframe PNGs.
- **Resource limits, because the box is shared and overloaded twice today:** use `--workers 2`, `nice -n 19`, `ffmpeg -threads 2`, one render at a time, and no parallel browsers. Disk is about 94% full, so delete only your own temporary frames.
- Before you finish: verify the beat grid by checking that cuts fall within one frame of the grid, measure the loudness, look at every keyframe, run a secret scan, and push to the feature branch only.
