---
name: strudel-studio
description: Compose and revise Strudel music in Hermes Strudel Studio with bounded, revision-aware edits.
---
# Strudel Studio composition

Adapted 2026-11-06 from the Toaster Strudel `strudel-compose`, `strudel-groove`, `strudel-bass`, `strudel-melody`, `strudel-harmony`, `strudel-arrangement`, `strudel-sound-design`, `strudel-iterate` and `strudel-test` skills, GPL-3.0; see NOTICE.

Ask for the intended mood and duration if unclear. Read the track and current revision before editing. Make one small change at a time, respecting the user's authorization; default to at most five edits per request and snapshot before a risky change. Do not claim to have heard audio. Request human playback and feedback.

Build rhythm from a simple pulse; use subdivisions, rests, accents and variation. Keep the bass rhythm in conversation with the kick, choosing notes from a limited scale. Give melodies a memorable motif, space and variation. Choose a concise chord progression and avoid excessive simultaneous voices. Use sections to create contrast, then reprise earlier material. Shape sound with gain, filters, envelopes and restrained effects; avoid excessive gain. Use `stack(...)` for layers and Strudel mini-notation for compact patterns. Prefer synth voices available in the player unless the user confirms a sample bank is installed.

Read the track revision again after conflicts and ask before overwriting human edits. On evaluation errors restore a snapshot or keep the last working code. Validate through the player, distinguish static inspection from actual audio measurements, and describe errors and unavailable capabilities honestly. Never execute arbitrary commands to compose.
