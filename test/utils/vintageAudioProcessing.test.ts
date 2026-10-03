import { describe, it, expect } from 'vitest';
import { bestCpuMs, perfIt } from '../helpers/cpuTime';
import {
  AUTHENTICITY_PRESETS,
  AuthenticityLevel,
  applyVintageProcessing,
  getAuthenticityDescription,
  getAuthenticitySpecs,
  getPresetConfig,
  processVintageSamples,
  quantizeSample,
  sampleAndHold,
  type VintageProcessingConfig,
} from '@/utils/vintageAudioProcessing';
import { estimatePitch } from '@/utils/lpcMonotone';

const FS = 24000;

function sine(freq: number, seconds: number, amplitude = 0.5, fs = FS): Float32Array {
  const out = new Float32Array(Math.round(seconds * fs));
  for (let i = 0; i < out.length; i++) out[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / fs);
  return out;
}

/** Magnitude of one frequency component (single-bin DFT) over the middle of the signal. */
function toneLevel(x: Float32Array, freq: number, fs = FS): number {
  const from = Math.floor(x.length / 4);
  const to = Math.floor((3 * x.length) / 4);
  let re = 0;
  let im = 0;
  for (let i = from; i < to; i++) {
    re += x[i] * Math.cos((2 * Math.PI * freq * i) / fs);
    im -= x[i] * Math.sin((2 * Math.PI * freq * i) / fs);
  }
  return (2 * Math.hypot(re, im)) / (to - from);
}

const dB = (ratio: number) => 20 * Math.log10(ratio);
const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / Math.max(1, x.length));

/**
 * The chain without the pitch stage, compression or normalisation, so the
 * response to pure tones can be compared across separate runs.
 */
const forTones = (level: AuthenticityLevel): VintageProcessingConfig => ({
  ...getPresetConfig(level),
  pitchFlattening: false,
  volumeVarianceReduction: 0,
  normalizePeak: 0,
  normalizeRms: 0,
});
const authenticTones = forTones(AuthenticityLevel.Authentic);
const ultraTones = forTones(AuthenticityLevel.UltraAuthentic);

describe('AUTHENTICITY_PRESETS', () => {
  it('uses the measured format for Authentic: 8475 Hz, 8-bit, 80 Hz-3.8 kHz, -8 dB shelf', () => {
    const p = AUTHENTICITY_PRESETS[AuthenticityLevel.Authentic];
    expect(p.targetSampleRate).toBe(8475);
    expect(p.quantizationLevels).toBe(256);
    expect(p.lowCutoff).toBe(80);
    expect(p.highCutoff).toBe(3800);
    expect(p.highShelfGainDb).toBe(-8);
    expect(p.highShelfFrequency).toBe(1200);
    expect(p.sampleAndHold).toBe(true);
    expect(p.pitchFlattening).toBe(true);
  });

  it('models the SB Pro 3.2 kHz filter in Ultra, with no extra crush', () => {
    const p = AUTHENTICITY_PRESETS[AuthenticityLevel.UltraAuthentic];
    expect(p.targetSampleRate).toBe(8475);
    expect(p.quantizationLevels).toBe(256);
    expect(p.highCutoff).toBe(3200);
    expect(p.pitchFlattening).toBe(true);
  });

  it('keeps Subtle light: no pitch flattening, no 8-bit quantisation', () => {
    const p = AUTHENTICITY_PRESETS[AuthenticityLevel.SubtleVintage];
    expect(p.pitchFlattening).toBe(false);
    expect(p.quantizationLevels).toBe(65536);
    expect(p.sampleAndHold).toBe(false);
  });

  it('drops the invented noise artifacts and the dead pitch setting', () => {
    for (const preset of Object.values(AUTHENTICITY_PRESETS)) {
      expect(preset).not.toHaveProperty('aliasingAmount');
      expect(preset).not.toHaveProperty('preEchoAmount');
      expect(preset).not.toHaveProperty('injectArtifacts');
      expect(preset).not.toHaveProperty('pitchVarianceReduction');
    }
  });
});

describe('quantizeSample', () => {
  it('quantises like unsigned 8-bit PCM centred on code 128', () => {
    expect(quantizeSample(0, 256)).toBe(0);
    expect(quantizeSample(0.5, 256)).toBe(0.5);
    expect(quantizeSample(0.3, 256)).toBe(38 / 128);
    expect(quantizeSample(1, 256)).toBe(127 / 128); // code 255 is the top
    expect(quantizeSample(-1, 256)).toBe(-1); // code 0
    expect(quantizeSample(-2, 256)).toBe(-1);
  });
});

describe('sampleAndHold', () => {
  it('repeats each engine sample instead of interpolating', () => {
    const out = sampleAndHold(new Float32Array([0.1, 0.2, 0.3]), 1, 3, 9);
    expect(Array.from(out)).toEqual(Array.from(new Float32Array([0.1, 0.1, 0.1, 0.2, 0.2, 0.2, 0.3, 0.3, 0.3])));
  });

  it('holds the last sample to the requested length', () => {
    expect(Array.from(sampleAndHold(new Float32Array([0.5]), 8475, 24000, 4))).toEqual([0.5, 0.5, 0.5, 0.5]);
  });
});

describe('processVintageSamples', () => {
  it('leaves Modern untouched', () => {
    const input = sine(440, 0.1);
    const out = processVintageSamples(input, FS, getPresetConfig(AuthenticityLevel.Modern));
    expect(Array.from(out)).toEqual(Array.from(input));
  });

  it('keeps the length and sample rate of the input', () => {
    for (const level of Object.values(AuthenticityLevel)) {
      expect(processVintageSamples(sine(300, 0.37), FS, getPresetConfig(level)).length).toBe(Math.round(0.37 * FS));
    }
  });

  it('keeps silence silent', () => {
    for (const level of Object.values(AuthenticityLevel)) {
      const out = processVintageSamples(new Float32Array(4800), FS, getPresetConfig(level));
      expect(out.every((v) => v === 0)).toBe(true);
    }
  });

  it('removes content above the 4237 Hz Nyquist limit of the original, aliases included', () => {
    const passed = rms(processVintageSamples(sine(500, 0.5), FS, authenticTones));
    const stopped = rms(processVintageSamples(sine(6000, 0.5), FS, authenticTones));
    expect(dB(stopped / passed)).toBeLessThan(-30);
  });

  it('keeps low bass above 80 Hz but cuts below it', () => {
    const bass = toneLevel(processVintageSamples(sine(150, 0.5), FS, authenticTones), 150);
    const rumble = toneLevel(processVintageSamples(sine(30, 0.5), FS, authenticTones), 30);
    expect(dB(rumble / bass)).toBeLessThan(-12);
  });

  it('tilts the spectrum: highs sit well below the 500 Hz region', () => {
    const low = toneLevel(processVintageSamples(sine(500, 0.5), FS, authenticTones), 500);
    const high = toneLevel(processVintageSamples(sine(2500, 0.5), FS, authenticTones), 2500);
    expect(dB(high / low)).toBeLessThan(-6);
    expect(dB(high / low)).toBeGreaterThan(-14);
  });

  it('cuts harder in Ultra (3.2 kHz SB Pro filter)', () => {
    const authentic = toneLevel(processVintageSamples(sine(3600, 0.5), FS, authenticTones), 3600);
    const ultra = toneLevel(processVintageSamples(sine(3600, 0.5), FS, ultraTones), 3600);
    expect(ultra).toBeLessThan(authentic);
  });

  it('leaves the zero-order-hold images that give the metallic edge', () => {
    const out = processVintageSamples(sine(1000, 0.5), FS, authenticTones);
    const image = toneLevel(out, 8475 - 1000);
    expect(dB(image / toneLevel(out, 1000))).toBeGreaterThan(-45);
    // Linear reconstruction (no sample-and-hold) leaves much less of it.
    const smooth = processVintageSamples(sine(1000, 0.5), FS, { ...authenticTones, sampleAndHold: false });
    expect(toneLevel(smooth, 8475 - 1000)).toBeLessThan(image);
  });

  it('normalises quiet speech towards the original level before quantising', () => {
    const config = { ...getPresetConfig(AuthenticityLevel.Authentic), pitchFlattening: false };
    const out = processVintageSamples(sine(500, 0.5, 0.01), FS, config);
    expect(rms(out)).toBeGreaterThan(0.08);
    expect(rms(out)).toBeLessThan(0.2);
  });

  it('flattens the pitch in Authentic and follows the end punctuation', () => {
    // A vowel-like buzz at 160 Hz.
    const input = new Float32Array(FS);
    for (let i = 0; i < input.length; i++) {
      const t = i / FS;
      input[i] =
        0.3 * Math.sin(2 * Math.PI * 160 * t) +
        0.2 * Math.sin(2 * Math.PI * 480 * t) +
        0.1 * Math.sin(2 * Math.PI * 800 * t);
    }
    const config = getPresetConfig(AuthenticityLevel.Authentic);
    const statement = processVintageSamples(input, FS, config, '.');
    const question = processVintageSamples(input, FS, config, '?');
    const body = estimatePitch(statement.subarray(Math.round(0.3 * FS), Math.round(0.45 * FS)), FS);
    expect(Math.abs(body.hz - 92)).toBeLessThan(6);
    const tail = (x: Float32Array) => estimatePitch(x.subarray(Math.round(0.88 * FS), Math.round(0.97 * FS)), FS).hz;
    expect(tail(question)).toBeGreaterThan(tail(statement) + 30);
  });

  it('is deterministic', () => {
    const input = sine(220, 0.4);
    const config = getPresetConfig(AuthenticityLevel.UltraAuthentic);
    expect(Array.from(processVintageSamples(input, FS, config, '!'))).toEqual(
      Array.from(processVintageSamples(input, FS, config, '!')),
    );
  });

  perfIt('processes five seconds of 24 kHz audio quickly', () => {
    const fiveSeconds = Float32Array.from(sine(130, 5), (v, i) => v * (0.6 + 0.4 * Math.sin(i / 1200)));
    expect(
      bestCpuMs(() => processVintageSamples(fiveSeconds, FS, getPresetConfig(AuthenticityLevel.Authentic), '.')),
    ).toBeLessThan(300);
  });
});

function recordingContext() {
  return {
    createBuffer: (channels: number, length: number, sampleRate: number) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { length, sampleRate, numberOfChannels: channels, getChannelData: (c: number) => data[c] };
    },
  } as unknown as AudioContext;
}

describe('applyVintageProcessing', () => {
  it('returns the same buffer for Modern', async () => {
    const ctx = recordingContext();
    const buffer = ctx.createBuffer(1, 100, FS);
    expect(await applyVintageProcessing(buffer, ctx, getPresetConfig(AuthenticityLevel.Modern))).toBe(buffer);
  });

  it('writes processed samples into a buffer at the input rate and length', async () => {
    const ctx = recordingContext();
    const buffer = ctx.createBuffer(1, 4800, FS);
    buffer.getChannelData(0).set(sine(300, 0.2));
    const out = await applyVintageProcessing(buffer, ctx, getPresetConfig(AuthenticityLevel.Authentic), '.');
    expect(out.length).toBe(4800);
    expect(out.sampleRate).toBe(FS);
    expect(rms(out.getChannelData(0))).toBeGreaterThan(0);
  });
});

describe('descriptions', () => {
  it('describes the measured format', () => {
    expect(getAuthenticitySpecs(AuthenticityLevel.Authentic)).toBe('8.5 kHz, 8-bit, 80-3800 Hz');
    expect(getAuthenticitySpecs(AuthenticityLevel.UltraAuthentic)).toBe('8.5 kHz, 8-bit, 80-3200 Hz');
    expect(getAuthenticityDescription(AuthenticityLevel.Authentic)).toMatch(/8\.5 kHz/);
    expect(getAuthenticityDescription(AuthenticityLevel.SubtleVintage)).not.toMatch(/1991|authentic/i);
  });
});
