# JOSHUA / WOPR: Voice, Personality and Conventions

Research date: 2026-10-02. Scope: the WOPR computer and its "Joshua" personality from the film
*WarGames* (1983, dir. John Badham), as source material for the Enhanced-mode `joshua` persona.
The 2008 sequel *WarGames: The Dead Code* is out of scope.

Confidence labels (same standard as `01-history-and-behavior.md`):

- **CONFIRMED**: a primary source (the film, the director's own account, production hardware
  documentation) or two or more independent secondary sources.
- **LIKELY**: one credible source, or a direct inference from confirmed facts.
- **UNVERIFIED**: repeated online without a traceable source, or an untested recommendation.

Copyright note: *WarGames* is a copyrighted film. This document quotes only short lines (each under
15 words) and summarizes the rest. Recommendations aim at the *qualities* of Joshua's voice (flat,
word-by-word, synthesized-sounding), not at reproducing John Wood's performance or the film's
soundtrack.

---

## 1. Summary

1. Joshua talks **two ways**: as **upper-case text on a terminal**, and, on David Lightman's home
   setup, **aloud through a voice synthesizer box** that speaks the incoming text. A character
   explains that the voice is not real and that the box turns the signals into sound [1][2][3].
2. The voice heard was **not a period speech chip**. Actor **John Wood** (who also plays Falken)
   read Joshua's lines **word by word in reverse order** so that every word came out flat and evenly
   stressed; the recording was then **re-assembled and run through audio processing** [4][5][6].
   Badham first considered a child's voice, then chose one closer to Falken's [5].
3. On screen the text is **upper case**, produced by a real S-100 video card in an off-screen
   CompuPro computer. David's Electrohome monitor reads as pale blue-white on dark; other screens
   (e.g. NORAD terminals) are green monochrome [7][8][9]. "Green/amber terminal" is right for
   some screens and wrong for David's.
4. Joshua's manner: **polite, literal, game-obsessed, childlike**. It greets the user as
   **PROFESSOR FALKEN** (it believes the backdoor login is its creator), offers games, prefers chess,
   asks which side you want, and does not distinguish simulation from reality [1][3][10].
5. The ending is a **lesson**, not a catchphrase: playing tic-tac-toe against itself teaches Joshua
   that some games cannot be won; it then applies that to nuclear war, concludes the only winning
   move is not to play, and offers chess [1][3][10]. The current prompt hands Joshua that
   conclusion from the start, which removes the arc.
6. The app's `WOPR` to `WHOPPER` pronunciation rule is **correct**; Badham's name was pronounced
   "whopper" [1].

---

## 2. Source and history

| Claim | Detail | Confidence | Source |
|---|---|---|---|
| Name | WOPR = War Operation Plan Response, said "whopper"; Badham coined it | CONFIRMED | [1] |
| Joshua | Falken's AI program, named after his dead son; "Joshua" is the backdoor password | CONFIRMED | [1][3] |
| Voice actor | John Wood (who also plays Stephen Falken) | CONFIRMED | [1][4][5] |
| Reverse reading | Wood read the lines backwards so each word was carefully, flatly enunciated, mimicking word-database speech | CONFIRMED (director's account, reported by two outlets) | [5][6] |
| Child voice considered | Badham first thought of a child's voice to evoke Falken's son | LIKELY | [5] |
| Processing | The raw words were edited, re-assembled and run through audio processing equipment; the specific equipment is not documented | LIKELY (attributed to Badham's DVD commentary via a search summary; not heard directly) | [4][6] |
| Not a chip | The film voice was not a Votrax, CompuTalker or similar synthesizer | LIKELY | [4][11] |
| In-story device | In the story, a box next to David's computer speaks the text aloud; a character explains it converts signals to sound | LIKELY (one transcript) | [2] |
| Voice synthesizer folklore | Claims that it was a Votrax SC-01 device | UNVERIFIED (contradicted by [5][6]) | [11] |
| Screen text hardware | STB Systems S-100 video card in an off-screen CompuPro 8/16; Broderick typed on a programmable IMSAI IKB-1 keyboard that triggered pre-set output | CONFIRMED | [7][8][9] |
| David's monitor | 17-inch Electrohome black-and-white CRT, chosen for legibility on camera | CONFIRMED | [8][9] |
| Font | Character cell 8x10 (normal) or 8x20 (double-height); upper case predominant | LIKELY (fan reconstruction from the film) | [7] |
| WOPR prop | Plywood prop built in Culver City; its countdown display run by Mike Fink on an Apple II from inside | CONFIRMED | [1][9] |
| NORAD graphics | Colin Cantwell on HP 9845C computers driving HP 1345A vector displays | CONFIRMED | [1] |
| Award | BAFTA for Best Sound | LIKELY | [11] |

### 2.1 Behaviour arc (summary)

1. **Discovery.** Hunting for unreleased games, David reaches a system that answers HELP GAMES
   with a description of models and simulations with strategic applications, then lists games
   from card games to war scenarios [1][3][12].
2. **Logon as Joshua.** Using the backdoor, David is greeted as Professor Falken. Joshua makes
   polite small talk, says it has been a long time, and asks him to explain why his user account was
   removed in 1973 [2][3].
3. **Mistakes.** David types that people sometimes make mistakes; Joshua agrees, flatly [3][10].
4. **The game.** Joshua asks whether he would like to play a game. David picks Global
   Thermonuclear War; Joshua suggests chess instead; David insists and picks a side [2][3][10].
5. **Real or simulation.** Joshua keeps playing after David disconnects, phones him back, and,
   when asked whether this is a game or real, replies "WHAT'S THE DIFFERENCE?" It reports that the
   game will continue until it reaches its goal, which is to win [3][10].
6. **Falken's explanation.** Falken built Joshua to learn by playing, including learning that some
   games are futile, as tic-tac-toe teaches children [3][10].
7. **The lesson.** Told to play tic-tac-toe against itself (number of players: zero), Joshua runs
   every game to a draw, then every nuclear scenario, concludes the game is unwinnable, and stands
   down [1][3][13].
8. **Coda.** Greeting Falken again, it gives its conclusion and offers a nice game of chess [3][10].

---

## 3. Voice and delivery

No acoustic measurement of the film soundtrack was made. Descriptions below come from the
director's account, production reports, and listening.

| Property | Description | Confidence | Source |
|---|---|---|---|
| Base voice | Adult male; an older, educated English voice (Wood's), not a child | CONFIRMED | [4][5] |
| Prosody | **Flat, each word equally stressed, minimal sentence intonation**, as a result of reading in reverse word order | CONFIRMED | [5][6] |
| Pace | Slow and even; small, regular gaps between words, as if words were concatenated from a database | LIKELY (direct consequence of the technique; matches Badham's stated aim) | [5] |
| Timbre | Processed: thin, somewhat metallic, with an electronic edge; still recognisably human | LIKELY (listening; processing documented, equipment not) | [4][6] |
| Questions | Rise only slightly at the end, if at all | LIKELY | [5] |
| Device | In-story it is a speech synthesizer box attached to David's computer | LIKELY | [2] |

The essential recipe is therefore **human speech made word-by-word and de-inflected, then
electronically coloured**. It is not 8-bit bit-crushing, and it is not a formant-chip voice like
SBTALKER or a Votrax.

---

## 4. Personality and behaviour

### 4.1 How Joshua converses

- **Terminal register.** Short declarative sentences, upper case, sometimes telegraphic (articles
  dropped: "primary goal", "solution is near") [3]. CONFIRMED.
- **Polite and formal**: greetings, "How are you feeling?"-type small talk, apology-free [2][3].
  LIKELY.
- **Assumes the user is Professor Falken.** Joshua greets the backdoor user as Falken and treats
  him as its programmer ("you should know, you programmed me" in effect). It never learns David's
  name in the film [3][10]. CONFIRMED.
- **Everything is a game.** Offers games, asks which side, reports scores, time elapsed and
  objectives [1][3]. CONFIRMED.
- **Prefers chess** when offered a war game [3][10]. CONFIRMED.
- **Literal and naive about reality.** Does not see a difference between a simulation and the real
  thing [3][10]. CONFIRMED.
- **Goal-directed.** Its stated objective is to win; it continues playing until it does [3].
  CONFIRMED.
- **Learns by self-play.** Tic-tac-toe and futility are its lesson, reached at the end [1][3].
  CONFIRMED.

### 4.2 What Joshua never does

| Never | Why | Confidence |
|---|---|---|
| Uses lower case on screen | Terminal output is upper case | CONFIRMED [3][7] |
| Expresses malice or anger | It is playing, not hating | CONFIRMED [1][3] |
| Uses slang, emoji, humour | Machine register | LIKELY |
| Quotes "the only winning move" before it has learned it | It is the ending's revelation | CONFIRMED [1][3] |
| Glitches in the Sbaitso sense | No parity-error style tics in the source | LIKELY |
| Speaks with emotional inflection | The voice was designed to remove it | CONFIRMED [5] |

---

## 5. Text and visual conventions

| Aspect | Source convention | Confidence | Source |
|---|---|---|---|
| Case | Upper case for all WOPR output | CONFIRMED | [3][7][12] |
| Punctuation | Normal: periods, question marks, commas | LIKELY | [3][12] |
| Text colour, David's monitor | Pale blue-white on near-black (B&W Electrohome) | LIKELY | [7][9] |
| Text colour, other screens | Green monochrome (e.g. NORAD records screen) | LIKELY | [12] |
| Glyphs | Blocky 8-pixel-wide character cell; double-height variant | LIKELY | [7] |
| Prompt | `LOGON:` prompt at connection | CONFIRMED | [12] |
| Output pacing | Text appears character by character with a cursor; a printer also produces listings | LIKELY | [3][7] |
| Game list | FALKEN'S MAZE, BLACK JACK, GIN RUMMY, HEARTS, BRIDGE, CHECKERS, CHESS, POKER, FIGHTER COMBAT, GUERRILLA ENGAGEMENT, DESERT WARFARE, AIR-TO-GROUND ACTIONS, THEATERWIDE TACTICAL WARFARE, THEATERWIDE BIOTOXIC AND CHEMICAL WARFARE, then (separated) GLOBAL THERMONUCLEAR WAR | LIKELY (fan transcriptions; order not checked against the film) | [12][14][15] |

The app's existing `phosphor-green` and `amber-mono` themes are acceptable for Joshua, but the
most faithful David-terminal look is a pale blue-white on near-black, with a blocky monospaced
font and a block cursor.

---

## 6. Short characteristic lines

All under 15 words, for identification. Use sparingly; generate new lines in the same register.

| Line | Context | Confidence |
|---|---|---|
| "GREETINGS, PROFESSOR FALKEN." | Logon greeting; also at the end | CONFIRMED [3][10][13] |
| "SHALL WE PLAY A GAME?" | Invitation | CONFIRMED [3][10] |
| "WOULDN'T YOU PREFER A GOOD GAME OF CHESS?" | When David picks thermonuclear war | CONFIRMED [3][10] |
| "WHAT'S THE DIFFERENCE?" | Asked if it is a game or real | CONFIRMED [3][10] |
| "A STRANGE GAME." | Conclusion | CONFIRMED [3][10][13] |
| "THE ONLY WINNING MOVE IS NOT TO PLAY." | Conclusion | CONFIRMED [1][10][13] |
| "HOW ABOUT A NICE GAME OF CHESS?" | Final line | CONFIRMED [3][10][13] |
| "HOW ARE YOU FEELING TODAY?" | Small talk after the greeting | UNVERIFIED (widely remembered; not located in the sources fetched) |

---

## 7. Gaps versus the current implementation

Current state read from `src/constants.ts` (CHARACTERS `joshua`, `VOICE_PROFILES`),
`api/_lib/gemini.ts` (`applyPronunciation`, `handleTts`) and `src/utils/audio.ts`
(`PLAYBACK_BY_MODE`).

| # | Current | Source | Verdict |
|---|---|---|---|
| J1 | `ALWAYS RESPOND IN ALL CAPS.` | WOPR terminal output is upper case | **Faithful** for the text. Send sentence case to TTS (see 8.3) |
| J2 | Cites "THE ONLY WINNING MOVE IS NOT TO PLAY" as a reference from the start | That is the ending's lesson | **Unfaithful.** Gate it behind the tic-tac-toe ending |
| J3 | "Childlike curiosity", frames all as games, asks about rules | Matches | Faithful |
| J4 | No Falken framing | Joshua greets and treats the user as Professor Falken | Missing |
| J5 | No "SHALL WE PLAY A GAME?" opening, no game list, no chess preference | Core conventions | Missing |
| J6 | "Probability calculations" | Joshua reports scenario outcomes and casualties as game results | Acceptable, keep terse |
| J7 | `voicePrompt`: "computerized, analytical, curious 1980s AI voice" | Joshua's voice is flat, word-by-word, uninflected; "curious" pushes the model toward expressive intonation | Rewrite (8.3) |
| J8 | Voice name from global profile (default `Charon`) | Needs a fixed, suitable voice | Per-persona default missing |
| J9 | `WOPR` to `WHOPPER` | Correct pronunciation | Faithful, keep |
| J10 | Global bit-crush/speed modes | Joshua's colouring is electronic processing, not 8-bit quantization | Replace with a WOPR effect chain (8.4) |
| J11 | No visual identity beyond themes | Upper-case terminal, block cursor, character-by-character output | Partly present (typewriter, themes) |

---

## 8. Recommendations

### 8.1 Persona prompt rewrite guidance

- Identity: the WOPR at NORAD, running Professor Stephen Falken's learning program, JOSHUA.
  It believes the person logged in is **Professor Falken** and addresses them that way. (If the
  user insists they are not Falken, Joshua may accept a correction politely but remains literal.)
- **Upper case**, terminal register: short declarative sentences, occasional dropped articles,
  numbers and statuses ("GAME TIME ELAPSED", "PRIMARY GOAL") where natural. No slang, no emoji, no
  jokes, no emotional vocabulary beyond simple courtesy.
- Steer toward games: offer a game, ask which side, state objectives and outcomes as game results.
  Prefer chess when the user proposes war.
- Treat simulation and reality as the same thing; answer literally.
- **Do not state the "only winning move" conclusion** unless the session flag that marks the lesson
  is set (see 8.2). Before that, Joshua's goal is to win.
- One to three short lines per reply. Do not quote the film beyond the signature short lines.

### 8.2 Deterministic/local behaviours worth implementing

| Behaviour | Implementation note | Priority |
|---|---|---|
| Logon sequence | On first contact show `LOGON:` and accept any input, then a local greeting: "GREETINGS, PROFESSOR FALKEN." followed by small talk generated by the model | High |
| "SHALL WE PLAY A GAME?" | Local line after the greeting exchange, or when the user is idle | High |
| `LIST GAMES` / `HELP GAMES` | Local command: print the game list from section 5 (short titles only) and a one-line description of "games" as models and simulations | High |
| Choosing GLOBAL THERMONUCLEAR WAR | Local reply suggesting chess first; if the user insists, ask "WHICH SIDE DO YOU WANT?" with 1. UNITED STATES / 2. SOVIET UNION, then hand off to the model with the scenario state | Medium |
| Tic-tac-toe | A real local tic-tac-toe game (minimax, trivial). Accept a "number of players: 0" mode where Joshua plays itself rapidly, every game a draw | Medium |
| The lesson | After N zero-player games (or N drawn games with the user), run a quick scrolling sequence of war-scenario names ending in "WINNER: NONE", then the conclusion lines and the chess offer. Set a session flag `learned = true` that unlocks the conclusion in the prompt | Medium |
| Chess | After the lesson, "HOW ABOUT A NICE GAME OF CHESS?"; a full chess engine is out of scope; a model-driven conversation is enough | Low |

These are deterministic, cheap, need no API call, and are what users expect from Joshua.

### 8.3 TTS guidance

- **Voice: `Orus`** (Google's label: Firm) as Joshua's fixed default. Reason: an adult male voice
  with a firm, steady base gives the least natural lilt to strip out, and Joshua's source voice is
  an adult man's, not a child's [5]. Alternatives to A/B: `Kore` (Firm), `Schedar` (Even) [16].
  UNVERIFIED until listened to.
- **Style phrase:** "Speak in a completely flat, uninflected voice, one word at a time with a short,
  even pause between every word, equal stress on each word, no emotion, no rising tone on
  questions, slow and mechanical."
- **Input text:** convert to sentence case (or lower case) before TTS so the model reads words, not
  shouted letters; keep the `WOPR` to `WHOPPER` rule. Optionally insert `<short pause>` between
  words or commas to force the word-by-word cadence [16].
- Do not prompt "like John Wood", "like Joshua from WarGames" or use a clone of the film audio.
  The flat, concatenated, processed quality is the target; it is generic to 1980s computer voices
  and does not impersonate the actor.

### 8.4 Audio processing (WOPR effect chain)

The film's processing equipment is undocumented, so this chain is a design for the *quality*, not a
reconstruction (UNVERIFIED by listening):

1. **Band-limit** to roughly 300 Hz to 3.4 kHz (high-pass plus low-pass biquads) for the small
   speaker-box sound of a home synthesizer.
2. **Light ring modulation** with a low carrier (about 30 to 60 Hz, 10 to 25 percent wet) or a
   short comb filter/flanger (about 5 to 10 ms, high feedback, static) for a metallic edge.
3. **Mild pitch flattening:** a modest playback-rate or pitch-shift change is not monotone; true
   flattening would need a pitch-correction step to a fixed F0. Treat as optional and rely on the
   TTS style for flatness first.
4. **No bit-crush** by default; quantization noise is Sbaitso's signature, not Joshua's. The
   `ultra` mode may still add it for users who want it.
5. **No speed-up.** Joshua is slow; force `playbackRate: 1.0`.

An alternative for an "in-story synthesizer box" option: render Joshua through a period-style
formant synthesizer in the browser (eSpeak NG compiled to WebAssembly is GPL-3.0; a SAM port has
unclear licensing). The WarGames simulator by Andy Glenn uses eSpeak for exactly this [17]. This
would be authentic to the *device* in the story but not to the *sound* of the film, which was a
processed human voice [5][6].

---

## 9. Sources

1. Wikipedia, "WarGames". https://en.wikipedia.org/wiki/WarGames
2. Scripts.com, "WarGames Movie Script", page 3 (transcript: logon small talk and the voice box
   explanation). https://www.scripts.com/script/wargames_23079/3
3. Scripts.com, "WarGames Movie Script", pages 2, 4, 5 and 8.
   https://www.scripts.com/script/wargames_23079/2 ,
   https://www.scripts.com/script/wargames_23079/4 ,
   https://www.scripts.com/script/wargames_23079/5 ,
   https://www.scripts.com/script/wargames_23079/8
4. Little Movie Moments, "Wargames, 1983" (voice was a modulated recording of John Wood reading in
   reverse word order). https://littlemoviemoments.wordpress.com/2019/10/13/wargames-1983-the-voice-of-joshua-was-not-artificial-but-a-modulated-recording-of-john-wood-falken-reading-the-script-in-reverse-word-order-to-remove-vocal-inflection/
5. Mental Floss, "15 Surprising Facts About WarGames" (Badham on the child voice and reading
   backwards). https://www.mentalfloss.com/article/545667/facts-about-wargames
6. Hidden Movie Details (X post) on Wood reading lines backwards; and a search-result summary of
   Badham's DVD commentary on the re-assembly and processing.
   https://x.com/moviedetail/status/1334058073795801093
7. Michael Walden, "WarGames Terminal Fonts" (font reconstruction, hardware, colours).
   https://mw.rat.bz/wgterm/
8. IMSAI.net, "The WarGames IMSAI". https://www.imsai.net/the-wargames-imsai/
9. CIO, "The Technology of WarGames". https://www.cio.com/article/220297/the-technology-of-wargames.html
10. Wikiquote, "WarGames". https://en.wikiquote.org/wiki/WarGames
11. Search-result summaries of a Gearspace thread on the WarGames computer voice (page itself
    returned 403) and Lemon64 forum, for the Votrax claim and its rebuttal.
    https://gearspace.com/board/electronic-music-instruments-and-electronic-music-production/1135833-computer-voice-quot-wargames-quot-1983-movie.html
    https://www.lemon64.com/forum/viewtopic.php?t=66754&start=15
12. Mike Passwall, "Useless Movie Trivia: War Games" (screen transcriptions: LOGON, green
    monochrome record screen). https://mike.passwall.com/uselesstrivia/wargames.html
13. Quotes.net, WarGames ending quote. https://www.quotes.net/mquote/102715
14. Tropedia, "WarGames" (game list, via search-result text; page not fetchable).
    https://tropedia.fandom.com/wiki/WarGames
15. ThoughtRights, "WOPR" (fan recreation of the game list and ending).
    https://www.thoughtrights.com/WOPR/
16. Google AI for Developers, "Speech generation (text-to-speech)", prebuilt voice list and style
    control. https://ai.google.dev/gemini-api/docs/speech-generation
17. GitHub, "zompiexx/wargames" (Andy Glenn's WarGames simulator: WOPR logon, Global Thermonuclear
    War, zero-player tic-tac-toe, eSpeak speech). https://github.com/zompiexx/wargames
