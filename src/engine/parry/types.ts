/**
 * Types for the local PARRY engine (the deterministic half of the hybrid
 * design in ref-docs/06-parry.md).
 *
 * The engine is pure: no React, DOM, network or clock. Its only randomness is
 * a seeded PRNG whose state lives in `ParryState.rng`, so the same seed and
 * the same inputs always give the same result.
 */

/** The later code's startup prompt: VERSION [WEAK, MILD, STRONG]. */
export type ParryStrength = 'WEAK' | 'MILD' | 'STRONG';

/** Colby's affect variables, each on a 0-20 scale. */
export interface Affect {
  readonly fear: number;
  readonly anger: number;
  readonly mistrust: number;
  /** Shame/humiliation, added in the later versions. */
  readonly hurt: number;
}

/** Flare concepts, after the later code's eleven weighted sets. */
export type FlareId =
  | 'horses'
  | 'racing'
  | 'police'
  | 'italians'
  | 'money'
  | 'gambling'
  | 'bookies'
  | 'cheating'
  | 'the-bookie'
  | 'gangsters'
  | 'rackets';

/** Sensitive areas (weights from the later code), plus insinuations of illness. */
export type SensitiveArea = 'looks' | 'sex' | 'family' | 'education' | 'religion' | 'illness';

/** Ordinary intake questions PARRY answers plainly while calm. */
export type IntakeTopic = 'name' | 'age' | 'job' | 'marital' | 'home' | 'hospital' | 'hobbies' | 'feeling';

export type ByeReason = 'extreme-fear' | 'extreme-anger' | 'swearing' | 'exhausted';

export type ParryActionKind =
  /** A plain factual answer to an intake question. */
  | 'answer'
  /** A hint along the flare graph. */
  | 'flare'
  /** The next part of the bookie story (only to a non-threatening listener). */
  | 'story'
  /** The next statement of the Mafia delusion (MILD and STRONG only). */
  | 'delusion'
  /** Change the subject. */
  | 'evade'
  /** Decline to answer. */
  | 'refuse'
  /** High fear and the input was a question: query the interviewer's motives. */
  | 'suspicious-query'
  /** High fear and the input was a statement: suggest the interviewer is in with the others. */
  | 'draw-in'
  /** High anger (fear not high): ignore the input and attack. */
  | 'counter-attack'
  /** A sensitive area was touched: answer guardedly and ask why they want to know. */
  | 'sensitive'
  /** The interviewer stays steady and kind: a small concession. */
  | 'soften'
  /** The interviewer doubts him or comments on the relationship. */
  | 'defend'
  /** Nothing to say: a non-committal reply. */
  | 'noncommittal'
  /** Say nothing (show an empty line, skip TTS). */
  | 'silence'
  /** End the interview. */
  | 'bye'
  /** The interview is already over; do nothing. */
  | 'ended';

export type Tone = 'flat' | 'guarded' | 'uneasy' | 'afraid' | 'irritated' | 'hostile' | 'final';

/** What PARRY does next, decided locally. Gemini only phrases it. */
export interface ParryAction {
  readonly kind: ParryActionKind;
  readonly topic?: IntakeTopic;
  readonly flare?: FlareId;
  readonly storyBeat?: number;
  readonly delusionIndex?: number;
  readonly area?: SensitiveArea;
  readonly reason?: ByeReason;
  /** Persona facts the line may draw on (and nothing beyond them). */
  readonly facts: readonly string[];
  /** Affect when PARRY replies (after this input's rises, before the decay). */
  readonly affect: Affect;
  readonly tone: Tone;
  /** The interviewer's input, trimmed. */
  readonly heard: string;
  readonly isQuestion: boolean;
  /** A locally written line for this action, for offline use or when the model fails. */
  readonly fallbackLine: string;
}

export interface ParryState {
  readonly strength: ParryStrength;
  readonly affect: Affect;
  /** Floors. Mistrust's base ratchets upward after every provocation. */
  readonly base: Affect;
  readonly activeFlare: FlareId | null;
  readonly disclosedFlares: readonly FlareId[];
  /** Next beat of the bookie story to tell. */
  readonly storyBeat: number;
  /** Next statement of the delusion sequence. */
  readonly delusionIndex: number;
  readonly delusionsUnderDiscussion: boolean;
  /** Whether a delusion word has been mentioned yet (the first mention raises Fear). */
  readonly delusionMentioned: boolean;
  readonly swearCount: number;
  readonly repeatCount: number;
  /** Normalised earlier inputs, for repetition detection (most recent last, capped). */
  readonly seenInputs: readonly string[];
  readonly turn: number;
  /** PRNG state (mulberry32). */
  readonly rng: number;
  readonly ended: boolean;
}

export interface ParryStep {
  readonly state: ParryState;
  readonly action: ParryAction;
}

/** One bar of an emotion panel. */
export interface AffectBar {
  readonly name: 'FEAR' | 'ANGER' | 'MISTRUST' | 'HURT';
  readonly value: number;
  readonly max: 20;
}

/** A custom-character request for the existing `/api/chat` proxy. */
export interface ParryPrompt {
  readonly customCharacter: { readonly name: string; readonly systemInstruction: string };
  readonly message: string;
}
