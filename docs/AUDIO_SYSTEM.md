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
  endPunctuation: '.' | '?' | '!' | null = null
): Promise<AudioBuffer>
```

Strips a RIFF/WAVE header if present, converts little-endian PCM16 to Float32
(`int16 / 32768`), and applies the vintage chain for any mode other than `modern`.

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
