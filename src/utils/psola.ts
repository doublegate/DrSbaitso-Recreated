/**
 * Time-domain pitch-synchronous overlap-add (TD-PSOLA): changes the pitch of
 * speech without changing its duration or its formants (the timbre stays the
 * speaker's). Used to narrow a voice's pitch movement and set its median
 * pitch (ref-docs/09 section 6.2, stages 3 and 4), which the LPC pulse train
 * in lpcMonotone.ts must not be used for: that sounds buzzy and robotic.
 */
import { estimatePitch } from './lpcMonotone';

export interface PitchFrame {
  /** Centre of the frame, in samples. */
  at: number;
  /** Fundamental frequency in Hz, or 0 when the frame is unvoiced or silent. */
  hz: number;
}

const HOP_SECONDS = 0.01;
const WINDOW_SECONDS = 0.04;
/** Unvoiced stretches are overlap-added at this spacing, unchanged. */
const UNVOICED_HOP_SECONDS = 0.005;

/** Frame-wise pitch (10 ms hop, 40 ms window), 3-frame median smoothed. */
export function pitchTrack(x: Float32Array, sampleRate: number, minHz = 60, maxHz = 300): PitchFrame[] {
  const hop = Math.round(sampleRate * HOP_SECONDS);
  const win = Math.round(sampleRate * WINDOW_SECONDS);
  const frames: { at: number; hz: number; rms: number }[] = [];
  let loudest = 0;
  for (let start = 0; start + win <= x.length; start += hop) {
    const slice = x.subarray(start, start + win);
    let energy = 0;
    for (const v of slice) energy += v * v;
    const rms = Math.sqrt(energy / win);
    loudest = Math.max(loudest, rms);
    const { hz, strength } = estimatePitch(slice, sampleRate, minHz, maxHz);
    frames.push({ at: start + win / 2, hz: strength > 0.5 ? hz : 0, rms });
  }
  const gate = Math.max(1e-4, loudest * 0.08);
  const raw = frames.map((f) => (f.rms >= gate ? f.hz : 0));
  return frames.map((f, i) => {
    if (raw[i] === 0) return { at: f.at, hz: 0 };
    const near = [raw[i - 1], raw[i], raw[i + 1]].filter((v) => v !== undefined && v > 0).sort((a, b) => a - b);
    return { at: f.at, hz: near[Math.floor(near.length / 2)] };
  });
}

export interface CompressPitchOptions {
  /**
   * Scales each frame's distance from the median, in semitones: 1 keeps the
   * melody, 0.5 halves its range, 0 makes it flat.
   */
  factor: number;
  /** Median pitch of the result; default: the input's median (no shift). */
  targetHz?: number;
}

function hann(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / n);
  return w;
}

/**
 * Narrows (or widens) the pitch movement around the median and optionally
 * moves the median, keeping duration and formants. Returns a copy when the
 * input has no voiced speech.
 */
export function compressPitch(x: Float32Array, sampleRate: number, options: CompressPitchOptions): Float32Array {
  const track = pitchTrack(x, sampleRate);
  const voiced = track
    .filter((f) => f.hz > 0)
    .map((f) => f.hz)
    .sort((a, b) => a - b);
  if (voiced.length === 0) return Float32Array.from(x);
  const median = voiced[Math.floor(voiced.length / 2)];
  const target = options.targetHz ?? median;
  const hop = Math.round(sampleRate * HOP_SECONDS);
  const firstAt = track[0]?.at ?? 0;

  /** F0 at a sample (nearest frame), 0 when unvoiced. */
  const f0At = (pos: number) =>
    track[Math.max(0, Math.min(track.length - 1, Math.round((pos - firstAt) / hop)))]?.hz ?? 0;

  // Analysis marks: one per pitch period on voiced stretches (snapped to the
  // waveform peak), a fixed small hop elsewhere.
  const unvoicedHop = Math.round(sampleRate * UNVOICED_HOP_SECONDS);
  const marks: { pos: number; period: number; voiced: boolean }[] = [];
  for (let pos = 0; pos < x.length;) {
    const hz = f0At(pos);
    if (hz > 0) {
      const period = Math.round(sampleRate / hz);
      const radius = Math.max(1, Math.floor(period / 4));
      let best = pos;
      for (let i = Math.max(0, pos - radius); i <= Math.min(x.length - 1, pos + radius); i++) {
        if (x[i] > x[best]) best = i;
      }
      const last = marks.at(-1);
      const snapped = last && best <= last.pos ? pos : best;
      marks.push({ pos: snapped, period, voiced: true });
      pos = snapped + period;
    } else {
      marks.push({ pos, period: unvoicedHop, voiced: false });
      pos += unvoicedHop;
    }
  }

  const out = new Float32Array(x.length);
  const weight = new Float32Array(x.length);
  let mark = 0;
  for (let t = marks[0].pos; t < x.length;) {
    // Same timeline in and out (duration kept): use the analysis mark nearest t.
    while (mark + 1 < marks.length && Math.abs(marks[mark + 1].pos - t) <= Math.abs(marks[mark].pos - t)) mark++;
    const m = marks[mark];
    const half = m.period;
    const window = hann(2 * half + 1);
    for (let k = -half; k <= half; k++) {
      const src = m.pos + k;
      const dst = Math.round(t) + k;
      if (src < 0 || src >= x.length || dst < 0 || dst >= x.length) continue;
      const w = window[k + half];
      out[dst] += x[src] * w;
      weight[dst] += w;
    }
    let step = m.period;
    if (m.voiced) {
      const hz = sampleRate / m.period;
      const newHz = target * 2 ** ((options.factor * 12 * Math.log2(hz / median)) / 12);
      step = sampleRate / newHz;
    }
    t += Math.max(1, step);
  }
  for (let i = 0; i < out.length; i++) {
    if (weight[i] > 0.05) out[i] /= weight[i];
    else if (weight[i] === 0) out[i] = x[i];
  }
  return out;
}
