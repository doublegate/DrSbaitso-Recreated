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
  ctx: AudioContext
): Promise<void> {
  return new Promise((resolve) => {
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // --- Dr. Sbaitso effects to recreate 8-bit sound ---

    // 1. Bit-crusher effect using a ScriptProcessorNode to quantize audio samples.
    // This simulates the low-resolution audio of old sound cards.
    // Setting bit depth to 6-bit (64 levels).
    const bufferSize = 2048;
    const bitCrusher = ctx.createScriptProcessor(bufferSize, 1, 1);
    const numLevels = 64; 
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

    // 2. Adjust playback rate. This makes the voice faster and deeper,
    // mimicking the pitch and cadence of the original program.
    // A value of 1.1 speeds it up significantly.
    source.playbackRate.value = 1.1;

    // Connect nodes: source -> bitCrusher -> destination
    source.connect(bitCrusher);
    bitCrusher.connect(ctx.destination);
    
    source.onended = () => {
        // Disconnect nodes to allow for garbage collection
        source.disconnect();
        bitCrusher.disconnect();
        resolve();
    };

    source.start();
  });
}