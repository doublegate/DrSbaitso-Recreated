# ADR-0004: The classic 80x25 screen by default, Enhanced on request

- Status: Accepted (owner decision, 2026-10-02)
- Date: 2026-10-02

## Context

The app had grown a modern toolbar UI with about twenty features (personas,
themes, visualisers, export, sound packs, voice control). None of it resembled
the 1990-1992 program the project is named after, and the goal set for v2 was
faithfulness to the original. Removing the features was ruled out ("keep
everything, fix it").

## Decision

- The default screen is a faithful 80x25 VGA text-mode recreation
  (`src/components/classic/`): the v2.20 banner, the bundled IBM VGA 9x16 font, the
  original palette, layout, cursor and timing as measured in DOSBox
  (`ref-docs/04-dosbox-verification.md`). It talks only to Dr. Sbaitso.
- Everything else lives in Enhanced mode (`src/EnhancedApp.tsx`), including the
  persona selector. Alt+Shift+X, `?mode=enhanced|classic` and a link on each screen
  switch between them; the choice is remembered in `localStorage`
  (`sbaitso_ui_mode`).

## Consequences

- First impressions match the original; no feature was removed.
- Two UIs share the services, audio and engines but have separate tests (unit,
  integration and e2e for each).
- The classic screen needs its own accessibility work: a hidden input carries
  keyboard and mobile typing, and a screen-reader transcript mirrors the text grid.
- Some original behaviours remain open (listed in `to-dos/faithfulness.md`), for
  example speaking each letter of the name as it is typed.
