# ELIZA (DOCTOR script): History, Algorithm, Style and Implementation Guidance

Research date: 2026-10-02. Scope: the original ELIZA program and its DOCTOR script, as a
reference for making the Enhanced-mode `eliza` persona faithful. It covers:

- history;
- the exact matching algorithm, including the parts found only in the 1965 source;
- output conventions;
- licensing;
- gaps in the current implementation;
- concrete recommendations.

Confidence labels (same standard as `01-history-and-behavior.md`):

- **CONFIRMED**: a primary source (the 1966 CACM paper, the 1965 MAD-SLIP source printout, or the
  original code running under emulation), or two or more independent secondary sources.
- **LIKELY**: one credible source, or a direct inference from primary data.
- **UNVERIFIED**: repeated without a traceable primary source, or an untested recommendation.

Primary-source method:

- The 1966 CACM paper [1] was downloaded and its text extracted with `pdftotext`. It is a scan with
  OCR noise, so quotations were checked against the transcription in [6].
- The 1965 DOCTOR script (`tape.100`) and the eliza-ctss documentation [4][5] were read directly.
- Anthony Hay's annotated reading of the 1965 MAD-SLIP source [7][8], and his CC0 C++
  reimplementation [6], were read for the LIMIT, HASH and delimiter details. His code quotes the
  relevant MAD-SLIP lines verbatim, so the mechanism claims below rest on the original listing.

Quotations are kept under 15 words. The 1966 DOCTOR script is ACM-copyrighted text (see Licensing),
so this document summarizes it rather than reproducing it.

---

## Summary

1. ELIZA is a **script-driven program**, and DOCTOR is one script for it. The program was written
   by Joseph Weizenbaum at MIT in MAD-SLIP for the IBM 7094 under the CTSS time-sharing system
   (Project MAC), 1964-1966 [1][2][3]. "ELIZA" is the engine. "DOCTOR" is the script that makes
   it behave like a Rogerian psychotherapist [1].
2. The algorithm is fully documented and is **deterministic**:
   - keyword scan with ranks;
   - decomposition templates with `0` (any number of words) and `n` (exactly n words) slots;
   - reassembly templates that cycle in order;
   - `=` substitutions applied during the scan (I/YOU, MY/YOUR ...);
   - a `MEMORY` queue fed by the keyword `MY`;
   - a `NONE` list of content-free replies.

   The 1966 paper says memory selection is "random". The 1965 source shows it is a mid-square
   **hash of the last input word**, and that recall happens only on every fourth input (the
   `LIMIT` counter) [1][7][8].
3. **ALL CAPS output is faithful.** The paper states that "the capitalized lines are the machine
   responses" [1]. The 7094 used 6-bit BCD, which has no lower case [3][7]. The restored original
   on emulated CTSS prints upper case [4]. ELIZA's output **never contains a question mark**:
   on CTSS `?` was the line-delete character, so users could not type one either [1].
4. **The original code is public domain (CC0).** Weizenbaum's estate released the 1965 MAD-SLIP
   source and its DOCTOR script under CC0 [2][4]. The **1966 CACM version** of the DOCTOR script
   (the larger, better-known one) was published in an ACM journal. ACM kept the original
   copyright on pre-2023 works when it went open access in January 2026 [11][12].
5. The current `eliza` persona is a free-form Gemini imitation. It invents phrases the script
   never produced ("THAT IS INTERESTING", "TELL ME ABOUT YOUR MOTHER") and uses question marks.
   It cannot reproduce ELIZA's signature mechanical failures, such as echoing a fragment with the
   pronouns swapped badly.
6. **Recommendation:** implement ELIZA as an **exact local engine** (no LLM for text), loaded
   with the CC0 1965 script by default. Use Gemini only for TTS, with its own calm, even,
   clinician voice (Kore recommended).

---

## History

| Claim | Detail | Confidence | Source |
|---|---|---|---|
| Author | Joseph Weizenbaum, Department of Electrical Engineering, MIT | CONFIRMED | [1][3] |
| Years | 1964-1966. Wikipedia says 1964-1967. The paper was received in 1965 and published in January 1966 | CONFIRMED (1964-66) | [1][3][7] |
| Publication | "ELIZA - A Computer Program for the Study of Natural Language Communication Between Man and Machine", *Communications of the ACM* 9(1), January 1966, pp. 36-45 | CONFIRMED | [1] |
| Machine / OS | IBM 7094, MAC time-sharing system (CTSS) at MIT | CONFIRMED | [1][2][4] |
| Language | MAD-SLIP: MAD (Michigan Algorithm Decoder) plus Weizenbaum's SLIP list-processing library, with support routines in FAP assembler | CONFIRMED | [1][2][7] |
| Funding | Project MAC, sponsored by ARPA (Office of Naval Research contract) | CONFIRMED | [1] |
| Name | After Eliza Doolittle in Shaw's *Pygmalion*, because the program can be "incrementally improved" by a "teacher" | CONFIRMED | [1][3] |
| Scripts | "A script is data". Scripts existed in Welsh and German as well as English. DOCTOR (Rogerian therapist) was the only serious one at the time | CONFIRMED | [1] |
| Why a psychotherapist | Weizenbaum's rationale: in a psychiatric interview one party may "assume the pose of knowing almost nothing of the real world" | CONFIRMED | [1] |
| Source rediscovery | Jeff Shrager and MIT archivist Myles Crowley found the printout in Weizenbaum's papers in 2021, in a folder labeled "COMPUTER CONVERSATIONS (1965)" | CONFIRMED | [2][7] |
| Printout contents | A nearly complete MAD-SLIP ELIZA, support functions in MAD and FAP, and an early DOCTOR script (`.TAPE. 100`). About 4% of the SLIP library was missing and has been reconstructed | CONFIRMED | [4][5] |
| This listing is pre-1966 | The 1965 code lacks the keystack, `NEWKEY`, `PRE` and the `EDIT` command that the 1966 paper describes. Its KEY table has 32 entries and a 5-bit hash (the paper says 128 and 7-bit) | CONFIRMED | [5][7] |
| Reanimation | In December 2024 / January 2025 the original ran again on a restored CTSS on the s709 IBM 7094 emulator (Lane, Hay, Schwarz, Berry, Shrager). It nearly reproduced the "Men are all alike" conversation; the two differences come from `PRE` being unimplemented | CONFIRMED | [3][4][5] |
| HASH found | Shrager recovered the SLIP `HASH` FAP routine from the MIT archive in April 2022. It is a mid-square hash | CONFIRMED | [8] |
| Lisp lineage | Bernie Cosell at BBN wrote a BBN-Lisp near-clone from the paper in 1966, without seeing the MAD-SLIP code. The GNU Emacs `doctor` and many later clones descend from it | LIKELY (two secondary sources) | [9][10] |
| RFC 439 DOCTOR | The DOCTOR that met PARRY in 1972 ran on BBN TENEX, printed in mixed case, and greeted with text found in neither 1960s script. It was therefore a BBN-Lisp descendant, not Weizenbaum's MAD-SLIP program | LIKELY | [13][10] |
| Secretary anecdote and later critique | Weizenbaum's secretary asked to be left alone with the program. He later criticized the idea of computer psychotherapy (*Computer Power and Human Reason*, 1976) | CONFIRMED (widely reported) | [3] |

---

## How it actually worked

### Data model (one script = a list of S-expressions)

| Element | Form in the script | Meaning | Confidence | Source |
|---|---|---|---|---|
| Greeting | First list in the script, e.g. `(HOW DO YOU DO.  PLEASE TELL ME YOUR PROBLEM)` | Typed when the script loads. May be empty | CONFIRMED | [1][4][6] |
| Keyword entry | `(KEYWORD [= SUBST] [rank] [DLIST(/tags)] transformation-rules...)` | Keyword, optional substitute, optional rank (default 0), optional tags, rule list | CONFIRMED | [1] |
| Substitution only | `(YOURSELF = MYSELF)` | Replace the word during the scan. The word is **not** a keyword | CONFIRMED | [1] |
| Transformation rule | `((decomposition) (reassembly 1) (reassembly 2) ...)` | One decomposition template followed by its reassembly templates | CONFIRMED | [1] |
| Decomposition `0` | `(0 YOU 0 ME)` | `0` = any number of words. A positive integer `n` = exactly n words | CONFIRMED | [1] |
| Decomposition tag | `(0 YOUR 0 (/FAMILY) 0)` | Matches one word carrying any listed tag (e.g. MOTHER tagged `NOUN FAMILY`) | CONFIRMED | [1] |
| Decomposition alternatives | `(0 YOUR 0 (*FATHER MOTHER) 0)` | Matches any one of the listed words | CONFIRMED | [1][6] |
| Reassembly number | `(WHAT MAKES YOU THINK I 3 YOU)` | `n` inserts the n-th decomposed component | CONFIRMED | [1] |
| Link | `(=WHAT)` | In place of a rule list or a reassembly: use another keyword's rules (equivalence classes such as HOW/WHEN = WHAT) | CONFIRMED | [1][5] |
| `NEWKEY` | `(NEWKEY)` as a reassembly | Abandon this keyword and pop the next keyword from the keystack. Described in 1966; **absent from the 1965 code** | CONFIRMED | [1][5][7] |
| `PRE` | `(PRE (I ARE 3) (=YOU))` | Reassemble the text, then reprocess it under another keyword. 1966 only | CONFIRMED | [1][5] |
| `MEMORY` | `(MEMORY MY (0 YOUR 0 = LETS DISCUSS FURTHER WHY YOUR 3) ...)` | Exactly four decomposition = reassembly pairs, tied to one keyword (MY in DOCTOR) | CONFIRMED | [1][4] |
| `NONE` | `(NONE ((0) (...) (...)))` | Required pseudo-keyword. Its universal `(0)` rule cycles through content-free remarks | CONFIRMED | [1] |

### Processing one input (merged from the 1966 paper and the 1965 source)

1. **Read and tokenize.** The input is split into words. The user ends input with a double
   carriage return; `?` cannot be typed [1][4]. Text is upper case internally (6-bit BCD) [7].
   Words longer than six characters span several SLIP cells. This matters only for the hash
   (step 5) [6][7].
2. **Advance `LIMIT`.** `LIMIT` starts at 1 and is incremented after each input. When it reaches
   5 it wraps to 1, so it cycles 2, 3, 4, 1, 2 ... from the first input [7] (source lines
   000120, 000510-000520 quoted there). CONFIRMED.
3. **Scan left to right.**
   - Apply `=` substitutions on the fly. In DOCTOR this swaps I/YOU, ME/YOU, MY/YOUR, AM/ARE,
     YOU'RE/I'M, MYSELF/YOURSELF [1][4][6].
   - Track keywords by rank. In the 1966 design, a new keyword ranked higher than everything seen
     so far goes on **top** of the keystack; any other goes on the **bottom**. Ties keep the
     first one found [1].
   - The 1965 code keeps **only the highest-ranked keyword**: there is no keystack [7]. CONFIRMED.
4. **Delimiters.** The paper names period and comma [1]. The 1965 source also treats the word
   **BUT** as a delimiter [7]. At a delimiter:
   - if a keyword has already been found, everything after the delimiter is discarded;
   - otherwise the clause before it is discarded.

   Only one clause is ever transformed. CONFIRMED (paper plus source line 000660).
5. **MEMORY capture.** If the winning keyword is the MEMORY keyword (MY), one of the four memory
   transformations is applied to the input and pushed onto a FIFO queue. Normal processing then
   continues [1].
   - The paper says the choice is "randomly selected" [1].
   - The 1965 source chooses with `I = HASH.(BOT.(INPUT),2) + 1`: a 2-bit hash of the **last
     SLIP cell** of the input (the last word, or its last six-character chunk) [7]. CONFIRMED.
   - `HASH(D,N)` is mid-square. Take the low 35 bits of the 36-bit BCD word, square it, and
     return the middle N bits [8]. CONFIRMED (FAP listing transcribed in [8], C++ port in [6]).
   - Consequence: ELIZA has **no random element**, and conversations are reproducible [7].
6. **No keyword found.**
   - If `LIMIT == 4` and the memory queue is not empty, pop the oldest memory and print it.
   - Otherwise use the `NONE` rules [1][7].
   - In DOCTOR the NONE replies cycle through four remarks: not sure I understand fully / please
     go on / what does that suggest / do you feel strongly about such things [4][6].

   CONFIRMED.
7. **Keyword found.**
   - Try its decomposition rules in order. Scripts end each list with a catch-all such as
     `(0 YOU 0)` [1].
   - On a match, use the **next** reassembly rule for that decomposition. Each decomposition
     keeps its own counter, so all of its reassemblies are used in turn before any repeats [1].
   - Then follow any link (`=X`), `NEWKEY` or `PRE` [1].

   CONFIRMED.
8. **Script error fallback.** If a keyword's rules all fail to match, the 1965 code prints one
   of four hard-coded messages chosen by `LIMIT`: PLEASE CONTINUE, HMMM, GO ON , PLEASE, or
   I SEE [7]. This is a **source-only** detail. CONFIRMED.
9. **Teacher mode.** The 1966 paper describes an `EDIT` command [1]. The 1965 code instead uses
   `+` to enter a script-change mode and `*` to add a rule inline [3][7]. This is not relevant to
   a persona; do not expose it.

### Ranks and keyword set in DOCTOR

| Script | Entries | Ranked keywords (rank) | Notes | Confidence | Source |
|---|---|---|---|---|---|
| 1965 `.TAPE. 100` (printout, CC0) | 37 entries after the greeting | EVERYONE / EVERYBODY / NOBODY / NOONE (2), ALWAYS (1); the rest rank 0 | Greeting: "I AM THE DOCTOR. PLEASE SIT DOWN AT THE TYPEWRITER". No COMPUTER, DREAM, ALIKE, NAME, foreign-language or HELLO rules | CONFIRMED | [4] |
| 1966 CACM appendix | 68 entries after the greeting | COMPUTER / COMPUTERS / MACHINE / MACHINES (50), NAME (15), ALIKE, SAME, LIKE (10), REMEMBER (5), DREAMT (4), IF, DREAM (3), WAS, MY, EVERYONE ... (2), ALWAYS (1) | Greeting "HOW DO YOU DO. PLEASE TELL ME YOUR PROBLEM". Uses `NEWKEY` and `PRE`, which the 1965 code cannot run | CONFIRMED | [1][5][6] |

Behaviour worth reproducing exactly (all CONFIRMED from the 1966 script [1][6]):

- Mentioning a computer outranks everything (rank 50). ELIZA asks whether computers worry you.
- `NAME` (rank 15): ELIZA refuses to deal with names ("I AM NOT INTERESTED IN NAMES").
- Universals (EVERYBODY, ALWAYS) steer to specifics ("CAN YOU THINK OF A SPECIFIC EXAMPLE").
- A family word after MY yields "TELL ME MORE ABOUT YOUR FAMILY". The script **never** says
  "tell me about your mother".
- Apologies get "PLEASE DON'T APOLIGIZE". The misspelling is in the original.
- Foreign-language keywords (DEUTSCH, FRANCAIS ...) get "I AM SORRY, I SPEAK ONLY ENGLISH".

---

## Characteristic output style

| Trait | Evidence | Confidence | Source |
|---|---|---|---|
| Upper case only | "The capitalized lines are the machine responses". BCD has no lower case. The restored CTSS run prints caps | CONFIRMED | [1][4][7] |
| No question marks, even for questions | Every published reply ends without `?`, e.g. "CAN YOU THINK OF A SPECIFIC EXAMPLE" | CONFIRMED | [1][6] |
| Occasional periods and commas inside replies | Script text such as "HOW DO YOU DO." and "REALLY, 2 3". On CTSS, punctuation prints as a separate token ("HOW DO YOU DO .") | CONFIRMED (script); LIKELY (spacing) | [4][5] |
| Echoes fragments with pronouns swapped | "WHAT MAKES YOU THINK I AM NOT VERY AGGRESSIVE" | CONFIRMED | [1] |
| Mechanical errors are part of the character | When rules are generic, pronoun swaps produce broken English (the RFC 439 DOCTOR has "Oh? I enough about that?"). The 1965 engine crashes on numbers in input | CONFIRMED | [13][5] |
| One short line per turn | The DOCTOR script has no multi-sentence replies except the greeting | CONFIRMED | [1][4] |
| No knowledge of the world, no opinions, no self-disclosure | By design (the "pose of knowing almost nothing") | CONFIRMED | [1] |

Short example lines (all from the 1966 paper or script; each under 15 words):

- "HOW DO YOU DO.  PLEASE TELL ME YOUR PROBLEM" (greeting) [1][6]
- "IN WHAT WAY" [1]
- "CAN YOU THINK OF A SPECIFIC EXAMPLE" [1]
- "I AM SORRY TO HEAR YOU ARE DEPRESSED" [1]
- "TELL ME MORE ABOUT YOUR FAMILY" [1]
- "WHAT ELSE COMES TO MIND WHEN YOU THINK OF YOUR FATHER" [1]
- "DOES THAT HAVE ANYTHING TO DO WITH THE FACT THAT YOUR BOYFRIEND MADE YOU COME HERE" (the
  MEMORY mechanism) [1]

The full "Men are all alike" transcript is in [1]. It runs about 12 exchanges and ends with a
memory recall.

---

## Original I/O and what a voice should aim for

| Fact | Detail | Confidence | Source |
|---|---|---|---|
| Medium | A typewriter terminal on CTSS. "the computer can read messages typed on the typewriter and respond by writing on the same instrument" | CONFIRMED | [1] |
| Input conventions | Normal punctuation except `?` (line delete). The turn ends with a double carriage return. The restored system advises keeping lines under 72 characters | CONFIRMED | [1][4] |
| Character set | 6-bit BCD, six characters per 36-bit word: upper case only | CONFIRMED | [3][7] |
| Latency | Reply time depended on time-sharing load. Weizenbaum says it "need never involve truly intolerable delays" | CONFIRMED | [1] |
| Voice | **None.** ELIZA never spoke. Any voice is an anachronism | CONFIRMED | [1][3] |

What a voice should therefore aim for: no original voice exists to imitate. The voice should
signify the persona rather than recreate a sound. Two readings are defensible:

- **Clinician register (recommended).** A calm, even, unhurried, neutral therapist voice that
  reflects rather than emotes. This matches what users projected onto the program, which was the
  point of the DOCTOR script [1].
- **"Computer reading a teletype" register.** Flat and slightly mechanical. This is the current
  choice. It is defensible, but it borrows a 1980s speech-synthesizer cliche that has nothing
  to do with a 1966 typewriter terminal (UNVERIFIED as a design judgement).

Either way, do not use the Sbaitso voice (Charon) for ELIZA. ELIZA should sound like a different
program from a different era.

---

## Licensing and copyright status

| Item | Status | Can the project include it? | Confidence | Source |
|---|---|---|---|---|
| 1965 MAD-SLIP ELIZA source (printout) | Released by Weizenbaum's estate under **CC0 1.0** (public domain dedication) | Yes, freely, including the logic and any text in it | CONFIRMED | [2][4] |
| 1965 DOCTOR script `.TAPE. 100` | Part of the same printout. eliza-ctss distributes it under `eliza/`, which its README places under CC0 | Yes. Credit Weizenbaum and the ELIZA archaeology team as a courtesy | LIKELY (the CC0 grant covers the printout; no separate statement names the script) | [4][5] |
| Reconstructed SLIP pieces and eliza-ctss scripts | CC0 (Lane, Hay, Schwarz). The s709 emulator is MIT-licensed | Yes | CONFIRMED | [4] |
| Anthony Hay's C++ ELIZA and its HASH / BCD port | CC0 1.0 | Yes. The `hash()` and `last_chunk_as_bcd()` logic can be ported verbatim | CONFIRMED | [6] |
| 1966 CACM DOCTOR script (paper appendix) | Published with an ACM copyright notice. US works published 1964-1977 with notice have a 95-year term, so it runs to the end of 2061. ACM made the backfile free to read in 2026 but did not change licensing for pre-2023 works | **Not cleanly.** Hay's and Lane's repositories ship it with an ACM attribution, which is a risk judgement rather than a licence. Keywords, ranks and decomposition patterns are functional and probably not protectable (17 U.S.C. 102(b)). The reassembly sentences are short phrases with thin protection at most. **Not legal advice**: the project owner should decide | CONFIRMED (copyright facts); UNVERIFIED (protectability of individual rules) | [11][12][14][15] |
| The algorithm itself | Ideas, methods and systems are not copyrightable | Yes. Reimplementing it from the paper is fine | CONFIRMED (statute) | [15] |
| The name "ELIZA" | Used freely by hundreds of clones since 1966. No trademark found | Yes (descriptive, historical use) | UNVERIFIED (no trademark search done) | [3][10] |

---

## Gaps vs. the current implementation

Read from `src/constants.ts` (`CHARACTERS` entry `eliza`, and `VOICE_PROFILES`),
`api/_lib/gemini.ts` (TTS handler) and `src/EnhancedApp.tsx` (`personaGreeting`) on 2026-10-02.

| # | Current behaviour | Original behaviour | Severity |
|---|---|---|---|
| 1 | Replies are generated freely by Gemini from a prose description | Replies are deterministic template output from a fixed script, with no world knowledge | High: no LLM prompt can reproduce exact cycling, ranks, MEMORY timing or the hash |
| 2 | Prompt example "YOU FEEL SAD?" uses a question mark | ELIZA never prints `?` [1] | Medium |
| 3 | Prompt suggests "TELL ME ABOUT YOUR MOTHER", "THAT IS INTERESTING", "TELL ME MORE ABOUT THAT" | Not in either DOCTOR script. The real lines are "TELL ME MORE ABOUT YOUR FAMILY" and the four NONE remarks [1][4]. "I SEE" exists only as a YES reply and a script-error fallback [6][7] | Medium |
| 4 | "Keep responses very short (1-2 sentences)" | Always exactly one line, usually one clause [1] | Low |
| 5 | No MEMORY behaviour | "EARLIER YOU SAID YOUR ..." recalls on every fourth turn that has no keyword [1][7] | High: this is ELIZA's most striking trick |
| 6 | ALL CAPS instruction | Faithful [1][4] | None: keep it |
| 7 | Greeting (`personaGreeting`, case `eliza`) is "HOW DO YOU DO.  PLEASE TELL ME YOUR PROBLEM." | Matches the 1966 script, except for the final period, which the script lacks [1][6]. The 1965 script greeting differs ("I AM THE DOCTOR ...") [4] | Low |
| 8 | Enhanced mode asks for the user's name before any persona | ELIZA never asked for a name. The 1966 script deflects names ("I AM NOT INTERESTED IN NAMES") [6] | Low (app-level UX). Never echo the name in ELIZA replies |
| 9 | `voicePrompt`: "flat, mechanical, artificial 1960s computer voice" | No voice existed. See the voice section | Medium |
| 10 | The voice name comes only from the global `VOICE_PROFILES` (default `classic` = **Charon**), so ELIZA speaks with Dr. Sbaitso's voice | n/a | Medium: personas are not distinguishable by ear |
| 11 | `applyPronunciation` has no ELIZA case | "ELIZA" is pronounced correctly by default; nothing needed | None |
| 12 | Gemini sees full history and can contradict itself, moralize, or break character | The original has no state beyond the MEMORY queue, the LIMIT counter and the per-rule reassembly counters | High |

---

## Concrete recommendations

### 1. Implement an exact local engine (recommended)

Generate ELIZA's text locally and deterministically, with no Gemini call for text. Benefits:

- It works offline and under quota limits.
- It costs nothing and replies instantly. A configurable fake "time-sharing" delay can be added.
- It is the only way to be faithful.

Hay's CC0 C++ implementation [6] is a complete, tested reference covering the CACM features and
the 1965 source quirks. Port it rather than redesign it.

Suggested TypeScript data structures (UNVERIFIED design, derived from [1][6][7]):

```ts
type Word = string;                       // upper-case token; '.' and ',' are their own tokens

type PatternElem =
  | { kind: 'any' }                       // 0  - any number of words (possibly none)
  | { kind: 'count'; n: number }          // n  - exactly n words
  | { kind: 'word'; word: Word }          // literal
  | { kind: 'oneOf'; words: Word[] }      // (*FATHER MOTHER)
  | { kind: 'tag'; tags: string[] };      // (/FAMILY)

type ReassemblyElem = Word | number;      // number = 1-based decomposition component

type Reassembly =
  | { kind: 'text'; parts: ReassemblyElem[] }
  | { kind: 'link'; keyword: Word }       // (=WHAT)
  | { kind: 'newkey' }                    // (NEWKEY)   - 1966 only
  | { kind: 'pre'; parts: ReassemblyElem[]; link: Word }; // (PRE (...) (=X)) - 1966 only

interface Transformation {
  decomposition: PatternElem[];
  reassemblies: Reassembly[];
  next: number;                           // cycling cursor; persisted per session
}

interface KeywordEntry {
  keyword: Word;
  substitute?: Word;                      // (MY = YOUR ...)
  rank: number;                           // default 0
  tags: string[];                         // DLIST(/NOUN FAMILY)
  rules: Transformation[] | { link: Word };
}

interface Script {
  greeting: Word[][];                     // may be empty
  entries: Map<Word, KeywordEntry>;
  memory: { keyword: Word; pairs: [PatternElem[], ReassemblyElem[]][] }; // exactly 4 pairs
  none: Transformation;                   // universal (0) rule
}

interface ElizaState {
  limit: 1 | 2 | 3 | 4;                   // starts at 1, advanced before processing each input
  memoryQueue: Word[][];                  // FIFO
  cursors: Record<string, number>;        // `${keyword}#${ruleIndex}` -> next reassembly
}
```

Engine contract:

- `respond(state, input) -> { text, state }` is a pure function. It is easy to unit-test and to
  persist with the session.
- Golden-vector tests:
  - the "Men are all alike" conversation reproduced line for line against the 1966 script [1];
  - Hay's `hash()` test vectors, for example `hash(0214366217062, 7) == 14` ("ALWAYS" → 14, as
    stated on paper p. 38) [1][6].

Script handling:

- Ship `tape.100` (CC0) as the default script, parsed from its original S-expression text. A small
  S-expression reader is needed, which keeps the script as data, as Weizenbaum intended [1].
- Optionally ship a "1966 CACM" script only after the project owner decides on the licensing
  question above. If shipped, implement `NEWKEY` and `PRE` (the 1966 features).
- Alternatively, keep the 1965 keyword set and add **newly written** rules for the 1966 behaviours
  (computer, dream, names), clearly labeled as project additions.

Input handling for a browser:

- Accept `?` and `!`, but treat them as delimiters like the period. This is a documented deviation:
  the original could not receive `?` at all.
- Upper-case the input before matching.
- Strip characters outside A-Z, apostrophe, period and comma.
- Map digits to words or ignore them, since the original crashed on numbers [5].

Output:

- Join tokens with single spaces, upper case, and never append `?`.
- Choose between the CACM style "DO." and the CTSS spacing "DO ." for punctuation. Prefer CACM
  for readability.

### 2. If a hybrid or Gemini fallback is kept

Use one only when the local engine is disabled. A free-form LLM ELIZA should not be the default.
If kept, rewrite the `systemInstruction` along these lines (UNVERIFIED wording):

- "You are the DOCTOR script running on Weizenbaum's 1966 ELIZA. You know nothing about the
  world and never offer opinions, advice, facts or empathy of your own."
- "Reply with ONE line, upper case, no question marks, no exclamation marks, no quotation marks."
- "Build replies only by (a) reflecting a fragment of the user's last clause with
  I/YOU, MY/YOUR, AM/ARE swapped, or (b) one of these stock remarks: [the four NONE lines and a
  short list of real DOCTOR reassemblies]."
- "If the user mentions computers or machines, ask about computers. If a family member, ask
  about the family. If a universal word (everybody, always, nobody), ask for a specific example.
  If a name, say you are not interested in names."
- "Never use the user's name. Never mention being an AI, a language model, or the year."
- Better still: send the locally computed engine reply and ask Gemini for nothing. The engine
  already produces the text.

### 3. Voice (TTS)

- **Voice: Kore** (Google describes it as "Firm") [16]. Reasons:
  - ELIZA is conventionally referred to as "she" (the restored system's README says "interact
    with her") [4];
  - Kore is commonly heard as a neutral, steady female voice;
  - it is clearly different from Charon (Sbaitso), Fenrir and Puck (the other profiles).
- **Alternative: Schedar** ("Even") for a gender-neutral, very level read [16].
- Voice gender is not documented by Google. Pick by listening (UNVERIFIED).
- **Style phrase:** "calm, even and unhurried, a neutral clinical therapist's tone with very
  little emotion, measured pauses, never warm or chatty". Drop "artificial computer voice":
  ELIZA's illusion depended on sounding like a person behind a typewriter [1].
- **Wiring:** add a per-persona `voiceName` (and style) that overrides `VOICE_PROFILES[...].voiceName`
  for non-Sbaitso personas. Otherwise the global profile makes every persona Charon (Gap 10).
- **Intonation:** the display text has no `?`, and the TTS will read questions flat. That is
  arguably faithful, since ELIZA's questions are typed statements. If a natural rise is wanted,
  append `?` in the **TTS text only** when the reply begins with an interrogative word (WHAT,
  WHY, HOW, DO, DOES, ARE, CAN, WHO, WHERE, WHEN). Keep the screen text unchanged (UNVERIFIED
  design).
- The bit-crusher and audio presets are a Sound Blaster (1990s) effect. For ELIZA, prefer the
  "Modern" or "High Quality" preset by default, or no effect. Optionally add a teletype keystroke
  sound during the typewriter reveal instead.

### 4. Presentation

- Label the persona "ELIZA (DOCTOR script, 1966)".
- Do not ask for a name for ELIZA, or at least never echo it.
- Keep the greeting from the selected script.
- Add a one-line disclaimer, as Weizenbaum himself would have wanted: ELIZA is not therapy [3].

---

## Sources

1. Weizenbaum, J. "ELIZA - A Computer Program for the Study of Natural Language Communication
   Between Man and Machine." *CACM* 9(1), Jan 1966, 36-45. Scan used:
   https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf (DOI 10.1145/365153.365168,
   https://dl.acm.org/doi/10.1145/365153.365168)
2. ELIZAGEN, "The Original ELIZA" (2021 discovery, CC0 statement, credits):
   https://sites.google.com/view/elizagen-org/original-eliza
3. Lane, Hay, Schwarz, Berry, Shrager. "ELIZA Reanimated: The world's first chatbot restored on
   the world's first time sharing system." arXiv:2501.06707 (2025):
   https://arxiv.org/abs/2501.06707 ; Wikipedia, "ELIZA": https://en.wikipedia.org/wiki/ELIZA
4. Rupert Lane, `eliza-ctss` README (licences, quick-start transcript, KSR-37 terminal):
   https://github.com/rupertl/eliza-ctss ; script `tape.100`:
   https://github.com/rupertl/eliza-ctss/blob/main/eliza/src/ELIZA/tape.100
5. `eliza-ctss` SCRIPTS.md and KNOWN-ISSUES.md (100 vs 200 scripts; PRE/NEWKEY missing; numeric
   crash): https://github.com/rupertl/eliza-ctss/blob/main/SCRIPTS.md ,
   https://github.com/rupertl/eliza-ctss/blob/main/KNOWN-ISSUES.md
6. Anthony Hay, ELIZA in C++ (CC0), including the transcribed 1966 DOCTOR script, `hash()` and
   `last_chunk_as_bcd()`: https://github.com/anthay/ELIZA ,
   https://github.com/anthay/ELIZA/blob/master/src/eliza.cpp
7. Anthony Hay, "What I learned from reading the original ELIZA source code" (BUT delimiter,
   LIMIT counter, HASH memory selection, hard-coded fallbacks, missing keystack):
   https://github.com/anthay/ELIZA/blob/master/doc/Eliza_part_2.md
8. Anthony Hay, "The HASH algorithm used by ELIZA":
   https://github.com/anthay/ELIZA/blob/master/doc/Eliza_part_3.md
9. hjellinek/Eliza, Bernie Cosell's BBN-Lisp ELIZA: https://github.com/hjellinek/Eliza
10. ELIZAGEN, "ELIZA Clones" (genealogy, Cosell lineage):
    https://sites.google.com/view/elizagen-org/eliza-clones ; CoRecursive #078 "The History and
    Mystery of Eliza": https://corecursive.com/eliza-with-jeff-shrager/
11. ACM, "ACM is Now Fully Open Access!" (Jan 2026):
    https://www.acm.org/articles/bulletins/2026/january/acm-open-access
12. ACM Publication Rights and Licensing Policy (pre-2023 works keep their original licensing):
    https://www.acm.org/publications/policies/publication-rights-and-licensing-policy
13. Cerf, V. RFC 439, "PARRY Encounters the DOCTOR" (21 Jan 1973; session of 18 Sep 1972):
    https://www.rfc-editor.org/rfc/rfc439.txt
14. Cornell University Library, "Copyright Term and the Public Domain in the United States"
    (1964-1977 with notice: 95 years): https://guides.library.cornell.edu/copyright/publicdomain
15. 17 U.S.C. 102(b) (no copyright in any idea, procedure, process, system, method of operation):
    https://www.law.cornell.edu/uscode/text/17/102
16. Google, Gemini API "Speech generation" (30 prebuilt voices with descriptors, style control):
    https://ai.google.dev/gemini-api/docs/speech-generation
