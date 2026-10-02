# Audio System Documentation

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
| HAL 9000 | Algieba | sentence case | `hal` | HAL chain |
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

`useSpeechPlayer(mode).speak(audio, text, { processing })` defaults to `'sbaitso'`. Enhanced
mode should pass `usePersona().voiceProcessing`; Classic mode stays on `'sbaitso'`.

## Core Audio Functions

### decode(base64: string): Uint8Array

Converts base64-encoded audio data to raw bytes with `atob()`.

### decodeAudioData(): AudioBuffer

```typescript
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
  audioMode?: 'modern' | 'subtle' | 'authentic' | 'ultra',
  endPunctuation: '.' | '?' | '!' | null = null,
  options: { processing?: 'sbaitso' | 'clean' | 'hal' | 'wopr'; text?: string } = {}
): Promise<AudioBuffer>
```

Strips a RIFF/WAVE header if present and converts little-endian PCM16 to Float32
(`int16 / 32768`). Then, by route: `sbaitso` (the default) applies the vintage chain for any
mode other than `modern`; `clean` applies nothing; `hal` and `wopr` apply their chains in every
mode.

### playAudio(): Promise<void>

```typescript
export function playAudio(
  buffer: AudioBuffer,
  ctx: AudioContext,
  bitDepth: number = 0,      // quantisation levels; 0 disables the crusher
  playbackRate: number = 1,  // above 1 raises pitch as well as speed
  useWorklet: boolean = true,
  onStart?: (source: AudioBufferSourceNode) => void
): Promise<void>
```

Plays the buffer through a `BufferSourceNode`. With `bitDepth > 0` it inserts a bit-crusher
(AudioWorklet `bit-crusher-processor`, or a `ScriptProcessorNode` fallback) that rounds each
sample to `bitDepth` levels. No speech mode uses it any more: the vintage chain already
quantises to the original's full 8 bits. Nodes are disconnected when playback ends, and the
promise resolves then.

## Sound Effects

### playGlitchSound(): White Noise

Not authentic: the original's "parity error" glitch was spoken text, with no noise burst
(`ref-docs/02-voice-and-audio.md` section 5).

Triggered when response contains "PARITY CHECKING" or "IRQ CONFLICT".

```typescript
export function playGlitchSound(ctx: AudioContext): void
```

**Implementation:**

```typescript
const bufferSize = ctx.sampleRate * 0.2; // 200ms
const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
const output = buffer.getChannelData(0);

for (let i = 0; i < bufferSize; i++) {
  output[i] = Math.random() * 2 - 1; // Random [-1.0, 1.0]
}
```

**White Noise Generation:**
- Random samples uniformly distributed in [-1.0, 1.0]
- Contains all frequencies equally
- Mimics hardware glitch/static

**Volume Envelope:**
```typescript
const gainNode = ctx.createGain();
gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
```

**Envelope Shape:**
```
Volume
  0.3 ┤━╮
      │ ╲
      │  ╲
      │   ╲___
  0.0 ┤───────╲───
      0ms    200ms
```

- Starts at 30% volume (0.3)
- Exponentially fades to near-zero (0.001) over 200ms
- Prevents harsh cutoff

### playErrorBeep(): Square Wave

Triggered on API errors or failures.

```typescript
export function playErrorBeep(ctx: AudioContext): void
```

**Implementation:**

```typescript
const oscillator = ctx.createOscillator();
const gainNode = ctx.createGain();

oscillator.type = 'square';
oscillator.frequency.setValueAtTime(300, ctx.currentTime);

gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
```

**Square Wave Properties:**
- **Frequency:** 300 Hz (low, jarring pitch)
- **Waveform:** Square (harsh, 8-bit character)
- **Duration:** 300ms

**Square Wave Visualization:**
```
Amplitude
  1.0 ┤━━╮  ╭━━╮  ╭━━
      │  │  │  │  │
  0.0 ┤  ╰━━╯  ╰━━╯
 -1.0 ┤
      ├──────────────
      0ms        33ms
      (300 Hz = 3.33ms period)
```

**Why Square Wave?**
- PC speaker only produced square waves
- Authentic retro beep sound
- High harmonic content (aggressive tone)

## AudioContext Management

### ensureAudioContext()

Singleton pattern for AudioContext lifecycle.

```typescript
const ensureAudioContext = () => {
  if (!audioContextRef.current) {
    try {
      audioContextRef.current = new (window.AudioContext ||
                                      (window as any).webkitAudioContext)
                                     ({ sampleRate: 24000 });
    } catch (e) {
      console.error("Could not create AudioContext:", e);
    }
  }
};
```

**Why Singleton?**
- AudioContext creation is expensive
- Browser limits concurrent contexts (6 in Chrome)
- Maintains consistent sample rate across sessions

**Sample Rate: 24 kHz**
- Matches Gemini TTS output (24,000 Hz)
- Lower than CD quality (44.1 kHz)
- Contributes to retro sound aesthetic

**Browser Compatibility:**
- Standard: `window.AudioContext`
- Safari fallback: `window.webkitAudioContext`

### Autoplay Policy Compliance

Modern browsers block audio without user interaction.

**Strategy:**
```typescript
if (ctx.state === 'suspended') {
  ctx.resume();
}
```

**User Interaction Triggers:**
- Name submission (handleNameSubmit)
- Message submission (handleUserInput)

**State Transitions:**
```
Initial: AudioContext.state = 'suspended'
   ↓ (user clicks/presses Enter)
ensureAudioContext() → new AudioContext()
   ↓
AudioContext.state = 'running' or 'suspended'
   ↓ (if suspended)
ctx.resume()
   ↓
AudioContext.state = 'running'
   ↓
Audio plays successfully
```

## Performance Characteristics

### Memory Usage

**Per Audio Playback:**
- AudioBuffer: ~48KB per second of audio
- ScriptProcessorNode: 2048 samples × 4 bytes = 8KB buffer
- Total: ~56KB per active playback

**Greeting Sequence:**
- 7 pre-generated AudioBuffers stored in state
- ~7 × 2 seconds × 48KB = ~672KB total
- Released after greeting completes

### CPU Usage

**Vintage processing (offline, before playback):**
- Runs once per utterance on the decoded buffer, O(n) per stage
- About 20 ms for 5 s of speech in the Authentic chain (Node, desktop CPU), most of it in the
  LPC stage

**Bit-crusher (only when `bitDepth > 0`; no speech mode uses it):**
- 2048 samples per callback
- At 24 kHz: 2048/24000 = 85ms interval
- ~12 callbacks per second
- Minimal CPU impact (<1% on modern hardware)

**Quantization Algorithm:**
- O(n) per buffer (n = 2048)
- Simple arithmetic operations
- No complex DSP

### Latency

**Total Audio Latency:**
1. TTS API call: 500-1500ms (network dependent)
2. Base64 decode: <1ms
3. AudioBuffer creation: <10ms
4. Playback start: <5ms
5. **Total: ~515-1515ms**

**Mitigation Strategy:**
- Typewriter effect masks TTS latency
- Parallel audio generation during typing
- Pre-generation for greeting sequence

## Browser Compatibility

### Supported Browsers

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 88+ | Full support |
| Firefox | 85+ | Full support |
| Safari | 14+ | Requires webkitAudioContext |
| Edge | 88+ | Full support (Chromium) |

### Known Issues

#### ScriptProcessorNode Deprecation

⚠️ **Warning:** ScriptProcessorNode is deprecated in favor of AudioWorklet.

**Current Status:**
- Still supported in all major browsers
- No removal timeline announced
- Works reliably for this use case

**Future Migration Path:**
```typescript
// Current (deprecated)
const bitCrusher = ctx.createScriptProcessor(2048, 1, 1);
bitCrusher.onaudioprocess = function(e) { ... };

// Future (AudioWorklet)
await ctx.audioWorklet.addModule('bit-crusher-processor.js');
const bitCrusher = new AudioWorkletNode(ctx, 'bit-crusher');
```

**Migration Benefits:**
- Runs on separate audio thread (no main thread blocking)
- Better performance
- Lower latency

#### Mobile Safari Issues

**Autoplay Policy:**
- Stricter than desktop browsers
- Requires explicit user tap (not programmatic)
- May require retry on first playback

**Sample Rate:**
- iOS defaults to 48 kHz regardless of request
- May need resampling for consistent behavior

#### Memory Leaks

**ScriptProcessorNode:**
- Does not garbage collect if not disconnected
- Must call `disconnect()` after use
- Current implementation handles this correctly

## Testing Audio System

### Manual Testing

```typescript
// Test basic playback
const ctx = new AudioContext({ sampleRate: 24000 });
const testBuffer = ctx.createBuffer(1, 24000, 24000); // 1 second silence
await playAudio(testBuffer, ctx);

// Test bit-crusher effect
const data = new Uint8Array(48000); // 1 second of audio
const buffer = await decodeAudioData(data, ctx, 24000, 1);
await playAudio(buffer, ctx); // Should hear quantization artifacts

// Test glitch sound
playGlitchSound(ctx); // Should hear 200ms white noise

// Test error beep
playErrorBeep(ctx); // Should hear 300ms square wave beep
```

### Expected Audio Quality

✅ **Correct Behavior (Authentic):**
- Dark, band-limited voice with a faint metallic edge (sample-and-hold images)
- Pitch held flat on each syllable, stepping between syllables
- Falls at the end of a statement, rises at the end of a question
- Same speed as the TTS (no 1.1x speed-up)

❌ **Incorrect Behavior:**
- Audio sounds identical to source
- No distortion or artifacts
- Smooth, modern speech synthesis
- Silent or no playback

## Advanced Topics

### Bit Depth Comparison

| Bit Depth | Levels | Step Size | Use Case |
|-----------|--------|-----------|----------|
| 1-bit | 2 | 1.0 | Extreme lo-fi |
| 4-bit | 16 | 0.125 | Heavy distortion |
| 6-bit | 64 | 0.031746 | Former (unsupported) "authentic" setting |
| **8-bit** | **256** | **0.0078125** | **Dr. Sbaitso: unsigned 8-bit at 8475 Hz** |
| 16-bit | 65,536 | 0.000015 | CD quality |

### Effects now implemented

Sample-rate reduction with sample-and-hold, the low-pass output filter and pitch flattening are
now part of the vintage chain (see "Processing pipeline" above).

## Future Enhancements

1. **Validation:** Compare rendered F0 and band levels with `ref-docs/02-voice-and-audio.md`
   sections 3.2-3.3 (checklist in section 7.6)
2. **Per-sentence intonation:** one contour per sentence rather than per TTS call
3. **Original-engine mode:** optional, bring-your-own `SBTALKER.EXE` emulation
4. **Audio Caching:** Store generated audio in IndexedDB
5. **Streaming Support:** Real-time audio processing for longer responses
6. **Visualization:** Waveform display with quantization levels
