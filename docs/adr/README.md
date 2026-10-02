# Architecture decision records

Each record states the context, the decision and its consequences. A superseded
record is never rewritten: a new one replaces it and the two link to each other.

| ADR | Decision |
|---|---|
| [0001](0001-gemini-behind-a-server-proxy.md) | Gemini behind a server proxy; the key never reaches the browser |
| [0002](0002-one-service-worker-via-vite-plugin-pwa.md) | One service worker built by vite-plugin-pwa; updates wait for the user |
| [0003](0003-hybrid-local-engines.md) | Local engines decide each persona's behaviour; the model handles open conversation |
| [0004](0004-classic-screen-by-default.md) | The classic 80x25 screen by default, Enhanced mode on request |
| [0005](0005-measured-voice-pipeline.md) | A measured voice pipeline, with a processing route per persona |
| [0006](0006-opt-in-history-and-content-boundaries.md) | History is opt-in; only licensed third-party material ships |
