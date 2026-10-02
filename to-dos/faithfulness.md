# Faithfulness to the original

Findings from `ref-docs/` (sourced from the v1.01 `SBAITSO.EXE` and v2.20 `SBAITSO2.EXE`
binaries on archive.org, Creative's `SBTALKER.EXE` measured under emulation, and First
Byte's patents). Everything else is a factual correction to make either way.

## Owner decisions (2026-10-02)

| Topic | Decision |
|---|---|
| Screen | **Classic 80x25 screen by default**, plus an "Enhanced" toggle that restores the toolbar, panels and modern extras |
| Engine | **Hybrid**: a local parser for the original commands and deterministic cases (empty, repeated and garbage input, profanity, the parity sequence, the exit flow); Gemini for open conversation, with a prompt in the original's register |
| Sessions | **Opt-in** "Keep session history" (off by default, honouring "MEMORY CONTENTS WILL BE WIPED OFF") |
| Voice | **Measured pipeline plus pitch flattening (LPC) in this release** |
| License | **MIT** |
| Verification | Run the archived original **inside DOSBox only**; captures stay in the scratchpad, never committed |
| Personas | Classic is Dr. Sbaitso only; **the persona selector lives in Enhanced mode** |
| Font | **Bundle the IBM VGA web font** (VileR, CC BY-SA 4.0) with its licence and credit |

## Facts to correct (no decision needed)

- [ ] Dates: the program shipped in 1990 (v1.01) and 1992 (v2.20). Fix "1991" in the
      README, the persona prompt and the docs. ([ref-docs/01](../ref-docs/01-history-and-behavior.md))
- [x] Speech engine: First Byte **SmoothTalker 3.5**, which stores single pitch periods
      of a real voice. `docs/DECTALK_RESEARCH.md` calls it rule-based and sample-free.
      ([ref-docs/02](../ref-docs/02-voice-and-audio.md))
- [x] Pronunciation: "SBAYT-so", not "SUH-BAIT-SO" (`api/_lib/gemini.ts`). Spell out
      "DOCTOR", not "DR.".
- [x] `playbackRate` 1.1 raises pitch by 10%; it does not deepen the voice. Use 1.0 for
      the authentic modes (`src/utils/audio.ts`).
- [x] The Authentic preset's 5 kHz high cut has no effect; the original sits under a
      roughly 4 kHz ceiling at 8,475 Hz (`src/utils/vintageAudioProcessing.ts`).
- [x] `pitchVarianceReduction` is never read by any code: implement or remove it.
- [ ] "PARITY CHECKING" and "IRQ CONFLICT AT ADDRESS 220H" never appear in the original.
      The real glitch is "PARITY ERR ... RECOVERED / PHEW! THAT WAS CLOSE!", triggered
      by swearing. Fix in `src/constants.ts`, `src/App.tsx` (`GLITCH_PHRASES`) and
      `src/utils/retroErrors.ts`. (Done in `src/constants.ts`, `src/utils/retroErrors.ts`
      and `src/utils/sessionManager.ts`; `App.tsx` should switch `GLITCH_PHRASES` to the
      engine's `isParityText` / `PARITY_TRIGGER_LINES` during integration.)
- [ ] Check whether Gemini honours `speechMetadata.style` in `generateContent` (A/B test
      with an extreme style). If it doesn't, the voice styles do nothing.

## Behaviour (decided: hybrid engine)

Decided: **hybrid** engine. `src/engine/sbaitso/` answers the original's commands and
canned cases locally; everything else goes to Gemini. Items ticked below are done in
that module; wiring it into `src/App.tsx` is still pending.

- [x] Local command parser before the model: `HELP` (3 pages), `R` (repeat), `SAY`,
      `CALC`, `AUTHOR`, `SHUT UP`, and dot commands such as `.PITCH 0-9`, `.SPEED`,
      `.TONE`, `.VOLUME`, `.PARAM`, `.COLOR` and `.WIDTH 40/80`. (Engine done; UI
      integration pending.)
- [x] Deterministic handlers: empty Enter (escalating nags), short or garbage input,
      repeated input, profanity strikes ending in the parity sequence. (Engine done;
      UI integration pending.)
- [x] Persona prompt rebuilt from the original's register (its real lines, spelled-out
      initialisms such as "C P U") instead of invented catchphrases.
- [ ] Name entry: letters and spaces only, a length limit, each letter spoken as it is
      typed, and "Doctor Sbaitso" spoken first. (Rules done: `validateName`,
      `isNameCharAllowed`, `NAME_ERROR_TEXT`; the limit of 20 is a guess. Per-letter
      speech and the spoken title are UI work.)
- [x] Exit: `BYE` → `GOOD BYE` → `<C>ontinue <N>ew patient <Q>uit`. (Wired into the classic screen: C/N/Q keys, Q quits to a `C:\SB>` prompt.)
- [x] Opt-in "Keep session history" setting (off by default), shipped as "SAVE HISTORY" in Enhanced mode.

## Screen (decided: classic default + enhanced toggle)

- [ ] An 80x25 DOS text screen: `#0000AA` background, white text, `#FFFF55` prompt and
      title, a box-drawn banner, and the IBM VGA font (VileR, CC BY-SA 4.0, attribution
      required).
- [ ] Mixed-case `Please enter your name ...` on row 6; one-space indent; text printed a
      line at a time, then spoken; blinking underline cursor.
- [ ] Enhanced-mode toggle that restores the toolbar, panels and persona selector.

## Voice (decided: measured pipeline + LPC pitch flattening)

- [x] Vintage pipeline at 8,475 Hz unsigned 8-bit, 80 Hz-3.8 kHz band, a -8 dB high
      shelf, and sample-and-hold resampling.
- [x] Flattening pitch per syllable (LPC resynthesis): the biggest remaining gap, and
      the largest piece of work.
- [ ] (Later, not this release) Optional "bring your own `SBTALKER.EXE`" emulation
      mode. The original engine remains First Byte copyright, so it could never be
      bundled.
