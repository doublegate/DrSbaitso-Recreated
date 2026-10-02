# Dr. Sbaitso: Speech Engine, Voice and Audio

Research date: 2026-10-02. Scope: the speech synthesizer, its output format and timbre, the voice
parameters and commands, pronunciation behaviour, and how to approximate all of it in a browser.
Program history, the conversation engine and the visual UI are covered in
`01-history-and-behavior.md` and `03-screen-and-ui.md`.

Confidence labels:

- **CONFIRMED**: a primary source (an original binary, its string table, a patent, or a measurement
  of the original engine running), or two or more independent secondary sources.
- **LIKELY**: one credible source, or a direct inference from primary data.
- **UNVERIFIED**: repeated online without a traceable source, or an untested recommendation.

## Method

There are three kinds of evidence, listed here from strongest to weakest.

1. **The original engine, run and measured [M].** The MIT-licensed NVDA add-on
   `joshknnd1982/smoothTalker-sbaitso` [2] ships `engine.bin`, a conventional-memory snapshot taken
   with Creative's `SBTALKER.EXE` resident. It also ships `core.py`, which runs that image under
   the Unicorn CPU emulator and captures what the engine sends to an emulated Sound Blaster DSP and
   8237 DMA controller. I ran it locally (Python 3.14, `unicorn` 2.1.4) in a scratch directory. I
   logged every DSP command and synthesized test phrases. I then measured pitch (autocorrelation,
   40 ms frames), spectrum (Welch, 512 to 1024 points), duration and pauses with numpy/scipy. The
   engine is deterministic, so a byte-identical output for two input strings proves the engine
   pronounces them the same way. Section 5 uses that test. Nothing from the image was copied into
   this repository.
2. **The original binaries' strings [5].** The archive.org `SBAITSO_VGA` package contains
   `SBAITSO2.EXE` v2.20, `SBTALKER.EXE`, `BLASTER.DRV`, `READ.EXE`, `SET-ECHO.EXE` and the batch
   files. Short fragments are quoted below.
3. **Patents, period press, forum posts and documentation** [3][4][6][7][11][12][13].

Caveat on [M]: the image was captured under DOSBox (its environment block shows
`BLASTER=A220 I7 D1 H5 T6`). The sound comes from emulation, not from a real card. Everything the
engine *computes* (samples, rate, timing) is the original code's output. The analog stage of a real
card (filter, amplifier) is not modelled. Section 3.4 covers that stage separately.

---

## 1. Summary

1. **The engine is First Byte SmoothTalker 3.5, male voice. Creative did not write it.**
   `SBTALKER.EXE` identifies itself as "SmoothTalker (R), Version 3.5, male voice", (c) 1983-1990
   First Byte. It also cites U.S. patents 4,692,941 and 4,617,645 [5][2]. Wikipedia's "a version of
   Monologue" [1] is a loose label. Monologue was First Byte's 1990-91 retail successor to
   SmoothTalker [6]. CONFIRMED.
2. **It is a concatenative, waveform-segment synthesizer. It is neither a Klatt formant
   synthesizer nor pure "rule-based" synthesis.** The main patent describes storing single
   digitized pitch periods of a real voice per phoneme. Those periods are repeated to build a
   sound, interpolated between phonemes for transitions, and pitch-shifted by truncating or
   padding each period [3]. A second patent covers a 4-bit predictive compression of those
   waveforms [4]. Letter-to-sound rules turn text into phonemes first [3][6]. CONFIRMED.
3. **The output is 8475 Hz, 8-bit unsigned, mono. It is not 11.025 kHz.** The engine programs DSP
   time constant 138, and 1,000,000 / (256 - 138) = 8474.6 Hz. It plays through DSP command `0x14`
   (8-bit single-cycle DMA) in 1536-byte blocks of about 181 ms [M]. The add-on author states the
   same rate [2]. CONFIRMED.
4. **The timbre is dark and bass-heavy, not "telephone band".** At the default settings the
   spectral centroid is about 500 Hz. About 70% of the power lies between 300 Hz and 1 kHz, and
   about 20% lies *below* 300 Hz. Bands above 2 kHz are 24 to 31 dB below the 300-500 Hz peak [M].
   Section 3.3 has the full table. CONFIRMED (measured).
5. **The pitch is a low male voice moving in steps, not a dead monotone.** At default pitch 5 the
   median F0 is about 90-95 Hz. The pitch holds flat on each syllable and steps between syllables.
   It falls to about 62-80 Hz at a period and rises to about 120-155 Hz at a question mark or an
   exclamation mark [M]. The patent [3] and 1991 press [6] both describe question rises and
   statement falls. CONFIRMED.
6. **Speaking rate is moderately fast with very short pauses.** At default speed it runs at about
   3.6 to 4.7 syllables per second, roughly 150 to 210 wpm. Pauses at commas and sentence ends are
   only about 55 to 185 ms [M]. CONFIRMED (measured).
7. **The user controls four voice parameters.** Tone 0/1 (Bass/Treble), Volume 0-9, Pitch 0-9 and
   Speed 0-9 are set through `.TONE`, `.VOLUME`, `.PITCH`, `.SPEED` and `.PARAM tvps`. There is also
   `.MASTER` 0-15 for the mixer master volume [5]. The defaults are probably Tone 0, Volume 5,
   Pitch 5, Speed 5 [2]. Ranges: CONFIRMED. Defaults: LIKELY.
8. **"SBAITSO" is spoken as two syllables, "SBAYT-so".** It is not three syllables
   ("SUH-BAIT-SO"), which is what the project's pronunciation override currently forces [M][1].
   CONFIRMED.
9. **The project's main parameter values are not supported by evidence.** The 11.025 kHz rate, the
   300 Hz high-pass, the 6-bit "authentic" crush and the 1.1x playback rate all need changing.
   Section 7 gives the replacement values.

---

## 2. Speech engine lineage

### 2.1 Product line

| Item | Finding | Confidence | Source |
|---|---|---|---|
| Developer | First Byte, Santa Ana, CA. Later a Davidson & Associates subsidiary. Patent assignment records later list Sierra Entertainment | CONFIRMED | [3][4][6] |
| SmoothTalker origin | 1984 (Macintosh first, then Apple IIgs and DOS) | CONFIRMED | [1][8] |
| DOS SmoothTalker | v1.1 (1988) for the Covox Speech Thing. Ships "V2" and "V3 (Dr Sbaitso)" voices | LIKELY | [8] |
| Engine in Dr. Sbaitso | SmoothTalker **3.5, male voice**, (c) 1983-1990 | CONFIRMED | [5][2] |
| Monologue | $149 retail TSR, "Monologue 2.0" in Feb 1991. Male or female voice, bass or treble tone. Supports Sound Blaster, IBM Speech Card, Tandy and others | CONFIRMED (for Monologue) | [6] |
| Wikipedia wording | "a version of Monologue" | Loose: the binary names SmoothTalker | [1][5] |
| Later engines | "Version 4" at 22 kHz in Zug games and Kid Works 2 (Windows). Monologue '97 v3.0 runs at 11025 Hz. A third-party API covers both the V3 (Sound Blaster only) and V4 (multi-device) DOS engines | LIKELY | [7][9][10] |

The 11025 Hz figure belongs to **Monologue '97** [9] and the 22 kHz figure to **SmoothTalker v4**
[7]. Neither applies to the 1990 SmoothTalker 3.5 that Dr. Sbaitso uses.

### 2.2 Roles of the DOS files (v2.20 package)

| File | Size | Role | Confidence | Source |
|---|---|---|---|---|
| `SBTALKER.EXE` | 177,879 B | The TSR. Holds the SmoothTalker 3.5 engine *and* its voice data. Takes a `/d<driver>` switch; the default driver name in the binary is `StandDac.drv` | CONFIRMED | [5] |
| `BLASTER.DRV` | 9,891 B | Creative's **output driver only**: "BLASTER.DRV Version SBP 1.0 ... 1991 Creative Labs ... J.Kiraly". Reads the `BLASTER` variable, programs the DSP time constant and starts DMA | CONFIRMED | [5][M] |
| `SBTALK.BAT` / `SBAITSO2.BAT` | - | `SBTALKER /dBLASTER`, then `SBAITSO2`, then `REMOVE` | CONFIRMED | [5] |
| `READ.EXE` | 17,050 B | "SOUND BLASTER Text-to-Speech Text Reader" (v1.00). Reads a quoted argument or stdin | CONFIRMED | [5] |
| `SET-ECHO.EXE` | 17,279 B | "Text-to-Speech Echo Set". Takes `echo_parameter` in the range 0-4000; its meaning is undocumented | CONFIRMED (range); meaning UNVERIFIED | [5] |
| `REMOVE.EXE` | 582 B | Unloads the TSR | CONFIRMED | [5] |

How text reaches the synthesizer: the client calls `INT 2Fh` with `AX=0FBFBh` and gets back
`ES:BX`, a descriptor. Its far entry point is at `[ES:BX+4]`. The text buffer is at `ES:BX+20h`:
one length byte (maximum 255 characters), then the text. The settings block (`gender, tone,
volume, pitch, speed, startpos, action`) sits at `buffer+200h`. `AL=2` applies settings and `AL=7`
speaks [2]. All of this was reverse-engineered, so it is LIKELY. The field names come from
First Byte's own binaries [2]. Synthesis is real-time and streams DMA block by block, so playback
starts before the whole utterance has been rendered [2][M].

### 2.3 Synthesis method

From US 4,692,941, "Real-time text-to-speech conversion system" (Jacks and Sprague, First Byte,
filed 1984, issued 1987) [3]:

- Text goes through **letter-to-sound rules** to give phonemes. The patent covers "the 50-odd
  phonemes" of English.
- Each voiced phoneme is stored as **one digitized voice period** of a real speaker. The period is
  repeated to sustain the sound. A voiced/unvoiced bit marks each segment.
- **Transitions** come from a 50x50 phoneme-pair table. They are built either by concatenating
  segments forward or in reverse, or by **interpolating** between two phonemes' periods.
- **Pitch** goes up by truncating the low-energy tail of each period and down by padding it with
  zero-valued samples. This keeps formant positions fixed. That is why changing the pitch setting
  moves F0 without changing vowel colour.
- **Micro-variation**: pitch is varied "1% at 4 Hz" for naturalness. **Intonation** raises the
  pitch before a question mark and lowers it before a period.
- **Speed** comes from shortening pauses and from changing the number of period repetitions.
- About 40-50 KB of waveform data.

US 4,617,645 (Sprague, 1986) [4] stores those waveforms with roughly 2:1 compression. Each sample
is predicted from the previous two samples, plus one of 16 increments chosen by a 4-bit code.

**Is it "formant synthesis"?** No, not in the Klatt/DECtalk sense of resonators excited by a
source. The Monologue '97 add-on's README calls the First Byte family "formant synthesizers" [9].
That describes the stored formant structure of each period, not resonator synthesis. For
SmoothTalker 3.5 the patents settle the question.

Measurement check [M]: in steady vowels, consecutive pitch periods are nearly sample-identical.
The median period is 94.5 samples, about 90 Hz. In the top decile of frames, about 80% of samples
match the previous period within 1 LSB, which fits the "repeat one stored period" design. No
literal runs of zeros inside periods were found at low pitch settings. Version 3.5 may smooth the
padding, or pad differently from the 1984 patent text. Treat zero-padding as **not audible** in
this version (LIKELY).

---

## 3. Output format and timbre

### 3.1 Format

| Property | Value | Confidence | Source |
|---|---|---|---|
| Sample rate | **8475 Hz** (time constant 138). Fixed: unchanged by the pitch, speed or tone settings, and unchanged when the emulator reports DSP 1.05, 2.01, 3.02 or 4.05 | CONFIRMED | [M][2] |
| Bit depth / coding | 8-bit **unsigned** PCM, centre code 128 | CONFIRMED | [M][2] |
| Channels | Mono | CONFIRMED | [M][11] |
| DSP commands | `D1` (speaker on), `40 8A` (time constant), `14 lo hi` (8-bit single-cycle DMA). No auto-init DMA | CONFIRMED | [M] |
| DMA block | 1536 bytes, about 181 ms (the last block is shorter) | CONFIRMED | [M] |
| Codes used | About 150-180 of 256 at volume 5. Peaks around 47..239 (about -2 dBFS). RMS about -17.5 dBFS | CONFIRMED | [M] |
| Nyquist limit | 4237 Hz. The engine produces nothing above it | CONFIRMED | arithmetic |

Single-cycle DMA re-arms the transfer at each block-end interrupt. On real SB 1.x hardware this
can leave tiny gaps or clicks at block boundaries. That is a well-known SB 1.x trait, but it has
not been checked against Sbaitso recordings, so it is UNVERIFIED for this program and not
recommended for emulation.

### 3.2 Pitch and prosody (default pitch 5, speed 5) [M]

| Utterance type | Measured F0 (Hz) | Shape |
|---|---|---|
| Statement body | 85-116, median about 90-95 | Flat plateaus per syllable (for example 88 88 88, then 99 99 99) with step changes |
| End with "." | Falls to about 62-80 | Final fall, followed by about 80-110 ms of trailing silence |
| End with "?" | Rises to about 120-156 | Steep rise on the last word |
| End with "!" | Rises to about 110-134 | Rise on the last word. Same length as ".", different contour |
| End with "," or no punctuation | Level, slight rise to about 97 | Continuation |

The add-on author reports a within-utterance range of about 48-110 Hz [2]. My autocorrelation
estimates put the body at a similar 70-115 Hz, with higher peaks on question rises. The 1991 press
called the result "sing-song" [6]. So the voice is **mechanical but not monotone**. It has
rule-driven, stepped intonation with no jitter, and that missing jitter is the source of the buzzy
"robot" quality. CONFIRMED.

### 3.3 Spectral target (long-term average, three test sentences) [M]

Band level in dB relative to the loudest band:

| Band (Hz) | 50-100 | 100-200 | 200-300 | 300-500 | 500-700 | 700-1k | 1-1.5k | 1.5-2k | 2-2.5k | 2.5-3k | 3-3.5k | 3.5-4.24k |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tone 0 (Bass, default) | -9 | -6 | -5 | **0** | -6 | -12 | -14 | -17 | -24 | -28 | -29 | -31 |
| Tone 1 (Treble) | -18 | -13 | -9 | **0** | -3 | -6 | -4 | -5 | -10 | -13 | -13 | -15 |

The default voice has a spectral centroid of about 490-560 Hz. Tone 1 raises it to about 1210 Hz,
cuts the energy below 300 Hz from about 20% to about 4%, and lowers the RMS by about 4 dB. The
add-on author describes Tone 1 the same way: it "cuts the low end" [2]. **The project's 300 Hz
high-pass is closer to Tone 1 than to the default.**

### 3.4 The card's analog stage

| Card | Playback filter | Confidence | Source |
|---|---|---|---|
| Sound Blaster 1.0 | Sallen-Key low-pass, about 4 kHz, on the DAC output | LIKELY | [11] |
| Sound Blaster Pro | About 3.2 kHz filter, software-switchable | LIKELY | [12] |
| SB Pro 2 | 2nd-order Butterworth, about 3.2 kHz | LIKELY | [12] |
| Sound Blaster 16 | Steep filter that tracks the sample rate | LIKELY | [12] |

The DAC holds each 8475 Hz sample until the next one arrives (zero-order hold). Spectral images of
the speech therefore appear at 8475 Hz plus or minus f. They are only partly removed by a
12 dB/octave filter at about 4 kHz. That residue is the plausible physical source of the "metallic"
edge people remember (LIKELY, by inference). It is **not** random noise, and it is not "pre-echo",
which is a transform-codec artifact.

---

## 4. Voice parameters and commands

From the `SBAITSO2.EXE` v2.20 help and prompt strings [5] (CONFIRMED), with measured effects [M]:

| Command | Range | Help text (short) | Measured effect at other settings = default |
|---|---|---|---|
| `.TONE t` | 0/1 | "0=Bass and 1=Treble tone" | 1 removes low end. Centroid about 490 to 1210 Hz |
| `.VOLUME v` | 0-9 | "0 for lowest volume" | RMS 0.024 (v0), 0.133 (v5), 0.357 (v9). Peak near full scale at 9, no clipping [2] |
| `.PITCH p` | 0-9 | "0 for lowest pitch" | Median F0 about 70 Hz (p1), 81 (p3), 94 (p5), 113 (p7), 151 (p9). The add-on reports about 41-154 Hz across 0-9 [2]. Higher pitch also shortens the phrase slightly (3.94 s at p0, 3.28 s at p9) |
| `.SPEED s` | 0-9 | "0 for lowest speed" | Same sentence: 5.52 s (s0), 4.15 (s3), 3.40 (s5), 2.92 (s7), 2.51 (s9). s9 is about 1.35x faster than default, s0 about 0.62x |
| `.PARAM tvps` | 4 digits | "Tone/Volume/Pitch/Speed". `<D>` restores defaults | Sets all four |
| `.MASTER m` | 0-15 | "for Master volume" | Mixer (SB Pro) master volume, not an engine parameter (LIKELY) |
| `.ECHO ON/OFF` | - | "will read out what you typed in" | Speaks the user's input. A claim online that echo uses "pitch 6" is UNVERIFIED |
| `R` | - | "listen to the last response" | Repeats the last utterance |
| `SAY ...` | - | "ask him to SAY anything" | Speaks arbitrary text |

Defaults: `SBAITSO2.EXE` writes gender 0, tone 0, volume 5, pitch 5, speed 5 to the parameter
block before initialising the engine [2]. That makes the default voice **Bass tone, mid pitch, mid
speed** (LIKELY: one reverse-engineering source, consistent with the engine image). The `gender`
field does nothing in the 3.5 male build: gender 1 produced byte-identical output [M][2]
(CONFIRMED).

---

## 5. Pronunciation notes

Byte-identical output means identical pronunciation [M]. "Not identical" can still be close,
because word spacing changes the prosody. Close matches were ranked by DTW distance over cepstral
features.

| Input | Engine behaviour | Confidence |
|---|---|---|
| Upper/lower case | Ignored: `HELLO` = `hello` = `Hello` | CONFIRMED |
| `SBAITSO` | Identical to `SBAYTSO` and `SBAI TSO`. Next closest is `SPAYTSO`. Far from `SUH BAIT SO` and from spelled `S B A I T S O`. The program sends the bare word: "MY NAME IS DOCTOR SBAITSO." [5] | CONFIRMED; matches Wikipedia's /ˈspeɪtsoʊ/, "SPAYT-soh" [1] |
| `DR.` / `MR.` / `VS.` / `PM` | Spelled as letters: identical to `D R`, `M R`, `V S`, `P M`. No abbreviation expansion. The program's own text writes `DOCTOR` in full [5] | CONFIRMED |
| `IRQ` | Read as a word, identical to `IRK` / `ERK` | CONFIRMED |
| `CPU` | Read as a word (closest: "cup you"), not spelled | LIKELY |
| `$5` | Identical to `FIVE DOLLARS` | CONFIRMED |
| `3:45` | Identical to `THREE FORTY FIVE` | CONFIRMED |
| `1991` | Closest to `NINETEEN NINETY ONE` (year style), not digit by digit | LIKELY |
| `42` | Not identical to `FORTY TWO`, but close in length | LIKELY: read as a number |
| `%` `#` `@` `+` `=` | Identical to `PERCENT`, `NUMBER`, `AT`, `PLUS`, `EQUALS` | CONFIRMED |
| `$` `[` `!` `/` alone | Silent | CONFIRMED |
| `...` | Adds about 160 ms over "." | CONFIRMED |
| Longer than 255 characters | Not possible in one call: one length byte. Clients must split | CONFIRMED [2] |

**Signature sounds.** The "parity error" glitch in the original was **spoken text**. The response
table has entries such as "PARITY ERR ... RECOVERED", "PARITY .. CHECKSUM ERR?", and lines with
embedded junk such as `FZA!$[{?`. All of these went to the TTS [5] (CONFIRMED). The engine reads
the junk as short broken fragments: for example, `FZA!$[{?` is about 0.4 s against 0.28 s for
`FZA` [M]. The original glitch had no white-noise burst. The project's `playGlitchSound` (0.2 s of
white noise) is an invention. See also `01-history-and-behavior.md`.

---

## 6. Approximating it in a browser

### 6.1 Can the original engine run in the browser?

Technically yes: the engine is about 640 KB of real-mode code. Two routes:

- Port `core.py` [2] to JS using unicorn.js (Unicorn compiled to WASM, **GPL-2.0**) [15].
- Write a small custom 8086 interpreter. The engine only needs real mode, a handful of `INT`
  services and SB/DMA port I/O [2].

The legal position decides this, not the engineering:

| Component | License | Implication |
|---|---|---|
| `smoothTalker-sbaitso` add-on code | MIT | Reusable with attribution [2] |
| Unicorn / unicorn.js | GPL-2.0 | Shipping it in the web app pulls GPL obligations onto the bundle [2][15] |
| `engine.bin` / `SBTALKER.EXE` | **Copyright First Byte**. The patents have expired; code and voice data have not. The add-on author warns that redistributing it is a takedown risk | **Do not bundle** [2] |
| SAM (`sam-js`) | No license. Reverse-engineered abandonware, "use at your own risk" | Do not bundle; it is also the wrong voice (C64 formant) [14] |

Recommended options, in order:

1. **Default: Gemini TTS plus a measured post-processing chain** (section 7). License-clean.
   Expected fidelity is moderate: the timbre and band-limit can match well; Gemini's prosody will
   leak through.
2. **Optional, opt-in "Original engine" mode, bring your own file.** The user supplies their own
   `SBTALKER.EXE` (or a captured image); the page emulates it client-side. No copyrighted bytes in
   the repo or the deploy. Effort is high. If unicorn.js is used, keep it as a separately loaded,
   GPL-licensed module and document that (UNVERIFIED legal reading: get advice before shipping).
3. **Clean-room "SmoothTalker-style" synthesizer.** The patented method [3][4] has expired and is
   free to implement: single-period concatenation, interpolated transitions, pitch by period
   truncation or padding, and stepped punctuation intonation. It would need its own voice data:
   about 50 phonemes' worth of single periods recorded or extracted from a licensed voice. This is
   the most authentic license-clean route, and the most work.

eSpeak NG is often suggested for a robotic voice. Its license is assumed to be GPL-3.0, but that
was not verified in this research (UNVERIFIED). Its timbre is formant-synthesized and does not
resemble SmoothTalker.

### 6.2 Can Gemini TTS style prompts get closer?

What the current Gemini docs show [13]:

- Models `gemini-3.8-flash-tts` and `gemini-3.8-flash-lite-tts`.
- Style is passed as a turn-level `speech_metadata.style` annotation, plus inline tags such as
  `<short pause>`.
- **The documented examples all use the Interactions API (`content[].annotations[]`).** The page
  has no `generateContent` example that places `speechMetadata` inside `parts`. That is what
  `api/_lib/gemini.ts` currently sends. **Verify that the style is actually honoured**, for example
  by A/B testing an extreme style such as "whispering". If it is silently dropped, every voice
  prompt in `constants.ts` does nothing. This is UNVERIFIED either way.
- `response_format.sample_rate` accepts 24000, 16000 or 8000. Voice descriptors include Charon
  "Informative", Fenrir "Excitable", Puck "Upbeat", Algenib "Gravelly", Schedar "Even" and Alnilam
  "Firm". There is also "voice design" (a persistent voice created from a text description).

What prompting can and cannot do (UNVERIFIED until listened to):

- A model trained on natural speech will not produce stepped plateaus or truncated-period buzz.
  Those must come from DSP.
- Prompting *can* move the starting point closer: a flat, even, unemotional delivery, a
  medium-fast steady pace, short pauses, and no breathiness or laughter.
- Asking for an "8-bit computer voice" invites the model to fake effects that the DSP chain then
  stacks on top of. Ask for the *delivery* and let the DSP supply the *medium*.

---

## 7. Recommendations for this project

Values are given with confidence and the file they belong in. "Measured" values come from the
original engine at its default settings [M].

### 7.1 `utils/vintageAudioProcessing.ts`, `AUTHENTICITY_PRESETS`

| Field | Current (Authentic / Ultra) | Recommended Authentic | Recommended Ultra | Confidence / basis |
|---|---|---|---|---|
| `targetSampleRate` | 11025 / 11025 | **8475** | **8475** | CONFIRMED [M][2] |
| `quantizationLevels` | 256 / 256 | 256, quantized **as unsigned 8-bit**: `q = clamp(round(x*128), -128, 127)/128` | 256 | CONFIRMED (format). The current `2/(levels-1)` step is a close approximation |
| Pre-quantize normalization | none | **Peak about 0.75 FS (about -2.5 dBFS), RMS about -17 dBFS** before quantizing, so quantization noise matches the original's use of about 150-180 codes | same | CONFIRMED [M] |
| `lowCutoff` | 300 / 300 | **80** (Tone 0 has about 20% of its power below 300 Hz) | 80 | CONFIRMED [M]. Keep 300 only for a "Treble" variant |
| `highCutoff` | 5000 / 5000 | **3800**, 2nd-order (Q 0.707), modelling the SB 1.x output filter. 5000 is above the 4237 Hz Nyquist and does nothing | **3200** (SB Pro filter) | LIKELY [11][12] |
| Spectral tilt (new) | none | **High-shelf about -8 dB from about 1.2 kHz**, or a 1st-order low-pass near 1 kHz mixed in. Tune until band levels match the section 3.3 Tone 0 row within plus or minus 3 dB | same | Target CONFIRMED [M]; filter choice LIKELY |
| DAC model (new; replaces `injectArtifacts`) | random noise times amplitude, plus a "pre-echo" one-tap filter | **Zero-order-hold upsample** from 8475 Hz to the context rate (repeat samples; do not let the browser interpolate), *then* the 2nd-order low-pass above. This reproduces the partial image leakage | same, with low-pass at 3200 | LIKELY (physics of the DAC; [11][12]) |
| `aliasingAmount`, `preEchoAmount` | 0.05/0.03, 0.12/0.08 | **0** (remove: neither models anything the hardware did) | 0 | CONFIRMED that they are not hardware behaviour |
| `pitchVarianceReduction` | 0.4 / 0.65 | Currently **dead config**: it is never read by any code. Either implement it (7.3) or delete it | - | CONFIRMED (code read) |
| `prosodyReduction` / `volumeVarianceReduction` | compressor | Keep a gentle compressor (the original is fairly level), but do not call it prosody reduction: it does not touch pitch | - | LIKELY |
| Processing order | prosody, LPF, resample, quantize, band-pass, artifacts | **Pitch work, then tilt EQ, then anti-alias LPF (about 3.9 kHz) and resample to 8475, then normalize, then 8-bit quantize, then ZOH upsample, then analog LPF (3.8 or 3.2 kHz) and HPF 80 Hz** | same | Mirrors the real signal path |

`SubtleVintage` can stay as a non-authentic convenience mode. Its description should not claim
period accuracy. The `getAuthenticityDescription` strings ("11 kHz, 8-bit") must change with the
rate.

### 7.2 `utils/audio.ts`, `PLAYBACK_BY_MODE` / `getPlaybackSettings`

| Mode | Current | Recommended | Why |
|---|---|---|---|
| `authentic` | `{ bitDepth: 0, playbackRate: 1.1 }` | `{ bitDepth: 0, playbackRate: 1.0 }` | `playbackRate` resamples, so 1.1 also raises pitch by 10% [16]. The original's pitch is set by the time constant and fixed. If faster delivery is wanted, time-stretch before the 8475 Hz step, or ask Gemini for a faster pace. Target 3.6-4.7 syllables per second (CONFIRMED [M]) |
| `ultra` | `{ bitDepth: 64, playbackRate: 1.1 }` | `{ bitDepth: 0, playbackRate: 1.0 }` | The extra 6-bit crush has no historical basis. The original is full 8-bit (CONFIRMED [M]) |
| `playAudio` defaults | `bitDepth = 64, playbackRate = 1.1` | `0` and `1.0` | Same reasons |

### 7.3 Pitch shaping (new; the main gap)

Gemini's natural intonation is the largest remaining difference. Two DSP options, in order of
fidelity:

1. **LPC resynthesis with a pulse-train source** (LIKELY closest). Fit LPC (order 10-12 at
   8475 Hz) per 10-20 ms frame of the Gemini speech. Re-excite voiced frames with a pulse train at
   a *target* F0 and unvoiced frames with noise. Identical periods, no jitter: this is the
   "repeated stored period" signature from [3].
2. **Phase-reset robotization.** Run an STFT with hop = sample rate / F0 and zero the phases. This
   is cheap and mono-pitched, but harsher than the original.

Target F0 contour, from the measured values in section 3.2 (CONFIRMED [M]):

- Base about **92 Hz**. Hold flat per syllable, with steps of about plus or minus 5-10 Hz between
  syllables.
- Last word before "." glides down to about **75 Hz**.
- Last word before "?" glides up to about **150 Hz**.
- Last word before "!" glides up to about **125 Hz**.
- Before "," or at an unpunctuated end, hold level or rise slightly to about 97 Hz.
- Optional micro-variation: **1% at 4 Hz** (LIKELY [3]; below the resolution of my measurement).

A cheap partial step if no pitch processing is wanted: choose the Gemini voice and style for a low,
flat male read, and accept the leakage.

### 7.4 `api/_lib/gemini.ts` and `constants.ts`

| Item | Current | Recommended | Confidence |
|---|---|---|---|
| `applyPronunciation('sbaitso')` | `SBAITSO` to `SUH-BAIT-SO` | `SBAITSO` to **`SBAYT-SO`**, or `SPAYT-SO` if Gemini garbles the "sb" cluster | CONFIRMED [M][1] |
| Abbreviations | none | In the Sbaitso persona instruction, require spelled-out words ("DOCTOR", not "DR."). The original database did this [5]; the engine would have spelled "DR." as letters [M] | CONFIRMED |
| Sbaitso `voicePrompt` | "very deep, extremely monotone, continuous, 8-bit computer voice from 1991" | e.g. "flat, even, mechanical adult male read; steady medium-fast pace; no emotion or breathiness; very short pauses; clipped word endings; pitch drops at the end of statements and jumps up at the end of questions". Drop "very deep" (F0 about 92 Hz is ordinary low-male) and "8-bit" (the DSP supplies that) | Values CONFIRMED [M]; prompt wording UNVERIFIED |
| `VOICE_PROFILES.classic` | Charon, no style | Keep Charon as baseline. A/B test Schedar ("Even") and Alnilam ("Firm") against the section 3.3 target and a reference clip from option 6.1-2 | UNVERIFIED |
| `VOICE_PROFILES.deep` | Fenrir, "incredibly deep, resonant and slow" | Relabel as non-authentic. The original is *not* slow or resonant | CONFIRMED [M] |
| TTS sample rate | 24000 (default) | Request **16000** via `response_format.sample_rate`: less bandwidth, no loss, since everything ends at 8475 Hz. Avoid 8000 (below 8475) | LIKELY [13] |
| Style transport | `parts[].speechMetadata.style` in `generateContent` | Verify it is honoured (6.2). If not, use the documented Interactions API annotation, or the legacy inline "Say in ...:" prefix | UNVERIFIED |
| Chunking | `LIMITS.ttsText` 1500 | Not constrained by authenticity. Note that the original spoke at most 255 characters per call and restarted its intonation at each call [2] | CONFIRMED |

### 7.5 Glitches (`utils/audio.ts`, `playGlitchSound`)

Speak the glitch text through the normal TTS path and processing chain ("PARITY ERR ...
RECOVERED", plus a few junk characters), as the original did [5]. The white-noise burst can stay as
an optional effect, but it should not be labelled authentic.

### 7.6 Validation checklist (for whoever implements this)

1. Render a fixed sentence set through the pipeline. Compare F0 median and percentiles against
   section 3.2, and band levels against section 3.3 (target within plus or minus 3 dB).
2. Check that the rendered rate is 3.6-4.7 syllables per second and that sentence pauses are no
   longer than about 200 ms.
3. Check that output codes, measured before ZOH, span about 150-180 of 256 levels at normal volume.
4. If option 6.1-2 is built, A/B blind against the real engine.

---

## 8. Corrections to existing docs

| Doc / file | Claim | Correction | Confidence |
|---|---|---|---|
| `docs/DECTALK_RESEARCH.md` 1.1, 3.2 | "NOT digitized/sampled speech", "NOT formant", "Rule-based phonetic synthesis with pronunciation tables" | It **is** built from digitized speech: stored single pitch periods, concatenated and interpolated, with letter-to-sound rules in front [3][4] | CONFIRMED |
| same, 1.1 | "~1,200 pronunciation rules", "<200KB" | No source found for 1,200. The patent gives 40-50 KB of waveform data [3]; `SBTALKER.EXE` is 178 KB [5] | UNVERIFIED (rules) |
| same, 1.2 | `BLASTER.DRV` = "actual synthesis engine (Monologue Engine)" | `BLASTER.DRV` is a 9.9 KB Creative output driver. The engine and voice data are in `SBTALKER.EXE` (SmoothTalker 3.5) [5] | CONFIRMED |
| same, 1.2 | "Version: 3.5" of SBTalker | 3.5 is the **SmoothTalker** engine version string [5] | CONFIRMED |
| same, 2.1, 5.2, 7.1 | 11.025 kHz "90%+ confidence" | **8475 Hz** [M][2] | CONFIRMED |
| same, 2.1, 5.2 | Frequency response "300 Hz - 5 kHz" | Content runs from below 100 Hz to 4237 Hz, with heavy roll-off above 1 kHz. About 20% of the power is below 300 Hz [M] | CONFIRMED |
| same, 1.3 | SB 1.0 DAC "likely no anti-aliasing filter" | About 4 kHz Sallen-Key low-pass on the output [11] | LIKELY |
| same, 5.3 | F0 "~110-130 Hz", "120-150 WPM", "Pitch Variation: ±10-20%" | F0 median about 90-95 Hz; stepped contour from about 62 to about 156 Hz; about 150-210 wpm [M] | CONFIRMED |
| same, 3.2 | Monologue "Male/female voice options" (implied for Sbaitso) | True of retail Monologue [6]. SBTALKER 3.5 is male-only and ignores the `gender` field [2][M] | CONFIRMED |
| same, 4.1 | SAM "Formant synthesis", "Open source" | SAM has no license (abandonware) [14] | LIKELY |
| `docs/AUDIO_SYSTEM.md` | "6-bit (64 levels) ... Authentic 1991 Sound Blaster quality" | The original is full 8-bit unsigned [M] | CONFIRMED |
| same | playbackRate "1.1 = 10% faster, slightly deeper", "Mimics CPU speed variations" | `playbackRate` > 1 raises pitch [16]. SB DMA playback rate is set by the DSP time constant, not by CPU speed [M][2] | CONFIRMED (pitch); LIKELY (CPU) |
| `utils/vintageAudioProcessing.ts` header | "Sample Rate: 11.025 kHz (typical)" | 8475 Hz | CONFIRMED |
| same | `injectVintageArtifacts` "aliasing", "pre-echo (primitive DAC reconstruction smearing)" | Random amplitude-scaled noise is not aliasing. A one-sample *post*-echo is not pre-echo, and neither occurs in an 8-bit DAC. Model zero-order hold plus the analog low-pass instead | CONFIRMED (code read) / LIKELY (model) |
| same | `pitchVarianceReduction` | Never read by any code | CONFIRMED |
| `utils/audio.ts` | `ultra` 64-level crush, 1.1x rate | See 7.2 | CONFIRMED |
| `api/_lib/gemini.ts` | `SUH-BAIT-SO` | Two syllables, `SBAYT-SO` [M][1] | CONFIRMED |
| `constants.ts` `VOICE_PROFILES.deep` | "incredibly deep, resonant and slow" | Opposite of the original's moderate-fast rate | CONFIRMED |
| Web search summaries | "11.025 kHz, 8-bit mono, 300-5000 Hz frequency response" for Sbaitso | A search summary that returned this project's GitHub repository among its results repeated these figures. They match this project's own docs and appear in no primary source, so treat them as circular, not as independent corroboration | LIKELY (observed in search output) |

---

## 9. Sources

- [M] Local measurement: SmoothTalker 3.5 image (`engine.bin`) from [2], run under Unicorn 2.1.4
  using that repository's `core.py`; DSP command logging, F0 and spectral analysis with numpy and
  scipy, 2026-10-02. Reproducible from [2].
1. Wikipedia, "Dr. Sbaitso": https://en.wikipedia.org/wiki/Dr._Sbaitso
2. J. Kennedy, smoothTalker-sbaitso (NVDA add-on; README, `core.py`):
   https://github.com/joshknnd1982/smoothTalker-sbaitso. Sibling SAPI5 build:
   https://github.com/joshknnd1982/smoothtalker-sapi5
3. US 4,692,941, "Real-time text-to-speech conversion system", Jacks and Sprague, First Byte:
   https://patents.google.com/patent/US4692941A/en
4. US 4,617,645, "Compaction method for waveform storage", Sprague, First Byte:
   https://patents.google.com/patent/US4617645A/en
5. Internet Archive, "MS-DOS: Dr. Sbaitso (VGA Machine)", `SBAITSO.zip` (`SBAITSO2.EXE` v2.20,
   `SBTALKER.EXE`, `BLASTER.DRV`, `READ.EXE`, `SET-ECHO.EXE`, batch files):
   https://archive.org/details/SBAITSO_VGA (CGA build: https://archive.org/details/SBAITSO_CGA)
6. Baltimore Sun, "SmoothTalker gives your PC the power of speech", 1991-02-04:
   https://www.baltimoresun.com/news/bs-xpm-1991-02-04-1991035156-story.html
7. VOGONS, "So, you like Dr. Sbaitso...?": https://www.vogons.org/viewtopic.php?t=37742
8. Internet Archive, "First Byte's Smooth Talker v1.1 for DOS (1988)":
   https://archive.org/details/smooth_talker_v2
9. J. Kennedy, monologue97-sapi5 (Monologue '97 engine notes):
   https://github.com/joshknnd1982/monologue97-sapi5
10. systoolz, dosbtalk (Apache-2.0 API for the First Byte V3/V4 engines):
    https://github.com/systoolz/dosbtalk
11. TubeTime, "Sound Blaster 1.0 Principles of Operation":
    https://www.tubetime.us/index.php/2019/01/19/sound-blaster-1-0-principles-of-operation/
12. VOGONS, "DOSBox Sound Blaster emulation (Lowpass Filtering)":
    https://www.vogons.org/viewtopic.php?t=49802
13. Google, Gemini API "Speech generation":
    https://ai.google.dev/gemini-api/docs/speech-generation
14. discordier, SAM (JavaScript port of Software Automatic Mouth): https://github.com/discordier/sam
15. A. Altea, unicorn.js (GPL-2.0): https://github.com/AlexAltea/unicorn.js/
16. MDN, `AudioBufferSourceNode.playbackRate`:
    https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/playbackRate
