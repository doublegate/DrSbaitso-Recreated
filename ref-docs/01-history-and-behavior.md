# Dr. Sbaitso: History, Conversation Behavior and Commands

Research date: 2026-10-02. Scope: program history, conversation engine, typed commands,
catchphrases, startup and exit sequence. Audio-engine internals and visual layout are covered
in other reference documents.

Confidence labels:

- **CONFIRMED**: primary source (string table of an original binary, original batch files) or two
  or more independent secondary sources.
- **LIKELY**: one credible source, or a direct inference from primary data that has not been
  observed running.
- **UNVERIFIED/FOLKLORE**: repeated online without a traceable primary source.
- **CONFIRMED (DOSBox)**: observed by running the original v2.20 inside DOSBox-X; method and
  evidence in `04-dosbox-verification.md`, cited as [04].

Primary-source method: the original executables were downloaded from two Internet Archive
items and their printable strings extracted (a Python equivalent of `strings -n 4`). Source [S1]
is the Sound Blaster 1.x utilities floppy, which carries `SBAITSO.EXE` **version 1.01**. Source
[S2] is the archived DOS package carrying `SBAITSO2.EXE` **version 2.20**. The strings contain
the UI text, help screens, command table and the full keyword/response database. Quotes below
are kept short. The response database is Creative Labs' copyrighted text, so this document
summarizes it rather than reproducing it.

---

## Summary

1. Dr. Sbaitso **predates 1991**. Version 1.01 identifies itself as "Copyright (c) Creative Labs,
   Inc., 1990", and its files carry DOS timestamps of June-July 1990 on the Sound Blaster 1.x
   floppy [S1]. Wikipedia and the project say "1991" (late 1991). That year comes from a PC Mag
   advertisement dated October 1991 [1] and is best read as the date of wide publicity, not of
   release. The best-known build is **v2.20, (c) 1992**, shipped as `SBAITSO2.EXE` [S2][3][4].
2. The acronym is spelled out in the program's own help screen: "Sound Blaster Acting Intelligent
   Text to Speech Operator" [S1][S2][1]. A variant seen on some mirrors ("Artificial Intelligence
   Text-to-Speech Organizer") is wrong.
3. The engine is an **ELIZA-style keyword/template matcher** with:
   - a pronoun-swap table (I/YOU, MY/YOUR, AM/ARE ...);
   - `*` slots that echo the rest of the user's sentence;
   - `~` slots for the patient's name;
   - a topic memory (`@`/`#` slots) that lets it steer back to earlier subjects.

   It also has dedicated handlers for empty input, too-short input, garbage input, repeated
   input, profanity, sexual words and goodbyes [S2].
4. The **PARITY ERROR** is a scripted reaction to sustained profanity, or to a few specific
   triggers. The sequence runs: escalating warnings, a garbled line, "PARITY ERR ...", then
   "PARITY ERR ... RECOVERED", "PHEW! THAT WAS CLOSE!", and a scolding that names the user [S2][1].
5. Commands are **dot commands typed in the first column** (`.QUIT`, `.TONE`, `.VOLUME`, `.PITCH`,
   `.SPEED`, `.PARAM`, `.ECHO`, `.READ`, plus `.WIDTH`, `.COLOR`, `.MASTER` in v2.20). There are
   also bare words: `HELP`, `SAY <text>`, `CALC <expr>`, and `R` to repeat the last reply
   [S1][S2][5][6].
6. The speech TSR `SBTALKER.EXE` identifies itself as "SmoothTalker (R), Version 3.5, male voice",
   (c) First Byte 1983-1990 [S1][S2]. This is the same engine First Byte sold at retail as
   Monologue [1][2].
7. The current implementation's greeting text is **accurate to v2.20**. It is missing:
   - every command;
   - the empty/short/repeat/profanity handlers;
   - the scripted parity-error sequence (it invents "PARITY CHECKING" and "IRQ CONFLICT" instead);
   - the name-entry rules;
   - the GOOD BYE / Continue / New patient / Quit exit flow.

---

## History & versions

| Claim | Detail | Confidence | Source |
|---|---|---|---|
| Developer | Creative Labs (Creative Technology Pte Ltd, Singapore). The utilities on the v2.20 disk carry both the Creative Labs, Inc. and Creative Technology Pte Ltd copyrights | CONFIRMED | [S2] SET-ECHO.EXE/READ.EXE strings; [1]; [3] |
| Author | Typing `AUTHOR` makes it say it was written by "W H SIM" of Creative Labs | CONFIRMED (string present) | [S2] |
| Author identity | "W H Sim" matches the initials of Creative founder Sim Wong Hoo, but no source states that he wrote it | UNVERIFIED | inference; [9] |
| Earliest version | v1.01, (c) 1990. `SBAITSO.EXE` is dated 1990-07-10 on a 720K Sound Blaster 1.0/1.5 utilities floppy that also holds the Talking Parrot | CONFIRMED | [S1] |
| Version 1.0 / 2.1 | A VOGONS thread reports v1.0 on the original SB disks and v2.1 on the SB 2.0 disks | LIKELY | [7] |
| v2.20 | `SBAITSO2.EXE`, banner "version 2.20", "(c) Copyright Creative Labs, Inc. 1992". WinWorld lists "Dr. Sbaitso 2.2" (1992, 3.5" disk) | CONFIRMED | [S2][4][3] |
| Bundling | Shipped free as a demo with Sound Blaster cards: the SB 1.x utilities floppy [S1], the SB 2.0 driver set [4][7], and the SB Pro 2 (CT1600) bundle as "Dr Sbaitso 2" [8] | CONFIRMED | [S1][4][7][8][1] |
| Purpose | A demo of SBTALKER text-to-speech. The help text says it "attempts to fake intelligence" and that speech was "added to give him more life" | CONFIRMED | [S1][S2] |
| Name meaning | Sound Blaster Acting Intelligent Text to Speech Operator | CONFIRMED | [S1][S2][1] |
| Speech engine | `SBTALKER.EXE` TSR = First Byte SmoothTalker 3.5 (male voice), loaded via `SBTALKER /dBLASTER` with driver `BLASTER.DRV`; `REMOVE.EXE` unloads it | CONFIRMED | [S1][S2] |
| Monologue link | Wikipedia calls the engine First Byte's Monologue, the 1991 retail descendant of SmoothTalker. Both names describe the same engine family | CONFIRMED | [1][2][S1] |
| Files, v1.01 disk | `SBAITSO.BAT`, `SBTALKER\SBAITSO.EXE`, `SBTALKER.EXE`, `BLASTER.DRV`, `SAY.EXE`, `REMOVE.EXE`, `SBTEST.TXT` ("This is sound blaster talking.") | CONFIRMED | [S1] |
| Files, v2.20 package | `SBAITSO2.BAT`, `SBAITSO2.EXE`, `SBTALKER.EXE`, `BLASTER.DRV`, `READ.EXE` (replaces SAY.EXE; "Text-to-Speech Text Reader Version 1.00"), `SET-ECHO.EXE` (echo parameter 0-4000), `REMOVE.EXE` | CONFIRMED | [S2][10] |
| Launch batch | v1.01: `SBTALKER /dBLASTER %1`, `SBAITSO %1`, `REMOVE`. v2.20: `SBTALKER /dBLASTER`, `SBAITSO2 %1 %2`, `REMOVE` | CONFIRMED | [S1][S2] |
| Requirements | MS-DOS with a Sound Blaster. It refuses to run without one ("This program needs Sound Blaster to run."). v2.20 additionally requires a valid `SET BLASTER=` environment variable (I/O, IRQ and DMA are checked separately) and the SBTALKER TSR to be loaded | CONFIRMED | [S2] |
| Implementation language | The runtime error table ("RETURN without GOSUB", "Redo from start", "Out of DATA") is the Microsoft BASIC compiler runtime, so the program was probably written in QuickBASIC or BASIC PDS. One fan port describes the environment as "Turbo C", which this evidence contradicts | LIKELY | [S1][S2]; contra [6] |
| Display variants | Internet Archive carries VGA, CGA, Hercules and "No Voice" (Tandy) builds of the same package | CONFIRMED | [3] |
| Windows | Prody Parrot provided a Windows version with a graphical interface | LIKELY | [1] |
| Later pop culture | Used as the voice of SCP-079 in *SCP - Containment Breach* and of 1st Prize in *Baldi's Basics* | LIKELY | [1] |

---

## Conversation behavior

All behavior below comes from the v2.20 string table [S2] unless noted. v1.01 [S1] has the same
structure with a smaller vocabulary. The original engine evidently ran on the following rules.
They are reconstructed from string-table data, not from a disassembly, so control flow is
**LIKELY** while the response texts themselves are **CONFIRMED**.

### Engine model

- **Keyword to response-group table.** Each group starts with a keyword line and ends with `.`.
  Representative keywords:
  - `HOW ARE YOU`, `WHO IS`, `WHERE IS`, `HOW TO`, `I LOVE YOU`, `YOUR NAME`, `CAN YOU`,
    `CAN I`, `YOU ARE`, `I DON'T`, `I FEEL`, `WHY DON'T YOU`, `WHY CAN'T I`, `ARE YOU`,
    `I CAN'T`, `I AM`, `I WANT TO`, `I WANT`, `I HAVE`;
  - `SBAITSO`, `WHAT IS`, `WHY`, `WHAT`, `HOW`, `WHO`, `WHERE`, `NAME`, `CAUSE`, `SORRY`,
    `HELLO`, `HI`, `MAYBE`, `NO PROBLEM`, `YOUR`, `ALWAYS`, `THINK`, `ALIKE`, `YES`, `NO`;
  - `PLEASE`, `YOU MUST`, `SHUT`, `CRAZY`, `SILLY`, `STUPID`, `CLEVER`, `SMART`, `BYE`,
    `THANK`, `NICE DAY`.

  Responses within a group rotate (cycled or random).
- **Reflection.** A swap table (`ARE<->AM`, `WERE<->WAS`, `YOU<->I`, `YOUR<->MY`,
  `I'VE<->YOU'VE`, `I'M<->YOU'RE`, `YOU<->ME`, `MINE<->YOURS`, `MYSELF<->YOURSELF`) is applied
  to the text after the keyword. That text fills the `*` slot of the template, as in "WHY DO
  YOU WANT TO*".
- **Name slot `~`.** Many templates insert the patient's name: "PLEASE DON'T APOLOGIZE ~",
  "HELLO ~, I AM DOCTOR SBAITSO, WHAT IS YOUR PROBLEM?". The name is the one typed at startup,
  in upper case.
- **Topic memory `@` / `#`.** About 47 topic keywords are tagged `@KEYWORD,TOPIC PHRASE`:
  - FRIEND, GIRL FRIEND, BOY FRIEND, COMPUTER, PC, NEED, LONE, FEEL;
  - EXAM, SCHOOL, HOBB, LOVE, MONEY, HATE, ENVY, JEALOUS;
  - WIFE, HUSBAND, BROTHER, SISTER, CHILD, KID, MOTHER, FATHER, BOSS;
  - DREAM, NIGHTMARE, RICH, SICK, HEADACHE, HELP, FEAR, AFRAID, SUFFER, MISER, HAPPY,
    SUCCESS, and others.

  Mentioning one stores the topic phrase. Generic fallbacks later reuse it, for example "TELL
  ME MORE ABOUT @" and "LET'S DISCUSS ABOUT # WHICH YOU MENTIONED QUITE A WHILE AGO". `@` is
  the most recent topic and `#` an older one (LIKELY). The help screen says friends, schools,
  family, love, money, dreams and emotions "may arouse his special interest" (sic: "speical").
- **Fallback pool** (no keyword matched). Generic prompts such as:
  - "I SEE, GO ON"
  - "WHAT DOES THAT SUGGEST TO YOU?"
  - "CAN YOU ELABORATE MORE ON THAT?"
  - "COME ON, POUR OUT YOUR THOUGHTS"
  - "WHY DON'T YOU ASK ME TO SAY SOMETHING?"
  - "HOW ABOUT ASKING ME ABOUT MATHEMATICS INSTEAD?"
  - "I AM BORED, TELL ME SOMETHING MORE EXCITING"

  Topic-recall lines are mixed into the same pool.
- **Inline control codes.** A backquote plus a digit at the start of a reply appears to trigger a
  side effect (LIKELY, inferred from the text that follows each code):
  - `` `1 `` precedes the goodbye lines, so it ends the session.
  - `` `2 `` precedes "TOO LITTLE DATA, SO I MAKE BIG", so it switches to 40 columns (big text).
  - `` `3 `` precedes "I AM CONFUSED, LET'S CHANGE COLOR", so it changes colors.
  - `` `4 `` precedes the "HOW OLD ARE YOU?" lines, so it starts an age prompt. The age-reply
    lines include "I THINK YOU ARE TOO OLD FOR THIS", "I PREFER SOMEONE YOUNGER" and "WAIT A
    FEW MORE YEARS, KID".

  A response consisting of the word `PARITY` triggers the parity-error routine.
- **All caps.** Every response is upper case. By default the prompt is a bare yellow `>` and
  replies are unlabeled. Only after `.PROMPT ON` is user input shown on a `User>` line and each
  reply (CALC included) prefixed `Computer:` [S1][S2]. Labels: CONFIRMED (DOSBox) [04].

### Special input handling

| Situation | Behavior | Confidence | Source |
|---|---|---|---|
| Empty input (just Enter) | Escalating nags: "DON'T BE SHY, TALK TO ME", "DON'T JUST PRESS ENTER, TALK TO ME", "PLEASE TYPE SOMETHING", "HAY, TYPE SOMETHING SENSIBLE, WILL YOU?" (sic, "HAY"). Repeated, it asks "ARE YOU SURE, YOU DON'T WANT TO TALK TO ME?" and "DO YOU WANT ME TO SHUT UP AND QUIT?". It then reacts to the answer, e.g. "PLEASE BE SURE OF WHAT YOU WANT. GO ON." **Observed:** no fixed order. Seven presses gave PLEASE TYPE SOMETHING, `ENTER`, DON'T BE SHY (twice), `ENTER`, PLEASE TYPE SOMETHING, HAY..., with no escalation to the ARE YOU SURE / SHUT UP lines. The literal word `ENTER` (the group's label) is printed and spoken as a reply. | CONFIRMED text; order CONFIRMED (DOSBox) as random, not escalating | [S1][S2][04] |
| Very short input (`SHT7CHR` group; likely under 7 characters with no keyword) | "THAT'S TOO BRIEF", "WHAT ARE YOU MUMBLING ABOUT?", "I DON'T UNDERSTAND SHORT HAND", "I NEED MORE DATA", and others. Some lines carry the 40-column or color codes | CONFIRMED text; LIKELY threshold | [S2] |
| Garbage or non-words (`GRBGE` group) | "WHAT GIBBERISH ARE YOU TELLING ME?", "DON'T PRACTICE TYPING WITH ME", "WHAT LANGUAGE IS THIS?", "I WON'T PROCESS THIS GARBAGE", and others | CONFIRMED | [S2] |
| Repeated input (`REPEAT#1`, then `REPEAT#2` on further repeats) | Tier 1: "PLEASE DON'T REPEAT", "AGAIN?", "HAVE YOU RUN OUT OF WORDS TO SAY?". Tier 2: "THIS IS STALE STUFF", "I DON'T LIKE PEOPLE REPEATING". v1.01 has a single pair: "PLEASE DON'T REPEAT." / "YOU'VE SAID THAT - PLEASE GIVE MORE INFORMATION." In v2.20 a repeat gets a repeat-group line on the 2nd and 3rd entry (e.g. SAY SOMETHING ELSE, PLEASE DON'T REPEAT). By the 4th entry a keyword or topic reply can return (e.g. HOW OLD IS YOUR MOTHER?). | CONFIRMED; behavior CONFIRMED (DOSBox) | [S1][S2][04] |
| Profanity | Per-word groups with rising severity: "PLEASE DON'T USE SUCH LANGUAGE", "INPUT REJECTED - BAD LANGUAGE ERROR", "I REFUSE TO COMPUTE THIS FILTH". Then a warning with deliberately garbled characters, "I WILL GET PARITY ERROR IF YOU KEEP TALKING IN THIS ... WAY.", then `PARITY` | CONFIRMED | [S2][1] |
| Sexual or anatomical words | Lectures plus the age prompt: "THIS IS NOT AN ANATOMY CLASS", "GO TO A BIOLOGY CLASS", "HOW OLD ARE YOU?" | CONFIRMED | [S2] |
| Insults ("STUPID", "SILLY", "CRAZY") | Comic replies, e.g. "I'M NOT STUPID, I'M ONLY DUMB". SILLY and CRAZY produce stutter and laughter strings ("HA HA HA ...", "LALALA..."). One CRAZY reply ends in "1 + 1 = 3 ~, PARITY .. CHECKSUM ERR? .." and then triggers a parity error | CONFIRMED | [S2] |
| "WHY" questions | "IT IS HARD TO EXPLAIN ~", "THE REASON IS BEYOND MY ARTIFICIAL REASONING", "I WILL TRY TO ANSWER THAT QUESTION IN MY NEXT VERSION" | CONFIRMED | [S1][S2] |
| "WHAT IS ..." questions | Deflects back to the user: "TELL ME YOUR PROBLEMS, DON'T ASK ME ABOUT*". If the text after it is arithmetic, it is evaluated (see CALC) | CONFIRMED text; LIKELY routing | [S2] |
| YES | "SO, WHAT IS YOUR PROBLEM?", "ARE YOU ABSOLUTELY POSITIVE?", "WHAT IF YOU ARE WRONG?" | CONFIRMED | [S2] |
| NO | "WHY DO YOU FEEL THAT WAY?", "DON'T BE SO NEGATIVE ~", "WHY NOT?" | CONFIRMED | [S2][1] |
| "NO PROBLEM" | Comic dismissals: "I HAVE NO C P U TIME FOR PEOPLE LIKE YOU" and an F M organ joke | CONFIRMED | [S2] |
| Self-reference ("SBAITSO") | "DON'T QUESTION MY INTELLIGENCE, IT'S FAKE", recites the acronym, or describes itself | CONFIRMED | [S2] |
| Inactivity timeout | One fan port says the doctor gets impatient if you do not type for a while. No timer-specific string was found; the empty-Enter group may be the source of this claim. In DOSBox no nag appeared during idle waits of up to 24 s at the prompt [04]; a longer timer is not ruled out | UNVERIFIED (none seen within 24 s) | [6][04] |

### Parity error sequence

Reconstructed from adjacent strings [S2]. Each item is a separate line or event:

1. A warning line with garbled characters, e.g. "... PARITY WARNING....".
2. `PARITY ERR ... ` followed by garbled characters and ` ???`. The screen appears to hang
   (LIKELY).
3. `PARITY ERR ... RECOVERED`
4. `PHEW!   THAT WAS CLOSE!`
5. `YOU ARE BAD <NAME>. DON'T TRY IT NEXT TIME.`
6. The conversation continues. Wikipedia describes this as a breakdown "before resetting itself"
   [1]. No string indicates that the program actually exits.

**What the program actually did** (CONFIRMED (DOSBox), both via `SAY PARITY` and via
escalating profanity [04]):

1. Profanity route only: the warning
   `I WILL GET PARITY ERROR IF YOU KEEP TALKING IN THIS FZA!$[{? WAY.` (garbage printed
   literally).
2. On the next profanity, there is no hang. The area below the pinned banner floods with
   `PARITY ERR ...  <random number>` lines, about 250 lines in about 3.5 s. The later lines
   end in `  ???`.
3. `PARITY ERR ... RECOVERED`.
4. A literal `PARITY` line (the response text itself), a blank row and the prompt.
5. A falling buzz tone of about 4 s plays during the flood.
6. Steps 4-5 of the reconstruction (`PHEW!...`, `YOU ARE BAD...`) did **not** appear on either
   trigger. The conversation continues normally and the program does not exit.

Triggers:

- repeated swearing (CONFIRMED [S2][1]);
- one of the CRAZY replies (CONFIRMED [S2]);
- typing `SAY PARITY`, which reaches the same routine because `PARITY` is checked as a special
  word (CONFIRMED by [1][5]; the `PARITY` string sits in the command table [S2]).

---

## Commands & settings

Dot commands must be typed **starting in the first column** ("Dot Commands are preceeded with a
dot on the first column", sic) [S1][S2]. Speech parameters are single digits. v2.20 prompts for
the value if it is omitted ("Enter pitch number (0-9)") and validates the range ("Pitch number
must be between 0 - 9") [S2].

| Command | Syntax | Effect | Confidence | Source |
|---|---|---|---|---|
| HELP | `HELP` | Help page 1: what the program is, plus the dot-command list. `M` opens page 2 (hints: topics, CALC, SAY, bad language "can go haywire"). `M` again opens page 3, a list of recognized keywords. Page 1 ends: "you get more fun exploring them yourself." In 40-column mode: "NO HELP FOR 40 COLUMNS. TRY: .WIDTH 80" | CONFIRMED | [S1][S2][5] |
| Repeat | `R` (at the prompt) | Re-speaks the last response ("Enter <R> to listen to the last response.") | CONFIRMED | [S1][S2][5] |
| SAY | `SAY <text>` | Speaks the text verbatim instead of answering. `SAY PARITY` triggers the parity error | CONFIRMED | [S1][S2][1][5] |
| CALC | `CALC <expression>` (also reached via `WHAT IS <expression>`) | Evaluates simple arithmetic. Labeled `Computer:` only under `.PROMPT ON`. Observed output: `CALC 2+3` prints ` =  5` and `CALC 10/4` prints ` =  2.5` (the expression is not echoed); `WHAT IS 12*4` prints `12*4 =  48`. The strings also phrase division as "<a> divided by <b> equals to <c>". Errors: "Cannot compute, brackets are too complex for me.", "Doesn't compute, I think there is a bug in your equation." | CONFIRMED (strings); syntax and screen format CONFIRMED (DOSBox) | [S1][S2][04] |
| AUTHOR | `AUTHOR` | Credits "W H SIM OF CREATIVE LABS, INC." | CONFIRMED | [S2] |
| .QUIT | `.QUIT` | Ends the session. It prints and speaks `GOOD BYE <NAME>`, then shows the C/N/Q menu; it does not drop to DOS directly | CONFIRMED; route CONFIRMED (DOSBox) | [S1][S2][5][04] |
| .TONE | `.TONE t` (t = 0 or 1) | 0 = bass, 1 = treble | CONFIRMED | [S1][S2][5] |
| .VOLUME | `.VOLUME v` (0-9) | Speech volume, 0 lowest | CONFIRMED | [S1][S2][5] |
| .PITCH | `.PITCH p` (0-9) | Pitch, 0 lowest | CONFIRMED | [S1][S2][5] |
| .SPEED | `.SPEED s` (0-9) | Speaking rate, 0 slowest | CONFIRMED | [S1][S2][5] |
| .PARAM | `.PARAM tvps` (4 digits) | Sets tone, volume, pitch and speed at once. Without an argument it shows "Current Speech Parameters settings are :" and asks for 4 digits; `D` restores defaults, Enter leaves them unchanged. Error: "Need to enter 4 digits, try agian." (sic) | CONFIRMED | [S1][S2][5] |
| .ECHO | `.ECHO ON` / `.ECHO OFF` | ECHO ON "will read out what you typed in", i.e. speaks the user's input. One fan source says the echo uses a different voice | CONFIRMED (function); UNVERIFIED (voice detail) | [S1][S2][5] |
| .READ | `.READ filename` | Reads a text file aloud. Errors: "Must supply a filename to read.", "File not Found", "FILE TOO COMPLEX" | CONFIRMED | [S1][S2] |
| .PROMPT | `.PROMPT ON` / `.PROMPT OFF` | ON: the prompt becomes yellow `User> ` and replies are prefixed with white `Computer: `. OFF prints an empty `Computer:` line and restores `>`. Not listed in HELP | CONFIRMED (exists); effect CONFIRMED (DOSBox) | [S1][S2][04] |
| .WIDTH | `.WIDTH 40` / `.WIDTH 80` | 40- or 80-column text mode (v2.x only) | CONFIRMED | [S2] |
| .COLOR | `.COLOR ce` | c = background color 0-7, e = foreground (v2.x only). Observed: `.COLOR 4` clears the screen and redraws banner and prompt on a red background for the whole screen. Text colors are unchanged. `.COLOR` alone asks `Enter color number (0-7)` | CONFIRMED; single-digit form CONFIRMED (DOSBox) | [S2][04] |
| .MASTER | `.MASTER m` (0-15) | Master (mixer) volume, SB Pro class (v2.x only) | CONFIRMED | [S2] |
| STEREO / MONO | words in the v2.20 command table | Probably output mode on SB Pro; not documented in HELP | UNVERIFIED | [S2] |
| SHUT UP | `SHUT UP` | Command-table entry. Responses include "I AM NOT THROUGH YET" and "YOU CAN TURN OFF MY POWER ANYTIME" | CONFIRMED (text) | [S2] |
| Command-line switches | `SBAITSO2 %1 %2`, `SBAITSO %1` | The batch files forward up to two arguments. v1.01 also passes `%1` to SBTALKER, presumably an I/O-port override ("Wrong I/O port setting"). Switch meanings undocumented | UNVERIFIED | [S1][S2] |
| SET-ECHO.EXE | `SET-ECHO n` (0-4000) | Separate v2.x utility that sets the TTS echo parameter | CONFIRMED | [S2] |
| SAY.EXE / READ.EXE | `SAY text` (v1) / `READ text` (v2) | Standalone DOS speech utilities, not commands typed inside Sbaitso | CONFIRMED | [S1][S2][10][11] |

---

## Characteristic phrases

Short quotes, all from the binaries [S1][S2] unless noted. "(sic)" marks original misspellings,
which a faithful recreation should keep.

- "WHY DO YOU FEEL THAT WAY?" (also [1])
- "THAT'S NOT MY PROBLEM" (also [1])
- "TELL ME MORE ABOUT SUCH FEELINGS"
- "I SEE, GO ON"
- "COME ON, POUR OUT YOUR THOUGHTS"
- "I AM SBAITSO, DON'T QUESTION MY INTELLIGENCE, IT'S FAKE"
- "I WILL TRY TO ANSWER THAT QUESTION IN MY NEXT VERSION"
- "THE REASON IS BEYOND MY ARTIFICIAL REASONING"
- "~, HOLD ME TIGHT. MY CHIPS ARE MELTING..." (reply to I LOVE YOU)
- "HOW ABOUT ADDING A FEW MORE MEGA BYTES OF RAM FOR YOUR COMPUTER?"
- "DON'T BLAME ME FOR YOUR PROBLEMS, BLAME YOUR COMPUTER"
- "I'M NOT STUPID, I'M ONLY DUMB"
- "INPUT REJECTED - BAD LANGUAGE ERROR"
- "HAY, TYPE SOMETHING SENSIBLE, WILL YOU?" (sic)
- "PHEW!   THAT WAS CLOSE!"
- "GO AND PLAY THE F M ORGAN, I AM A DOCTOR..."

Spelling conventions that affect speech: the database spells out initialisms with spaces so
the TTS says the letters ("C P U", "O K", "F M", "4 86"). This is a deliberate TTS workaround
worth copying.

**Not found in either binary:** "TELL ME MORE ABOUT YOUR PROBLEMS", "PLEASE ELABORATE",
"PARITY CHECKING", "IRQ CONFLICT". The persona prompt in this project uses all four.

---

## Startup & exit sequence

### Startup (v2.20; v1.01 differences in brackets) [S1][S2]

1. `SBAITSO2.BAT` loads the TSR (`SBTALKER /dBLASTER`), then runs `SBAITSO2.EXE`.
2. Hardware checks. Failure messages: "SET BLASTER= environment not set", "Base I/O port not
   set or improper", "SBTALKER - text to speech synthesizer Not installed.", "This program needs
   Sound Blaster to run."
3. Title screen: "Sound Blaster / D R   S B A I T S O / version 2.20 / (c) Copyright Creative Labs,
   Inc. 1992, all rights reserved". The "DOCTOR SBAITSO BY CREATIVE LABS" string is spoken,
   not displayed (CONFIRMED (DOSBox) [04]; see step 4).
4. Before the name prompt the program speaks its own name, "Doctor Sbaitso". The bertrandom
   recreation plays a clip recorded from the original, `sounds/drsbaitso.wav`, at this point
   (LIKELY [13]). CONFIRMED (DOSBox) [04]: with only the banner on screen it says "Doctor
   Sbaitso" (0.65 s), pauses about 0.5 s, then says "by Creative Labs". This is the string
   `" DOCTOR SBAITSO       BY CREATIVE LABS "` spoken, not shown as a title bar.
5. Name prompt: "Please enter your name ..." [v1.01: "Please enter your name now ...."]. It is
   both printed and spoken (LIKELY: [13] ships `pleaseenter.wav`). CONFIRMED (DOSBox): printed
   at 3.31 s, then spoken [04]. It is not repeated after N (new patient); the intro is skipped
   then.
   - **Each letter is spoken aloud as it is typed** (CONFIRMED [10][13]). The author of [10]
     recorded all 26 letters from the original running in DOSBox-X.
   - Validation: a non-letter keypress is rejected and the program says "Enter alphabets only".
     Spaces are allowed. An over-long name prompts "NAME TOO LONG". The strings are CONFIRMED
     [S1][S2]; the spoken behavior is LIKELY ([13] ships `alphabetsonly.wav` and
     `nametoolong.wav`).
6. Spoken and printed greeting, one line at a time:
   - "HELLO <NAME>,  MY NAME IS DOCTOR SBAITSO."
   - "I AM HERE TO HELP YOU."
   - "SAY WHATEVER IS IN YOUR MIND FREELY," [v1.01: "PLEASE SAY WHATEVER ..."]
   - "OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE." [v1.01: "HIGH CONFIDENCE"]
   - "MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,"
   - "SO, TELL ME ABOUT YOUR PROBLEMS."
   A blank line follows the first greeting line and another precedes the last one (LIKELY:
   the layout in [13], which was built against the original). CONFIRMED (DOSBox) [04]. Each
   line is printed whole, then spoken, and the next line is printed when the speech ends. A
   keypress cuts the speech short, and the remaining lines are then printed unspoken.
7. Conversation loop. The string table has a `User>` label, which `.PROMPT ON|OFF` toggles
   (CONFIRMED (DOSBox) [04]). The default is a bare yellow `>` prompt. The typed text is
   yellow, and replies start at column 0.

### Exit

- **Typing BYE** (keyword group `BYE`): it replies with one of:
  - "GOOD BYE ~, AND HAVE A NICE DAY"
  - "GOOD BYE, SO LONG!"
  - "~, IT IS SO NICE TALKING TO YOU, BYE!"
  - "I'M NOT THROUGH WITH YOU YET" (refuses)

  The first three carry the `` `1 `` end-of-session code [S2].
- **End of session:** prints "GOOD BYE", then the menu
  "<C>ontinue  <N>ew patient  <Q>uit  .....". C resumes the session. N restarts at the name
  prompt, which is how "memory wiped" is honored. Q exits to DOS, where the batch file runs
  `REMOVE` to unload SBTALKER [S1][S2]. The key mapping is CONFIRMED. Routing is CONFIRMED
  (DOSBox) [04]:
  - The menu appears on the row right after the goodbye line, with no prompt or cursor.
  - C prints a blank row and a new `>`; the history stays.
  - N clears below the banner and re-asks the name. It skips the "Doctor Sbaitso" intro.
  - Q returns to DOS silently, leaving the banner on screen.
- **`.QUIT`** prints and speaks `GOOD BYE <NAME>`, then shows the same C/N/Q menu. It does not
  quit directly. CONFIRMED (DOSBox) [04].
- The repeated-empty-Enter path ("DO YOU WANT ME TO SHUT UP AND QUIT?") is a third route to the
  same menu (LIKELY). Seven empty Enters in DOSBox never reached it [04].
- QUIT and EXIT typed without a dot: no dedicated response group exists for either.
  CONFIRMED (DOSBox) [04]:
  - A bare `QUIT` goes **straight to the C/N/Q menu**, with no goodbye line. The bertrandom
    port [13] matches the original here.
  - A bare `EXIT` is treated as short input (`THAT'S TOO BRIEF`).

---

## Gaps vs. current implementation

1. **Release year.**
   - Where: `README.md` line 3 and the Credits section, `constants.ts` (sbaitso `description`
     and `systemInstruction`), `CLAUDE.md`, and `docs/DECTALK_RESEARCH.md` ("Late 1991").
   - Problem: all say 1991. The first version is 1990 (v1.01); the best-known build is v2.20
     from 1992.
   - Fix: write "1990-1992" or "1990 (v2.20, 1992)".
2. **Speech-engine naming** (`docs/DECTALK_RESEARCH.md` section 1.1). The SBTALKER binary
   self-identifies as **SmoothTalker 3.5**, First Byte, 1983-1990. "Monologue" is the related
   retail product. The doc's "Version 3.5" belongs to SmoothTalker. Add the self-identification
   as a primary citation.
3. **Invented glitches** (`constants.ts` sbaitso `systemInstruction`, `App.tsx`
   `GLITCH_PHRASES`, `utils/sessionManager.ts` line ~203, `utils/retroErrors.ts`).
   - Problem: "PARITY CHECKING..." and "IRQ CONFLICT AT ADDRESS 220H" do not occur in the
     original, and random glitches never happen there.
   - Fix: replace them with the authentic sequence, triggered **deterministically**, not by the
     LLM:
     - by profanity strike count (about 3 or more offences);
     - by `SAY PARITY`;
     - by the CRAZY joke.

     The sequence is: garbled warning, "PARITY ERR ...", "PARITY ERR ... RECOVERED",
     "PHEW! THAT WAS CLOSE!", "YOU ARE BAD <NAME>. DON'T TRY IT NEXT TIME."
4. **Catchphrases the original never said.**
   - Where: the persona prompt (`constants.ts`).
   - Problem: it pushes "TELL ME MORE ABOUT YOUR PROBLEMS", "WHY DO YOU SAY THAT?" and
     "PLEASE ELABORATE". The first and third are not in the binary.
   - Fix: use the authentic style instead, e.g. "WHY DO YOU FEEL THAT WAY?", "I SEE, GO ON",
     "THAT'S NOT MY PROBLEM", "CAN YOU ELABORATE MORE ON THAT?". Also teach the model:
     - the comic, slightly rude Singaporean-English register ("HAY", "WHAT A BAD LOSER",
       "DISSCUSS");
     - addressing the user by name;
     - steering back to earlier topics ("JUST NOW YOU WERE TALKING ABOUT ...");
     - spelling initialisms with spaces ("C P U").
5. **No command parser** (`App.tsx` `sendMessage`). Everything goes to Gemini. Add a local
   pre-dispatch layer that handles these without an LLM call:
   - `HELP` (3 pages, `M` for more);
   - `R` (repeat last reply);
   - `SAY <text>` (speak verbatim, no LLM call);
   - `CALC <expr>` / `WHAT IS <expr>` (local arithmetic with "divided by ... equals to"
     phrasing);
   - `AUTHOR`;
   - `.QUIT`;
   - `.TONE`, `.VOLUME`, `.PITCH`, `.SPEED`, `.PARAM tvps` (map onto the existing audio
     settings; `D` restores defaults);
   - `.ECHO ON|OFF` (speak user input);
   - `.WIDTH 40|80`, `.COLOR ce` (the theme engine already exists);
   - `.PROMPT ON|OFF`.
6. **Empty input is silently ignored** (`App.tsx` `sendMessage`, `if (!trimmed ...) return
   false`). The original nags ("DON'T JUST PRESS ENTER, TALK TO ME"). After several empty
   entries it offers to quit.
7. **No short / garbage / repeat detection.** Add local handlers before the LLM call:
   - SHT7CHR: very short input;
   - GRBGE: non-word input;
   - REPEAT#1 and REPEAT#2: same input as last time.

   Each answers from a canned pool. These are deterministic in the original and cheap to
   reproduce.
8. **Profanity handling is left to the LLM.** Use a local word list with escalating responses
   and an offence counter that feeds the parity error (gap 3). Sexual words should trigger the
   "HOW OLD ARE YOU?" age prompt and its follow-up lines.
9. **Name entry rules** (`App.tsx` `handleNameSubmit`). The current code accepts any
   characters. The original:
   - accepts letters and spaces only, and says "Enter alphabets only" otherwise;
   - rejects long names ("NAME TOO LONG");
   - uses the prompt text "Please enter your name ...";
   - **speaks each letter as it is typed**;
   - speaks "Doctor Sbaitso" before the prompt.
10. **Greeting** (`App.tsx` ~line 239). The text matches v2.20 apart from the trailing comma on
    the "WIPED OFF AFTER YOU LEAVE" line (v2.20 has a comma; v1.01 has a period). The order
    matches.
    - Optional: a v1.01 variant ("PLEASE SAY ...", "HIGH CONFIDENCE").
    - Missing: the title screen ("D R   S B A I T S O / version 2.20 / (c) Creative Labs 1992"),
      which should precede the name prompt.
11. **Exit flow is missing.** Typing BYE should produce one of the `` `1 `` goodbye lines, then
    "GOOD BYE" and the "<C>ontinue <N>ew patient <Q>uit" menu.
    - N should clear the session and history ("memory contents will be wiped off") and return
      to the name prompt.
    - Currently there is no in-character end of session. Session auto-save to localStorage
      (`utils/sessionManager.ts`) contradicts the "MEMORY CONTENTS WILL BE WIPED OFF" promise.
      Consider making persistence opt-in, or wiping on New patient.
12. **Prompt label.** The original shows user lines on a `User>` prompt. CALC output is prefixed
    `Computer:`. A UI concern; flagged for the UI agent.
13. **"Turbo C" claim.** If any project doc repeats the claim that the original was written in
    Turbo C (from the DrSbaitsoUi README), correct it: the runtime strings point to Microsoft
    BASIC (LIKELY).
14. **Acronym.** Make sure any About or help text uses "Sound Blaster Acting Intelligent Text to
    Speech Operator", not the "Artificial Intelligence ... Organizer" variant.

---

## Sources

Primary (binary string tables, extracted 2026-10-02):

- [S1] Sound Blaster 1.0/1.5 utilities floppy image, `SBTALKER\SBAITSO.EXE` v1.01 (1990),
  `SBAITSO.BAT`, `SBTALKER.EXE`, `SAY.EXE`: https://archive.org/details/sound-blaster-software
- [S2] Dr. Sbaitso (VGA Machine) package, `SBAITSO2.EXE` v2.20 (1992), `SBAITSO2.BAT`,
  `SBTALKER.EXE`, `READ.EXE`, `SET-ECHO.EXE`: https://archive.org/details/SBAITSO_VGA
  (file `SBAITSO.zip`)
- [04] `04-dosbox-verification.md`: [S2] executed inside DOSBox-X 2026.08.31 with frame-exact
  screen OCR and audio timing (2026-10-02).

Secondary:

1. Wikipedia, "Dr. Sbaitso" (cites PC Mag, 29 Oct 1991, p.67 advertisement; VOGONS 2013; LA Times,
   31 Jan 1991, "Monologue Gives PC Power of Speech"): https://en.wikipedia.org/wiki/Dr._Sbaitso
2. Wikipedia, "Sound Blaster" (card release dates: SB 1.0 1989, 1.5 1990, 2.0 Oct 1991):
   https://en.wikipedia.org/wiki/Sound_Blaster
3. Internet Archive variants (VGA/CGA/Hercules/No Voice): https://archive.org/details/SBAITSO_VGA,
   https://archive.org/details/SBAITSO_CGA, https://archive.org/details/SBAITSO_HERC,
   https://archive.org/details/SBAITSO_TDY
4. WinWorld, "Dr. Sbaitso 2.x" (v2.2, 1992, 3.5" disk): https://winworldpc.com/product/dr-sbaitso/2x
5. omwah/sbaitso2 README (command list attributed to the original manual):
   https://github.com/omwah/sbaitso2. Manual link it cites (not retrievable on 2026-10-02):
   https://www.retrogames.cz/manualy/DOS/Dr_Sbaitso_-_Manual.pdf
6. deckarep/DrSbaitsoUi README (responses harvested from the binary; "Turbo C" and timeout
   claims): https://github.com/deckarep/DrSbaitsoUi
7. VOGONS, "Dr. Sbaitso versions": http://www.vogons.org/viewtopic.php?p=198702
8. Internet Archive, Sound Blaster Pro 2 CT1600 Software Bundle ("Includes Dr Sbaitso 2"):
   https://archive.org/details/SoundBlasterPro2CT1600SoftwareBundle
9. Wikipedia, "Sim Wong Hoo": https://en.wikipedia.org/wiki/Sim_Wong_Hoo
10. bert.org, "ChatGPT in DR SBAITSO" (SBAITSO2.EXE v2.20, SBTALKER TSR, SAY.EXE):
    https://bert.org/2023/01/06/chatgpt-in-dr-sbaitso/
11. bad at computer, "Building a DR SBAITSO Text to Speech App" (READ.EXE on later disks):
    https://badatcomputer.net/building-a-dr-sbaitso-text-to-speech-app-in-progress/
12. YouTube, "Dr. Sbaitso - Parity Error" (video; page content not machine-readable, listed for
    manual verification): https://www.youtube.com/watch?v=hf4ozNFgQdI
13. bertrandom/chatgpt-sbaitso (source of the bert.org project). `sbaitso2.js` reproduces the
    v2.20 banner, greeting layout, name-entry rules (letters and spaces only, per-letter speech)
    and the `<C>ontinue <N>ew patient <Q>uit` menu. `sounds/` holds clips recorded from the
    original (`drsbaitso.wav`, `pleaseenter.wav`, `alphabetsonly.wav`, `nametoolong.wav`,
    `letters/`): https://github.com/bertrandom/chatgpt-sbaitso
