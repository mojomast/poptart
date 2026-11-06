# Status and priorities

- Phase 0: upstream sources, contracts and architecture recorded.
- Phase 1: bundled Strudel, original CC0 drum samples, nested player, play/stop/mute and invalid-edit recovery verified in headless Chromium.
- Phase 2: JSON service, optimistic revisions, snapshots, sections, static analysis and code export; automated service workflow passes. Multi-process locking, section timeline and signal analysis are absent.
- Phase 3: simulated host, iframe handshake, refresh and reload. Real Hermes is untested; transport request is not routed to the nested player. No WebSocket.
- Phase 4: responsive editor and tests; no full Toaster visualizations, live recording or offline rendering. Expanded/compact and host/browser lifecycle need more testing, including actual speakers and non-Chromium browsers.
- Phase 5 update: authenticated bridge, one native tool, lazy sidecar and opt-in Desktop pane implemented; doctor/validate/native dispatch passed on v0.22.7. Actual enabled Hermes pane validation remains pending. Original next steps: Implement authenticated backend bridge and native tools, validate sandbox in actual Hermes Desktop, register the pane, test restart and remote gateway, then audit all redistributed dependencies/assets before release.

Before production harden per-message schemas and size limits, local authentication, isolation and process locking; add sample-load error visibility, live state events, user-authorized transport, safe snapshot/revert UI, and bounded automatic iteration. See HANDOFF.md.
