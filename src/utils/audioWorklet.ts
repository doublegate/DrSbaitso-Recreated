/**
 * AudioWorklet Utilities
 *
 * Modern AudioWorklet-based audio processing utilities.
 * Provides bit-crushing effects using AudioWorkletNode instead of deprecated ScriptProcessorNode.
 *
 * @version 1.2.0
 */

/**
 * Initialize AudioWorklet by loading the processor module
 * @param ctx - AudioContext instance
 * @returns Promise<boolean> - True if initialization succeeded, false if fallback needed
 */
export async function initAudioWorklet(ctx: AudioContext): Promise<boolean> {
  try {
    // Check if AudioWorklet is supported
    if (!ctx.audioWorklet) {
      console.warn('AudioWorklet not supported, will use fallback');
      return false;
    }

    // Load the worklet module
    await ctx.audioWorklet.addModule('/audio-processor.worklet.js');
    return true;
  } catch (error) {
    console.warn('Failed to initialize AudioWorklet:', error);
    return false;
  }
}

/**
 * Create a bit-crusher AudioWorkletNode
 * @param ctx - AudioContext instance
 * @param bitDepth - Number of quantization levels (0 = disabled, 16 = 4-bit, 64 = 6-bit, 256 = 8-bit)
 * @returns AudioWorkletNode | null
 */
export function createBitCrusherNode(
  ctx: AudioContext,
  bitDepth: number
): AudioWorkletNode | null {
  try {
    const node = new AudioWorkletNode(ctx, 'bit-crusher-processor', {
      processorOptions: {
        bitDepth
      }
    });
    return node;
  } catch (error) {
    console.error('Failed to create AudioWorkletNode:', error);
    return null;
  }
}

/**
 * Update bit depth of an existing BitCrusherNode
 * @param node - AudioWorkletNode instance
 * @param bitDepth - New bit depth value
 */
export function updateBitDepth(node: AudioWorkletNode, bitDepth: number): void {
  node.port.postMessage({
    type: 'updateBitDepth',
    value: bitDepth
  });
}

/**
 * Play audio buffer with AudioWorklet-based bit-crushing
 * @param buffer - AudioBuffer to play
 * @param ctx - AudioContext instance
 * @param bitDepth - Number of quantization levels (0 = disabled)
 * @param playbackRate - Playback speed multiplier (e.g., 1.1 for faster/deeper)
 * @param useWorklet - Whether to use AudioWorklet (true) or fallback (false)
 * @returns Promise<void> - Resolves when playback completes
 */
export function playAudioWithWorklet(
  buffer: AudioBuffer,
  ctx: AudioContext,
  bitDepth: number = 64,
  playbackRate: number = 1.1,
  useWorklet: boolean = true
): Promise<void> {
  return new Promise((resolve) => {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    if (useWorklet && bitDepth > 0) {
      // Use AudioWorklet for bit-crushing
      const bitCrusher = createBitCrusherNode(ctx, bitDepth);

      if (bitCrusher) {
        source.connect(bitCrusher);
        bitCrusher.connect(ctx.destination);

        source.onended = () => {
          source.disconnect();
          bitCrusher.disconnect();
          resolve();
        };
      } else {
        // Fallback: connect directly
        source.connect(ctx.destination);
        source.onended = () => {
          source.disconnect();
          resolve();
        };
      }
    } else {
      // No bit-crushing or disabled
      source.connect(ctx.destination);
      source.onended = () => {
        source.disconnect();
        resolve();
      };
    }

    source.start();
  });
}

/**
 * Check if AudioWorklet is supported in the current browser
 * @returns boolean
 */
export function isAudioWorkletSupported(): boolean {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const supported = 'audioWorklet' in ctx;
    ctx.close();
    return supported;
  } catch {
    return false;
  }
}
