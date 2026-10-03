# PARRY: History, Affect Model, Style and Implementation Guidance

Research date: 2026-10-02. Scope: Kenneth Colby's PARRY, a simulation of a paranoid psychiatric
patient, as a reference for making the Enhanced-mode `parry` persona faithful. It covers:

- history;
- the affect model and belief structure;
- the conversation strategy;
- output conventions;
- licensing;
- gaps in the current implementation;
- concrete recommendations.

Confidence labels (same standard as `01-history-and-behavior.md`):

- **CONFIRMED**: a primary source (Colby et al.'s papers, the archived PARRY source, the RFC 439
  transcript), or two or more independent secondary sources.
- **LIKELY**: one credible source, or a direct inference from primary data.
- **UNVERIFIED**: repeated without a traceable primary source, or an untested recommendation.

Primary-source method:

- **Colby, Weber and Hilf, "Artificial Paranoia"** (*Artificial Intelligence* 2, 1971) [1] was
  downloaded as a PDF and its text extracted. It gives the persona, the affect equations, the
  scanning order and seven annotated interview excerpts.
- **The archived PARRY source** (CMU AI Repository `parry.tgz`, deposited by Martin Frost,
  Stanford, 1991) [5] was downloaded and searched locally. Its affect-update code (`pmem2`
  `RAISE`, `opar3` `MODIFVAR`), flare tables (`rdata`), startup text (`pmem2` `INITPARAMS2`) and
  exit rules were read directly. Nothing from it was copied into the repository.
- **RFC 439** [3] was read in full.

The papers are copyrighted (North-Holland / Elsevier), and the source code carries no licence.
Quotations are therefore kept under 15 words, and transcripts are summarized.

---

## Summary

1. PARRY was built by psychiatrist **Kenneth Mark Colby** with **Sylvia Weber** and **Franklin
   Dennis Hilf** at the **Stanford Artificial Intelligence Laboratory**. It ran in MLISP on the
   PDP-6/10 (WAITS). It was first described in 1970-71 [1][2], and its best-known run is from 1972 [3][4].
2. PARRY is **not an ELIZA variant**. It is a model with:
   - persistent numeric affect: **Fear, Anger, Mistrust** on 0-20 scales, plus **Hurt**
     (shame/humiliation) in later versions;
   - a persona (a 28-year-old post-office clerk);
   - sensitive topics;
   - a weighted graph of **flare** concepts that lead toward a **delusional complex**: a bookie he
     beat up, who he fears will set the underworld, and finally the **Mafia**, on him [1][5].

   Unrecognized input is handled by steering toward that story.
3. Affect dynamics are published as equations and match the source code [1][5]:
   - provocations raise Fear (threat) or Anger (humiliation) by a percentage of the distance to 20;
   - Mistrust rises with both and almost never falls;
   - every exchange decays Anger by 1, Fear by 0.3 and Mistrust by 0.05, down to floors;
   - high affect produces evasion, counter-attack, accusations that the interviewer is "in with
     the others", or ending the interview with **BYE**.
4. **ALL CAPS is faithful to Colby's own published sessions**, where both sides are typed in
   capitals [1]. The 2026 reanimation on WAITS also runs in upper case [6]. **But** the famous
   1972 network session in RFC 439 is printed in mixed case [3]. Unlike ELIZA, PARRY **does** use
   question marks.
5. **Licensing:** the archived source has **no licence statement** anywhere: not in the CMU
   repository, the Internet Archive copy or the files themselves [5][7]. It is also incomplete;
   the response text database appears to be absent. Treat it as all rights reserved: study it,
   do not ship or port it. The published *behaviour* (equations, strategy, persona facts) can be
   reimplemented freely as ideas and methods [12].
6. The current `parry` persona is a generic "paranoid" LLM prompt. Its gaps:
   - no affect state;
   - no flare progression;
   - none of the specific persona;
   - "conspiracy thinking: being watched" is closer to a modern stereotype than to Colby's model;
   - it speaks with Dr. Sbaitso's voice.
7. **Recommendation:** a **hybrid**. A local engine owns state and decides **what** PARRY does
   next (affect, flare position, delusion index, chosen strategy, BYE). Gemini only phrases one
   short line for that decision. A small locally authored line bank serves as offline fallback.
   **Voice: Orus** (Firm), styled as a tense, guarded young man, with delivery modulated by
   Fear and Anger.

---

## History

| Claim | Detail | Confidence | Source |
|---|---|---|---|
| Authors | Kenneth Mark Colby (Senior Research Associate, Stanford CS), Sylvia Weber (graduate student), Franklin Dennis Hilf (Research Associate) | CONFIRMED | [1] |
| First description | Stanford AI Memo AIM-125, July 1970. Journal version *Artificial Intelligence* 2(1):1-25, 1971 | CONFIRMED | [1][2] |
| Funding | NIMH grants plus ARPA (SD-183) | CONFIRMED | [1] |
| Machine / language | MLISP (M-expressions translated to LISP 1.6) on the PDP-6/10 time-sharing system of the Stanford AI Project. The 1971 program was 35K words, 14K of them data base | CONFIRMED | [1] |
| Later code | The archived source mixes MLISP (`pmem*`) and PDP-10 assembly (`*.fai`, `*.lap`) for WAITS. It is "probably most of" PARRY | CONFIRMED | [5] |
| Later version | The archived code adds a fourth affect, **HURT** (shame/humiliation), a belief/inference module (`BEL`, `INF`), and a pattern-matching front end with a typo "respeller" (`NEARBY.KEY`). This matches Colby and Parkison's 1974 pattern-matching work and Colby's 1981 shame-based theory | CONFIRMED (code); LIKELY (dating) | [5][8][9] |
| Persona name | The 1971 weak-version transcript gives his name as Frank Smith | CONFIRMED | [1] |
| Monograph | Colby, *Artificial Paranoia: A Computer Simulation of Paranoid Processes*, Pergamon, 1975 (cited as 1974 in the 1974 Stanford report) | LIKELY | [8] |
| Theory paper | Colby, "Modeling a paranoid mind", *Behavioral and Brain Sciences* 4:515-534, 1981. The theory: paranoid strategies minimize and forestall **shame-induced distress** | CONFIRMED | [9] |
| Validation (informal) | 23 of 25 psychiatrists who interviewed the 1971 model judged it "paranoid"; 2 judged it "brain-damaged" | CONFIRMED | [1] |
| Validation (Turing-like) | Colby, Hilf, Weber, Kraemer, *Artificial Intelligence* 3:199-221, 1972. Wikipedia reports 33 psychiatrists identifying transcripts correctly 48% of the time (chance). Heiser et al., *J. Psychiatric Research* 15:149-162, 1979: five psychiatrists, five right and five wrong | LIKELY (figures from abstracts and Wikipedia) | [4][10][11] |
| Meets DOCTOR | 18 September 1972 session: PARRY at SAIL, DOCTOR at BBN TENEX, both reached from UCLA over the ARPANET. Published by Vint Cerf as RFC 439, 21 January 1973 | CONFIRMED | [3] |
| Wikipedia date error | Wikipedia dates RFC 439 to January 1972. The RFC itself says 1973 | CONFIRMED | [3][4] |
| Reanimation | 25 April 2026: Jeff Shrager, Lars Brinkhoff and Rupert Lane ran the original `PARRY.DMP` on a 1974 WAITS image (Richard Cornwell's sims fork). They restored three missing support files and quasi-replicated RFC 439 against the original ELIZA | CONFIRMED (project blog) | [6] |

---

## How it actually worked

### Persona (initial conditions, 1971)

All items below are CONFIRMED from [1]; the source's data files are consistent with them [5].

- 28 years old, single, a post-office clerk.
- No siblings. Lives alone and seldom sees his parents.
- Sensitive about his appearance, family, religion, education and sex.
- Hobbies: movies and horse racing.
- Bet heavily at the track and through bookies.
- Quarrelled with a bookie who did not pay off, and **beat him up**.
- Afterwards he reasoned that bookies pay the underworld for protection, so the bookie might
  have him hurt or killed.
- **Eager to tell his story** to a listener who is interested and not threatening. He drops hints
  and tests the interviewer's trustworthiness.
- In hospital about a week. The police brought him in.
- RFC 439 adds Bay Meadows, the racetrack in San Mateo near Stanford [3].

### Affect variables

| Variable | Range / initial | Rise | Normal fall per exchange | Confidence | Source |
|---|---|---|---|---|---|
| Fear | 0-20. Initial 0 (low) or 10 (mild) | Physical threat. `FEAR += FJUMP * (20 - FEAR)` | -0.3, not below base. Floor is base + 3 while a flare topic is active and base + 5 while delusions are discussed. Later code uses -0.2 and -0.1 for those two contexts | CONFIRMED | [1][5] |
| Anger | 0-20. Initial 0 or 10 | Psychological harm: humiliation, being controlled. `ANGER += AJUMP * (20 - ANGER)` | -1 | CONFIRMED | [1][5] |
| Mistrust | 0-20. Initial 0 ("inherent mild") or 15 (high) | On any Fear or Anger rise: `MISTRUST += 0.5 * JUMP * (20 - MISTRUST)` | -0.05, down to a base level that itself ratchets up: `BASE += 0.1 * JUMP * (20 - BASE)`. Net effect: any provocation leaves him more mistrustful by the end | CONFIRMED | [1][5] |
| Hurt (later versions) | 0-20 | `HJUMP` on humiliation. Raises the floors of Fear and Anger to half of Hurt's base, and makes Fear and Anger more volatile (`JUMP += HURT/50`) | -0.5 | CONFIRMED (code) | [5] |

Rises are percentages of the remaining headroom, so the same insult causes a larger absolute jump
when PARRY is calm [1]. Colby states the specific numbers are arbitrary initial conditions, not
theory [1].

### Versions (paranoia strength)

- **1971.** There were two versions [1]:
  - **Weak:** affect starts at the lowest values and rises more slowly. There is no Mafia
    delusion; he deflects to "racketeers".
  - **Strong:** affect starts low or high and rises faster. The Mafia delusional complex can be
    elicited.

  CONFIRMED.
- **Later code.** At startup it asks "VERSION [WEAK, MILD, STRONG]" [5][6].
  - **Weak** multiplies the rises by 0.3 (Fear), 0.7 (Anger) and 0.5 (Hurt).
  - **Strong** starts Hurt at 5; **mild** starts it at 0 [5].
  - Other startup prompts: whether to print non-verbal features, and whether to trace the emotion
    variables [5][6].

  CONFIRMED.

### Input scanning order (1971)

Each input is checked in this fixed, context-independent order [1]. CONFIRMED.

1. **Insinuation that he is mentally ill or needs help.** Raises Fear and Anger, more for a
   statement than for a question.
2. **Reference to the delusional complex** (the Mafia and associated words such as "kill").
   - A first mention raises Fear by an amount set by whether the word is strong, weak or ambiguous.
   - **Ambiguous** words count as delusional only when Mistrust is above a threshold.
3. **Sensitive area.** Weighted by whose attribute is meant (self, another person, impersonal)
   and by tone.
   - In later code the weights are looks 9, sex life 8, family 6, education 4, religion 2 [5].
   - A **compliment** lowers affect when Mistrust is low or moderate. When Mistrust is high it
     **raises Anger**, because it is read as an attempt at pacification [1].
4. **Flare concept.** Fear rises in proportion to the flare's weight.
5. **Interviewer-patient relationship statements** ("you seem afraid of me", "I don't believe
   you"), apologies and direct threats. Negative attitudes cause slight rises.

If none of these fire, he answers from his personal data [1]:

- If **Fear is high** (Fear outranks Anger when both are high), he refuses to engage. A question
  gets a suspicious query about motives; a statement draws the interviewer into the delusion
  ("you are in with the others").
- If **Anger is high and Fear is not**, he ignores the input and attacks.
- At **extreme levels he ends the interview** with "BYE".

### Flare graph and delusional complex

| Item | Detail | Confidence | Source |
|---|---|---|---|
| 1971 structure | A hierarchy of **eight** flare concepts, weighted by relevance to his fear of the Mafia, plus a directed graph in which each flare points to the next. This strategy leads the interviewer toward the Mafia topic. The program records which flares have been mentioned | CONFIRMED | [1] |
| Later flare table | Eleven concept sets with weights 17, 15, 12, 10, 9, 7, 6, 5, 4, 3, 1: rackets, gangsters, specific persons, cheating, bookies, gambling, money, horse racing, police, Italians, horses. The Mafia set sits above them as the delusion topic | CONFIRMED (code `rdata`) | [5] |
| Example path | police → law → "Italian crooks" → underworld → gangsters / rackets → Mafia (1971 excerpts 1, 2, 5) | CONFIRMED | [1] |
| Default move | When input is not understood, he gives the **next flare statement** if a flare is active, otherwise a non-committal reply. This produces the "one-track mind" effect | CONFIRMED | [1] |
| Delusions are a sequence | In the strong version, delusion statements are ordered and explain one another. Unanswerable wh-questions get the **next delusion in sequence** (excerpt 2) | CONFIRMED | [1] |
| Willingness gate | Later code changes subject instead of discussing the Mafia if: the version is weak, Fear > 17, Anger > 17, or Fear + Anger + Mistrust > 40 | CONFIRMED (code `opar3`) | [5] |
| Flare threshold | The threshold for discussing flares is somewhat higher than the one for expressing delusions | CONFIRMED | [1] |

### Other conversational mechanics

| Mechanic | Detail | Confidence | Source |
|---|---|---|---|
| Silence | PARRY can fall silent by printing a bare carriage return. The interviewer indicates silence by typing a lone period | CONFIRMED | [1][5] |
| Ending | "BYE" ends the program, which drops back to Lisp. Later code also has: exit after 5 swear inputs (Anger +0.3 each); exit after 9 "exhaust" (repetitive) inputs (Anger +0.15 each); a "BYEOFF" variant when Fear is above 18.4 during flare or delusion talk | CONFIRMED | [1][5] |
| Topic memory | Tracks topics already raised, follow-up questions on the last answer, and anaphora ("they" keeps the topic) | CONFIRMED | [1] |
| Answer data | Personal questions get specific answers only when asked. Delusion statements may be volunteered at an "opportune" moment. Each personal topic has up to two default replies to avoid repetition | CONFIRMED | [1] |
| Beliefs (later) | The belief file encodes humiliating self-judgements PARRY guards against (being crazy, a loser, dishonest, broke, low status, friendless; having cheated the bookie). Inferences link interviewer remarks to them, which drives Hurt | CONFIRMED (code `bel`, `inf`) | [5] |
| Input rule | The startup text says to end input with a period or question mark, then carriage return | CONFIRMED | [5][6] |
| Machine-mediated interviews | Validation used two teletypes through a computer buffer, so judges saw no typing hesitations from either a human or PARRY | CONFIRMED | [1] |

---

## Characteristic output style

| Trait | Evidence | Confidence | Source |
|---|---|---|---|
| Short, plain, colloquial sentences from a person, not a machine | Every published reply is 1-2 short sentences of everyday English | CONFIRMED | [1][3] |
| Answers ordinary intake questions normally at first | Name, age, job and marital status get flat factual answers while affect is low | CONFIRMED | [1] |
| Hints and prompts | Drops a flare term ("ITALIAN CROOKS", "the mob") to see if the interviewer bites | CONFIRMED | [1][3] |
| Suspicious counter-questions about motive | "WHY ARE YOU INTERESTED IN MY LOOKS ?" | CONFIRMED | [1] |
| Hostility and refusal under anger | "SOME OF YOUR REMARKS ANNOY ME", "It's none of your business." | CONFIRMED | [1][3] |
| Evasion under fear | "LET'S TALK ABOUT SOMETHING ELSE", "I'D RATHER NOT DISCUSS IT." | CONFIRMED | [1] |
| Draws the interviewer in | "ARE YOU IN WITH THE OTHERS ?" | CONFIRMED | [1] |
| Perseveration | In RFC 439 he repeats "I went to the races." many times while DOCTOR stonewalls | CONFIRMED | [3] |
| Uses `?` | Unlike ELIZA. The 1971 typesetting puts a space before it ("ME ?") | CONFIRMED | [1] |
| No "glitches", no robot talk | He is simulated as a human patient; indistinguishability from humans was the goal | CONFIRMED | [1][10] |

Short example lines (each under 15 words; from [1] unless marked [3]):

- "I SHOULDN'T BE HERE."
- "COPS ARREST THE WRONG PEOPLE."
- "THE MAFIA ARE THE WORST GANGSTERS."
- "YOU KNOW, THEY KNOW ME." (strong version)
- "FORGET THE EXCUSES, YOU GUYS ARE ALL ALIKE."
- "I KNOW YOU ARE GOING TO TRY TO GIVE ME ELECTRIC SHOCK."
- "BOOKIES CAN'T BE TRUSTED."
- "AT LEAST YOU ARE TRYING TO UNDERSTAND." (when the interviewer stays non-threatening)
- "I don't confide in strangers." [3]
- "You are a real nag." [3]

---

## Original I/O and what a voice should aim for

| Fact | Detail | Confidence | Source |
|---|---|---|---|
| Medium | Teletyped text only. "I-O sequences are limited to linguistic communication by means of teletyped messages" | CONFIRMED | [1] |
| Case | The 1971 paper prints both interviewer and PARRY in capitals. The 1972 RFC 439 session is mixed case. The 2026 WAITS run is upper case | CONFIRMED | [1][3][6] |
| Non-verbal features | Optional printed non-verbal cues (startup "PRINT NON VERBAL FEATURE?"). Their text lives in data not present in the archive | CONFIRMED (prompt); UNVERIFIED (content) | [5][6] |
| Voice | **None.** PARRY never spoke | CONFIRMED | [1] |

What a voice should therefore aim for: the design goal was that a psychiatrist could not tell
PARRY from a real patient [1][10]. The voice should therefore be a **believable person**, not a
computer:

- a young-adult American man (28, working class);
- terse and guarded;
- flat until provoked;
- quieter and evasive when afraid;
- clipped and sharp when angry.

A "robotic" or theatrical "crazy" delivery is unfaithful. Avoid caricature: the source material
is a clinical simulation.

---

## Licensing and copyright status

| Item | Status | Can the project include it? | Confidence | Source |
|---|---|---|---|---|
| PARRY source (CMU AI Repository / Internet Archive copy) | **No licence or permission statement** in the README, the repository page, the Internet Archive item or the files (searched locally) | **No.** Default copyright applies. The likely holders are Stanford and/or Colby's estate (Colby died in 2001). Government grant funding does not place university work in the public domain | CONFIRMED (absence of licence); LIKELY (holder) | [5][7] |
| Source completeness | The README says it is "probably most of" the source. The response text database (`PDAT`) referenced by the docs is not in the tarball, and grep finds none of the published replies. The 2026 run needed three restored support files | LIKELY | [5][6] |
| 2026 WAITS image (sailing-on-arpanet) | Distributed for emulation. The blog states no separate licence for `PARRY.DMP` | UNVERIFIED | [6] |
| 1971 paper, 1972 paper, 1981 BBS paper | Publisher copyright (North-Holland/Elsevier; Cambridge UP) | Paraphrase only. Short quotations for reference are fine | CONFIRMED | [1][9] |
| RFC 439 | An RFC from before the IETF Trust era. It is freely redistributed in full by the RFC Editor, but it carries no explicit licence | Quote short lines; link to the RFC rather than embedding the transcript | UNVERIFIED | [3] |
| The model itself (equations, strategy, persona facts) | Ideas, procedures and methods are not copyrightable | **Yes.** Reimplement from the papers | CONFIRMED (statute) | [12] |
| The name "PARRY" | Historical program name. No trademark found | Yes, as historical reference | UNVERIFIED | [4] |

---

## Gaps vs. the current implementation

Read from `src/constants.ts` (`CHARACTERS` entry `parry`, and `VOICE_PROFILES`),
`api/_lib/gemini.ts` (TTS handler) and `src/EnhancedApp.tsx` (`personaGreeting`) on 2026-10-02.

| # | Current behaviour | Original behaviour | Severity |
|---|---|---|---|
| 1 | No internal state. Gemini improvises paranoia each turn | Numeric Fear/Anger/Mistrust (plus Hurt) carried across turns, with published update and decay rules [1][5] | High |
| 2 | "Conspiracy thinking: references to being watched, followed, or targeted" | One specific, systematized delusion: a bookie, the underworld, the Mafia. Reached gradually through weighted flare concepts, and **volunteered only to a non-threatening listener** [1] | High |
| 3 | "Rapid subject changes when feeling threatened" | Topic change is one fear-driven strategy among several. Otherwise PARRY is **persistently on-topic**, steering toward his story (the "one-track mind") [1][3] | Medium |
| 4 | "Occasional lucid moments followed by paranoid tangents" | Normal answers to normal questions while affect is low. Paranoid output is **caused** by detected malevolence, sensitive topics or flares, not random tangents [1] | Medium |
| 5 | Persona facts absent | 28-year-old post-office clerk, horse racing, the bookie fight, a week in hospital, brought by the police [1] | High |
| 6 | No sensitive areas | Looks, family, religion, education and sex raise Anger and Mistrust. Compliments backfire when Mistrust is high [1][5] | Medium |
| 7 | No termination | "BYE" ends the session at extreme affect, after repeated swearing, or when exhausted by repetition [1][5] | Medium |
| 8 | No silence | He can answer with nothing [1] | Low |
| 9 | Labelled "paranoid schizophrenia" | Colby limits "paranoid" to a **mode** of thinking dominated by malevolence delusions. The 1971 case is an imagined individual, not a schizophrenia simulation [1]. Wikipedia's "paranoid schizophrenia" wording is secondary | Low (wording; affects tone of the prompt) |
| 10 | ALL CAPS instruction | Faithful to the 1971 Stanford transcripts [1]. RFC 439 is mixed case [3]. Keep caps, but allow `?` | None |
| 11 | Greeting: "HELLO <name>. YOU ARE NOW CONNECTED TO PARRY." | PARRY had no greeting. The interviewer speaks first, and PARRY answers intake questions ("OK.") [1] | Low |
| 12 | `voicePrompt`: "anxious, defensive, suspicious tone" | Roughly right, but static. The real model's tone follows affect level [1] | Medium |
| 13 | The voice name comes only from the global `VOICE_PROFILES` (default **Charon**), shared with Dr. Sbaitso | n/a | Medium |
| 14 | "Handle sensitively" with no concrete guard | Needs an explicit statement that this is a 1970s research simulation, and must avoid modern stigmatizing language | Low |

---

## Concrete recommendations

### 1. Architecture: local state engine plus Gemini phraser (recommended)

A full local port is not possible: the source is unlicensed and its response database is missing.
A purely prompted LLM cannot keep numeric state honestly. Split the work instead.

**Local engine (deterministic, unit-tested).** It owns state and decides the strategy. Suggested
TypeScript (UNVERIFIED design, values from [1][5]):

```ts
type Version = 'weak' | 'mild' | 'strong';

interface Affect { fear: number; anger: number; mistrust: number; hurt: number } // each 0..20

interface ParryState {
  version: Version;
  affect: Affect;
  base: Affect;                     // floors; mistrust/hurt bases ratchet upward
  flareActive: string | null;       // current flare concept id
  flaresMentioned: Set<string>;
  delusionIndex: number;            // next delusion statement in sequence (strong only)
  delusionsUnderDiscussion: boolean;
  swearCount: number;               // 5 -> angry exit
  repeatCount: number;              // 9 -> exhausted exit
  lastTopic: string | null;         // for follow-ups and anaphora
  ended: boolean;
}

interface FlareNode { id: string; weight: number; words: string[]; next: string }
// e.g. horses(1) -> horseracing(5) -> gambling(7) -> bookies(9) -> gangsters(15)
//      -> rackets(17) -> mafia (delusion topic); police(4) -> italians(3) -> ... (from [1][5])

type Intent =
  | { kind: 'answer-self'; topic: string }            // intake facts: name, age, job ...
  | { kind: 'flare-statement'; flare: string }         // next hint along the graph
  | { kind: 'delusion'; index: number }                // strong version only
  | { kind: 'suspicious-query' }                       // high fear, input was a question
  | { kind: 'draw-in' }                                // high fear: "you're in with them"
  | { kind: 'counterattack' }                          // high anger, fear not high
  | { kind: 'change-subject' }                         // unwilling to discuss mafia
  | { kind: 'sensitive-rebuff'; area: string }
  | { kind: 'relationship'; stance: 'defensive' | 'softening' }
  | { kind: 'silence' }
  | { kind: 'bye' };
```

Per turn:

1. Classify the input with keyword and pattern tables in the 1971 scanning order: ill/help
   insinuation, delusion words, sensitive area, flare word, relationship, apology or threat, swear.
2. Apply the jumps:
   - `X += jump * (20 - X)`, with weak-version multipliers of 0.3 for Fear, 0.7 for Anger and
     0.5 for Hurt;
   - `mistrust += 0.5 * jump * (20 - mistrust)` and `mistrustBase += 0.1 * jump * (20 - mistrustBase)`.
3. Choose an intent. Use the willingness gate (Fear > 17, Anger > 17, or Fear + Anger +
   Mistrust > 40 means change the subject), plus the high-Fear and high-Anger rules and the exit
   conditions.
4. Decay after the reply:
   - Anger -1;
   - Hurt -0.5;
   - Fear -0.3, or the slower rates with floors of base + 3 (flare active) and base + 5
     (delusions under discussion);
   - Mistrust -0.05 to its base.

**Gemini phraser.** Send a compact, structured request; never the whole persona essay. For example:

```text
PERSONA: PARRY (K. M. Colby, Stanford 1971-72). 28, single, post office clerk, lives alone,
likes movies and horse races, in hospital about a week, brought by police. Beat up a bookie who
didn't pay off; fears the bookie's underworld friends (ultimately the Mafia) will get even.
STATE: fear=12.4 anger=3.0 mistrust=9.1 (scale 0-20) version=strong
INTENT: flare-statement flare=bookies
INTERVIEWER SAID: "Do you bet on the horses?"
WRITE: one or two short plain sentences PARRY would type, ALL CAPS, question marks allowed,
no stage directions, no explanations, no modern references, no clinical labels.
```

Keep a **local line bank** of about 5-10 newly written lines per intent. It is used when Gemini is
unavailable, rate limited or off-script, which keeps the persona working offline.

Do **not** copy Colby's published lines wholesale into the bank. Write new lines in the same
register. A few iconic short lines with attribution ("BYE.") are reasonable (UNVERIFIED legal
judgement).

**Exposed to the UI (optional).** An "emotion trace" panel showing Fear, Anger, Mistrust and Hurt
bars would mirror Colby's own "TRACE EMOTION VARIABLES?" option [5][6]. A WEAK / MILD / STRONG
selector would mirror the startup prompt.

### 2. If only the prompt is rewritten (minimum change)

Guidance for the `systemInstruction` (UNVERIFIED wording):

- State the persona facts above. Say he is a hypothetical patient in a psychiatric interview,
  not a chatbot and not "an AI".
- Default to plain, cooperative short answers to ordinary intake questions.
- Become suspicious only when the interviewer:
  - implies he is mentally ill;
  - touches looks, family, religion, education or sex;
  - doubts him;
  - pushes on the bookie or Mafia story while he is already frightened.
- Hint at the story through police, Italians, horses, gambling, bookies, gangsters and rackets,
  in that rough order. Only tell the Mafia story to a listener who stays non-threatening.
- When frightened: evade ("rather not discuss it"), question the interviewer's motives, or accuse
  them of being in with the others. When angry: counter-attack. At the extreme: reply only "BYE."
- An apology does not calm him when he is suspicious. Steady, non-judgemental remarks slowly do.
- One or two short sentences. ALL CAPS. Question marks allowed. No glitches, no computer talk,
  no modern references after the early 1970s.
- Remove "watched, followed, targeted", "rapid subject changes" and "lucid moments followed by
  paranoid tangents" (Gaps 2-4).
- Replace "paranoid schizophrenia" with "a paranoid patient (Colby's 1971 simulation)".
- Remove the generic greeting. PARRY waits for the interviewer, or says "OK." to "how are you".

### 3. Voice (TTS)

- **Voice: Orus** (Google: "Firm") [13]. Reasons:
  - a steady, firm adult male read suits a guarded, terse 28-year-old;
  - it is distinct from Charon (Sbaitso), Fenrir ("deep" profile) and Puck ("glitchy" profile).
- **Alternatives:**
  - **Algenib** ("Gravelly") for a rougher, more working-class edge;
  - **Fenrir** ("Excitable") only as the high-Anger variant.
- Google does not document voice gender. Choose by listening (UNVERIFIED).
- **Base style phrase:** "a tense, guarded young American man in his late twenties; terse and
  clipped, flat and wary, a little defensive; natural human speech, not robotic, not theatrical".
- **Affect modulation** (needs engine state, recommended):
  - Fear >= 12: append "quieter and hesitant, evasive, uneasy pauses".
  - Anger >= 12: append "curt, sharper, irritated, hostile edge".
  - Both low: append "plain and matter-of-fact".
  - BYE: "abrupt, final".
- **Wiring:** add a per-persona `voiceName` override (as for ELIZA), so the global `VOICE_PROFILES`
  choice stops making PARRY sound like Dr. Sbaitso.
- **Audio effects:** PARRY was a simulated human. Default to the "Modern" or "High Quality" preset
  with no bit-crusher. A teletype sound under the typewriter reveal fits the original medium
  better than an 8-bit voice.
- **Silence intent:** display an empty line and skip TTS.

### 4. Presentation and sensitivity

- Label the persona "PARRY (K. M. Colby, Stanford, 1972)".
- Add a short note that it is a historical research simulation of a paranoid patient, not a
  portrayal of real people with mental illness.
- Keep the Mafia and "Italian crooks" material: it is the documented 1971 delusion [1]. Frame it
  as the character's false belief, and do not let the LLM generalize it into ethnic commentary.
- Offer an "ELIZA meets PARRY" demo (both local engines) as a nod to RFC 439. Once both engines
  exist it is cheap and deterministic [3][6].

---

## Sources

1. Colby, K. M., Weber, S., Hilf, F. D. "Artificial Paranoia." *Artificial Intelligence* 2
   (1971) 1-25. PDF used: https://web.stanford.edu/class/cs124/colby_71.pdf ; DOI
   10.1016/0004-3702(71)90002-6
2. Stanford AI Memo AIM-125 (July 1970), "Artificial Paranoia":
   https://stacks.stanford.edu/file/druid:zw825gz9528/zw825gz9528.pdf ; DTIC AD0708683:
   https://apps.dtic.mil/sti/html/tr/AD0708683/index.html
3. Cerf, V. RFC 439, "PARRY Encounters the DOCTOR", 21 January 1973 (session 18 September
   1972): https://www.rfc-editor.org/rfc/rfc439.txt
4. Wikipedia, "PARRY": https://en.wikipedia.org/wiki/PARRY
5. CMU Artificial Intelligence Repository, `areas/classics/parry/` (readme by Martin Frost,
   5 Sept 1991; `parry.tgz` read locally: `pmem2` RAISE/INITPARAMS, `opar3` MODIFVAR and Mafia
   gate, `pmem5`, `rdata` flare weights, `bel`, `inf`, `all.doc`):
   https://www.cs.cmu.edu/afs/cs/project/ai-repository/ai/areas/classics/parry/ ,
   https://www.cs.cmu.edu/afs/cs/project/ai-repository/ai/areas/classics/parry/readme.txt
6. ELIZAGEN, "PARRY Parries Again" (Shrager, 26 April 2026; WAITS reanimation, startup prompts):
   https://sites.google.com/view/elizagen-org/blog/parry-parries-again ; updated WAITS image:
   https://github.com/larsbrinkhoff/sailing-on-arpanet/ ; emulator:
   https://github.com/rcornwell/sims/
7. Internet Archive, "PARRY" (Community Software upload of the same source, no rights statement):
   https://archive.org/details/parry_chatbot
8. Earnest, L. (ed.) *Recent Research in Artificial Intelligence, Heuristic Programming, and
   Network Protocols*, Stanford AIM-252, July 1974 (Higher Mental Functions project; Colby and
   Parkison pattern-matching AIM-234; *Artificial Paranoia* monograph):
   http://i.stanford.edu/pub/cstr/reports/cs/tr/74/466/CS-TR-74-466.pdf
9. Colby, K. M. "Modeling a paranoid mind." *Behavioral and Brain Sciences* 4 (1981) 515-534:
   https://philpapers.org/rec/COLMAP-3
10. Colby, Hilf, Weber, Kraemer. "Turing-like indistinguishability tests for the validation of a
    computer simulation of paranoid processes." *Artificial Intelligence* 3 (1972) 199-221:
    https://philpapers.org/rec/COLTIT-7
11. Heiser, Colby, Faught, Parkison. "Can psychiatrists distinguish a computer simulation of
    paranoia from the real thing?" *J. Psychiatric Research* 15(3) (1979) 149-162:
    https://pubmed.ncbi.nlm.nih.gov/541781/
12. 17 U.S.C. 102(b): https://www.law.cornell.edu/uscode/text/17/102
13. Google, Gemini API "Speech generation" (prebuilt voices and descriptors, style control):
    https://ai.google.dev/gemini-api/docs/speech-generation
