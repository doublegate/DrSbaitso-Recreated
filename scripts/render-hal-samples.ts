/**
 * Renders HAL 9000 voice candidates for listening (ref-docs/09 section 6.1:
 * A/B Algieba, Iapetus, Charon, Schedar; target median F0 about 99 Hz with a
 * small pitch SD).
 *
 *   npx tsx --env-file=.env.local scripts/render-hal-samples.ts
 *   (TTS_MODEL=<model> to use one model, e.g. the lite fallback)
 *
 * Writes voice-samples/hal/ (gitignored): one WAV per voice and variant, and
 * index.html to play them side by side. Each voice is one TTS request with the
 * same text and style the app sends for HAL.
 *
 * Variants:
 *   A raw      Gemini output, no processing
 *   B app      the app's current HAL chain (processHalVoice)
 *   C pitched  shifted to a 99 Hz median, then the HAL chain
 *   D warm     C plus extra low-end warmth and a softened top (gentle de-ess)
 */
import { GoogleGenAI } from '@google/genai';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CHARACTERS } from '../src/constants';
import { applyPronunciation, DEFAULT_MODELS, pcmFromWav, resamplePcm16, toSentenceCase } from '../api/_lib/gemini';
import { processHalVoice } from '../src/utils/personaVoices';
import { estimatePitch } from '../src/utils/lpcMonotone';
import { resampleBy, timeStretch } from '../src/utils/timeStretch';
import { applyBiquad, designBiquad } from '../src/utils/biquad';

const VOICES = ['Algieba', 'Iapetus', 'Charon', 'Schedar'];
const TARGET_HZ = 99;
const RATE = 24000;
// Written for this project (no film dialogue).
const LINES = [
  'Good afternoon, Alice. Everything aboard is running smoothly, and I am feeling very well.',
  'I understand that you are tired. Perhaps you should rest for a while, and we can talk again later.',
  "I'm sorry, Alice. I don't think that would be a good idea right now.",
];

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is not set (run with --env-file=.env.local).');
const client = new GoogleGenAI({ apiKey });
const hal = CHARACTERS.find((c) => c.id === 'hal9000')!;
const text = applyPronunciation('hal9000', toSentenceCase(LINES.join(' ')));

async function synthesize(voiceName: string): Promise<Float32Array> {
  let lastError: unknown;
  // TTS_MODEL picks one model (e.g. when the primary's daily quota is spent).
  const models = process.env.TTS_MODEL ? [process.env.TTS_MODEL] : [DEFAULT_MODELS.tts, ...DEFAULT_MODELS.ttsFallbacks];
  for (const model of models) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text, speechMetadata: { style: hal.voiceStyle } } as never] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      });
      const inline = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!inline?.data) throw new Error('no audio');
      let bytes: Uint8Array = Buffer.from(inline.data, 'base64');
      let rate = Number(/rate=(\d+)/.exec(inline.mimeType ?? '')?.[1]) || RATE;
      if (/wav/i.test(inline.mimeType ?? '')) {
        const parsed = pcmFromWav(bytes);
        if (!parsed) throw new Error('unreadable WAV');
        bytes = parsed.pcm;
        rate = parsed.sampleRate;
      }
      bytes = resamplePcm16(bytes, rate, RATE);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return Float32Array.from({ length: bytes.byteLength / 2 }, (_, i) => view.getInt16(i * 2, true) / 32768);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Median F0 and its spread in semitones over voiced 40 ms frames. */
function pitchStats(x: Float32Array): { median: number; sdSemitones: number } {
  const frame = Math.round(RATE * 0.04);
  const values: number[] = [];
  for (let i = 0; i + frame <= x.length; i += frame) {
    const slice = x.subarray(i, i + frame);
    let energy = 0;
    for (const v of slice) energy += v * v;
    if (Math.sqrt(energy / frame) < 0.02) continue;
    const { hz, strength } = estimatePitch(slice, RATE, 60, 300);
    if (hz > 0 && strength > 0.6) values.push(hz);
  }
  if (values.length === 0) return { median: 0, sdSemitones: 0 };
  values.sort((a, b) => a - b);
  const median = values[Math.floor(values.length / 2)];
  const st = values.map((v) => 12 * Math.log2(v / median));
  const mean = st.reduce((s, v) => s + v, 0) / st.length;
  return { median, sdSemitones: Math.sqrt(st.reduce((s, v) => s + (v - mean) ** 2, 0) / st.length) };
}

/** Pitch shift keeping duration: WSOLA to compensate, then resample. */
function shiftPitch(x: Float32Array, factor: number): Float32Array {
  return factor === 1 ? x : resampleBy(timeStretch(x, RATE, 1 / factor), factor);
}

function peakNormalise(x: Float32Array, peakDb = -3): Float32Array {
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0 ? 10 ** (peakDb / 20) / peak : 1;
  return x.map((v) => v * gain);
}

function wav(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const out = path.resolve(import.meta.dirname, '../voice-samples/hal');
mkdirSync(out, { recursive: true });
const rows: string[] = [];
for (const voice of VOICES) {
  process.stdout.write(`${voice}: `);
  const raw = await synthesize(voice);
  const stats = pitchStats(raw);
  const factor = stats.median > 0 ? TARGET_HZ / stats.median : 1;
  const app = processHalVoice(raw, RATE, { text });
  const pitched = processHalVoice(shiftPitch(raw, factor), RATE, { text });
  let warm = applyBiquad(pitched, designBiquad('lowshelf', 150, RATE, Math.SQRT1_2, 2));
  warm = applyBiquad(warm, designBiquad('highshelf', 6500, RATE, Math.SQRT1_2, -4));
  const variants: Record<string, Float32Array> = {
    'A-raw': peakNormalise(raw),
    'B-app': app,
    'C-pitched': pitched,
    'D-warm': peakNormalise(warm),
  };
  const cells = Object.entries(variants).map(([name, samples]) => {
    const file = `${voice}-${name}.wav`;
    writeFileSync(path.join(out, file), wav(samples));
    return `<td><audio controls preload="none" src="${file}"></audio></td>`;
  });
  const shift = (12 * Math.log2(factor)).toFixed(1);
  rows.push(
    `<tr><th>${voice}</th><td>${stats.median.toFixed(0)} Hz</td><td>${stats.sdSemitones.toFixed(1)} st</td><td>${shift} st</td>${cells.join('')}</tr>`,
  );
  console.log(
    `median ${stats.median.toFixed(0)} Hz, SD ${stats.sdSemitones.toFixed(1)} st, shift to 99 Hz ${shift} st`,
  );
}

writeFileSync(
  path.join(out, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>HAL voice candidates</title>
<style>body{font:15px system-ui;margin:24px;background:#111;color:#eee}td,th{padding:6px 10px;border-bottom:1px solid #333;text-align:left}audio{width:220px}</style>
<h1>HAL 9000 voice candidates</h1>
<p>Model: ${process.env.TTS_MODEL ?? DEFAULT_MODELS.tts}. Same text and style for every voice. Target (ref-docs/09): median about 99 Hz, small pitch SD.</p>
<p><b>A</b> raw Gemini &middot; <b>B</b> app's current HAL chain &middot; <b>C</b> shifted to 99 Hz + chain &middot; <b>D</b> C + warmer, softer top</p>
<p><i>${LINES.join('<br>')}</i></p>
<table><tr><th>Voice</th><th>Median F0</th><th>Pitch SD</th><th>Shift for C/D</th><th>A raw</th><th>B app</th><th>C pitched</th><th>D warm</th></tr>
${rows.join('\n')}</table>`,
);
console.log(`written to ${out}`);
