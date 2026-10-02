/**
 * Colby's affect model (ref-docs/06-parry.md, "Affect variables").
 *
 * - A rise is a share of the headroom: `X += jump * (20 - X)`.
 * - Any Fear or Anger rise also raises Mistrust by half the jump, and
 *   ratchets Mistrust's base by a tenth of it, so provocation leaves a mark.
 * - Hurt makes Fear and Anger more volatile (`jump += hurt / 50`) and raises
 *   their floors to half of Hurt's base.
 * - Each exchange decays Anger by 1, Hurt by 0.5, Mistrust by 0.05 and Fear by
 *   0.3 (0.2 with a floor of base + 3 while a flare is active, 0.1 with a
 *   floor of base + 5 while delusions are being discussed).
 */
import type { Affect, ParryState, ParryStrength } from './types';

export const AFFECT_MAX = 20;

export interface StrengthConfig {
  readonly initial: Affect;
  /** Multipliers on rises (the later code's WEAK version damps them). */
  readonly rise: { readonly fear: number; readonly anger: number; readonly hurt: number };
  /** Fear or Anger at or above this turns PARRY suspicious or hostile. */
  readonly highAffect: number;
  /** Whether the Mafia delusion can be elicited (WEAK deflects to "racketeers"). */
  readonly delusions: boolean;
}

/**
 * Initial values and multipliers are from the paper and the later code; the
 * `highAffect` thresholds are not published and are this engine's choice
 * (stronger versions turn hostile sooner).
 */
export const STRENGTHS: Readonly<Record<ParryStrength, StrengthConfig>> = {
  WEAK: {
    initial: { fear: 0, anger: 0, mistrust: 0, hurt: 0 },
    rise: { fear: 0.3, anger: 0.7, hurt: 0.5 },
    highAffect: 14,
    delusions: false,
  },
  MILD: {
    initial: { fear: 0, anger: 0, mistrust: 0, hurt: 0 },
    rise: { fear: 1, anger: 1, hurt: 1 },
    highAffect: 12,
    delusions: true,
  },
  STRONG: {
    initial: { fear: 0, anger: 0, mistrust: 15, hurt: 5 },
    rise: { fear: 1, anger: 1, hurt: 1 },
    highAffect: 10,
    delusions: true,
  },
};

/** Fear or Anger at or above this ends the interview. */
export const EXTREME_AFFECT = 19;
/** The later code's BYEOFF: Fear above this during flare or delusion talk ends it. */
export const EXTREME_FEAR_IN_FLARE = 18.4;
/** Willingness gate for the Mafia topic (later code). */
export const DELUSION_GATE = { fear: 17, anger: 17, sum: 40 } as const;
/** Flares are discussed at somewhat higher affect than delusions. */
export const FLARE_GATE = { fear: 17.5, anger: 17.5, sum: 45 } as const;
/** Mistrust above which a compliment reads as pacification. */
export const HIGH_MISTRUST = 10;

const clamp = (x: number): number => Math.min(AFFECT_MAX, Math.max(0, x));

/** `X += jump * (20 - X)`, clamped to 0-20. */
export function applyJump(value: number, jump: number): number {
  return clamp(value + jump * (AFFECT_MAX - value));
}

export interface Jumps {
  readonly fear?: number;
  readonly anger?: number;
  readonly hurt?: number;
}

/** Apply raw jumps through the strength multipliers, Hurt volatility and the Mistrust coupling. */
export function raise(state: ParryState, jumps: Jumps): ParryState {
  const cfg = STRENGTHS[state.strength];
  const { affect, base } = state;
  const volatility = affect.hurt / 50;
  const scaled = (raw: number | undefined, mult: number): number =>
    raw && raw > 0 ? Math.min(1, raw * mult + volatility) : 0;

  const fearJump = scaled(jumps.fear, cfg.rise.fear);
  const angerJump = scaled(jumps.anger, cfg.rise.anger);
  const hurtJump = jumps.hurt && jumps.hurt > 0 ? Math.min(1, jumps.hurt * cfg.rise.hurt) : 0;

  let mistrust = affect.mistrust;
  let mistrustBase = base.mistrust;
  for (const jump of [fearJump, angerJump]) {
    if (jump > 0) {
      mistrust = applyJump(mistrust, 0.5 * jump);
      mistrustBase = applyJump(mistrustBase, 0.1 * jump);
    }
  }

  return {
    ...state,
    affect: {
      fear: applyJump(affect.fear, fearJump),
      anger: applyJump(affect.anger, angerJump),
      mistrust,
      hurt: applyJump(affect.hurt, hurtJump),
    },
    base: { ...base, mistrust: mistrustBase },
  };
}

/** Lower Fear and Anger (a compliment or apology to a trusting PARRY), never below the floors. */
export function calm(state: ParryState, amount: number): ParryState {
  const { affect } = state;
  const floors = floorsOf(state);
  return {
    ...state,
    affect: {
      ...affect,
      fear: Math.min(affect.fear, Math.max(floors.fear, affect.fear - amount)),
      anger: Math.min(affect.anger, Math.max(floors.anger, affect.anger - amount)),
    },
  };
}

function floorsOf(state: ParryState): { fear: number; anger: number } {
  const hurtFloor = state.base.hurt / 2;
  return {
    fear: Math.max(state.base.fear, hurtFloor),
    anger: Math.max(state.base.anger, hurtFloor),
  };
}

/** Step `value` down by `rate`, stopping at `floor` (a value already below it stays). */
function decayTo(value: number, rate: number, floor: number): number {
  if (value <= floor) return value;
  return Math.max(floor, value - rate);
}

/** The per-exchange decay, applied after PARRY replies. */
export function decayAffect(state: ParryState): ParryState {
  const { affect, base } = state;
  const floors = floorsOf(state);
  let fearRate = 0.3;
  let fearFloor = floors.fear;
  if (state.delusionsUnderDiscussion) {
    fearRate = 0.1;
    fearFloor = floors.fear + 5;
  } else if (state.activeFlare !== null) {
    fearRate = 0.2;
    fearFloor = floors.fear + 3;
  }
  return {
    ...state,
    affect: {
      fear: decayTo(affect.fear, fearRate, fearFloor),
      anger: decayTo(affect.anger, 1, floors.anger),
      mistrust: decayTo(affect.mistrust, 0.05, base.mistrust),
      hurt: decayTo(affect.hurt, 0.5, base.hurt),
    },
  };
}
