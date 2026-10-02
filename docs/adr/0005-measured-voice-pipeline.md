# ADR-0005: A measured voice pipeline, with a route per persona

- Status: Accepted (owner decision, 2026-10-02)
- Date: 2026-10-02

## Context

The original voice was Creative's SBTALKER (First Byte "Monologue") played
through an 8-bit Sound Blaster DAC. v1.x approximated it with guesses: a 64-level
bit crush applied everywhere, playback at 1.1x (which raises the pitch), random
noise "aliasing", and filters set above the Nyquist limit where they did nothing.
Bundling SBTALKER itself is not an option, and modern TTS cannot be asked to sound
like it.

## Decision

- Gemini TTS produces the speech; the browser reshapes it with values measured
  from recordings of the original (`ref-docs/02-voice-and-audio.md`):
  resampling to 8475 Hz, unsigned 8-bit quantisation, sample-and-hold playback,
  an 80 Hz to 3.8 kHz band with a -8 dB high shelf, and LPC resynthesis on a flat
  pitch near 92 Hz with an end fall or rise taken from the sentence's punctuation
  (`src/utils/vintageAudioProcessing.ts`, `src/utils/lpcMonotone.ts`).
- Playback is always 1.0x. Audio modes choose how much of the chain applies.
- Each persona has a processing route (`processing` in `CHARACTERS`): `sbaitso`
  (the chain above), `hal` and `wopr` (chains from their own acoustic research,
  `src/utils/personaVoices.ts`), and `clean` for ELIZA and PARRY. Each persona
  also has its own TTS voice, style text and casing.
- Style text describes qualities only; it never names a performer or a film
  character.

## Consequences

- Changes to the chain are made against the measurements, not by ear; tests pin
  frequencies, levels and timing on synthetic signals, and CPU-time budgets keep
  the chains fast.
- The result is an approximation of the original, not the original; nobody has
  yet listened to the persona routes against references. That listening check is
  open in `to-dos/faithfulness.md`.
- Gemini's voice and timing vary between model versions, so the chain's input is
  not fixed.
