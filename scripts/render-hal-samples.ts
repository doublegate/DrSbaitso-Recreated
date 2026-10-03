/**
 * Renders and scores HAL 9000 voice candidates against the measured targets in
 * ref-docs/09 (section 2.2 and the section 7 checklist): median F0 about
 * 99 Hz, per-utterance pitch SD about 2.1 st, level question endings, and
 * 4.3-4.7 syllables per second.
 *
 *   npx tsx --env-file=.env.local scripts/render-hal-samples.ts
 *   (TTS_MODELS=a,b and VOICES=a,b narrow the run; STYLE=... tries other direction;
 *   RESCORE=1 re-measures saved WAVs)
 *
 * Writes voice-samples/hal/ (gitignored): per model and voice, the raw render
 * and a "faithful" version (TD-PSOLA to the target median and spread, then
 * the app's HAL chain), plus index.html ranking them by distance from the
 * targets. Qualities are described in words only; no performer is named and
 * no film audio is used (ref-docs/09 section 5).
 */
import { GoogleGenAI } from '@google/genai';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CHARACTERS } from '../src/constants';
import { applyPronunciation, pcmFromWav, resamplePcm16, toSentenceCase } from '../api/_lib/gemini';
import { countSyllables, processHalVoice } from '../src/utils/personaVoices';
import { compressPitch, pitchTrack } from '../src/utils/psola';

const RATE = 24000;
const TARGET = { hz: 99, sd: 2.1, rate: 4.5 };
const MODELS = (process.env.TTS_MODELS ?? 'gemini-3.8-flash-tts,gemini-2.5-pro-preview-tts').split(',');
const VOICES = (
  process.env.VOICES ?? 'Algieba,Charon,Schedar,Iapetus,Sadaltager,Gacrux,Rasalgethi,Orus,Alnilam,Achernar'
).split(',');

// The app's HAL direction (src/constants.ts); STYLE=... tries another.
const STYLE = process.env.STYLE ?? CHARACTERS.find((c) => c.id === 'hal9000')!.voiceStyle;

// Written for this project (no film dialogue). Ends on a question to measure its contour.
const LINES = [
  'Good afternoon, Alice. Everything aboard is running smoothly, and all of my systems are working perfectly.',
  'I have checked the oxygen, the power, and the navigation, and everything is in order.',
  'Are you feeling a little better today?',
];
const text = applyPronunciation('hal9000', toSentenceCase(LINES.join(' ')));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && !process.env.RESCORE) throw new Error('GEMINI_API_KEY is not set (run with --env-file=.env.local).');
const client = new GoogleGenAI({ apiKey: apiKey ?? '' });

async function synthesize(model: string, voiceName: string): Promise<Float32Array> {
  // 2.5 models take direction inline; 3.x models take it in speechMetadata.style.
  const part = model.startsWith('gemini-2.5')
    ? { text: `Say in ${STYLE}: ${text}` }
    : ({ text, speechMetadata: { style: STYLE } } as never);
  const response = await client.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [part] }],
    config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
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
}

const st = (a: number, b: number) => 12 * Math.log2(a / b);

/** Seconds of speech: 10 ms frames whose RMS is above 8% of the loudest frame. */
function activeTime(x: Float32Array): number {
  const frame = Math.round(RATE * 0.01);
  const rms: number[] = [];
  for (let i = 0; i + frame <= x.length; i += frame) {
    let e = 0;
    for (let k = i; k < i + frame; k++) e += x[k] * x[k];
    rms.push(Math.sqrt(e / frame));
  }
  const gate = Math.max(...rms) * 0.08;
  return rms.filter((r) => r > gate).length * 0.01;
}

interface Measure {
  median: number;
  sd: number;
  questionEnd: number;
  rate: number;
  score: number;
}

/** The ref-docs/09 section 7 measurements, and a distance from the targets (lower is closer). */
function measure(x: Float32Array): Measure {
  const track = pitchTrack(x, RATE);
  const voiced = track.filter((f) => f.hz > 0);
  const sorted = voiced.map((f) => f.hz).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const semis = sorted.map((hz) => st(hz, median));
  const mean = semis.reduce((s, v) => s + v, 0) / Math.max(1, semis.length);
  const sd = Math.sqrt(semis.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, semis.length));
  // The last 300 ms of voicing (the question) against the median.
  const lastAt = voiced.at(-1)?.at ?? 0;
  const tail = voiced
    .filter((f) => f.at >= lastAt - RATE * 0.3)
    .map((f) => f.hz)
    .sort((a, b) => a - b);
  const questionEnd = tail.length ? st(tail[Math.floor(tail.length / 2)], median) : 0;
  // Speaking rate over the active time: 10 ms frames louder than 8% of the loudest.
  const activeSeconds = activeTime(x);
  const rate = countSyllables(text) / Math.max(0.1, activeSeconds);
  const score =
    Math.abs(st(median, TARGET.hz)) / 2 +
    Math.abs(sd - TARGET.sd) +
    Math.abs(questionEnd) / 1.5 +
    Math.abs(rate - TARGET.rate);
  return { median, sd, questionEnd, rate, score };
}

function wav(samples: Float32Array): Buffer {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0 ? 0.7 / peak : 1;
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * gain * 32767))), i * 2));
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
const results: { model: string; voice: string; raw: Measure; faithful: Measure; files: [string, string] }[] = [];

/** Reads a WAV this script wrote (16-bit mono). */
function readWav(file: string): Float32Array {
  const b = readFileSync(file);
  return Float32Array.from({ length: (b.length - 44) / 2 }, (_, i) => b.readInt16LE(44 + i * 2) / 32768);
}

for (const model of MODELS) {
  for (const voice of VOICES) {
    const label = `${model.replace(/^gemini-/, '')} ${voice}`;
    try {
      // RESCORE=1 re-measures the WAVs already written instead of calling the API.
      const stemName = `${model.replace(/^gemini-/, '')}-${voice}`;
      const raw = process.env.RESCORE ? readWav(path.join(out, `${stemName}-raw.wav`)) : await synthesize(model, voice);
      const before = measure(raw);
      // Narrow the melody to the target spread and set the median, then the app chain.
      const factor = before.sd > TARGET.sd ? TARGET.sd / before.sd : 1;
      const faithful = processHalVoice(compressPitch(raw, RATE, { factor, targetHz: TARGET.hz }), RATE, { text });
      const after = measure(faithful);
      const stem = `${model.replace(/^gemini-/, '')}-${voice}`;
      writeFileSync(path.join(out, `${stem}-raw.wav`), wav(raw));
      writeFileSync(path.join(out, `${stem}-faithful.wav`), wav(faithful));
      results.push({ model, voice, raw: before, faithful: after, files: [`${stem}-raw.wav`, `${stem}-faithful.wav`] });
      console.log(
        `${label}: raw ${before.median.toFixed(0)} Hz, SD ${before.sd.toFixed(1)} st, q ${before.questionEnd.toFixed(1)} st, ${before.rate.toFixed(1)} syl/s, score ${before.score.toFixed(2)}`,
      );
    } catch (error) {
      console.log(`${label}: failed (${error instanceof Error ? error.message.slice(0, 80) : 'error'})`);
    }
  }
}

results.sort((a, b) => a.raw.score - b.raw.score);
const fmt = (m: Measure) =>
  `${m.median.toFixed(0)} Hz &middot; ${m.sd.toFixed(1)} st &middot; q ${m.questionEnd >= 0 ? '+' : ''}${m.questionEnd.toFixed(1)} &middot; ${m.rate.toFixed(1)} syl/s`;
const rows = results.map(
  (r, i) =>
    `<tr><td>${i + 1}</td><th>${r.voice}</th><td>${r.model.replace(/^gemini-/, '')}</td><td>${r.raw.score.toFixed(2)}</td>` +
    `<td>${fmt(r.raw)}<br><audio controls preload="none" src="${r.files[0]}"></audio></td>` +
    `<td>${fmt(r.faithful)}<br><audio controls preload="none" src="${r.files[1]}"></audio></td></tr>`,
);
writeFileSync(
  path.join(out, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>HAL voice candidates</title>
<style>body{font:15px system-ui;margin:24px;background:#111;color:#eee}td,th{padding:8px 10px;border-bottom:1px solid #333;text-align:left;vertical-align:top}audio{width:260px;margin-top:4px}small{color:#aaa}</style>
<h1>HAL 9000 voice candidates</h1>
<p>Targets (ref-docs/09, measured from the film): median <b>99 Hz</b>, pitch SD <b>2.1 st</b>, questions <b>level</b> (q near 0), <b>4.3-4.7</b> syl/s.
Ranked by the raw render's distance from those targets (lower score is closer).</p>
<p><b>Raw</b>: Gemini output with the new direction text. <b>Faithful</b>: raw, pitch movement narrowed to 2.1 st and centred on 99 Hz (TD-PSOLA, timbre kept), then the app's HAL chain.</p>
<p><small>Direction: ${STYLE}</small></p>
<p><i>${LINES.join(' ')}</i></p>
<table><tr><th>#</th><th>Voice</th><th>Model</th><th>Score</th><th>Raw</th><th>Faithful</th></tr>
${rows.join('\n')}</table>`,
);
console.log(`written to ${out}`);
