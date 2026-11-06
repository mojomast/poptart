# SCORE SHEET — delivery review

## Picture and timing

- Eight 1080p PNGs inspected before full rendering. Distinct heavy Inter / mono
  score typography, exact banner lime, eight-arm vector, static 1.8% grain.
- All seven scene cuts fall within **7.143ms** of the musical grid (less than one
  60fps frame). Internal operation hits, code crop changes, error indicator,
  revision stamps and montage cuts are also checked against the grid.
- 29 exact-pixel reverse/random-access checks pass, including each boundary at
  −1 / 0 / +1 frame. Native source-image loads are awaited. No browser errors.
- Real 126 BPM source-clock replay confirmed against harmonic evidence: Main
  enters on C/G/A/F, not a restarted A/F/C/G phrase. The fit over 55 kick attacks
  has **0.316ms** standard deviation. Current native mapping uses 97 unique
  captured code states across 628 60fps frame references.
- Real feature screenshots captured at device scale 3. Every drawing crop is
  bounds-checked and rejects source-pixel upscaling. The actual UI is untouched.
- Invalid edit: real error text, Playing state and last-good source retained;
  two post-tail audio windows remain nonzero. Saved revision labels 2/3/4 are
  actual UI output. Source-video picture remains on the original audio time.
- All eight scene modules use the awaited HyperFrames frame-source API. No CRT,
  VHS, shader, fabricated UI, random waveform or stock music.

## Framework checks

HyperFrames 0.9.19 lint and full check pass with **zero errors and warnings**.
Canvas typography is outside the DOM contrast analyzer (0 DOM text checks), so
this is not claimed as an automated typography/contrast certification. The
actual full-resolution frames and crop bounds were reviewed separately.

## Audio and encode

40.000s / 2,400 frames. The source excerpt begins at 1.610524s and plays at speed
1 throughout. The sole music source is `complex-demo-packaged.mp4`. A 20ms fade-in
and 1.5s end-card fade are included. The 4× oversampled peak-limited PCM measures
−14.05 LUFS / −1.72dBTP. `npm run verify` independently checks final AAC loudness
and peak, 1080p/60 master, H.264 720p/60 preview below 25MB, all eight PNGs, and
full video/audio decoding. Final encode measurements are in
[`previews/verification.json`](previews/verification.json).

## Reproducibility and resource review

Original source hashes, tempo, 11 registered operations, caption/scene timing,
native-frame coverage and a 1.8GB cache ceiling are asserted. The cache is about
0.34GB. Obsolete native images created by this project were removed; no unrelated
files were touched. Render runs at nice 19 with two workers and two-core affinity;
all separate FFmpeg commands use two threads. Capture and checks use one browser
at a time. Generated frame caches and source inputs remain ignored.

Font licenses are bundled verbatim. Final staged files are secret-scanned before
pushing. All project changes are under `promo/poptart-video/`; the PR targets the
repository's existing default branch, `feat/hermes-strudel-studio`, and stays open.
