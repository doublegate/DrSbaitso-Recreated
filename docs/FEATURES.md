# Features

A reference to what the app does. It has two screens: the **classic screen**, a faithful
recreation of Dr. Sbaitso v2.20 (1992; v1.01 shipped in 1990), which opens by default,
and **Enhanced mode**, with more personas and tools. Switch with **Alt+Shift+X**,
`?mode=enhanced` / `?mode=classic`, or the link on each screen; the choice is
remembered. How it is built: [ARCHITECTURE.md](ARCHITECTURE.md).

## Classic screen

An 80x25 DOS text display in the bundled IBM VGA 9x16 font, the original palette and the
v2.20 banner, scaled by whole numbers. Behaviour follows the original as measured in
DOSBox (`ref-docs/04-dosbox-verification.md`).

- **Start-up**: the banner, the inline `Please enter your name ...` prompt (letters and
  spaces only, `NAME TOO LONG` for long names), then the v2.20 greeting and a yellow `>`
  prompt with a blinking underline cursor.
- **Name letters**: each letter typed at the name prompt is spoken just after its echo,
  as in the original. The alphabet is rendered once in Dr. Sbaitso's voice and kept in
  the browser (`src/utils/letterVoice.ts`); on a first visit it loads in the background
  (26 small requests, at most ten a minute) and letters are silent until they arrive.
- **Speech**: each line is printed, then spoken; the next appears when the speech
  reaches it. A key press cuts the speech and the remaining lines print silently.
- **Commands** answered by the local engine (`src/engine/sbaitso/`), not the model:
  - `HELP` (three pages; `M` then Enter for more), `R` (repeat), `SAY <text>`,
    `CALC <sum>` and `WHAT IS <sum>` (a safe evaluator), `AUTHOR`, `SHUT UP`;
  - dot commands `.WIDTH 40/80`, `.COLOR`, `.PROMPT`, `.ECHO`, `.PITCH`, `.SPEED`,
    `.TONE`, `.VOLUME`, `.PARAM`, `.MASTER`, `.READ`, `.QUIT`, with the original's range
    errors (the voice settings are accepted but do not yet change the audio);
  - replies to empty Enter and to short, garbage and repeated input;
  - escalating replies to bad language, ending in the `PARITY ERR` flood with its falling
    buzz;
  - `BYE`, `QUIT` and `.QUIT`, then `<C>ontinue <N>ew patient <Q>uit`. Q drops to a DOS
    prompt; Enter there runs the program again.
- **Open conversation** goes to Gemini through the server proxy, with a persona prompt
  built from the original's real lines (ALL CAPS, knowledge cutoff 1992, initialisms
  spelled "C P U").
- **Accessibility**: a screen-reader transcript and a labelled input; see
  [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Personas (Enhanced mode)

Choose a persona in the header. Each keeps its own conversation memory, and the log marks
each switch (`--- NOW TALKING TO ... ---`). Every turn goes through the persona's local
engine first (`src/engine/personaTurn.ts`); only open conversation reaches the model.

| Persona | Local engine | Model | Voice |
|---|---|---|---|
| Dr. Sbaitso (1990-1992) | All the classic commands, dot commands, input checks and the parity sequence (shown shortened in the log) | open conversation | Charon or the chosen voice profile; the vintage chain |
| ELIZA (1966) | Everything: Weizenbaum's algorithm with the 1965 DOCTOR script | none (works offline) | Kore, clean |
| HAL 9000 (1968) | The pod bay door refusal, disconnect refusals, and the shutdown ending with "Daisy Bell" | open conversation, with your name; sentence case | Algieba, HAL chain |
| JOSHUA / WOPR (1983) | `LOGON:`, `LIST GAMES`, `HELP GAMES`, the war menu, tic-tac-toe (never loses), the self-play lesson | open conversation; "the only winning move" only after the lesson | Iapetus, WOPR chain |
| PARRY (1972) | Colby's fear/anger/mistrust model chooses each move | phrases the move as one line; a written fallback if the call fails | Orus, clean |
| Your characters | none | every turn, with your system instruction | Charon with your style prompt; the vintage chain |

Custom characters are made in SETTINGS > Character creator: name, description, era,
knowledge cutoff, system instruction, voice style prompt, letter case of replies and
personality traits, with a live preview. They are stored in this browser
(`customCharacters`). The creator's "Glitch Messages" field is saved but not used.

The voice commands "talk to ELIZA" (and the other persona names) switch persona too.

## Enhanced mode layout

- **Header**: the persona selector, four menus (CONVERSATION, VISUALS, SOUND, SETTINGS,
  each item showing its shortcut) and a CLASSIC button.
- **Log and input line**: replies type out at terminal speed (long printouts faster) and
  are spoken while they type. The input line has a microphone toggle and SEND.
- **Status bar**: audio mode, voice profile (only while Dr. Sbaitso is active: CLASSIC
  SBAITSO, DEEP (ENHANCED, NOT ORIGINAL), SLIGHTLY GLITCHY), theme, SAVE HISTORY,
  SPEECH MUTED and OFFLINE indicators.
- On phones the layout stacks, and swiping right closes the panel opened last. See
  [MOBILE.md](MOBILE.md).

## Conversation tools (CONVERSATION menu)

| Tool | What it does |
|---|---|
| Search and replay | Searches saved conversations (needs SAVE HISTORY) with usage statistics, and replays one message by message (Space, arrows, Home/End, `[` `]` speed, L loop) |
| Export | Print the current conversation to PDF via the print dialog, or download print-ready HTML; CSV (messages, statistics, word frequency, character usage); package custom themes; batch-export saved conversations as HTML, CSV, JSON or Markdown |
| Templates (Alt+Shift+L) | Six scripted openers in five categories (therapy, casual, technical, creative, educational). Each prompt is sent as a normal turn. |
| Insights (Alt+Shift+I) | A dashboard over saved conversations: timeline, sentiment and its trajectory, topics and topic clusters, persona usage, health score, loops, engagement, emotions, topic evolution, similar conversations, recurring patterns. Empty until SAVE HISTORY has kept something. |
| Clear conversation | Clears the log, the persona's model memory and its engine state |

**History is opt-in.** SAVE HISTORY in the status bar is off by default, honouring the
greeting's "MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE". When on, conversations are
kept in this browser's localStorage; turning it off erases them.

## Visuals (VISUALS menu)

| Tool | What it does |
|---|---|
| Emotion visualizer (Alt+Shift+E) | Emotions detected in the current conversation |
| Topic diagram (Alt+Shift+T) | A D3 force diagram of the conversation's topics |
| Audio visualizer | The speech that is playing, as a waveform, a frequency plot or bars |

Themes (status bar or SETTINGS > Theme customizer): DOS Blue (default), Phosphor Green,
Amber Monochrome, Paper White, Matrix Green, and your own themes with a WCAG contrast
check and JSON import/export. The choice is remembered.

## Sound (SOUND menu)

| Item | What it does |
|---|---|
| Voice input (Alt+Shift+V) | Dictate into the input line ([VOICE_INPUT.md](VOICE_INPUT.md)) |
| Hands-free voice control | "Hey Doctor" plus a command ([VOICE_CONTROL.md](VOICE_CONTROL.md)) |
| Mute / unmute speech | Replies are shown but not synthesised (saves TTS quota) |
| Music player (Alt+Shift+M) | Procedural chiptune loop ([MUSIC_MODE.md](MUSIC_MODE.md)) |
| Sound packs (Alt+Shift+P) | Your own sounds on app events ([SOUND_PACKS_GUIDE.md](SOUND_PACKS_GUIDE.md)) |
| Sound settings (Alt+Shift+S) | Built-in interface sounds (key clicks, beeps, boot sounds, ambience) in four styles |

**Audio modes** (status bar, Alt+Shift+Q), for Dr. Sbaitso's voice only:

| Mode | Sound |
|---|---|
| Modern Quality | The TTS as delivered |
| Subtle Vintage | A light band-pass; not period-accurate |
| Authentic Sound Blaster (default) | The measured original: 8475 Hz, unsigned 8-bit, sample-and-hold, flattened pitch |
| Ultra Authentic | Authentic through the darker SB Pro 3.2 kHz filter |

Details: [AUDIO_SYSTEM.md](AUDIO_SYSTEM.md).

## Settings (SETTINGS menu)

Theme customizer, character creator, accessibility (Alt+Shift+A;
[ACCESSIBILITY.md](ACCESSIBILITY.md)), voice commands, cloud sync
([CLOUD_SYNC.md](CLOUD_SYNC.md)) and the tutorial (Alt+Shift+H), which runs once on the
first visit.

## Installable app and offline

- Installable as a PWA; the shortcuts open the classic screen or Enhanced mode.
- Text or links shared to the installed app land, unsent, on the input line of either
  screen.
- After one visit the app loads offline; replies and speech need the network. Enhanced
  mode shows OFFLINE, and ELIZA keeps working.
- Updates wait for you: "A NEW VERSION IS AVAILABLE" with RELOAD and LATER.

See [PWA.md](PWA.md).

## Privacy and security

- The Gemini API key stays on the server; the browser talks only to `/api`
  ([API.md](API.md)).
- Nothing is saved unless you turn on SAVE HISTORY; cloud sync uploads only that history,
  to a Firebase project you supply.
- A strict Content-Security-Policy and security headers on every response
  ([DEPLOYMENT.md](DEPLOYMENT.md)).
- Development builds load a performance profiler; production loads it only with
  `?profile=1` ([PERFORMANCE.md](PERFORMANCE.md)).
