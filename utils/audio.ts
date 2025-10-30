export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function playAudio(
  buffer: AudioBuffer,
  ctx: AudioContext,
  bitDepth: number = 64, // Number of quantization levels (0 = disabled)
  playbackRate: number = 1.1
): Promise<void> {
  return new Promise((resolve) => {
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Adjust playback rate. This makes the voice faster and deeper,
    // mimicking the pitch and cadence of the original program.
    source.playbackRate.value = playbackRate;

    // If bit-crushing is enabled (bitDepth > 0), apply quantization
    if (bitDepth > 0) {
      // Bit-crusher effect using a ScriptProcessorNode to quantize audio samples.
      // This simulates the low-resolution audio of old sound cards.
      const bufferSize = 2048;
      const bitCrusher = ctx.createScriptProcessor(bufferSize, 1, 1);
      const numLevels = bitDepth;
      const step = 2.0 / (numLevels - 1);

      bitCrusher.onaudioprocess = function(e) {
        const input = e.inputBuffer.getChannelData(0);
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < input.length; i++) {
          // Quantize the float sample to a fixed number of levels.
          const val = input[i];
          output[i] = Math.round(val / step) * step;
        }
      };

      // Connect nodes: source -> bitCrusher -> destination
      source.connect(bitCrusher);
      bitCrusher.connect(ctx.destination);

      source.onended = () => {
          // Disconnect nodes to allow for garbage collection
          source.disconnect();
          bitCrusher.disconnect();
          resolve();
      };
    } else {
      // No bit-crushing, connect directly
      source.connect(ctx.destination);

      source.onended = () => {
          source.disconnect();
          resolve();
      };
    }

    source.start();
  });
}

export function playGlitchSound(ctx: AudioContext): void {
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1; // Generate random samples for white noise
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime); // Start at lower volume
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2); // Fade out quickly

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
  source.onended = () => {
    source.disconnect();
    gainNode.disconnect();
  };
}

export function playErrorBeep(ctx: AudioContext): void {
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'square'; // A square wave sounds more retro/8-bit
    oscillator.frequency.setValueAtTime(300, ctx.currentTime); // A low, jarring frequency

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); // Quick fade out

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3); // Play for 0.3 seconds
}