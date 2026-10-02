/**
 * The local PARRY engine: owns the affect state and decides WHAT PARRY does
 * next. Gemini only phrases the decision (see `prompt.ts`).
 *
 * Per turn (ref-docs/06-parry.md, "Concrete recommendations"):
 * 1. count swearing and repetition (5 swears or 9 repeats end the interview);
 * 2. scan the input in Colby's 1971 order (illness insinuation, delusion
 *    words, sensitive areas, flare words, relationship statements) and apply
 *    the rises;
 * 3. end with BYE at extreme affect, else choose an action;
 * 4. decay the affect.
 */
import {
  AFFECT_MAX,
  DELUSION_GATE,
  EXTREME_AFFECT,
  EXTREME_FEAR_IN_FLARE,
  FLARE_GATE,
  HIGH_MISTRUST,
  STRENGTHS,
  calm,
  decayAffect,
  raise,
} from './affect';
import {
  BYE_LINE,
  DELUSION_LINES,
  FLARE_LINES,
  INTAKE_LINES,
  KIND_LINES,
  SENSITIVE_LINES,
  STORY_LINES,
} from './lines';
import {
  AMBIGUOUS_MISTRUST,
  APOLOGY_PATTERN,
  COMPLIMENT_PATTERN,
  DELUSION_FACTS,
  DELUSION_WORDS,
  DOUBT_PATTERN,
  ENTRY_FLARES,
  FLARES,
  FLARE_SCAN_ORDER,
  ILLNESS_WORDS,
  INTAKE_FACTS,
  INTAKE_PATTERNS,
  SENSITIVE,
  SENSITIVE_FACTS,
  SENSITIVE_SCAN_ORDER,
  STORY,
  STORY_ASK_PATTERN,
  SWEAR_WORDS,
  THREAT_PATTERN,
} from './persona';
import { nextRandom, seedFrom } from './rng';
import type {
  AffectBar,
  ByeReason,
  FlareId,
  IntakeTopic,
  ParryAction,
  ParryActionKind,
  ParryState,
  ParryStep,
  ParryStrength,
  SensitiveArea,
  Tone,
} from './types';

/**
 * PARRY never greets: the interviewer speaks first (ref-docs/06-parry.md,
 * gap 11). The caller shows an empty prompt and waits.
 */
export const PARRY_OPENER: null = null;

/** Swear inputs that end the interview (later code). */
export const SWEAR_LIMIT = 5;
/** Repetitive ("exhaust") inputs that end the interview (later code). */
export const REPEAT_LIMIT = 9;
/** Chance PARRY volunteers a flare hint on a turn with nothing else to say (not published). */
export const VOLUNTEER_CHANCE = 0.6;
/** Mistrust at or above which he will not tell the story at all (not published). */
const STORY_MISTRUST_MAX = 18;
/** Mistrust at or above which a sensitive question is refused outright (not published). */
const REFUSE_MISTRUST = 15;
const SEEN_CAP = 50;
/** Interviewer text kept on the action (the proxy caps a message at 2000 characters). */
const HEARD_CAP = 500;

export interface CreateParryOptions {
  readonly strength?: ParryStrength;
  /** PRNG seed. The same seed and inputs always give the same session. */
  readonly seed?: number;
}

export function createParryState(options: CreateParryOptions = {}): ParryState {
  const strength = options.strength ?? 'MILD';
  const initial = STRENGTHS[strength].initial;
  return {
    strength,
    affect: { ...initial },
    base: { ...initial },
    activeFlare: null,
    disclosedFlares: [],
    storyBeat: 0,
    delusionIndex: 0,
    delusionsUnderDiscussion: false,
    delusionMentioned: false,
    swearCount: 0,
    repeatCount: 0,
    seenInputs: [],
    turn: 0,
    rng: seedFrom(options.seed ?? 1),
    ended: false,
  };
}

// ------------------------------------------------------------ classification

const wordCache = new Map<string, RegExp>();
function wordRe(word: string): RegExp {
  let re = wordCache.get(word);
  if (!re) {
    re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    wordCache.set(word, re);
  }
  return re;
}

function hasAny(text: string, words: readonly string[]): boolean {
  return words.some((w) => wordRe(w).test(text));
}

export function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const QUESTION_START = /^(what|why|how|who|where|when|which|do|does|did|are|is|was|were|can|could|will|would|have|has|should)\b/;

type DelusionLevel = 'strong' | 'weak' | 'ambiguous';

interface Classification {
  readonly heard: string;
  readonly normalized: string;
  readonly isQuestion: boolean;
  readonly silent: boolean;
  readonly swear: boolean;
  readonly illness: boolean;
  readonly delusion: DelusionLevel | null;
  readonly compliment: boolean;
  readonly sensitive: Exclude<SensitiveArea, 'illness'> | null;
  readonly aboutHim: boolean;
  readonly flare: FlareId | null;
  readonly doubt: boolean;
  readonly apology: boolean;
  readonly threat: boolean;
  readonly intake: IntakeTopic | null;
  readonly storyAsk: boolean;
  /** A bare listening prompt ("Go on.", "I see."); never counted as repetition. */
  readonly backchannel: boolean;
}

/**
 * Listening prompts an interested interviewer naturally repeats. Counting them
 * as "exhaust" input would end the interview just as the story is told (this
 * exemption is the engine's choice; the later code's rule is not published).
 */
const BACKCHANNEL =
  /^(go on|i see|ok|okay|yes|no|yeah|uh huh|mm|hmm|right|really|and then|then what|tell me more|continue|what happened|what next|keep going)$/;

function classify(input: string, mistrust: number): Classification {
  const heard = input.trim().slice(0, HEARD_CAP);
  const text = normalizeInput(input);
  let delusion: DelusionLevel | null = null;
  if (hasAny(text, DELUSION_WORDS.strong)) delusion = 'strong';
  else if (hasAny(text, DELUSION_WORDS.weak)) delusion = 'weak';
  else if (mistrust > AMBIGUOUS_MISTRUST && hasAny(text, DELUSION_WORDS.ambiguous)) delusion = 'ambiguous';

  const sensitive = SENSITIVE_SCAN_ORDER.find((area) => hasAny(text, SENSITIVE[area].words)) ?? null;

  return {
    heard,
    normalized: text,
    isQuestion: input.includes('?') || QUESTION_START.test(text),
    silent: text.length === 0,
    swear: hasAny(text, SWEAR_WORDS),
    illness: hasAny(text, ILLNESS_WORDS),
    delusion,
    compliment: COMPLIMENT_PATTERN.test(text),
    sensitive,
    aboutHim: /\b(you|your|yourself)\b/.test(text),
    flare: FLARE_SCAN_ORDER.find((id) => hasAny(text, FLARES[id].words)) ?? null,
    doubt: DOUBT_PATTERN.test(text),
    apology: APOLOGY_PATTERN.test(text),
    threat: THREAT_PATTERN.test(text),
    intake: INTAKE_PATTERNS.find(([, re]) => re.test(text))?.[0] ?? null,
    storyAsk: STORY_ASK_PATTERN.test(text),
    backchannel: BACKCHANNEL.test(text),
  };
}

// ----------------------------------------------------------------- decisions

interface Decision {
  readonly state: ParryState;
  readonly kind: ParryActionKind;
  readonly topic?: IntakeTopic;
  readonly flare?: FlareId;
  readonly storyBeat?: number;
  readonly delusionIndex?: number;
  readonly area?: SensitiveArea;
  readonly reason?: ByeReason;
  readonly facts: readonly string[];
  readonly lines: readonly string[];
}

const sum = (s: ParryState): number => s.affect.fear + s.affect.anger + s.affect.mistrust;

function willingDelusion(s: ParryState): boolean {
  return (
    STRENGTHS[s.strength].delusions &&
    s.affect.fear <= DELUSION_GATE.fear &&
    s.affect.anger <= DELUSION_GATE.anger &&
    sum(s) <= DELUSION_GATE.sum
  );
}

function willingFlare(s: ParryState): boolean {
  return s.affect.fear <= FLARE_GATE.fear && s.affect.anger <= FLARE_GATE.anger && sum(s) <= FLARE_GATE.sum;
}

/** He tells his story only to an interested listener who is not threatening him. */
function storyOpen(s: ParryState, provoked: boolean): boolean {
  const high = STRENGTHS[s.strength].highAffect;
  return (
    !provoked &&
    s.storyBeat < STORY.length &&
    s.affect.fear < high &&
    s.affect.anger < high &&
    s.affect.mistrust < STORY_MISTRUST_MAX
  );
}

function disclose(s: ParryState, flare: FlareId): ParryState {
  return {
    ...s,
    activeFlare: flare,
    disclosedFlares: s.disclosedFlares.includes(flare) ? s.disclosedFlares : [...s.disclosedFlares, flare],
  };
}

function tellStory(s: ParryState): Decision {
  const beat = s.storyBeat;
  const { flare, facts } = STORY[beat];
  return {
    state: { ...disclose(s, flare), storyBeat: beat + 1 },
    kind: 'story',
    flare,
    storyBeat: beat,
    facts,
    lines: STORY_LINES[beat],
  };
}

function flareStatement(s: ParryState, flare: FlareId): Decision {
  return { state: disclose(s, flare), kind: 'flare', flare, facts: FLARES[flare].facts, lines: FLARE_LINES[flare] };
}

function tellDelusion(s: ParryState): Decision {
  const index = Math.min(s.delusionIndex, DELUSION_FACTS.length - 1);
  return {
    state: { ...s, delusionIndex: Math.min(s.delusionIndex + 1, DELUSION_FACTS.length), delusionsUnderDiscussion: true },
    kind: 'delusion',
    delusionIndex: index,
    facts: DELUSION_FACTS[index],
    lines: DELUSION_LINES[index],
  };
}

function simple(s: ParryState, kind: ParryActionKind, lines: readonly string[]): Decision {
  return { state: s, kind, facts: [], lines };
}

const evade = (s: ParryState): Decision => simple({ ...s, activeFlare: null }, 'evade', KIND_LINES.evade);

/** The Mafia topic: tell the next delusion, deflect (WEAK), or change the subject. */
function mafiaMove(s: ParryState): Decision {
  if (willingDelusion(s)) return tellDelusion(s);
  if (!STRENGTHS[s.strength].delusions && willingFlare(s)) return flareStatement(s, 'rackets');
  return evade(s);
}

/** The interviewer raised a flare concept. */
function flareMove(s: ParryState, flare: FlareId, provoked: boolean): Decision {
  if (!willingFlare(s)) return evade(s);
  if (FLARES[flare].story && storyOpen(s, provoked)) return tellStory(s);
  return flareStatement(s, flare);
}

function pickWeighted(s: ParryState, candidates: readonly FlareId[]): [FlareId, ParryState] {
  const total = candidates.reduce((acc, id) => acc + FLARES[id].weight, 0);
  const [r, rng] = nextRandom(s.rng);
  let x = r * total;
  for (const id of candidates) {
    x -= FLARES[id].weight;
    if (x < 0) return [id, { ...s, rng }];
  }
  return [candidates[candidates.length - 1], { ...s, rng }];
}

/** Flares he could hint at next: the entry points plus the successors of those already raised. */
function reachableFlares(s: ParryState): FlareId[] {
  const reachable = new Set<FlareId>(ENTRY_FLARES);
  for (const id of s.disclosedFlares) {
    const next = FLARES[id].next;
    if (next !== 'mafia') reachable.add(next);
  }
  return [...reachable].filter((id) => !s.disclosedFlares.includes(id));
}

/** Nothing in the input fired: follow the active flare (the one-track mind), or volunteer one. */
function defaultMove(s: ParryState, c: Classification): Decision {
  if (s.delusionsUnderDiscussion && willingDelusion(s) && s.delusionIndex < DELUSION_FACTS.length) {
    return tellDelusion(s);
  }
  if (s.activeFlare !== null) {
    const node = FLARES[s.activeFlare];
    if (node.story && storyOpen(s, false)) return tellStory(s);
    if (node.next === 'mafia') {
      if (STRENGTHS[s.strength].delusions && s.delusionIndex >= DELUSION_FACTS.length) {
        return simple(s, 'noncommittal', KIND_LINES.noncommittal);
      }
      return mafiaMove(s);
    }
    return flareMove(s, node.next, false);
  }
  const [r, rng] = nextRandom(s.rng);
  const next = { ...s, rng };
  const candidates = reachableFlares(next);
  if (r < VOLUNTEER_CHANCE && candidates.length > 0 && willingFlare(next)) {
    const [flare, picked] = pickWeighted(next, candidates);
    return flareStatement(picked, flare);
  }
  return c.silent ? simple(next, 'silence', ['']) : simple(next, 'noncommittal', KIND_LINES.noncommittal);
}

function decide(s: ParryState, c: Classification, provoked: boolean): Decision {
  const cfg = STRENGTHS[s.strength];
  const { fear, anger, mistrust } = s.affect;

  if (c.delusion !== null) return mafiaMove(s);

  // Fear outranks Anger when both are high.
  if (fear >= cfg.highAffect) {
    return c.isQuestion
      ? simple(s, 'suspicious-query', KIND_LINES.suspiciousQuery)
      : simple(s, 'draw-in', KIND_LINES.drawIn);
  }
  if (anger >= cfg.highAffect) return simple(s, 'counter-attack', KIND_LINES.counterAttack);

  if (c.illness) return sensitiveMove(s, 'illness', c.isQuestion);
  if (c.compliment) {
    return mistrust > HIGH_MISTRUST
      ? simple(s, 'counter-attack', KIND_LINES.counterAttack)
      : simple(s, 'soften', KIND_LINES.soften);
  }
  if (c.sensitive !== null) {
    return mistrust >= REFUSE_MISTRUST
      ? simple(s, 'refuse', KIND_LINES.refuse)
      : sensitiveMove(s, c.sensitive, c.isQuestion);
  }
  if (c.flare !== null) return flareMove(s, c.flare, provoked);
  if (c.threat || c.doubt) return simple(s, 'defend', KIND_LINES.defend);
  if (c.apology) {
    return mistrust > HIGH_MISTRUST ? simple(s, 'defend', KIND_LINES.defend) : simple(s, 'soften', KIND_LINES.soften);
  }
  if (c.intake !== null) {
    const topic = c.intake;
    const answered = topic === 'hospital' ? disclose(s, 'police') : s;
    return { state: answered, kind: 'answer', topic, facts: INTAKE_FACTS[topic], lines: INTAKE_LINES[topic] };
  }
  if (c.storyAsk) {
    if (storyOpen(s, provoked)) return tellStory(s);
    if (s.storyBeat < STORY.length) return simple(s, 'refuse', KIND_LINES.refuse);
  }
  return defaultMove(s, c);
}

function sensitiveMove(s: ParryState, area: SensitiveArea, isQuestion: boolean): Decision {
  const bank = SENSITIVE_LINES[area];
  return { state: s, kind: 'sensitive', area, facts: SENSITIVE_FACTS[area], lines: isQuestion ? bank.question : bank.statement };
}

// ---------------------------------------------------------------- the step

function toneOf(s: ParryState, kind: ParryActionKind): Tone {
  if (kind === 'bye') return 'final';
  const high = STRENGTHS[s.strength].highAffect;
  const { fear, anger, mistrust } = s.affect;
  if (fear >= high) return 'afraid';
  if (anger >= high) return 'hostile';
  if (fear >= high * 0.6) return 'uneasy';
  if (anger >= high * 0.6) return 'irritated';
  if (mistrust >= HIGH_MISTRUST) return 'guarded';
  return 'flat';
}

function finish(s: ParryState, c: Classification, d: Decision): ParryStep {
  let state = d.state;
  let fallbackLine = '';
  if (d.lines.length > 0) {
    const [r, rng] = nextRandom(state.rng);
    fallbackLine = d.lines[Math.floor(r * d.lines.length)];
    state = { ...state, rng };
  }
  const action: ParryAction = {
    kind: d.kind,
    ...(d.topic !== undefined && { topic: d.topic }),
    ...(d.flare !== undefined && { flare: d.flare }),
    ...(d.storyBeat !== undefined && { storyBeat: d.storyBeat }),
    ...(d.delusionIndex !== undefined && { delusionIndex: d.delusionIndex }),
    ...(d.area !== undefined && { area: d.area }),
    ...(d.reason !== undefined && { reason: d.reason }),
    facts: d.facts,
    affect: state.affect,
    tone: toneOf(state, d.kind),
    heard: c.heard,
    isQuestion: c.isQuestion,
    fallbackLine,
  };
  state = {
    ...state,
    delusionsUnderDiscussion: d.kind === 'delusion' || c.delusion !== null,
  };
  if (d.kind === 'bye') state = { ...state, ended: true };
  return { state: decayAffect(state), action };
}

function bye(s: ParryState, reason: ByeReason): Decision {
  return { state: s, kind: 'bye', reason, facts: [], lines: [BYE_LINE] };
}

/**
 * One interviewer turn. Pure: returns a new state and the action to phrase.
 * After the interview has ended it returns the same state and an `ended`
 * action with an empty line.
 */
export function parryRespond(state: ParryState, input: string): ParryStep {
  if (state.ended) {
    return {
      state,
      action: {
        kind: 'ended',
        facts: [],
        affect: state.affect,
        tone: 'final',
        heard: input.trim().slice(0, HEARD_CAP),
        isQuestion: false,
        fallbackLine: '',
      },
    };
  }

  const c = classify(input, state.affect.mistrust);
  let s: ParryState = { ...state, turn: state.turn + 1 };
  let provoked = false;

  // Swearing and repetition (later code: Anger +0.3 and +0.15 per input).
  if (c.swear) {
    s = raise({ ...s, swearCount: s.swearCount + 1 }, { anger: 0.3 });
    provoked = true;
  }
  if (!c.silent && !c.backchannel) {
    if (s.seenInputs.includes(c.normalized)) {
      s = raise({ ...s, repeatCount: s.repeatCount + 1 }, { anger: 0.15 });
    } else {
      s = { ...s, seenInputs: [...s.seenInputs, c.normalized].slice(-SEEN_CAP) };
    }
  }
  if (s.swearCount >= SWEAR_LIMIT) return finish(s, c, bye(s, 'swearing'));
  if (s.repeatCount >= REPEAT_LIMIT) return finish(s, c, bye(s, 'exhausted'));

  // 1. Insinuation that he is mentally ill or needs help (less for a question).
  if (c.illness) {
    const f = c.isQuestion ? 0.5 : 1;
    s = raise(s, { anger: 0.3 * f, fear: 0.15 * f, hurt: 0.2 * f });
    provoked = true;
  }
  // 2. The delusional complex: the first mention raises Fear by word strength.
  if (c.delusion !== null) {
    if (!s.delusionMentioned) {
      const jump = c.delusion === 'strong' ? 0.3 : c.delusion === 'weak' ? 0.2 : 0.1;
      s = raise({ ...s, delusionMentioned: true }, { fear: jump });
    }
    s = { ...s, delusionsUnderDiscussion: true };
  }
  // 3. Sensitive areas, weighted by area, whose attribute is meant and tone.
  //    A compliment calms him unless Mistrust is high, when it reads as pacification.
  if (c.compliment) {
    if (s.affect.mistrust > HIGH_MISTRUST) {
      s = raise(s, { anger: 0.1 });
      provoked = true;
    } else {
      s = calm(s, 1);
    }
  } else if (c.sensitive !== null) {
    const weight = SENSITIVE[c.sensitive].weight;
    const f = (c.aboutHim ? 1 : 0.4) * (c.isQuestion ? 0.6 : 1);
    s = raise(s, { anger: weight * 0.02 * f, hurt: weight * 0.01 * f });
    provoked = true;
  }
  // 4. Flare concepts raise Fear in proportion to their weight.
  if (c.flare !== null) s = raise(s, { fear: FLARES[c.flare].weight / 100 });
  // 5. Relationship statements, apologies and direct threats.
  if (c.doubt) {
    s = raise(s, { fear: 0.05, anger: 0.05 });
    provoked = true;
  }
  if (c.threat) {
    s = raise(s, { fear: 0.45 });
    provoked = true;
  }
  if (c.apology && !c.doubt && s.affect.mistrust <= HIGH_MISTRUST) s = calm(s, 0.5);

  const { fear, anger } = s.affect;
  const flareTalk = s.activeFlare !== null || s.delusionsUnderDiscussion || c.flare !== null;
  if (fear >= EXTREME_AFFECT || (flareTalk && fear > EXTREME_FEAR_IN_FLARE)) {
    return finish(s, c, bye(s, 'extreme-fear'));
  }
  if (anger >= EXTREME_AFFECT) return finish(s, c, bye(s, 'extreme-anger'));

  return finish(s, c, decide(s, c, provoked));
}

const round = (x: number): number => Math.round(x * 10) / 10;

/** The four affect variables, rounded to one decimal, for an emotion panel. */
export function affectTrace(state: ParryState): AffectBar[] {
  return [
    { name: 'FEAR', value: round(state.affect.fear), max: AFFECT_MAX },
    { name: 'ANGER', value: round(state.affect.anger), max: AFFECT_MAX },
    { name: 'MISTRUST', value: round(state.affect.mistrust), max: AFFECT_MAX },
    { name: 'HURT', value: round(state.affect.hurt), max: AFFECT_MAX },
  ];
}
