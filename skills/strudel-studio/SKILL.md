---
name: strudel-studio
description: Compose and revise Strudel music in Hermes Strudel Studio with bounded, revision-aware edits.
---
# Strudel Studio composition

Adapted 2026-11-06 from the Toaster Strudel `strudel-compose`, `strudel-groove`, `strudel-bass`, `strudel-melody`, `strudel-harmony`, `strudel-arrangement`, `strudel-sound-design`, `strudel-iterate` and `strudel-test` skills, GPL-3.0; see NOTICE.

Ask for the intended mood and duration if unclear. Read the track and current revision before editing. Make one small change at a time, respecting the user's authorization; default to at most five edits per request and snapshot before a risky change. Do not claim to have heard audio. Request human playback and feedback.

Build rhythm from a simple pulse; use subdivisions, rests, accents and variation. Keep the bass rhythm in conversation with the kick, choosing notes from a limited scale. Give melodies a memorable motif, space and variation. Choose a concise chord progression and avoid excessive simultaneous voices. Use sections to create contrast, then reprise earlier material. Shape sound with gain, filters, envelopes and restrained effects; avoid excessive gain. Use `stack(...)` for layers and Strudel mini-notation for compact patterns. Prefer synth voices available in the player unless the user confirms a sample bank is installed.

Read the track revision again after conflicts and ask before overwriting human edits. On evaluation errors restore a snapshot or keep the last working code. Validate through the player, distinguish static inspection from actual audio measurements, and describe errors and unavailable capabilities honestly. Never execute arbitrary commands to compose.

## Native tool: `poptart_studio`
Load this skill as `hermes-strudel-studio:strudel-studio`.
Every call is `{op, input}`. Fields are exact; unknown keys are rejected:
- `list`: `{}`
- `get`, `snapshots`, `analyze`, `export`, `sections`: `{trackId}`
- `create`: `{title, code, tempo, sections}`; tempo 20–400, sections `[{id,name,code}]`, unique ids.
- `update`: `{trackId, expectedRevision, changes}`; nonempty changes from title/code/tempo/sections.
- `snapshot`: `{trackId, expectedRevision}`
- `restore`: `{trackId, snapshotId, expectedRevision}`
- `update_section`: `{trackId, expectedRevision, sectionId, section:{name,code}}`
Results contain `{ok,data?,error,code,fix}`. `CONFLICT`: read current revision, preserve human edits, never blindly overwrite. `VALIDATION_ERROR`: fix fields. `SERVICE_UNAVAILABLE`: check build and Node; never restart an existing service without approval.
Open the Strudel Studio Desktop pane only if enabled by the user. Edits persist but do not auto-evaluate: human Play/apply remains necessary. Analyze is static counts; export is code, never audio. There is no remote playback or delete operation. The pane loads its bundled guest document through the authenticated Hermes origin; do not tunnel or expose the sidecar. OAuth-specific and native-Desktop worklet behavior remain unverified.
