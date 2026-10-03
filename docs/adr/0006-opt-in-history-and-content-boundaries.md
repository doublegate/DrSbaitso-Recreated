# ADR-0006: Opt-in history, and what third-party material may ship

- Status: Accepted (owner decisions, 2026-10-02)
- Date: 2026-10-02

## Context

Two related questions came up while repairing v1.x features.

**History.** The original's greeting says "MEMORY CONTENTS WILL BE WIPED OFF
AFTER YOU LEAVE". v1.x promised session saving but never saved anything, so
search, replay and insights were always empty.

**Content.** Faithfulness pulls towards shipping original material: the SBTALKER
engine, film audio, the 1966 ELIZA script, PARRY's source, the IBM VGA font.

## Decision

**History is off by default.** "SAVE HISTORY" in Enhanced mode turns it on;
conversations are then kept in this browser and feed search, replay and insights.
Turning it off erases them. Cloud sync uploads only kept history, so nothing
leaves the browser while it is off.

**Shipped third-party material is limited to what is licensed for it:**

| Material | Decision |
|---|---|
| IBM VGA 9x16 font | Bundled, CC BY-SA 4.0, credited in `THIRD_PARTY_NOTICES.md` |
| ELIZA 1965 DOCTOR script | Bundled, public domain (CC0) |
| ELIZA 1966 CACM script | Not shipped (ACM copyright) |
| PARRY source | Not used; the engine is reimplemented from the published papers |
| SBTALKER / Monologue engine | Not shipped; measured, then approximated |
| Film audio and dialogue | Not shipped; only short quotes (under 15 words) in prompts and docs |
| Original program binaries | Run in an emulator for research only; never committed |

The project itself is MIT-licensed (`LICENSE`).

## Consequences

- The default matches the original's promise and needs no consent dialog.
- Some features are empty until history is turned on; their panels say so.
- Faithfulness has limits set by licensing; where the original material is not
  available, the documents in `ref-docs/` record how the approximation was made.
