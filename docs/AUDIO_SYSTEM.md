# Audio System

## Overview

Speech comes from Gemini TTS as 24 kHz mono PCM16. In the vintage modes it is then reshaped
into the sound of the original Dr. Sbaitso voice: First Byte SmoothTalker 3.5 rendering 8-bit
unsigned audio at 8475 Hz through a Sound Blaster. Every value below comes from measuring the
original engine; the evidence and confidence for each is in
[`ref-docs/02-voice-and-audio.md`](../ref-docs/02-voice-and-audio.md) (sections 3 and 7).

| Mode | What it does |
|---|---|
| `modern` | The TTS audio as delivered. |
| `subtle` | Light compression and a 200 Hz-8 kHz band. A retro feel, not period-accurate. |
| `authentic` (default) | The measured original chain, below, through the SB 1.x's ~3.8 kHz output filter. |
| `ultra` | The same chain through the darker SB Pro 3.2 kHz filter. |

Every mode plays at 1.0x with no extra bit-crush (`getPlaybackSettings`). A `playbackRate`
above 1 resamples and so also raises the pitch; the original's pitch was fixed by the DSP time
constant, not by CPU speed.

## Processing pipeline

```
Gemini TTS: base64 PCM16, 24 kHz mono
  -> decode()                     base64 -> bytes
  -> decodeAudioData()            PCM16 -> Float32 AudioBuffer (WAV header stripped if present)
  -> applyVintageProcessing()     per channel, pure Float32Array stages (vintage modes only):
       1. level compressor        50 ms local RMS pulled towards the overall RMS
       2. anti-alias + resample   8th-order Butterworth at 0.45 x 8475 Hz, then to 8475 Hz
       3. LPC pitch flattening    Authentic/Ultra only (see below)
       4. high shelf              -8 dB from 1.2 kHz: the original's dark "Bass" tone
       5. normalise               RMS ~-17 dBFS, peak at most 0.75 FS, as the original used ~150-180 codes
       6. quantise                unsigned 8-bit: clamp(round(x * 128), -128, 127) / 128
       7. sample-and-hold         back to 24 kHz by repeating samples, like the DAC (no interpolation)
       8. analog stage            80 Hz high-pass, 2nd-order low-pass at 3.8 kHz (Ultra 3.2 kHz)
  -> playAudio(buffer, ctx, 0, 1) BufferSource -> destination
```

The sample-and-hold step deliberately keeps the spectral images at 8475 Hz +/- f, which the
analog low-pass only partly removes. That residue is the plausible physical source of the
"metallic" edge people remember. The old random-noise "aliasing" and one-sample "pre-echo"
effects were removed: neither is something the hardware did.

The pitch stage runs at the engine rate (8475 Hz) rather than before resampling. The result is
the same and it costs about a third as much.

Configuration lives in `AUTHENTICITY_PRESETS` (`src/utils/vintageAudioProcessing.ts`):
`targetSampleRate`, `quantizationLevels`, `lowCutoff`, `highCutoff`, `highShelfGainDb`,
`highShelfFrequency`, `normalizePeak`, `normalizeRms`, `sampleAndHold`,
`volumeVarianceReduction` and `pitchFlattening`.

### LPC pitch flattening (`src/utils/lpcMonotone.ts`)

The original stores one pitch period per phoneme and repeats it, so its pitch is held flat on
each syllable and moves only by rule. Gemini's natural intonation is replaced by source-filter
resynthesis:

1. Analyse 30 ms Hann frames with 50% overlap: autocorrelation, a lag window, Levinson-Durbin
   (order 12) and slight bandwidth expansion, giving one all-pole vocal-tract filter per frame.
2. Decide voicing from frame energy, zero-crossing rate and normalised autocorrelation (60-400 Hz).
3. Build the target contour (`buildPitchContour`): split voiced runs into syllables at energy
   dips, hold each at about 92 Hz with small fixed steps between syllables, then glide over the
   last word to the punctuation target.
4. Excite voiced frames with one continuous pulse train at the target pitch and unvoiced frames
   with seeded noise, filter each frame, match its energy to the input frame and overlap-add.

| Utterance end | Target F0 |
|---|---|
| body (plateau) | ~92 Hz |
| `.` | ~75 Hz |
| `?` | ~150 Hz |
| `!` | ~125 Hz |
| none or `,` | ~97 Hz (level, slight rise) |

The ending comes from the spoken text: `useSpeechPlayer().speak(audio, text)` passes
`endPunctuationOf(text)` to `decodeAudioData(..., mode, endPunctuation)`. Without text the ending
is level. One contour covers one TTS call; the original restarted its intonation at every call of
at most 255 characters.

The output keeps the input length, silence stays silent, and a fixed seed makes it
deterministic. Five seconds of speech take about 20 ms for the whole Authentic chain in Node.

How close this sounds to the original has not been verified by listening against the real
engine; see `ref-docs/02-voice-and-audio.md` section 7.6 for the validation checklist.

## Persona voices and processing routes

Everything above is the Dr. Sbaitso voice. The other personas were never Sound Blaster
programs, so they get their own TTS voice and their own playback route; the audio-mode
selector applies to the `sbaitso` route only. Sources: `ref-docs/05-eliza.md` and
`06-parry.md` (voice sections) and `ref-docs/09-hal-and-wopr-voices.md` (sections 6 and 7).

| Persona | Gemini voice | Text sent to TTS | `processing` | Route in each audio mode |
|---|---|---|---|---|
| Dr. Sbaitso | Charon, or the chosen `VOICE_PROFILES` voice | as written (capitals) | `sbaitso` | `modern`: none; others: vintage chain |
| ELIZA | Kore | sentence case | `clean` | none |
| HAL 9000 | Alnilam | sentence case | `hal` | HAL chain |
| JOSHUA / WOPR | Iapetus | sentence case | `wopr` | WOPR chain |
| PARRY | Orus | sentence case | `clean` | none |
| Custom characters | Charon (fixed) | as written | `sbaitso` | as Dr. Sbaitso |

**Server side** (`api/_lib/gemini.ts` `handleTts`): the persona's `voiceName` and
`voiceStyle` (sent as `speechMetadata.style`) are used. `VOICE_PROFILES` override the voice and
add style only for Dr. Sbaitso, since that feature came from the AI Studio Sbaitso app. For
`ttsCase: 'sentence'`, an all-caps reply is converted by `toSentenceCase` (capitals can be
read as shouting or as letters); known initialisms (CPU, AI, OK, ...) and runs of single spelled
letters ("C P U") stay in capitals, and text that already has lower case is left alone. Then
`applyPronunciation`: HAL as "Hal" (one word, as in the film), AE-35 as "A E thirty-five",
WOPR as "Whopper". Style prompts describe qualities and never name a performer or film
character (ref-docs/09 section 5).

**Client side** (`src/utils/voiceRoutes.ts`): `resolveVoiceRoute(processing, mode)` picks the
route; `decodeAudioData(..., mode, endPunctuation, { processing, text })` applies it. The HAL
and WOPR chains change the length, so they return a new buffer.

### HAL chain (`processHalVoice`, `src/utils/personaVoices.ts`)

HAL was Douglas Rain's voice with the breaths edited out, slowed 10-20% at the same pitch on an
Eltro rate changer. There was no filtering or vocoding, so the chain only trims:

1. Breath gate: 10 ms frames below -45 dBFS that are noise-like (zero-crossing rate above 0.1,
   or below -70 dBFS) are silenced. 5 ms look-ahead, 30 ms hold, 60 ms release; pauses keep
   their length.
2. Tempo: WSOLA time-stretch (`src/utils/timeStretch.ts`: 40 ms frames, 50% overlap, +/-10 ms
   coarse-to-fine search), pitch unchanged. With the spoken text, `halTempoFor` measures the
   syllable rate and slows only above 4.7 syl/s, to 4.5 (never below 0.8); without text the
   factor is 0.88.
3. Tone: 50 Hz high-pass (2nd order), +2 dB low shelf at 150 Hz.
4. Dynamics: soft-knee compressor, threshold -24 dB, ratio 2.5, knee 10 dB, attack 10 ms,
   release 200 ms; then RMS about -16 dBFS with peaks at or below -3 dBFS.
5. No reverb, delay, crush, resampling or LPC.

Not implemented (optional in the doc): pitch-level shift toward 99 Hz, pitch-variance
compression, de-esser, "1968 film" colour.

`halShutdown(samples, sampleRate, u)` is the disconnection effect for later use: pitch
`-12.5 u^1.8` semitones and tempo `1 - 0.75 u^1.2`, applied as WSOLA by tempo/pitch then
resampling by pitch, so the two ramps stay independent (never one `playbackRate` ramp). At
u = 1 a 99 Hz voice ends near 48 Hz and four times as long.

### WOPR chain (`processWoprVoice`, `src/utils/personaVoices.ts`)

WOPR was John Wood reading each word in isolation (in reverse order), spliced back together and
processed. The chain works at 16 kHz:

1. Words: `segmentWords` splits at energy dips at least 12 dB below the loudest frame within
   250 ms on both sides (or below the speech floor), lasting 30 ms or more. With the text's word
   count only the deepest dips are kept; with no dip the speech is divided evenly. Words under
   60 ms merge into a neighbour.
2. Pitch: `planWoprLevels` gives each word one flat F0: 90 Hz, stepping down to 79 or 68 Hz
   every 3rd-5th word (seeded by the words, so a line always sounds the same). The last word is
   128 Hz for "?" (sagging to 122 Hz over the last 60 ms), 79 Hz for ".", 105 Hz for "!", 90 Hz
   otherwise. `lpcResynthesize` (order 18) applies it: voiced frames 85% pulse train and 15% of
   the frame's own LPC residual, unvoiced frames on their residual, so fricatives stay human.
3. Band: per word, 4th-order high-pass at 220 Hz, 4th-order low-pass at 3.8 kHz, +2 dB peak at
   2.5 kHz (Q 1).
4. Splicing: equal word RMS, 5 ms raised-cosine edges, 80 ms gaps; 110 ms after a comma and
   250 ms after a sentence end when the text's words line up with the words found.
5. Back to the input rate, peak -3 dBFS.

Not implemented (optional in the doc): per-word time-stretch to 220-350 ms, the "box"
resonance, the vocoder flavour, per-word TTS (tier B).

### Performance

Measured in Node (vitest, standalone) on 5 s of 24 kHz audio: HAL chain about 27 ms, WOPR chain
about 76 ms, Sbaitso Authentic chain about 28 ms. The tests budget 150 ms of CPU time.

### Integration

`useSpeechPlayer(mode).speak(audio, text, { processing })` (`src/hooks/useSpeechPlayer.ts`)
decodes, processes and plays one clip and resolves when it ends or is stopped.

- **Enhanced mode** passes `usePersona().voiceProcessing` for the greeting and every reply
  (`src/hooks/useChatPipeline.ts`), and the audio mode from the status bar (default
  Authentic; Alt+Shift+Q cycles it). Custom characters use the `sbaitso` route.
- **Classic screen** always uses Dr. Sbaitso's default voice, the `sbaitso` route and
  the Authentic mode. A reply is synthesised in one request, and each line is printed at
  its estimated place in the clip (`cueOffsets` in `src/utils/speechCues.ts`). A key
  press stops the speech; the remaining lines print silently.
- The classic dot commands `.PITCH`, `.SPEED`, `.TONE` and `.VOLUME` are accepted and
  range-checked like the original's, but do not yet change the audio.

## Request to playback

```
browser                         server (api/tts.ts)                     browser
synthesizeSpeech(text, id) ---> persona voice + style, TTS casing,  ---> base64 PCM16, 24 kHz
                                pronunciation, model fallback,           decode() -> decodeAudioData()
                                WAV header stripped, resampled to        route: vintage | hal | wopr | none
                                24 kHz if the model used another rate    playAudio() on the shared context
```

The server contract is fixed: mono PCM16 at 24 kHz (`docs/API.md`). `decodeAudioData` still
strips a RIFF/WAVE header if one arrives.

## Core functions (`src/utils/audio.ts`)

| Function | What it does |
|---|---|
| `decode(base64)` | Base64 to bytes |
| `decodeAudioData(data, ctx, sampleRate, channels, mode?, endPunctuation?, { processing, text })` | PCM16 to an `AudioBuffer` (`int16 / 32768`), then the route: `sbaitso` applies the vintage chain in any mode other than `modern`; `clean` nothing; `hal` and `wopr` their chains in every mode (these change the length, so they return a new buffer) |
| `getPlaybackSettings(mode)` | `{ bitDepth: 0, playbackRate: 1 }` for every mode |
| `playAudio(buffer, ctx, bitDepth, playbackRate, useWorklet, onStart)` | Plays through a `BufferSource`. With `bitDepth > 0` it inserts a bit-crusher (AudioWorklet `bit-crusher-processor` from `public/audio-processor.worklet.js`, or a `ScriptProcessorNode` fallback). No speech mode uses it. Nodes are disconnected when playback ends. `onStart` receives the source, which the audio visualizer and "stop audio" use. |
| `playParityTone(ctx, seconds)` | The classic screen's parity buzz: a square wave falling from about 1 kHz to about 0.7 kHz under the `PARITY ERR` flood (measured in DOSBox, `ref-docs/04-dosbox-verification.md` section 4) |
| `playGlitchSound(ctx)` | Enhanced mode only: a 200 ms noise burst when a reply contains the original's parity text. Not something the original did. |
| `playErrorBeep(ctx)` | Enhanced mode only: a 300 Hz square beep for 300 ms when a reply fails |

## The shared AudioContext (`src/utils/sharedAudio.ts`)

There is one `AudioContext` for the page, created lazily at the device's native rate and
never closed. Speech, the interface sound effects (`src/utils/soundEffects.ts`), sound
packs (`src/utils/soundPackPlayer.ts`) and the music engine all use it.

- `ensureAudioReady()` resumes the context (browsers start it suspended until a user
  gesture) and loads the bit-crusher worklet once; if the worklet cannot load,
  `playAudio` falls back to a `ScriptProcessorNode`.
- Enhanced mode calls it on name submission and on every send. On the classic screen,
  speech starts once the context is running: the very first start is silent until you
  type, and later starts (after Q and Enter) say "Doctor Sbaitso, by Creative Labs".
- `peekSharedAudioContext()` reports whether audio is unlocked without creating a
  context (which would trigger the browser's autoplay warning).

The 24 kHz speech buffers are resampled by the browser to the context's rate on playback.

## Other sounds

| Source | Where | Notes |
|---|---|---|
| Interface sounds | SOUND > Sound settings (Alt+Shift+S) | Procedural key clicks, beeps, boot sounds and ambience in four styles (DOS PC, Apple II, Commodore 64, modern synth); settings in localStorage |
| Sound packs | SOUND > Sound packs (Alt+Shift+P) | User-supplied sounds on app events; see [SOUND_PACKS_GUIDE.md](SOUND_PACKS_GUIDE.md) |
| Background music | SOUND > Music player (Alt+Shift+M) | Procedural chiptune; see [MUSIC_MODE.md](MUSIC_MODE.md) |

All three are Enhanced-mode features; the classic screen plays only speech and the parity
buzz.

## Testing

The chains are pure functions on `Float32Array`, so they are tested without an
`AudioContext` on synthetic signals: frequencies, levels, lengths, determinism and
CPU-time budgets (`test/utils/vintageAudioProcessing.test.ts`, `lpcMonotone.test.ts`,
`personaVoices.*.test.ts`, `audio.test.ts`). See [TESTING.md](TESTING.md).

To listen, run `npm run dev`, open Enhanced mode, and switch the audio mode in the status
bar (Alt+Shift+Q). Authentic should sound dark and band-limited with a faint metallic
edge, the pitch held flat on each syllable, falling at the end of a statement and rising
at a question, at the same speed as the TTS.

## Open work

- Listening validation against the original (`ref-docs/02-voice-and-audio.md` section
  7.6) and of the persona routes; tracked in `to-dos/faithfulness.md`.
- One pitch contour per sentence rather than per TTS call.
- The classic voice dot commands (`.PITCH`, `.SPEED`, `.TONE`, `.VOLUME`) have no audible
  effect yet.
