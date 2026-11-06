# Agent instructions

Read HANDOFF.md, ARCHITECTURE.md and INTEGRATION.md before changes. Keep audio engine, service and Hermes adapters independent. Treat all Strudel as arbitrary JavaScript. Never pass Hermes credentials to a player iframe. Use revision preconditions for every track write; preserve user edits and report conflicts. Do not add another agent runtime. Do not claim Hermes, audible quality, sandbox or sample behavior was tested without evidence. Run tests and build and update TEST_REPORT.md for behavioral changes. Do not commit secrets.
