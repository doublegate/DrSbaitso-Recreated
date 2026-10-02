# Faithfulness to the original

Findings from `ref-docs/` (sourced from the v1.01 `SBAITSO.EXE` and v2.20 `SBAITSO2.EXE`
binaries on archive.org, Creative's `SBTALKER.EXE` measured under emulation, and First
Byte's patents). Items marked **[decision]** wait on the owner's choice. Everything
else is a factual correction to make either way.

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
      `src/utils/retroErrors.ts`.
- [ ] Check whether Gemini honours `speechMetadata.style` in `generateContent` (A/B test
      with an extreme style). If it doesn't, the voice styles do nothing.

## Behaviour [decision]

- [ ] Local command parser before the model: `HELP` (3 pages), `R` (repeat), `SAY`,
      `CALC`, `AUTHOR`, `SHUT UP`, and dot commands such as `.PITCH 0-9`, `.SPEED`,
      `.TONE`, `.VOLUME`, `.PARAM`, `.COLOR` and `.WIDTH 40/80`.
- [ ] Deterministic handlers: empty Enter (escalating nags), short or garbage input,
      repeated input, profanity strikes ending in the parity sequence.
- [ ] Persona prompt rebuilt from the original's register (its real lines, spelled-out
      initialisms such as "C P U") instead of invented catchphrases.
- [ ] Name entry: letters and spaces only, a length limit, each letter spoken as it is
      typed, and "Doctor Sbaitso" spoken first.
- [ ] Exit: `BYE` → `GOOD BYE` → `<C>ontinue <N>ew patient <Q>uit`.
- [ ] Session saving vs. the greeting's promise that "MEMORY CONTENTS WILL BE WIPED OFF".

## Screen [decision]

- [ ] An 80x25 DOS text screen: `#0000AA` background, white text, `#FFFF55` prompt and
      title, a box-drawn banner, and the IBM VGA font (VileR, CC BY-SA 4.0, attribution
      required).
- [ ] Mixed-case `Please enter your name ...` on row 6; one-space indent; text printed a
      line at a time, then spoken; blinking underline cursor.
- [ ] Where the modern toolbar and panels live: a separate "enhanced" mode, a menu,
      or kept as they are.

## Voice [decision]

- [x] Vintage pipeline at 8,475 Hz unsigned 8-bit, 80 Hz-3.8 kHz band, a -8 dB high
      shelf, and sample-and-hold resampling.
- [x] Flattening pitch per syllable (LPC resynthesis): the biggest remaining gap, and
      the largest piece of work.
- [ ] Optional "bring your own `SBTALKER.EXE`" emulation mode. The original engine
      remains First Byte copyright, so it could never be bundled.
