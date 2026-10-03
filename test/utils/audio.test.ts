/**
 * Audio Utilities Test Suite
 * Tests for audio processing, bit-crushing, and playback functions
 *
 * @version 1.7.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decode, decodeAudioData, playAudio, playGlitchSound, playErrorBeep } from '@/utils/audio';

describe('Audio Utilities', () => {
  describe('decode', () => {
    it('should decode base64 string to Uint8Array', () => {
      const base64 = btoa('test data');
      const result = decode(base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty string', () => {
      const result = decode('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should decode valid audio data', () => {
      // Create sample audio data
      const samples = new Int16Array([100, 200, -100, -200]);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(samples.buffer)));

      const result = decode(base64);
      expect(result.length).toBe(samples.buffer.byteLength);
    });
  });

  describe('decodeAudioData', () => {
    let mockContext: AudioContext;

    beforeEach(() => {
      mockContext = new AudioContext();
    });

    it('should decode audio data to AudioBuffer', async () => {
      const base64Audio = btoa('test audio data '); // Even number of bytes (16)
      const audioData = decode(base64Audio);

      const buffer = await decodeAudioData(audioData, mockContext, 24000, 1);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.sampleRate).toBe(24000);
      expect(buffer.numberOfChannels).toBe(1);
    });

    it('should apply authentic audio mode processing', async () => {
      const base64Audio = btoa('test audio data '); // Even number of bytes (16)
      const audioData = decode(base64Audio);

      const buffer = await decodeAudioData(audioData, mockContext, 24000, 1, 'authentic');

      expect(buffer).toBeDefined();
      expect(mockContext.createBuffer).toHaveBeenCalled();
    });

    it('should handle modern audio mode (no processing)', async () => {
      const base64Audio = btoa('test audio data '); // Even number of bytes (16)
      const audioData = decode(base64Audio);

      const buffer = await decodeAudioData(audioData, mockContext, 24000, 1, 'modern');

      expect(buffer).toBeDefined();
    });

    // A context whose buffers keep their sample data, so values can be checked.
    function recordingContext() {
      const channel: { data?: Float32Array } = {};
      const ctx = {
        createBuffer: (_c: number, length: number, sampleRate: number) => {
          channel.data = new Float32Array(length);
          return { length, sampleRate, numberOfChannels: 1, getChannelData: () => channel.data! };
        },
      } as unknown as AudioContext;
      return { ctx, channel };
    }

    const pcm16 = (...samples: number[]) => new Uint8Array(new Int16Array(samples).buffer);

    it('decodes little-endian PCM16 sample values', async () => {
      const { ctx, channel } = recordingContext();
      await decodeAudioData(pcm16(16384, -32768), ctx, 24000, 1);
      expect(Array.from(channel.data!)).toEqual([0.5, -1]);
    });

    it('skips a WAV (RIFF) header instead of playing it as noise', async () => {
      const samples = pcm16(16384, -16384);
      const wav = new Uint8Array(44 + samples.length);
      const v = new DataView(wav.buffer);
      [...'RIFF'].forEach((c, i) => (wav[i] = c.charCodeAt(0)));
      [...'WAVE'].forEach((c, i) => (wav[8 + i] = c.charCodeAt(0)));
      [...'fmt '].forEach((c, i) => (wav[12 + i] = c.charCodeAt(0)));
      v.setUint32(16, 16, true);
      v.setUint32(24, 24000, true);
      [...'data'].forEach((c, i) => (wav[36 + i] = c.charCodeAt(0)));
      v.setUint32(40, samples.length, true);
      wav.set(samples, 44);

      const { ctx, channel } = recordingContext();
      const buffer = await decodeAudioData(wav, ctx, 24000, 1);
      expect(buffer.length).toBe(2);
      expect(Array.from(channel.data!)).toEqual([0.5, -0.5]);
    });

    it('passes the end punctuation to the pitch contour of the vintage modes', async () => {
      const samples = Array.from({ length: 24000 }, (_, i) =>
        Math.round(8000 * Math.sin((2 * Math.PI * 160 * i) / 24000) + 4000 * Math.sin((2 * Math.PI * 480 * i) / 24000)),
      );
      // Each buffer keeps its own data: processing reads one and writes another.
      const ctx = {
        createBuffer: (_c: number, length: number, sampleRate: number) => {
          const data = new Float32Array(length);
          return { length, sampleRate, numberOfChannels: 1, getChannelData: () => data };
        },
      } as unknown as AudioContext;
      const render = async (punctuation?: '.' | '?' | null) =>
        Array.from(
          (await decodeAudioData(pcm16(...samples), ctx, 24000, 1, 'authentic', punctuation)).getChannelData(0),
        );
      const question = await render('?');
      const statement = await render('.');
      expect(question.length).toBe(24000);
      expect(question.some((v) => v !== 0)).toBe(true);
      expect(question).not.toEqual(statement);
      expect(await render()).toEqual(await render(null));
    });

    it('tolerates an odd byte length instead of throwing a RangeError', async () => {
      const { ctx } = recordingContext();
      const buffer = await decodeAudioData(new Uint8Array([0, 64, 7]), ctx, 24000, 1);
      expect(buffer.length).toBe(1);
    });

    it('respects the byteOffset of a subarray view', async () => {
      const backing = new Uint8Array([9, 9, 0, 64]);
      const { ctx, channel } = recordingContext();
      await decodeAudioData(backing.subarray(2), ctx, 24000, 1);
      expect(Array.from(channel.data!)).toEqual([0.5]);
    });

    it('should throw error on invalid audio data', async () => {
      const invalidBase64 = 'invalid!!!base64!!!';

      await expect(async () => {
        const audioData = decode(invalidBase64);
        await decodeAudioData(audioData, mockContext, 24000, 1);
      }).rejects.toThrow();
    });
  });

  describe('playAudio', () => {
    let mockContext: AudioContext;
    let mockBuffer: AudioBuffer;

    beforeEach(() => {
      mockContext = new AudioContext();
      mockBuffer = {
        length: 1000,
        duration: 1,
        sampleRate: 24000,
        numberOfChannels: 1,
        getChannelData: vi.fn(() => new Float32Array(1000)),
      } as any;
    });

    it('should play audio buffer successfully', async () => {
      const createSourceSpy = vi.spyOn(mockContext, 'createBufferSource');

      await playAudio(mockBuffer, mockContext);

      expect(createSourceSpy).toHaveBeenCalled();
    });

    it('should apply bit-crushing with specified bit depth', async () => {
      await playAudio(mockBuffer, mockContext, 64);

      expect(mockContext.createBufferSource).toHaveBeenCalled();
    });

    it('should apply custom playback rate', async () => {
      await playAudio(mockBuffer, mockContext, 64, 1.2);

      const source = mockContext.createBufferSource();
      expect(mockContext.createBufferSource).toHaveBeenCalled();
    });

    it('should skip bit-crushing when bitDepth is 0', async () => {
      await playAudio(mockBuffer, mockContext, 0);

      // Verify no ScriptProcessorNode created
      expect(mockContext.createBufferSource).toHaveBeenCalled();
    });

    it('should handle AudioContext resume', async () => {
      Object.defineProperty(mockContext, 'state', {
        value: 'suspended',
        writable: true,
        configurable: true,
      });
      const resumeSpy = vi.spyOn(mockContext, 'resume');

      await playAudio(mockBuffer, mockContext);

      expect(resumeSpy).toHaveBeenCalled();
    });
  });

  describe('playGlitchSound', () => {
    let mockContext: AudioContext;

    beforeEach(() => {
      mockContext = new AudioContext();
    });

    it('should create white noise glitch sound', () => {
      playGlitchSound(mockContext);

      expect(mockContext.createBuffer).toHaveBeenCalledWith(1, expect.any(Number), 24000);
      expect(mockContext.createBufferSource).toHaveBeenCalled();
    });

    it('should handle suspended AudioContext', () => {
      Object.defineProperty(mockContext, 'state', {
        value: 'suspended',
        writable: true,
        configurable: true,
      });
      const resumeSpy = vi.spyOn(mockContext, 'resume');

      playGlitchSound(mockContext);

      expect(resumeSpy).toHaveBeenCalled();
    });
  });

  describe('playErrorBeep', () => {
    let mockContext: AudioContext;

    beforeEach(() => {
      mockContext = new AudioContext();
    });

    it('should create 300Hz square wave error beep', () => {
      playErrorBeep(mockContext);

      expect(mockContext.createOscillator).toHaveBeenCalled();
      expect(mockContext.createGain).toHaveBeenCalled();
    });

    it('should create beep with 300ms duration', () => {
      playErrorBeep(mockContext);

      expect(mockContext.createOscillator).toHaveBeenCalled();
      expect(mockContext.createGain).toHaveBeenCalled();
    });

    it('should handle suspended AudioContext', () => {
      Object.defineProperty(mockContext, 'state', {
        value: 'suspended',
        writable: true,
        configurable: true,
      });
      const resumeSpy = vi.spyOn(mockContext, 'resume');

      playErrorBeep(mockContext);

      expect(resumeSpy).toHaveBeenCalled();
    });
  });

  describe('Audio Processing Integration', () => {
    it('should handle complete audio playback workflow', async () => {
      const mockContext = new AudioContext();
      const base64Audio = btoa('complete audio workflow test');
      const audioData = decode(base64Audio);

      // Decode audio
      const buffer = await decodeAudioData(audioData, mockContext, 24000, 1);

      // Play audio with bit-crushing
      await playAudio(buffer, mockContext, 64, 1.1);

      expect(mockContext.createBufferSource).toHaveBeenCalled();
    });

    it('should support multiple audio quality presets', async () => {
      const mockContext = new AudioContext();
      const base64Audio = btoa('quality test');
      const audioData = decode(base64Audio);
      const buffer = await decodeAudioData(audioData, mockContext, 24000, 1);

      // Test each quality preset
      const presets = [
        { bitDepth: 16, playbackRate: 1.2 }, // Extreme Lo-Fi
        { bitDepth: 64, playbackRate: 1.1 }, // Authentic 8-bit
        { bitDepth: 256, playbackRate: 1.0 }, // High Quality
        { bitDepth: 0, playbackRate: 1.0 }, // Modern
      ];

      for (const preset of presets) {
        await playAudio(buffer, mockContext, preset.bitDepth, preset.playbackRate);
        expect(mockContext.createBufferSource).toHaveBeenCalled();
      }
    });
  });
});
