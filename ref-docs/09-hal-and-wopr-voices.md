# HAL 9000 and JOSHUA/WOPR: Voice and Audio

Research date: 2026-10-02. Scope: how the two film computer voices were produced, what they sound
like in measurable terms, and how to approximate their *qualities* with Gemini TTS plus browser
post-processing. Personality and conversational behaviour are covered separately in
`07-hal-9000.md` and `08-joshua-wopr.md`. The standard and the confidence labels follow
`02-voice-and-audio.md`.

Confidence labels:

- **CONFIRMED**: a primary source (a first-hand account by someone involved, or a measurement), or
  two or more independent secondary sources.
- **LIKELY**: one credible source, or a direct inference from primary data or measurement.
- **UNVERIFIED**: repeated online without a traceable source, or an untested recommendation.

Goal and limit: the aim is to capture the *qualities* of each voice (register, rate, pitch
behaviour, timbre, processing). It is not to clone or impersonate Douglas Rain or John Wood. No
film audio may be bundled with the project, used as a TTS reference, or used to train or condition
a voice. Section 6 also covers what not to put in style prompts.

## Method

Evidence is listed here from strongest to weakest.

1. **Local measurement of published film excerpts [M].** Analysis only. Files were downloaded to a
   scratch directory, measured with numpy/scipy (YIN pitch tracker, 40 ms windows, 10 ms hop;
   Welch spectra; energy-based activity detection), then deleted. Nothing was copied into this
   repository. Sources:
   - HAL: the Hugging Face dataset `campwill/HAL-9000-Speech` [20]. It has 96 clips of HAL's film
     dialogue, cut from a YouTube compilation, 48 kHz float WAV, with transcripts. Its card says
     "apache-2.0". That licence cannot cover film audio, so the dataset is **not** reusable. It
     was used here for measurement only. Clips 1-78 are normal dialogue (257 s in total), 79-86
     are the pleading during disconnection, 87-92 are the regressing self-introduction, and 93-96
     are "Daisy Bell".
   - WOPR: three independent YouTube uploads of the same "shall we play a game" line [21]. All
     three produce the same pitch track, so this is one line measured three times. It is not
     three lines. Longer WOPR scenes could not be segmented reliably without listening, because
     dialogue, music and effects overlap. They are not used for numbers.
   - Caveats: every excerpt has passed through the 1968/1983 film mix, a home-video transfer and
     YouTube's lossy codec. **Pitch and timing survive that chain well. Spectral balance does
     not.** Band levels below are therefore graded LIKELY at best. Syllable counts come from a
     vowel-group heuristic over the transcripts (roughly plus or minus 10%).
2. **First-hand production accounts.** Kubrick's statements to Wendy Carlos as she reports them
   [3]; the Kubrick Archive session transcript as reported by the documentary maker Gerry Flahive
   [4][5]; Rain's own account [6]; John Badham's DVD commentary as transcribed by a collector [9].
3. **Secondary sources**: Wikipedia, press obituaries, trivia sites, forum discussion [1][2][7][8]
   [10]-[19].

---

## 1. Summary

1. **HAL is a human performance, not a synthesizer. Its "processing" is mostly invisible.**
   Douglas Rain recorded every line in post-production in about 10 hours, a few feet from Kubrick,
   at MGM Borehamwood in late 1967 [4][6]. The breaths were edited out [4][5]. Kubrick told Wendy
   Carlos that the **whole performance was time-stretched by "about 10-20%"** on an Eltro
   Information Rate Changer, slower but at the same pitch, to make it sound more measured [3].
   CONFIRMED (first-hand via Carlos, plus Wikipedia [1][2]).
2. **HAL's measured voice is ordinary low-male, calm, and not monotone.** Normal dialogue has a
   median F0 of about **99 Hz** (p10 81, p90 120 Hz). Per-utterance pitch SD is about
   **2.1 semitones** (IQR 1.4-2.6). The speaking rate is about **4.3-4.7 syllables per second**
   (about 170-190 wpm), which includes the Eltro stretch. Questions do **not** rise: the last
   300 ms sit at the utterance median (median -0.1 st, n=7). Statements fall slightly (-0.4 st)
   [M]. LIKELY (measured; small n for questions).
3. **The disconnection effect is two independent ramps: pitch down and tempo down, at different
   rates.** Kubrick described it to Carlos: one Eltro pass "gradually dropped HAL's pitch down to
   almost zero" at constant speed, and the other "gradually stretched it out in time" [3]. He
   stressed that this is not a tape slow-down [3]. Measured, F0 falls from about 99 Hz to about
   84 Hz (pleading), about 81 Hz (self-introduction), about 63-71 Hz ("Daisy", sung) and about
   **48 Hz** on the last line. The rate falls from about 4.7 to about **1.5 syllables per second**
   [M]. CONFIRMED (method), LIKELY (numbers).
4. **WOPR is also a human voice, not a Votrax.** Badham says on the DVD commentary that John Wood
   (who plays Falken) read Joshua's lines **in reverse word order** so that every word came out
   flat, like words "pulled out of a database". The recordings were then edited back into order and
   run through unnamed "audio processing equipment" [9][10]. CONFIRMED (director's commentary,
   reported by two independent transcribers). **The processing equipment is unknown**: vocoder,
   Fairlight and Eventide are forum guesses [11]. UNVERIFIED.
5. **WOPR's measured signature is flat pitch inside each word, small steps between words, and a
   single step up on a question.** Within a word, F0 drifts by less than about 0.6 semitone over
   200 ms. Most words sit on a plateau of about **89-92 Hz**, some on about 64-79 Hz. On the
   question line the final word jumps about **+6 semitones to about 128 Hz** and holds there flat;
   it does not glide. Energy dips of **40-110 ms** separate the words. The spectrum is
   band-limited: about -20 dB at 100-200 Hz and about -25 dB at 3.5-4 kHz relative to the
   300-700 Hz peak [M]. LIKELY (one line, three uploads agree).
6. **Neither voice should go through the Sbaitso 8475 Hz chain.** Today every character's TTS goes
   through `applyVintageProcessing` in "authentic" mode (the default), and every character uses
   the voice of the global `VOICE_PROFILES` entry (Charon by default). That makes HAL and JOSHUA
   sound like Dr. Sbaitso. Both need their own voice and their own chain (section 6). CONFIRMED
   (code read).

---

## 2. HAL 9000 (2001: A Space Odyssey, 1968; voice Douglas Rain)

### 2.1 Production

| Item | Finding | Confidence | Source |
|---|---|---|---|
| Casting | Kubrick heard Rain's narration of the NFB documentary *Universe* (1960). Rain was first hired to narrate *2001*, then given HAL when the narration was cut. Martin Balsam had recorded HAL first and was replaced as "too colloquially American". Kubrick wanted a "bland mid-Atlantic accent" | CONFIRMED | [1][2][4][6] |
| On-set stand-ins | Nigel Davenport read HAL on set. Stefanie Powers supplied a temporary voice in rehearsal. Neither is in the film | LIKELY | [1] |
| When | Post-production, late 1967, after principal photography | CONFIRMED | [4][6] |
| Where / setup | MGM Borehamwood, near London, with Rain "a few feet from Kubrick". Rain saw only HAL's lines, not the script | CONFIRMED | [1][4][6] |
| Duration | About 10 hours over two days, or "a day and a half". One account says "less than 10 hours", split because Rain's voice level was dropping | CONFIRMED (about 10 h) | [1][4][6][7] |
| Direction | Sparse. From the Kubrick Archive transcript: "a little more concerned", "just try it closer and more depressed", "even softer and kind of in the depths" | CONFIRMED (archive transcript, reported) | [4][5] |
| Kubrick on the result | Praised Rain's "intelligent friend next door quality" and his "great sincerity" | LIKELY | [4] |
| Breath removal | Rain's breaths were edited out, giving an "unearthly" continuity | LIKELY (Flahive, plus press) | [4][5][13] |
| Time-stretch | The whole performance was time-stretched about **10-20%**, slower at the same pitch, on an Eltro Mark II. Kubrick to Carlos: "it was about 10-20%, rather subtle" | CONFIRMED (first-hand) | [3][2] |
| Eltro device | Rotating-head tape playback unit (Springer, Germany) that changes speed without pitch or pitch without speed. Its output was copied to another recorder. Wikipedia says the final effect used two passes | CONFIRMED | [2][3] |
| Reverb / EQ / filtering | No source mentions any. In the film HAL sounds dry, and direction such as "try it closer" points to close-miked intimacy | LIKELY (absence of evidence, plus [M] and [5]) | [M][5] |
| "Daisy Bell" takes | Rain sang it about 50 times at varying tempos and pitches; Kubrick used the first take | CONFIRMED | [6][7] |
| Why "Daisy" | An homage to the 1961 Bell Labs demonstration (Kelly, Lochbaum, Mathews; IBM 7094) that Clarke had heard | CONFIRMED | [1][14] |
| Rain's own view | Said an observer at the session would have thought it "a load of rubbish" | CONFIRMED | [4][6] |
| Barefoot, feet on a pillow | Repeated on social media with no traceable source | UNVERIFIED | [15] |

What this means: HAL's "computer" quality is **acting plus two subtle edits**: no breaths, and
about 15% slower at the same pitch. There is no filtering, vocoding or pitch flattening. Any
recreation that adds robot effects to HAL is wrong.

### 2.2 Measured characteristics [M]

Normal dialogue (clips 1-78, 77 clips, 257 s; clip 38 had too little voicing):

| Property | Value | Confidence | Notes |
|---|---|---|---|
| Median F0 | **99 Hz** | LIKELY | Pooled voiced frames, octave errors removed |
| F0 percentiles | p5 76, p10 81, p25 89, p75 109, p90 120, p95 129 Hz | LIKELY | |
| Per-utterance F0 SD | **2.1 semitones** median (IQR 1.4-2.6) | LIKELY | Lower than lively speech. Compare against the Gemini voice, not against a textbook norm |
| Per-utterance p10-p90 span | about 4.8 semitones median | LIKELY | Contrast Sbaitso's stepped jumps of up to about 8 st at a "?" (`02` section 3.2) |
| Final contour, statements | Last 300 ms about **-0.4 st** below the utterance median (IQR -3.4..+1.3), n=65 | LIKELY | A gentle fall, no strong declination |
| Final contour, questions | **-0.1 st** (IQR -1.7..+1.0), n=7 | LIKELY (small n) | **HAL's questions do not rise.** This is a defining part of his calm |
| Speaking rate | **4.7 syllables per second** over all clips, **4.3** over clips longer than 3 s | LIKELY | Includes Kubrick's 10-20% stretch. Roughly 170-190 wpm |
| Pauses at commas | About 150-230 ms where detectable | UNVERIFIED (low SNR) | Ship ambience (about 21 dB SNR) hides short pauses |
| Breath noise | None audible in the pauses that were inspected | LIKELY | Fits [4][5] |
| Long-term spectrum | Flat to within about 4 dB from 100 Hz to 1 kHz, then -8/-9 dB at 1-2 kHz, -16 to -20 dB at 2-11 kHz. Centroid about 600 Hz | LIKELY (shaped by the 1968 mix and transfer) | Full, close-miked low end. Do **not** copy the treble loss as "HAL's timbre": it belongs to the medium |

Comparison: HAL's 4.3-4.7 syllables per second sits at the top of Dr. Sbaitso's measured
3.6-4.7 range (`02` section 1), even after Kubrick's stretch. The "slow, measured" impression comes
from the even tempo, the missing breaths and the level question contours, not from a slow rate.
Hand-tuned recipes that set HAL at about 136 wpm [22] are too slow.

### 2.3 The disconnection and "Daisy Bell" effect

What was done (CONFIRMED [3][2]): two Eltro passes. One lowers pitch progressively at constant
tempo, "down to almost zero". The other slows tempo progressively at constant pitch. The two ramps
run at **different rates**. Kubrick told Carlos that a plain tape slow-down could not produce it.

Measured progression [M] (clip groups in film order):

| Stage | Clips | Median F0 (Hz) | F0 drop vs normal | Rate (syl/s) | Rate vs normal | F0 SD (st) |
|---|---|---|---|---|---|---|
| Normal | 1-78 | 99 | 0 | 4.7 | 1.00 | 2.1 |
| Pleading ("I'm afraid") | 79-86 | 84 | -2.9 st | 2.6 | 0.55 | 0.9 |
| Regressing self-introduction | 87-92 | 81 (78-88 per clip) | -3.5 st | 2.7 | 0.58 | 1.1 |
| "Daisy" first lines | 93-95 | 63-71 (sung) | -6 to -8 st | 1.5 | 0.32 | 1.3 |
| Last line | 96 | **48** | **-12.5 st** | about 1.1 | about 0.25 | flat |

Reading the table:

- Some of the pleading's slowness and flatness is acting: Rain played it softer and more halting.
  The Eltro curve is clearest from the self-introduction onward. LIKELY.
- During "Daisy" the pitch figures include the melody. The trend is still unambiguous: about an
  octave down by the last line, with the tempo at about a quarter of normal. LIKELY.
- The fall accelerates toward the end. The last two lines lose more than the whole preceding
  scene. LIKELY.

---

## 3. JOSHUA / WOPR (WarGames, 1983)

### 3.1 Production

| Item | Finding | Confidence | Source |
|---|---|---|---|
| Voice actor | John Wood, who also plays Dr. Falken. Credited as "Dr. Stephen Falken / WOPR (voice)" | CONFIRMED | [8][16] |
| Child voice considered | Badham first considered a child's voice, evoking Falken's dead son, then chose something closer to Falken | LIKELY (Mental Floss, quoting Badham) | [10] |
| Recording method | Wood read the lines **in reverse word order**, so each word was "very carefully enunciated" and flat. Badham's rationale, as quoted: computer voices are "single words that are being pulled out of a database real fast" | CONFIRMED (DVD commentary, reported by [9]; quoted by [10]) | [9][10] |
| Post-processing | "Edited and re-assembled after being run through audio processing equipment" (Badham, as transcribed) | CONFIRMED that processing happened. The equipment is unknown | [9] |
| Votrax / CompuTalker | "Not produced using a VOTRAX, CompuTalker, or other" synthesizer of the period | CONFIRMED (same commentary transcription). A forum claim of a Votrax SC-01 is unsourced | [9][11] |
| Vocoder / Fairlight / Eventide | Forum guesses. One listener reports human-sounding fricatives, which rules out a phoneme chip, and "equally spaced bandpasses" | UNVERIFIED | [11] |
| In-story device | A speech box on David's desk; the film explains it as a box that converts the computer's signals to sound. That fits "text printed, then spoken" | CONFIRMED (film dialogue, via [12]) | [12] |
| Sound credits | Oscar nomination for Best Sound: Michael J. Kohut, Carlos Delarios, Aaron Rochin, Willie D. Burton | CONFIRMED | [8] |

Summary: like HAL, WOPR is an actor's voice. The flatness comes from the **reading method**: each
word read as an isolated, uninflected list item. It does not come from a pitch-flattening device.
The rest of the "computer" sound comes from **splicing** (uniform gaps, no coarticulation between
words) and from unknown filtering or processing.

### 3.2 Measured characteristics [M]

One line, three uploads (frame-level pitch from 0.5 to 2.3 s; word boundaries from energy dips,
not checked by ear):

| Property | Value | Confidence |
|---|---|---|
| Pitch inside a word | Nearly constant: drift of 0.5-3 Hz over 70-250 ms of voicing (under about 0.6 st). Example: one word moves 88.3 to 91.3 Hz over 200 ms | LIKELY |
| Plateau level | Most words at **89-92 Hz**. Others at about **79 Hz** and about **64-70 Hz** | LIKELY |
| Steps between words | Discrete jumps rather than glides: 0 to about -5 st between non-final words | LIKELY |
| Question ending | The final word jumps to **about 128 Hz (+5.9 st)**, holds flat for about 150 ms, then sags about 1 st at the end. A step, not a glide | LIKELY |
| Inter-word separation | Energy dips of **40-110 ms** at -10 to -19 dB between voiced segments, with one longer gap of about 110 ms before the second half of the line | LIKELY |
| Word loudness | Peaks within about plus or minus 3-5 dB of each other across words, so loudness is fairly uniform | LIKELY |
| Rate | About 1.7-1.8 s of activity for the line. If that is the five-word line alone, the rate is about **2.8-3 syllables per second** | UNVERIFIED (alignment not confirmed) |
| Spectrum (dB relative to the 500-700 Hz band) | 50-100 Hz **-32 to -35**; 100-200 **-17 to -20**; 200-300 -4 to -6; 300-500 -1 to -2; 700-1k -2 to -3; 1-2k -12; 2-3.5k -11 to -16; 3.5-4k **-25 to -28**; 4-5k -23 to -25; 5-6k -35 to -38; >6k about -50. Centroid about 675 Hz | LIKELY (both uploads within 3 dB) |

Interpretation: the strong cut **below about 200 Hz** removes the fundamental (about 90 Hz) as well
as the body of the voice. Together with the roll-off above about 3.5 kHz, this gives the thin,
"small speaker in a box" sound. That is consistent with a band-pass in the processing chain, or
with the speech box being played through a small speaker (LIKELY). This is the opposite of HAL's
full low end.

### 3.3 Text and terminal relationship

| Item | Finding | Confidence | Source |
|---|---|---|---|
| Display hardware | The on-screen IMSAI's 17-inch Electrohome monitor was driven by an off-screen CompuPro 8086 (STB S-100 video card). Code by Mike Fink and Steve Grummette made Broderick's keystrokes appear to produce output | CONFIRMED | [17][18] |
| Monitor | Black and white CRT. On film the text reads light blue-white on near-black. A fan transcription gives `#8AD2FF` on `#262324` | LIKELY | [18] |
| Font | Custom bitmap. A fan reconstruction ("WarGames Terminal Fonts") is licensed **CC BY-NC-SA 4.0**. That is incompatible with bundling in this MIT project for unrestricted use; treat it as reference only | CONFIRMED (licence) | [18] |
| Case | Mostly upper case, but the transcribed screens include mixed case | LIKELY | [18] |
| Character-print sound | Characters print with a short electronic beep. One fan describes "beeping noises every time text prints out", and a sound extractor says the keyboard sound and the print sound are "essentially the same" | LIKELY (two independent fan sources) | [12][19] |
| Print speed | Faster than real 1200 baud in places ("data is transferred rather too quickly"). Not measured | UNVERIFIED | [12] |
| Text vs voice order | In-story, the box speaks what the computer sends. Whether speech starts with or after the text was not measured | UNVERIFIED | [12] |
| Modem | A 1200-baud Cermetek 212A relabelled IMSAI. The acoustic coupler was a visual prop | LIKELY | [12][17] |

---

## 4. Open-source emulations and reference parameters

| Project | Approach | Licence | Use here |
|---|---|---|---|
| campwill HAL Piper model [20] | Piper TTS fine-tuned on film audio | Card says apache-2.0, but the training data is film audio | **Do not use.** It clones Rain's voice and inherits the copyright problem |
| alvinalexander macOS recipe [22] | `say`, voice Bruce, rate 138 wpm, pitch 41, modulation 18 (or Alex, 136 wpm) | Blog | Hand-tuned. 136-138 wpm is slower than the measured 170-190 wpm |
| Hackaday WOPR simulator [23] | GI SP0256-AL2 chip, Gemini roleplay, key-click per character | Not stated | Shows the per-character click convention. The voice is a chip, so its timbre is wrong |
| zompiexx/wargames [24] | eSpeak plus `aplay` samples | Not stated in the README | Not a reference for timbre |
| WarGames Terminal Fonts [18] | Bitmap font transcription | CC BY-NC-SA 4.0 | Visual reference only |

No published spectral or pitch analysis of either voice was found. Searches covered Google Scholar
style queries, *HAL's Legacy* (Olive's chapter is a history of speech synthesis and does not
analyse Rain's voice [25]), and speech-science and HCI terms. The numbers in sections 2.2, 2.3 and
3.2 are this document's own measurements [M].

---

## 5. Approximating the qualities, not cloning the actors

- **Use a stock Gemini voice whose character is close, and get the rest from delivery direction
  and DSP.** Do not describe the target as "like HAL 9000", "Douglas Rain" or "John Wood" in the
  style prompt. Naming a real performer asks the model to imitate that person, and the
  descriptive prompts below carry the measurable qualities anyway.
- **Never feed film audio to the model as a reference**, and never ship a voice trained on it
  ([20] is the example to avoid).
- HAL is mostly **performance**: register, evenness, warmth, no breaths, level questions, about
  15% slower. Prompting does most of the work; DSP only trims.
- WOPR is mostly **editing**: isolated flat words, uniform gaps, band-limiting. DSP does most of
  the work; prompting only supplies a clean, unemotional source.

---

## 6. Recommendations for this project

### 6.1 Plumbing: per-character voice and chain (prerequisite)

| Item | Current | Recommended | Confidence |
|---|---|---|---|
| Voice selection, `api/_lib/gemini.ts` `handleTts` | `voiceName` always comes from `VOICE_PROFILES[voiceProfile]`, which defaults to Charon for every persona | Add an optional `voiceName` (and `styleSuffix`) per character in `CHARACTERS`, used when present. Keep the profile for Sbaitso only | CONFIRMED (code read) |
| Processing selection, `src/utils/audio.ts` `decodeAudioData` and `src/hooks/useSpeechPlayer.ts` | `applyVintageProcessing` (the Sbaitso 8475 Hz / 8-bit chain) runs for any audio mode except `modern`, whatever the character | Route by character: `sbaitso` uses the vintage chain; `hal9000` uses `processHalVoice` (6.2); `joshua` uses `processWoprVoice` (6.3). The audio-mode selector should mean "Sbaitso authenticity" only | CONFIRMED (code read) |
| Text sent to TTS | Persona replies are ALL CAPS (system instructions) and go to TTS verbatim | Send **sentence case** to TTS (display stays upper case). All-caps text risks shouted emphasis or letter-by-letter reading of words such as "HAL". Keep a pronunciation map: `HAL` as "Hal" (the film says the name as a word), `WOPR` as "whopper", `AE-35` as "A E thirty-five" | LIKELY (Gemini behaviour UNVERIFIED; the WOPR pronunciation is already in the project) |
| Style transport | `parts[].speechMetadata.style` on `generateContent` | Unchanged, but run the A/B check from `02` section 6.2 first. If the style is ignored, none of the prompts below take effect | UNVERIFIED |
| TTS sample rate | 24 kHz | HAL: keep **24 kHz**, since HAL is full-band. WOPR: 16 kHz is enough, as everything ends below about 5 kHz | LIKELY |

Gemini voices verified in the current docs [26] that fit these roles: Charon "Informative",
Iapetus "Clear", Algieba "Smooth", Schedar "Even", Orus "Firm", Alnilam "Firm", Rasalgethi
"Informative", Sadaltager "Knowledgeable", Gacrux "Mature", Achernar "Soft". The docs give
descriptors only, not gender or pitch. Which voices are male-presenting, and how low each one
sits, must be checked by ear and by measurement (UNVERIFIED).

### 6.2 HAL 9000

**Gemini side (`src/constants.ts` HAL entry and `api/_lib/gemini.ts`)**

| Parameter | Recommended | Basis |
|---|---|---|
| Voice | A/B test, in order: **Algieba** (Smooth), **Iapetus** (Clear), **Charon** (Informative), **Schedar** (Even). Choose the one whose measured median F0 is closest to 99 Hz with the smallest pitch SD | Target from [M]; ranking UNVERIFIED |
| Style (`voicePrompt`, replacing "calm, measured, unsettling monotone like HAL 9000") | "A calm, soft-spoken adult man with a neutral North American accent, speaking close to the microphone in an even, quiet, warm conversational tone; polite, attentive and sincere; unhurried, steady pace; precise, clear diction; very little emphasis; questions stay level and do not rise; no audible breaths, sighs or laughter; never raises his voice." | [1][3][4][M]. Drops "monotone" (HAL measures 2.1 st SD, not flat) and drops the name |
| Inline tags | None by default. Avoid `<breath>` and `<sigh>`. Use `<short pause>` only where the persona text has an em dash or an ellipsis | [4][5][26] |
| Text-side pauses | Keep commas. Spell out abbreviations ("Doctor", "A E thirty-five"). Avoid exclamation marks: HAL never exclaims | [M] (level contours) |

**Post-processing chain (new `processHalVoice` in `src/utils/vintageAudioProcessing.ts`, or a new
`src/utils/personaVoices.ts`)**, in order:

| Stage | Parameters | Basis / confidence |
|---|---|---|
| 1. Breath and noise gate | Remove inter-phrase segments below about -45 dBFS that are unvoiced and noise-like (breaths). Gate attack 5 ms, release 60 ms, hold 30 ms. Never shorten pauses below 120 ms | Breaths removed in 1967 [4][5]. LIKELY |
| 2. Tempo | Measure the rendered syllable rate. If it exceeds **4.7 syl/s**, time-stretch, pitch preserved (WSOLA: 40 ms frames, 50% overlap, plus or minus 10 ms search), down to **4.3-4.6 syl/s**. Typical factor 0.85-0.9, the same 10-20% Kubrick applied [3]. **Do not use `playbackRate`**: it lowers pitch too | [3][M]. LIKELY |
| 3. Pitch level (optional) | If the chosen voice's median F0 is more than 2 st from 99 Hz, shift it toward 99 Hz with a formant-preserving shift of at most 2 st. Otherwise leave it | [M]. UNVERIFIED (artifact risk) |
| 4. Pitch variance (optional) | Only if the rendered SD exceeds about 3 st. Compress F0 around the utterance median by a factor of about 0.7 (TD-PSOLA or WORLD-style). **Do not** use the LPC pulse-train stage from `lpcMonotone.ts` for HAL: it makes the voice buzzy and robotic, the opposite of the target | [M]. UNVERIFIED |
| 5. Tone | High-pass 50 Hz (2nd order). Low-shelf **+2 dB at 150 Hz** (proximity warmth). Optional gentle de-ess: dynamic cut of about 4 dB at 6-8 kHz | "Try it closer" [5]; [M] full low end. LIKELY |
| 6. Dynamics | `DynamicsCompressorNode`: threshold -24 dB, ratio 2.5, knee 10, attack 0.01 s, release 0.2 s. Make-up gain to about -16 LUFS. Peak at or below -3 dBFS | Even, intimate level. UNVERIFIED (taste) |
| 7. Space | **No reverb, no delay, no chorus, no bit-crush, no resampling** | Dry studio voice [4][M]. LIKELY |
| 8. Optional "1968 film" colour (off by default) | High-shelf -6 dB at 2.5 kHz, low-pass 9 kHz (2nd order) | Mimics the measured treble loss, which belongs to the medium [M]. UNVERIFIED |

**Validation targets for HAL**: median F0 90-110 Hz; per-utterance SD 1.5-2.8 st; rate
4.3-4.7 syl/s; question endings within plus or minus 1.5 st of the median; no breath events;
RT60 effectively 0 (no added room).

### 6.3 JOSHUA / WOPR

Two implementation tiers. Both feed the same DSP.

**Tier A: one TTS call, then DSP word processing (recommended)**

| Parameter | Recommended | Basis |
|---|---|---|
| Voice | **Iapetus** (Clear) first, then **Schedar** (Even), **Orus** (Firm), **Charon**. Choose the clearest consonants and the steadiest pitch | Wood's careful enunciation [9][10]. UNVERIFIED ranking |
| Style (replacing "computerized, analytical, curious 1980s AI voice") | "A precise, emotionless adult male reading each word separately, as if from a list: every word clearly and fully enunciated, the same flat pitch and loudness on every word, a small even pause between all words, no sentence melody, no emphasis, slow and deliberate." | Reverse-order reading [9][10]; [M]. Avoid "robotic"/"computer": that invites the model to fake effects the DSP then stacks on |
| Text side | Sentence case. One space between words. Optionally insert `<short pause>` between words for lines of 6 words or fewer, and A/B it against DSP gap insertion | [26]. UNVERIFIED |

**Tier B: per-word TTS (most faithful to the production method; costs N requests)**

Synthesize each word as its own TTS request, which is the isolated "list" reading of the original
session, then concatenate in order with fixed gaps. Cache common words. Use it only if Tier A's
flattened words still sound coarticulated. The method matches [9]; the cost and benefit are
UNVERIFIED.

**Post-processing chain (`processWoprVoice`)**, in order:

| Stage | Parameters | Basis / confidence |
|---|---|---|
| 1. Word segmentation | Energy envelope (10 ms frames). Split at dips of at least 12 dB lasting at least 30 ms. Merge segments shorter than 60 ms into a neighbour. Fall back to dividing by the text's word count | [M] dips. LIKELY |
| 2. Per-word flat pitch | Re-pitch each word to **one constant F0** with the LPC stage in `src/utils/lpcMonotone.ts`, extended with a per-segment target. Default **90 Hz**. Every 3rd to 5th non-final word steps down to **79 Hz** or **68 Hz**, chosen deterministically from a seeded hash of the word so the same sentence always sounds the same. No glides, no jitter, no 4 Hz vibrato | [M]. LIKELY (levels), UNVERIFIED (step pattern) |
| 3. Final word | `?`: **128 Hz** flat (+6 st), sagging to 122 Hz over the last 60 ms. `.`: **79 Hz** flat. `!`: **105 Hz** flat | `?` measured [M], LIKELY. `.` and `!` are UNVERIFIED extrapolations |
| 4. Excitation | Order 18-20 at 16 kHz. **Keep human fricatives**: on unvoiced frames, re-excite with the frame's own LPC *residual* rather than synthetic noise. Voiced frames use the pulse train at the target F0, mixed 85% pulse with 15% residual to soften the buzz | Fricatives sound human (forum listening [11]). LIKELY in effect; mix ratio UNVERIFIED |
| 5. Word timing | Trim each word's leading and trailing silence. Insert **80 ms** of silence between words, **110 ms** at commas, **250 ms** at sentence ends. Optionally time-stretch each word to 220-350 ms so the line runs at about 2.8-3.2 syl/s | [M] 40-110 ms dips. LIKELY (gaps), UNVERIFIED (rate) |
| 6. Word loudness | Normalize each word to the same RMS, plus or minus 2 dB. Apply a 5 ms raised-cosine fade in and out per word, which gives the spliced-tape edges | Uniform word peaks [M]. LIKELY |
| 7. Band-limit | High-pass **220 Hz, 4th order** (two cascaded biquads, Q 0.54 and 1.31). Low-pass **3.8 kHz, 4th order**. Peaking EQ +2 dB at 2.5 kHz, Q 1.0, to keep consonants crisp | Matches the measured -20 dB at 100-200 Hz, -25 dB at 3.5-4 kHz, and the 2-3.5 kHz shelf [M]. LIKELY |
| 8. Optional "box" colour (off by default) | Narrow resonance +3 dB at 1.1 kHz, Q 4 (small-speaker cone), plus very light saturation (`WaveShaperNode`, tanh drive 1.5) | In-story speech box [12]. UNVERIFIED |
| 9. Optional vocoder/ring flavour (off by default) | Only if someone wants the "80s movie computer" cliché: a 16-band channel vocoder (band-pass Q about 6, log-spaced 200-4000 Hz, envelope follower 15 ms) carried by the stage 4 output, mixed at 25% or less. **No ring modulation.** It smears pitch and is not supported by any source | The equipment is unknown [9]; vocoder is a forum guess [11]. UNVERIFIED |
| 10. Space | No reverb. Peak normalize to -3 dBFS | LIKELY |

**Terminal behaviour (`src/EnhancedApp.tsx` typewriter, `src/utils/soundEffects.ts`)**

| Item | Recommended | Basis |
|---|---|---|
| Text colour (JOSHUA-specific theme) | Foreground `#8AD2FF`, background `#262324`. Write your own values; do not bundle the CC BY-NC-SA font | [18]. LIKELY |
| Print sound | A short sine or square blip per printed character, about 8-12 ms with a 2 ms attack and an exponential decay, the same sound as the key-click. Pitch is a free choice: no measured value is available | [12][19]. LIKELY (presence), UNVERIFIED (pitch) |
| Print speed | About **30 characters per second** (33 ms per character), with no delay on spaces. This is a design choice that stays legible. Real 1200-baud would be about 120 chars/s, which the film appears to exceed in places | UNVERIFIED |
| Text and voice order | Print the line, then start speech when the last character lands. While speech plays, mute the per-character blips | In-story box speaks what the computer sent [12]. UNVERIFIED |

### 6.4 Optional HAL "shutdown" effect

Use it for an easter egg, for example when the user says they are disconnecting HAL. The recipe
reproduces the documented method (independent pitch and tempo ramps [3]) and the measured end
points [M]. It never uses film audio. "Daisy Bell" (1892) is in the public domain, so HAL may sing
it; Gemini's ability to sing is UNVERIFIED, so a spoken fallback is fine.

Parameters, over a sequence of K utterances (or one long one), with progress u from 0 to 1:

| Quantity | Curve | End value | Basis |
|---|---|---|---|
| Pitch factor p(u) | `p = 2^(-12.5 * u^1.8 / 12)` (semitones = -12.5 u^1.8) | about 0.49 (99 to about 48 Hz) | [M]; the accelerating curve fits the table in 2.3. LIKELY |
| Tempo factor r(u) | `r = 1 - 0.75 * u^1.2` | about 0.25 (4.7 to about 1.2 syl/s) | [M]. LIKELY |
| Decoupling | The two curves use different exponents, so pitch and tempo change at different rates, as described in [3]. **Never** use one `playbackRate` ramp: that is the tape slow-down that Kubrick said it was not | [3]. CONFIRMED (method) |
| Implementation | Offline, per block (about 50 ms): (1) time-stretch with WSOLA by `p(u)/r(u)`, pitch unchanged; (2) resample by `p(u)`, which lowers pitch and shortens by `p`. Net duration factor `1/r`, pitch factor `p`. Render with `OfflineAudioContext`, then play | Standard pitch/tempo decomposition. LIKELY |
| Prosody | Additionally compress pitch variance to 50% by u = 0.5 and 20% by u = 1 (the measured SD falls from 2.1 to about 1 st) | [M]. LIKELY |
| Ending | On the last syllable, hold the final pitch and fade amplitude over 1.5 s. Then 2 s of silence | UNVERIFIED (dramatic choice) |

### 6.5 Changes to `src/constants.ts`, summarised

| Field | HAL (`hal9000`) | JOSHUA (`joshua`) |
|---|---|---|
| `voiceName` (new, per character) | `Algieba` (A/B: Iapetus, Charon, Schedar) | `Iapetus` (A/B: Schedar, Orus, Charon) |
| `voicePrompt` | Section 6.2 style text, without the name | Section 6.3 style text |
| `processing` (new) | `'hal'` | `'wopr'` |
| Pronunciation | `HAL` as "Hal"; `AE-35` as "A E thirty-five" | `WOPR` as "whopper" (keep); `NORAD` as "NOR-ad"; `DEFCON` as "DEF-con" |
| Target numbers | F0 median 99 Hz, SD about 2 st, 4.3-4.7 syl/s, level questions | Words flat at 90 / 79 / 68 Hz, "?" at 128 Hz, 80 ms gaps, band 220 Hz to 3.8 kHz |

---

## 7. Validation checklist

Render a fixed sentence set per persona (statements, questions, a comma list, a long sentence).
Use project-written text, not film dialogue. Then measure with the same YIN and Welch method as
[M]:

1. **HAL pitch**: median F0 within 90-110 Hz. Per-utterance SD 1.5-2.8 st. Question endings
   within plus or minus 1.5 st of the median. Statement endings 0 to -3 st.
2. **HAL rate and pauses**: 4.3-4.7 syl/s. No breath events (no unvoiced, noise-like bursts in
   pauses). Pauses at commas 150-250 ms.
3. **HAL space**: no measurable added reverb (decay after a word ends within 50 ms). Low end
   intact (100-200 Hz band no more than 3 dB below the 300-500 Hz band).
4. **HAL shutdown**: final F0 45-55 Hz; final rate at most 1.5 syl/s. Pitch and duration
   trajectories are visibly different curves, not one ramp.
5. **WOPR flatness**: within each word, F0 drift under 0.5 st (target exactly 0 after LPC).
   Steps between words land only on the chosen levels.
6. **WOPR question**: final word at 128 Hz plus or minus 3 Hz and flat; no glide on the
   approach.
7. **WOPR timing**: inter-word gaps 70-90 ms (110 ms at commas); word RMS spread within
   plus or minus 2 dB.
8. **WOPR band**: relative to the 500-700 Hz band, 100-200 Hz between -15 and -22 dB; 3.5-4 kHz
   between -22 and -30 dB; above 6 kHz below -40 dB (matches section 3.2 within plus or minus
   4 dB).
9. **WOPR fricatives**: /s/ and /sh/ keep noise energy at 2.5-3.8 kHz, not buzz. Listen for
   human-sounding consonants.
10. **Identity check**: blind listeners should describe the result as "calm computer" or
    "flat 80s computer". They should not identify it as a specific actor. If they do, the
    prompt or voice is drifting toward impersonation: back off.
11. **Routing check**: HAL and JOSHUA audio never passes through the 8475 Hz / 8-bit Sbaitso
    chain, whatever the audio mode.

---

## 8. Sources

- [M] Local measurement, 2026-10-02. HAL: 96 dialogue clips from [20]. WOPR: one line from three
  uploads [21]. YIN F0 (threshold 0.25, 40 ms window, 10 ms hop), Welch spectra (4096 points),
  energy activity detection; numpy 2.5.3, scipy 1.18.1. Audio was deleted after analysis and
  nothing was retained in the repository.
1. Wikipedia, "HAL 9000": https://en.wikipedia.org/wiki/HAL_9000
2. Wikipedia, "Eltro information rate changer":
   https://en.wikipedia.org/wiki/Eltro_information_rate_changer
3. Wendy Carlos, "Vintage Technologies: The Eltro and the Voice of HAL" (2008):
   http://www.wendycarlos.com/other/Eltro-1967/
4. Gerry Flahive, "I'm Sure You'll Agree There's Some Truth in What I Say", POV Magazine:
   https://povmagazine.com/im-sure-youll-agree-theres-some-truth-in-what-i-say/ (also in the
   New York Times, 2018-03-30:
   https://www.nytimes.com/2018/03/30/movies/hal-2001-a-space-odyssey-voice-douglas-rain.html)
5. Boing Boing, "HAL's voice sounds unsettling because it's Canadian" (2018):
   https://boingboing.net/2018/04/09/hals-voice-sounds-unsettling.html; and Douglas Rain obituary:
   https://boingboing.net/2018/11/12/hal-9000-douglas-rain.html
6. Washington Post obituary, syndicated by the Portland Press Herald, 2018-11-12:
   https://www.pressherald.com/2018/11/12/douglas-rain-who-supplied-hals-voice-in-2001-dies-at-90/
7. Wikipedia, "Douglas Rain": https://en.wikipedia.org/wiki/Douglas_Rain
8. Wikipedia, "WarGames": https://en.wikipedia.org/wiki/WarGames
9. Director's Cut DVD commentary notes (Badham, Lasker, Parkes), as transcribed by an IMSAI
   collector and quoted in full in: Gearspace, "Computer voice in 'Wargames' (1983) movie?",
   2017: https://gearspace.com/board/electronic-music-instruments-and-electronic-music-production/1135833-computer-voice-quot-wargames-quot-1983-movie.html
10. Mental Floss, "15 Surprising Facts About WarGames":
    https://www.mentalfloss.com/article/545667/facts-about-wargames
11. Same Gearspace thread as [9], forum replies (vocoder, Votrax and Fairlight speculation;
    fricative observation).
12. Starring the Computer, "IMSAI 8080 in War Games (1983)":
    https://starringthecomputer.com/appearance.html?f=10&c=10
13. CBR, "This HAL 9000 Line in 2001: A Space Odyssey Is Still Terrifying":
    https://www.cbr.com/stanley-kubrick-2001-a-space-odyssey-most-terrifying-hal-9000-line/
14. Wikipedia, "John Larry Kelly Jr.": https://en.wikipedia.org/wiki/John_Larry_Kelly_Jr.
15. All The Right Movies (X post), barefoot/pillow claim:
    https://x.com/ATRightMovies/status/2041447494920380585
16. Behind The Voice Actors, "Joshua / WOPR":
    https://www.behindthevoiceactors.com/characters/WarGames/Joshua-WOPR/
17. IMSAI.net, "The WarGames IMSAI": https://www.imsai.net/the-wargames-imsai/
18. Michael Walden, "WarGames Terminal Fonts" (CC BY-NC-SA 4.0): https://mw.rat.bz/wgterm/
19. Life Refactored, "WarGames Sounds" (2008):
    http://refactorer.blogspot.com/2008/06/wargames-sounds.html
20. Hugging Face, `campwill/HAL-9000-Speech` (film audio; measurement only, not reusable):
    https://huggingface.co/datasets/campwill/HAL-9000-Speech
21. YouTube uploads of the WOPR line (measurement only): https://www.youtube.com/watch?v=J9YOYTqN3us,
    https://www.youtube.com/watch?v=hw2lkR0bQWw, https://www.youtube.com/watch?v=B53Vlje7mcM
22. Alvin Alexander, "Creating a HAL 9000 voice for Mac OS X":
    https://alvinalexander.com/mac-os-x/2001-hal-9000-voice-for-mac-os-x-space-2001/
23. Hackaday.io, "Simulate Talking With WOPR From the Movie WarGames":
    https://hackaday.io/project/203641-simulate-talking-with-wopr-from-the-movie-wargames
24. zompiexx/wargames README: https://github.com/zompiexx/wargames/blob/main/README.md
25. Language Learning & Technology, review of *HAL's Legacy* (Stork, ed., 1997):
    https://scholarspace.manoa.hawaii.edu/bitstream/10125/25010/1/01_01_review1.pdf
26. Google, Gemini API "Speech generation" (models, the 30 prebuilt voices and their
    descriptors, `speech_metadata.style`, inline tags, `sample_rate`):
    https://ai.google.dev/gemini-api/docs/speech-generation
