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
- [x] "PARITY CHECKING" and "IRQ CONFLICT AT ADDRESS 220H" never appear in the original.
      The real glitch is "PARITY ERR ... RECOVERED / PHEW! THAT WAS CLOSE!", triggered
      by swearing. Fix in `src/constants.ts`, `src/App.tsx` (`GLITCH_PHRASES`) and
      `src/utils/retroErrors.ts`. (Done in `src/constants.ts`, `src/utils/retroErrors.ts`
      and `src/utils/sessionManager.ts`; Enhanced mode's glitch check in
      `src/hooks/useChatPipeline.ts` now uses the engine's `isParityText`.)
      DOSBox (ref-docs/04) showed the real sequence is a flood of `PARITY ERR ...  <n>`
      lines, then `RECOVERED` and `PARITY`; PHEW!/YOU ARE BAD never appeared. The engine
      and the classic screen now do that.
- [x] Gemini honours `speechMetadata.style` in `generateContent`. Tested 2026-10-02 on
      `gemini-3.8-flash-tts` with the same sentence:

      | Style | Duration | Level |
      |---|---|---|
      | none | 4.84 s | -19.8 dB |
      | "whisper, very slow" | 7.04 s | -34.3 dB |
      | "shout, very fast" | 2.96 s | -16.8 dB |

      The old inline "Say in ...:" prefix ran 13.92 s, so on 3.x it is most likely
      spoken aloud as part of the text. Keep the prefix for 2.5 models only, as
      `api/_lib/gemini.ts` does.

## Behaviour (decided: hybrid engine)

Decided: **hybrid** engine. `src/engine/sbaitso/` answers the original's commands and
canned cases locally; everything else goes to Gemini. Items ticked below are done in
that module; wiring it into `src/App.tsx` is still pending.

- [x] Local command parser before the model: `HELP` (3 pages), `R` (repeat), `SAY`,
      `CALC`, `AUTHOR`, `SHUT UP`, and dot commands such as `.PITCH 0-9`, `.SPEED`,
      `.TONE`, `.VOLUME`, `.PARAM`, `.COLOR` and `.WIDTH 40/80`. (Engine done; UI
      integration pending.)
- [x] Deterministic handlers: empty Enter (random replies, including the literal
      `ENTER`), short or garbage input, repeated input, the profanity group ending in
      the parity flood. (Engine done and wired into the classic screen; order and
      wording corrected from ref-docs/04.)
- [x] Persona prompt rebuilt from the original's register (its real lines, spelled-out
      initialisms such as "C P U") instead of invented catchphrases.
- [ ] Name entry: letters and spaces only, a length limit, each letter spoken as it is
      typed, and "Doctor Sbaitso" spoken first. (Rules done: `validateName`,
      `isNameCharAllowed`, `NAME_ERROR_TEXT`; the limit of 20 is a guess. The spoken
      title is done when audio is already unlocked; per-letter speech is open.)
- [x] Exit: `BYE` / `QUIT` / `.QUIT` → `<C>ontinue <N>ew patient <Q>uit` on the next
      row. (Classic screen: C continues, N re-asks the name without the intro, Q leaves
      the banner above a `C:\SB>` prompt.)
- [x] Opt-in "Keep session history" setting (off by default), shipped as "SAVE HISTORY" in Enhanced mode.

## Screen (decided: classic default + enhanced toggle)

- [ ] An 80x25 DOS text screen: `#0000AA` background, white text, `#FFFF55` prompt and
      title, a box-drawn banner, and the IBM VGA font (VileR, CC BY-SA 4.0, attribution
      required).
- [x] Mixed-case `Please enter your name ...` on row 6; one-space indent on the
      greeting only; text printed a line at a time, then spoken; blinking underline
      cursor (114 ms on, 114 ms off).

## DOSBox corrections (ref-docs/04, 2026-10-02)

Applied to the classic screen and `src/engine/sbaitso/`:

- [x] Whole lines, each printed then spoken; the next line waits for the speech. One
      TTS request per reply; line times are estimated from each line's share of the
      characters (`src/utils/speechCues.ts`), not measured.
- [x] A keypress cuts the speech; the remaining lines print unspoken, the key is typed
      ahead.
- [x] Parity flood (about 250 lines in 3.5 s, `???` part-way, `RECOVERED`, `PARITY`)
      with a falling 1 kHz to 0.7 kHz tone; seeded, so tests are deterministic.
- [x] Profanity group order, ending in the garbled warning and then the flood.
- [x] `.QUIT` says `GOOD BYE <NAME>` and shows the menu; bare `QUIT` shows the menu;
      bare `EXIT` gets a short-input reply.
- [x] Exit menu on the row after the goodbye, no cursor, not spoken; C/N/Q as observed.
- [x] Empty Enter: random from the group, including `ENTER`; no escalation.
- [x] `User>` / `Computer:` only under `.PROMPT ON`; `.PROMPT OFF` prints an empty
      `Computer:` line. CALC prints ` =  5`; `WHAT IS 12*4` prints `12*4 =  48`.
- [x] Replies at column 0; turn = yellow input line, reply, blank row, `>`; no blank
      row after `R` or after an age question; dot commands print nothing.
- [x] Banner pinned, rows 5-23 scroll, row 24 never written.
- [x] Cursor 114 ms on / 114 ms off, shown only while waiting at `>`.
- [x] Startup speech "Doctor Sbaitso", "by Creative Labs", then the name prompt, in one
      TTS request.

Still open:

- [ ] The very first start is silent: browsers block audio until a user gesture, so the
      spoken intro only plays when audio is already unlocked (a restart after Q).
- [x] An Enter pressed while the doctor speaks is taken as the next input when the
      prompt returns, as the original consumes it.
- [x] HELP page 1 clears the whole screen, banner included; pages 2 and 3 redraw the
      banner and replace the rows below it.
- [x] `.WIDTH` and `.COLOR` clear the area below the banner and restart at row 6.
- [ ] Each letter of the name is spoken as it is typed.
- [x] Enhanced-mode toggle that restores the toolbar, panels and persona selector (Alt+Shift+X, `?mode=`).

## Personas

Enhanced-mode personas, from `ref-docs/07-hal-9000.md` and `ref-docs/08-joshua-wopr.md`.
Voices and audio for HAL and JOSHUA are tracked separately (`ref-docs/09`).

- [x] HAL prompt: sentence case, courteous, first name, 1-3 sentences, never admits
      error, apologises before refusing, gentler under stress (ref-docs/07 8.1).
- [x] JOSHUA prompt: caps terminal register, PROFESSOR FALKEN, games, chess over
      war, which side, "WHAT'S THE DIFFERENCE?"; the conclusion gated on
      `LESSON=LEARNED` (ref-docs/08 8.1).
- [x] HAL's replies show in sentence case on screen (checked in Chromium on
      2026-10-02: a mixed-case reply is displayed unchanged, `text-transform: none`).

- [x] JOSHUA local engine (`src/engine/joshua/`): `LOGON:`, greeting as PROFESSOR
      FALKEN, `LIST GAMES` / `HELP GAMES`, GLOBAL THERMONUCLEAR WAR to chess offer to
      side menu, tic-tac-toe against the user, zero-player self-play lesson that sets
      `learnedFutility`.
- [x] Wire `joshuaRespond` into `EnhancedApp.tsx` (via `engine/personaTurn.ts`):
      starts at `LOGON:`, sends `modelMessage`, boards print in the monospace log.
- [x] HAL local layer (`src/engine/hal/`): one pod-bay refusal per session,
      "I'm sorry, <name>" refusals of disconnect requests, and a `shutdown` ending
      (plea, regression, "Daisy Bell") on the third request.
- [x] Wire `halRespond` into `EnhancedApp.tsx`: sends `modelMessage`; input is
      ignored once offline.
- [x] Apply the Eltro-style slow-down to HAL's shutdown speech: `halShutdownRamp` from where
      the song starts (pitch about an octave down, tempo to a quarter, 1.5 s fade).
- [ ] (Optional) Animate the self-play games from `result.games` instead of printing
      the summary lines at once.

## Voice (decided: measured pipeline + LPC pitch flattening)

- [x] Vintage pipeline at 8,475 Hz unsigned 8-bit, 80 Hz-3.8 kHz band, a -8 dB high
      shelf, and sample-and-hold resampling.
- [x] Flattening pitch per syllable (LPC resynthesis): the biggest remaining gap, and
      the largest piece of work.
- [ ] (Later, not this release) Optional "bring your own `SBTALKER.EXE`" emulation
      mode. The original engine remains First Byte copyright, so it could never be
      bundled.

## Personas

Voices from [ref-docs/05](../ref-docs/05-eliza.md), [06](../ref-docs/06-parry.md),
[07](../ref-docs/07-hal-9000.md), [08](../ref-docs/08-joshua-wopr.md) and
[09](../ref-docs/09-hal-and-wopr-voices.md). Details: `docs/AUDIO_SYSTEM.md`.

- [x] Per-persona Gemini voice and delivery style instead of the global voice profile
      (Charon) for everyone: HAL Alnilam, JOSHUA Iapetus, ELIZA Kore, PARRY Orus.
      Voice profiles now apply to Dr. Sbaitso only. Styles never name a performer.
- [x] Sentence case to TTS for HAL, JOSHUA, ELIZA and PARRY (display unchanged).
- [x] HAL pronounced as a word ("Hal"), not "H-A-L"; AE-35 spelled for speech.
- [x] HAL chain: breath gate, pitch-preserving slow-down to 4.3-4.7 syl/s, 50 Hz
      high-pass, +2 dB at 150 Hz, gentle compression; no crush, resample or LPC.
- [x] WOPR chain: per-word flat LPC pitch (90/79/68 Hz, final 128/79/105 Hz),
      spliced 80/110/250 ms gaps, even word loudness, 220 Hz-3.8 kHz band.
- [x] ELIZA and PARRY play clean in every audio mode.
- [x] HAL "shutdown" effect (independent pitch and tempo ramps) as a pure function.
- [x] Wire the routes into `src/EnhancedApp.tsx`: both `speech.speak` calls (greeting
      and reply) pass `usePersona().voiceProcessing`. Classic mode stays `sbaitso`.
- [x] HAL: 10 voices on two models A/B'd by ear (2026-10-03) and measured against
      ref-docs/09 section 7 (`scripts/render-hal-samples.ts`); Alnilam chosen, with the
      session-direction style. Measured raw: 102 Hz median, 3.1 st SD, question end
      +0.7 st; faster than the film (about 7 syl/s against 4.3-4.7).
- [ ] The owner listened to all personas on the preview (2026-10-02) and found them
      "pretty good"; JOSHUA (Schedar, Orus, Charon) and PARRY (Algenib) alternatives are
      still not A/B'd.
- [ ] Measure rendered output against ref-docs/09 section 7 (HAL median F0 90-110 Hz,
      SD 1.5-2.8 st, level questions; WOPR band and gaps on real TTS).
- [ ] Optional: ELIZA `?` in the TTS text for interrogative replies; PARRY style by
      affect (Fear/Anger) once the PARRY engine exists; HAL shutdown easter egg;
      JOSHUA terminal colours and print blips.
