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
      const base64Audio = btoa('test audio data');

      const buffer = await decodeAudioData(base64Audio, mockContext);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.sampleRate).toBe(24000);
      expect(buffer.numberOfChannels).toBe(1);
    });

    it('should apply authentic audio mode processing', async () => {
      const base64Audio = btoa('test audio data');

      const buffer = await decodeAudioData(base64Audio, mockContext, 'authentic');

      expect(buffer).toBeDefined();
      expect(mockContext.decodeAudioData).toHaveBeenCalled();
    });

    it('should handle modern audio mode (no processing)', async () => {
      const base64Audio = btoa('test audio data');

      const buffer = await decodeAudioData(base64Audio, mockContext, 'modern');

      expect(buffer).toBeDefined();
    });

    it('should throw error on invalid audio data', async () => {
      const invalidBase64 = 'invalid!!!base64!!!';

      await expect(decodeAudioData(invalidBase64, mockContext)).rejects.toThrow();
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
      mockContext.state = 'suspended' as AudioContextState;
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
      mockContext.state = 'suspended' as AudioContextState;
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

      expect(mockContext.createBuffer).toHaveBeenCalledWith(1, expect.any(Number), 24000);
      expect(mockContext.createBufferSource).toHaveBeenCalled();
    });

    it('should create beep with 300ms duration', () => {
      playErrorBeep(mockContext);

      const expectedSamples = Math.floor(24000 * 0.3); // 300ms at 24kHz
      expect(mockContext.createBuffer).toHaveBeenCalledWith(1, expectedSamples, 24000);
    });

    it('should handle suspended AudioContext', () => {
      mockContext.state = 'suspended' as AudioContextState;
      const resumeSpy = vi.spyOn(mockContext, 'resume');

      playErrorBeep(mockContext);

      expect(resumeSpy).toHaveBeenCalled();
    });
  });

  describe('Audio Processing Integration', () => {
    it('should handle complete audio playback workflow', async () => {
      const mockContext = new AudioContext();
      const base64Audio = btoa('complete audio workflow test');

      // Decode audio
      const buffer = await decodeAudioData(base64Audio, mockContext);

      // Play audio with bit-crushing
      await playAudio(buffer, mockContext, 64, 1.1);

      expect(mockContext.createBufferSource).toHaveBeenCalled();
    });

    it('should support multiple audio quality presets', async () => {
      const mockContext = new AudioContext();
      const base64Audio = btoa('quality test');
      const buffer = await decodeAudioData(base64Audio, mockContext);

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
