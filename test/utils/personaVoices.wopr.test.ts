import { describe, it, expect } from 'vitest';
import { planWoprLevels, processWoprVoice, segmentWords, woprBandLimit, WOPR_LEVELS } from '@/utils/personaVoices';
import { estimatePitch } from '@/utils/lpcMonotone';
import { bestCpuMs } from '../helpers/cpuTime';

const FS = 24000;

/** A spoken-word stand-in: harmonics of a pitch that glides from f0 to f1. */
function word(f0: number, f1: number, seconds: number, amplitude: number): Float32Array {
  const n = Math.round(seconds * FS);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    phase += (f0 + ((f1 - f0) * i) / n) / FS;
    let v = 0;
    for (let h = 1; h <= 12; h++) v += Math.sin(2 * Math.PI * h * phase) / h;
    // Smooth onset and offset, like a real word.
    const edge = Math.min(1, i / (0.02 * FS), (n - i) / (0.02 * FS));
    out[i] = amplitude * v * edge;
  }
  return out;
}

function noise(seconds: number, amplitude: number, seed = 9): Float32Array {
  let s = seed >>> 0;
  return Float32Array.from({ length: Math.round(seconds * FS) }, () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s / 4294967296 - 0.5) * 2 * amplitude;
  });
}

const silence = (seconds: number) => noise(seconds, 0.0005);

function concat(...parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Three words with natural glides, uneven loudness and short dips between them. */
const threeWords = () =>
  concat(
    silence(0.1),
    word(130, 170, 0.3, 0.1),
    silence(0.06),
    word(160, 120, 0.3, 0.4),
    silence(0.06),
    word(120, 180, 0.3, 0.2),
    silence(0.1),
  );

/** Runs of exact silence at least `minSeconds` long, as [start, length] in samples. */
function silentRuns(x: Float32Array, minSeconds = 0.05): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= x.length; i++) {
    const quiet = i < x.length && Math.abs(x[i]) < 1e-6;
    if (quiet && start < 0) start = i;
    if (!quiet && start >= 0) {
      if (i - start >= minSeconds * FS) runs.push([start, i - start]);
      start = -1;
    }
  }
  return runs;
}

/** Sample ranges of the words between the gaps (ignoring leading and trailing edges). */
function words(x: Float32Array): [number, number][] {
  const gaps = silentRuns(x);
  const out: [number, number][] = [];
  let from = 0;
  for (const [start, length] of gaps) {
    out.push([from, start]);
    from = start + length;
  }
  out.push([from, x.length]);
  return out;
}

const pitchOf = (x: Float32Array, from: number, to: number) => estimatePitch(x.subarray(from, to), FS, 55, 170);
const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / Math.max(1, x.length));
const semitones = (a: number, b: number) => 12 * Math.log2(a / b);

describe('planWoprLevels', () => {
  it.each([
    ['?', 128],
    ['.', 79],
    ['!', 105],
    [null, 90],
  ] as const)('ends a "%s" line at %d Hz', (punctuation, hz) => {
    expect(planWoprLevels(3, punctuation, 1).at(-1)).toBe(hz);
  });

  it('holds 90 Hz and steps down to 79 or 68 Hz every 3rd to 5th word', () => {
    for (let seed = 0; seed < 20; seed++) {
      const levels = planWoprLevels(13, '.', seed);
      const body = levels.slice(0, -1);
      for (const hz of body) expect(WOPR_LEVELS.body.includes(hz as 90 | 79 | 68)).toBe(true);
      const steps = body.flatMap((hz, i) => (hz === 90 ? [] : [i]));
      expect(steps[0]).toBeGreaterThanOrEqual(2);
      expect(steps[0]).toBeLessThanOrEqual(4);
      for (let k = 1; k < steps.length; k++) {
        expect(steps[k] - steps[k - 1]).toBeGreaterThanOrEqual(3);
        expect(steps[k] - steps[k - 1]).toBeLessThanOrEqual(5);
      }
    }
  });

  it('is deterministic and depends on the words', () => {
    const line = 'THE ONLY WINNING MOVE IS NOT TO PLAY HOW ABOUT A NICE GAME OF CHESS'.split(' ');
    const a = planWoprLevels(line.length, '?', 7, line);
    expect(planWoprLevels(line.length, '?', 7, line)).toEqual(a);
    expect(planWoprLevels(3, '?', 7)).toEqual([90, 90, 128]);
  });
});

describe('segmentWords', () => {
  it('finds the words between energy dips', () => {
    const segments = segmentWords(threeWords(), FS);
    expect(segments).toHaveLength(3);
    const seconds = segments.map(({ start, end }) => [start / FS, end / FS]);
    expect(seconds[0][0]).toBeCloseTo(0.1, 1);
    expect(seconds[2][1]).toBeCloseTo(1.12, 1);
  });

  it('keeps only the deepest dips when the text has fewer words', () => {
    expect(segmentWords(threeWords(), FS, 2)).toHaveLength(2);
  });

  it('divides evenly by the word count when there is no dip at all', () => {
    expect(segmentWords(word(120, 120, 0.9, 0.3), FS, 3)).toHaveLength(3);
    expect(segmentWords(new Float32Array(2400), FS, 3)).toEqual([]);
  });
});

describe('processWoprVoice', () => {
  it('flattens each word to its planned pitch and steps up on a question', () => {
    const out = processWoprVoice(threeWords(), FS, { text: 'SHALL WE PLAY?' });
    const spans = words(out);
    expect(spans).toHaveLength(3);
    const targets = planWoprLevels(3, '?', 0x3f0b, ['SHALL', 'WE', 'PLAY?']);
    expect(targets).toEqual([90, 90, 128]);
    spans.forEach(([from, to], i) => {
      const length = to - from;
      const early = pitchOf(out, from + Math.round(0.15 * length), from + Math.round(0.45 * length));
      const late = pitchOf(out, from + Math.round(0.45 * length), from + Math.round(0.75 * length));
      expect(Math.abs(early.hz - targets[i])).toBeLessThan(3);
      // Flat inside the word: well under the 0.5 st the doc allows.
      expect(Math.abs(semitones(early.hz, late.hz))).toBeLessThan(0.5);
    });
  });

  it.each([
    ['.', 79],
    ['!', 105],
  ] as const)('ends a "%s" line flat at %d Hz', (punctuation, hz) => {
    const out = processWoprVoice(threeWords(), FS, { text: `ONE TWO THREE${punctuation}` });
    const [from, to] = words(out)[2];
    const length = to - from;
    expect(Math.abs(pitchOf(out, from + Math.round(0.2 * length), from + Math.round(0.7 * length)).hz - hz)).toBeLessThan(3);
  });

  it('splices the words with 80 ms of silence', () => {
    const out = processWoprVoice(threeWords(), FS, { text: 'ONE TWO THREE' });
    const gaps = silentRuns(out).map(([, length]) => length / FS);
    expect(gaps).toHaveLength(2);
    for (const gap of gaps) expect(gap).toBeCloseTo(0.08, 2);
  });

  it('pauses 110 ms at commas and 250 ms at sentence ends', () => {
    const comma = silentRuns(processWoprVoice(threeWords(), FS, { text: 'YES, NO MAYBE.' })).map(([, n]) => n / FS);
    expect(comma[0]).toBeCloseTo(0.11, 2);
    expect(comma[1]).toBeCloseTo(0.08, 2);
    const stop = silentRuns(processWoprVoice(threeWords(), FS, { text: 'GO. NOW STOP.' })).map(([, n]) => n / FS);
    expect(stop[0]).toBeCloseTo(0.25, 2);
    expect(stop[1]).toBeCloseTo(0.08, 2);
  });

  it('uses even gaps when the text does not match the words found', () => {
    const gaps = silentRuns(processWoprVoice(threeWords(), FS, { text: 'A, B. C D E?' })).map(([, n]) => n / FS);
    expect(gaps).toHaveLength(2);
    for (const gap of gaps) expect(gap).toBeCloseTo(0.08, 2);
  });

  it('evens out word loudness to within 2 dB', () => {
    const out = processWoprVoice(threeWords(), FS, { text: 'ONE TWO THREE' });
    const levels = words(out).map(([from, to]) => 20 * Math.log10(rms(out.subarray(from, to))));
    expect(Math.max(...levels) - Math.min(...levels)).toBeLessThan(2);
  });

  it('keeps unvoiced sounds noisy instead of buzzing', () => {
    const hiss = concat(silence(0.1), noise(0.3, 0.1, 4), silence(0.1));
    const out = processWoprVoice(hiss, FS, { text: 'SS' });
    const [from, to] = words(out)[0];
    expect(estimatePitch(out.subarray(from + 1200, to - 1200), FS).strength).toBeLessThan(0.4);
  });

  it('never applies 8-bit quantisation and peaks at -3 dBFS', () => {
    const out = processWoprVoice(threeWords(), FS, { text: 'ONE TWO THREE' });
    expect(new Set(Array.from(out, (v) => Math.round(v * 32768))).size).toBeGreaterThan(2000);
    const peak = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak).toBeCloseTo(10 ** (-3 / 20), 3);
  });

  it('is deterministic and keeps silence silent', () => {
    const input = threeWords();
    expect(Array.from(processWoprVoice(input, FS, { text: 'A B C' }))).toEqual(
      Array.from(processWoprVoice(input, FS, { text: 'A B C' })),
    );
    expect(processWoprVoice(new Float32Array(4800), FS).every((v) => v === 0)).toBe(true);
  });

  it('processes five seconds of 24 kHz speech in under 150 ms', () => {
    const parts: Float32Array[] = [];
    for (let k = 0; k < 13; k++) parts.push(word(110 + 5 * k, 150, 0.3, 0.2), silence(0.08));
    const input = concat(...parts).subarray(0, 5 * FS);
    const text = 'one two three four five six seven eight nine ten eleven twelve thirteen.';
    // About 75 ms standalone.
    expect(bestCpuMs(() => processWoprVoice(input, FS, { text }))).toBeLessThan(150);
  });
});

/** RMS of the second half (past the filter's start-up transient). */
const tailRms = (a: Float32Array) => Math.sqrt(a.subarray(a.length >> 1).reduce((s, v) => s + v * v, 0) / (a.length >> 1));

/** Gain in dB of one steady tone through the WOPR band-limit at 16 kHz. */
function bandGain(freq: number, fs = 16000): number {
  const x = Float32Array.from({ length: fs }, (_, i) => 0.3 * Math.sin((2 * Math.PI * freq * i) / fs));
  return 20 * Math.log10(tailRms(woprBandLimit(x, fs)) / tailRms(x));
}

describe('woprBandLimit', () => {
  const gain = bandGain;

  it('applies the specified WOPR band: thin below 200 Hz, dark above 4 kHz', () => {
    // A 4th-order 220 Hz high-pass alone gives about -13.5 dB at 150 Hz; the
    // measured -17 to -20 dB for 100-200 Hz also includes the voice's own slope.
    const ref = gain(600);
    expect(gain(150) - ref).toBeLessThan(-12);
    expect(gain(100) - ref).toBeLessThan(-25);
    expect(gain(6000) - ref).toBeLessThan(-25);
    expect(gain(2500) - gain(1000)).toBeGreaterThan(1);
  });
});
