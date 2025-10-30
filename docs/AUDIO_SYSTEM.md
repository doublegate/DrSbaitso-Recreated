# Audio System Documentation

## Overview

The audio system recreates the authentic 8-bit Sound Blaster audio experience of the original 1991 Dr. Sbaitso through a sophisticated Web Audio API processing pipeline. It transforms modern high-quality TTS audio into characteristic low-fidelity retro sound.

**Version 1.1.0** introduces configurable audio quality with 4 presets ranging from extreme lo-fi (4-bit) to modern clarity (no bit-crushing). Users can adjust both the bit depth (quantization levels) and playback rate (speed) to customize the retro audio experience.

## Audio Processing Pipeline (v1.1.0)

```
┌────────────────────────────────────────────────────────────────┐
│                     TTS API (Gemini)                           │
│           Base64-encoded PCM Audio (24kHz, mono)               │
│          (Character-specific voice prompts v1.1.0)             │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ↓
          ┌──────────────────────┐
          │   decode()           │
          │  Base64 → Uint8Array │
          └──────────┬───────────┘
                     │
                     ↓
          ┌──────────────────────┐
          │ decodeAudioData()    │
          │ Int16 → Float32      │
          │ Create AudioBuffer   │
          └──────────┬───────────┘
                     │
                     ↓
          ┌──────────────────────────────────────────────┐
          │   playAudio(buffer, ctx, bitDepth, rate)     │
          │  ┌────────────────────────────────────────┐  │
          │  │  BufferSourceNode                      │  │
          │  │  playbackRate: 1.0/1.1/1.2 (v1.1.0)    │  │
          │  └───────────────┬────────────────────────┘  │
          │                  │                           │
          │        ┌─────────┴──────────┐               │
          │        │   bitDepth > 0?    │               │
          │        └─────┬──────────┬───┘               │
          │         YES  │          │  NO                │
          │              ↓          │                    │
          │  ┌──────────────────┐  │                    │
          │  │ScriptProcessor   │  │                    │
          │  │Bit-Crusher       │  │                    │
          │  │16/64/256 levels  │  │                    │
          │  │(v1.1.0 Config)   │  │                    │
          │  └─────────┬────────┘  │                    │
          │            │           │                     │
          │            └───────────┼────────→            │
          │                        ↓                     │
          │           ┌───────────────────────────────┐  │
          │           │   AudioDestination            │  │
          │           └───────────────────────────────┘  │
          └──────────────────────────────────────────────┘
                                   │
                                   ↓
                      ┌─────────────────────────┐
                      │  Speakers               │
                      │  4/6/8-bit or Modern    │
                      │  (v1.1.0 Configurable)  │
                      └─────────────────────────┘
```

## Core Audio Functions

### decode(base64: string): Uint8Array

Converts base64-encoded audio data to raw bytes.

```typescript
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
```

**Input Format:**
- Base64 ASCII string (e.g., "//uQRAAA...")

**Output Format:**
- Uint8Array of raw bytes

**Performance:**
- O(n) time complexity
- No external dependencies (uses native atob())
- Typical 1-2 second audio: ~48KB → ~72KB base64

### decodeAudioData(): AudioBuffer

Converts raw PCM bytes to Web Audio API AudioBuffer.

```typescript
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer>
```

**Parameters:**
- `data` - Uint8Array of raw PCM bytes
- `ctx` - AudioContext instance
- `sampleRate` - 24000 (24 kHz)
- `numChannels` - 1 (mono)

**Process:**
1. Reinterpret Uint8Array as Int16Array (little-endian)
2. Calculate frame count: `dataInt16.length / numChannels`
3. Create AudioBuffer with specified parameters
4. Convert Int16 samples [-32768, 32767] to Float32 [-1.0, 1.0]

**Conversion Formula:**
```typescript
float32Value = int16Value / 32768.0
```

**Why 32768?**
- Int16 range: -32,768 to 32,767
- Division by 32,768 normalizes to [-1.0, 1.0]
- Web Audio API expects Float32 samples in this range

**Output:**
- AudioBuffer ready for playback or processing

### playAudio(): Promise<void> (v1.1.0 Enhanced)

Main audio playback function with configurable 8-bit effects.

```typescript
export function playAudio(
  buffer: AudioBuffer,
  ctx: AudioContext,
  bitDepth: number = 64,      // NEW v1.1.0: Quantization levels (0 = disabled)
  playbackRate: number = 1.1  // NEW v1.1.0: Speed adjustment
): Promise<void>
```

**Parameters:**
- `buffer` - AudioBuffer to play
- `ctx` - AudioContext instance
- `bitDepth` (v1.1.0) - Number of quantization levels (0, 16, 64, or 256)
  - `0` = No bit-crushing (modern quality)
  - `16` = 4-bit audio (extreme lo-fi)
  - `64` = 6-bit audio (authentic 8-bit, default)
  - `256` = 8-bit audio (high quality retro)
- `playbackRate` (v1.1.0) - Speed multiplier (1.0 = normal, 1.1 = 10% faster, 1.2 = 20% faster)

**Returns:**
- Promise that resolves when audio finishes playing

**Audio Quality Presets (v1.1.0):**

| Preset | bitDepth | playbackRate | Character |
|--------|----------|--------------|-----------|
| Extreme Lo-Fi | 16 | 1.2 | Most distorted, fastest |
| Authentic 8-bit | 64 | 1.1 | Original 1991 quality (default) |
| High Quality | 256 | 1.0 | Clearer retro sound |
| Modern | 0 | 1.0 | No bit-crushing |

**Audio Effects Chain:**

#### 1. BufferSourceNode
- **Purpose:** Audio source with configurable playback rate
- **Configuration:**
  - `source.buffer = buffer` (AudioBuffer)
  - `source.playbackRate.value = playbackRate` (v1.1.0 configurable)

**Playback Rate Effect:**
- `1.0` = Normal speed and pitch
- `1.1` = 10% faster, slightly deeper (default)
- `1.2` = 20% faster, deeper voice
- Mimics CPU speed variations in old systems

#### 2. ScriptProcessorNode (Configurable Bit-Crusher, v1.1.0)

**Conditional Application:**
```typescript
if (bitDepth > 0) {
  // Apply bit-crushing
  const bitCrusher = ctx.createScriptProcessor(2048, 1, 1);
  const numLevels = bitDepth;
  const step = 2.0 / (numLevels - 1);

  bitCrusher.onaudioprocess = function(e) {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < input.length; i++) {
      output[i] = Math.round(input[i] / step) * step;
    }
  };

  source.connect(bitCrusher);
  bitCrusher.connect(ctx.destination);
} else {
  // No bit-crushing, direct connection
  source.connect(ctx.destination);
}
```

**Configuration:**
```typescript
const bufferSize = 2048;  // Process 2048 samples at a time
const numLevels = bitDepth;  // 16, 64, or 256 (configurable v1.1.0)
const step = 2.0 / (numLevels - 1);
```

**Quantization Examples:**

**4-bit (16 levels):**
```
step = 2.0 / 15 = 0.133
Quantization: Very coarse, extreme artifacts
```

**6-bit (64 levels, default):**
```
step = 2.0 / 63 = 0.031746
Quantization: Authentic 1991 Sound Blaster quality
```

**8-bit (256 levels):**
```
step = 2.0 / 255 = 0.00784
Quantization: Subtle retro character, clearer
```

**Quantization Algorithm:**
```typescript
bitCrusher.onaudioprocess = function(e) {
  const input = e.inputBuffer.getChannelData(0);
  const output = e.outputBuffer.getChannelData(0);
  for (let i = 0; i < input.length; i++) {
    const val = input[i];  // Float32 sample [-1.0, 1.0]
    output[i] = Math.round(val / step) * step;  // Quantize to numLevels
  }
};
```

**How Quantization Works:**

| Input (Float32) | val / step | Round | * step | Output |
|----------------|------------|-------|--------|--------|
| 0.5000 | 15.746 | 16 | 0.031746 | 0.5079 |
| 0.2500 | 7.873 | 8 | 0.031746 | 0.2540 |
| 0.1234 | 3.887 | 4 | 0.031746 | 0.1270 |
| -0.7500 | -23.620 | -24 | 0.031746 | -0.7619 |

**Visual Effect:**

```
Original (Float32):     Quantized (6-bit):
     1.0 ┤───────          1.0 ┤━━━━━━━
         │                     │
     0.5 │   ╱╲            0.5 │  ┌┐┌┐
         │  ╱  ╲               │  ││││
     0.0 │─╱────╲──        0.0 │──┘└┘└──
         │       ╲             │
    -0.5 │        ╲       -0.5 │  ┌┐
         │         ╲           │  ││
    -1.0 ┤──────────      -1.0 ┤──┘└────

    (Smooth waveform)    (Staircase waveform)
```

**Why 6-bit?**
- Original Sound Blaster: 8-bit audio
- Dr. Sbaitso used compressed voice synthesis
- 6-bit (64 levels) creates more aggressive artifact
- Matches subjective quality of 1991 speech synthesis

#### 3. Node Connections

```typescript
source.connect(bitCrusher);
bitCrusher.connect(ctx.destination);
```

**Signal Flow:**
1. Audio data → BufferSource (playback rate applied)
2. BufferSource → ScriptProcessor (quantization applied)
3. ScriptProcessor → Destination (speakers)

#### 4. Cleanup

```typescript
source.onended = () => {
  source.disconnect();
  bitCrusher.disconnect();
  resolve();
};
```

**Memory Management:**
- Disconnects nodes after playback
- Allows garbage collection
- Prevents memory leaks on long sessions

## Sound Effects

### playGlitchSound(): White Noise

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

**ScriptProcessorNode Processing:**
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

✅ **Correct Behavior:**
- Voice sounds robotic and slightly distorted
- Audible quantization "staircase" effect
- Deeper/faster than original TTS
- Clear retro 8-bit character

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
| **6-bit** | **64** | **0.031746** | **Dr. Sbaitso** |
| 8-bit | 256 | 0.0078125 | Original Sound Blaster |
| 16-bit | 65,536 | 0.000015 | CD quality |

### Alternative Effect Algorithms

**Sample Rate Reduction (not implemented):**
```typescript
// Reduce effective sample rate to 8 kHz
const downsampleFactor = 3; // 24kHz / 3 = 8kHz
let lastSample = 0;
for (let i = 0; i < input.length; i++) {
  if (i % downsampleFactor === 0) {
    lastSample = input[i];
  }
  output[i] = lastSample;
}
```

**Lo-fi Filter (not implemented):**
```typescript
// Low-pass filter to remove high frequencies
const biquadFilter = ctx.createBiquadFilter();
biquadFilter.type = 'lowpass';
biquadFilter.frequency.value = 3000; // 3 kHz cutoff
```

## Future Enhancements

1. **AudioWorklet Migration:** Replace ScriptProcessorNode
2. **Adjustable Bit Depth:** UI control for 4-bit, 6-bit, 8-bit
3. **Additional Effects:** Sample rate reduction, low-pass filter
4. **Audio Caching:** Store generated audio in IndexedDB
5. **Streaming Support:** Real-time audio processing for longer responses
6. **Visualization:** Waveform display with quantization levels
