/**
 * BitCrusher AudioWorkletProcessor
 *
 * Modern replacement for deprecated ScriptProcessorNode.
 * Implements configurable bit-depth reduction for retro 8-bit audio effects.
 *
 * @version 1.2.0
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor
 */

class BitCrusherProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    // Get bit depth from options (number of quantization levels)
    // 0 = disabled, 16 = 4-bit, 64 = 6-bit, 256 = 8-bit
    this.bitDepth = options.processorOptions?.bitDepth || 64;

    // Calculate quantization step
    this.step = this.bitDepth > 0 ? 2.0 / (this.bitDepth - 1) : 0;

    // Listen for parameter updates
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateBitDepth') {
        this.bitDepth = event.data.value;
        this.step = this.bitDepth > 0 ? 2.0 / (this.bitDepth - 1) : 0;
      }
    };
  }

  /**
   * Process audio samples
   * @param {Float32Array[][]} inputs - Input audio data
   * @param {Float32Array[][]} outputs - Output audio data
   * @returns {boolean} - True to keep processor alive
   */
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    // If no input or bit-crushing disabled, pass through
    if (!input || !input.length || this.bitDepth === 0) {
      if (input && output) {
        for (let channel = 0; channel < input.length; ++channel) {
          output[channel].set(input[channel]);
        }
      }
      return true;
    }

    // Apply bit-crushing to each channel
    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      for (let i = 0; i < inputChannel.length; ++i) {
        // Quantize the sample to simulate lower bit depth
        const sample = inputChannel[i];
        outputChannel[i] = Math.round(sample / this.step) * this.step;
      }
    }

    return true;
  }
}

// Register the processor
registerProcessor('bit-crusher-processor', BitCrusherProcessor);
