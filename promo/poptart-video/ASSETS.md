# Sources and licenses

## Product evidence

| Asset | Provenance | Use |
|---|---|---|
| `banner.png` | `docs/assets/banner.png`, product baseline `13de043` | Exact lime #A3E635 and eight-arm logo geometry |
| `hermes-webapp.png` | `docs/assets/hermes-webapp.png`, same baseline | Genuine Hermes docking and chat/code shot |
| `complex-demo-packaged.mp4` | `mojomast/poptart`, input commit `04e9d66`, `promo/poptart-video-input/` | Only soundtrack; original picture in operations scene |
| `complex-demo.json` | Same input commit/folder | Exact source, 126 BPM, Intro/Main/Break arrangement |
| `highlights-v024.png`, `highlights-standalone-v024.png` | Same input commit/folder | Visual references; their different 120 BPM pattern is not misrepresented as the soundtrack |
| `.cache/native/` | Local DSF3 capture of actual v024 `src/Player.tsx`, `src/Audio.tsx`, `src/PatternEditor.tsx`, native Strudel engine, real local service | Token close-ups, invalid-edit state and saved revisions |

`inputs/hashes.json` records SHA-256 of original files; verification rechecks them.
`native/manifest.json` records source code, exact source-frame mappings, native
token boxes, revision labels, error text and two independent post-error audio
peaks. Generated captures are reproducible from the committed script. The
repository's [AGPL-3.0 license](../../LICENSE) and existing [notices](../../NOTICE)
apply to project source; source code is available in this same repository.

The original track uses the repo's original CC0 `bd`, `sd`, `hh` samples and
Strudel oscillators, as stated in the supplied track code. No external samples,
stock music, voice synthesis or generated imagery were added. Native re-capture
does not replace the soundtrack.

## Bundled fonts

| Font | Source | License |
|---|---|---|
| `assets/fonts/Inter.ttf` | [Google Fonts / Inter](https://github.com/google/fonts/tree/main/ofl/inter), variable `opsz,wght`, downloaded 2026-11-06 | OFL 1.1, verbatim `Inter-OFL.txt` alongside font |
| `assets/fonts/JetBrainsMono.ttf` | [Google Fonts / JetBrains Mono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono), variable `wght`, downloaded 2026-11-06 | OFL 1.1, verbatim `JetBrainsMono-OFL.txt` alongside font |

The poptart repo references Inter/system fonts but contains no bundled font
binaries. The promo bundles these families locally and performs no remote font
loading. No Hermagotchi fonts, shaders, artwork or channel modules are reused.

## Generated editorial assets

- Asterisk vector: measured banner geometry, four crossed 14×106px bars; eight arms.
- Paper grain: NumPy generator seeded with 230126, static and composited at 1.8%.
- Waveform and step strips: actual mastered audio's peak/RMS values.
- Rules, score labels and operation boxes: original code in `shared/draw.js`.

HyperFrames 0.9.19, esbuild 0.25.12 and Puppeteer Core 25.16.0 are pinned build/QC
dependencies. The host repository retains its existing Strudel/React licensing
and notices; see [THIRD_PARTY_LICENSES.md](../../THIRD_PARTY_LICENSES.md).
