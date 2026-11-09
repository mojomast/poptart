# SCORE SHEET · 2026-11-06

The track is the clock. The frame is a ruled score: hard typographic hits, a
rotating asterisk, and real app content on horizontal rails. Large negative space
and heavy grotesk type give it the confidence of an independent-label release.

## Design

- 1920×1080 / 60 fps / exactly 40 seconds. Eight scenes, not channels.
- Ink `#0B0D0A`, raised `#161A14`, off-white `#E9EDE3`. Lime **#A3E635** is the
  exact flat logo colour sampled from the supplied banner. Rules #2A3026; muted
  #6E7766; error-only orange #FF5A3C. Captured UI keeps its own theme untouched.
- Locally bundled **Inter Black** (grotesk, 900) and **JetBrains Mono** (500).
  The repo references system/Inter fonts but ships no font binaries. No remote
  font requests. Title 124–200px, caption 30–40px, score labels 18–22px.
- Safe edge 72px, caption baseline 988px, top register 64px. Rules at
  180/348/516/684/852px. Media rails are rectangular, never glass or floating cards.
- Asterisk vector matches the banner's eight arms and thickness. Rotation is
  **60° per beat**, independent of arm count, and stops on the final downbeat.
- Hit: visible immediately on the beat, then 6px of settle in 0.16s. No eased
  arrival. Cuts and title changes quantize to nearest 60fps frame of the beat.
- Sparse static paper grain at 1.8%. No shader, CRT, VHS, glitch or scanlines.
- Source PCM generates peak waveform, quarter-beat RMS strips and beat energy.
  They describe the actual track, not random visualizer data.

## Edit

Tempo 126 is explicit in complex-demo.json; 4/4 bars last 40/21 seconds. The
strongest kick-attack grid fitted over 55 main-section beats gives source origin
13.039095s with 0.32ms standard deviation. The selected downbeat is six bars
earlier, 1.610524s. Harmonic checks confirm A/F/C/G from that selected downbeat;
Main enters on cycle 6 (C), preserving the running scheduler phrase. Native
highlight replay therefore uses film time × 126/240, without resetting at Main.
The uninterrupted 40s excerpt includes sparse intro, entry of
the full main pattern at film 11.428571s, and the full arrangement in the climax.
No speed changes or stock music. Fade-in 20ms, final fade 38.5–40s. Measured
gain plus a 4×-oversampled, latency-compensated peak limiter targets −14 LUFS
while preserving the sparse intro's dynamics; headroom allows for AAC encoding.

| Scene | Bars | Film seconds | Musical action |
|---|---:|---:|---|
| Score | 2 | 0–3.809524 | Rules on beats 1–4; asterisk on bar 2; NOISE on beat |
| Hermes | 3 | 3.809524–9.523810 | Full real Hermes window → docked pane rail |
| Operations | 3 | 9.523810–15.238095 | One tool; five real operation families on beats |
| Highlights | 4 | 15.238095–22.857143 | Native 126 BPM code marks; two readable crops |
| Continuation | 2 | 22.857143–26.666667 | Genuine rejected edit and Playing state |
| Library | 3 | 26.666667–32.380952 | Right library and actual saved revision states |
| Drop | 1.5 | 32.380952–35.238095 | Four 1-beat cuts, then waveform hold |
| Release | 2.5 | 35.238095–40 | Wordmark, repo, maker; last downbeat rests |

## Source limitations and capture approach

The supplied 1280×900/25fps MP4 is an older packaged app recording with a left
library and no token marks. Its sound remains the sole music source and picture
is used at native resolution, mapped to the same source time. Supplied v024 PNGs
show a different 120 BPM example: retained as references, never presented as
synced to the 126 BPM soundtrack.

Feature close-ups are captured from the actual v024 React Player/Audio and
Strudel engine at device scale 3. No UI painting or CSS changes. An isolated
capture harness exposes the native Drawer for deterministic source-clock replay;
the same engine evaluates the supplied track. Drawer's pattern/query/paint code,
message bridge, and actual DOM produce the marks. Error and revision shots come
from real UI actions and the real disposable service. Capture provenance is
documented; these are app captures, not signed-in Hermes sessions. The supplied
Hermes hero is the real signed-in host shot.

Crop scale is measured against fitting the complete source into its rail.
Feature crops are 1.6–2.5×, held ≥1.5s; the deliberate climax uses beat cuts.
Never enlarge source pixels. Match crop windows to code, chat, library and status.

## Contract and review

Await `registerFrameSource({element,ready,render})`; absolute-time drawing only,
bounded decoded-image cache, no render-time clocks/network/randomness. FFmpeg
decodes the supplied MP4 to cached 60fps frames without optical flow. Native
capture frames are also indexed at 60fps. One render, two workers, nice 19,
FFmpeg threads 2. Only this project's caches may be removed.

Review eight stills, all cuts ±1 frame, shuffled-seek pixel equality, assets and
source hashes, frame counts, beat alignment, preview size, final loudness and
decode. Official references consulted: [frame sources](https://hyperframes.heygen.com/guides/frame-sources),
[determinism](https://hyperframes.heygen.com/concepts/determinism),
[music video](https://hyperframes.heygen.com/guides/music-to-video).
HyperFrames npm latest checked 2026-11-06: 0.9.19.
