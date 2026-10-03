/**
 * Local PARRY engine: the deterministic half of the hybrid design in
 * ref-docs/06-parry.md. It reimplements Colby's published affect model; no
 * code or text comes from the unlicensed archived source.
 *
 * Typical wiring (per interviewer turn):
 *
 *   const { state, action } = parryRespond(stateRef.current, input);
 *   stateRef.current = state;
 *   let line = action.fallbackLine;
 *   if (action.kind !== 'bye' && action.kind !== 'silence' && action.kind !== 'ended') {
 *     const prompt = buildParryPrompt(action, state);
 *     try {
 *       line = finalizeParryLine(
 *         await getAIResponse(prompt.message, 'parry-engine', { customCharacter: prompt.customCharacter }),
 *         action,
 *       );
 *     } catch { line = action.fallbackLine; }
 *   }
 *   // print `line` ('' = silence, skip TTS); if state.ended, close the interview.
 */
export type {
  Affect,
  AffectBar,
  ByeReason,
  FlareId,
  IntakeTopic,
  ParryAction,
  ParryActionKind,
  ParryPrompt,
  ParryState,
  ParryStep,
  ParryStrength,
  SensitiveArea,
  Tone,
} from './types';
export {
  PARRY_OPENER,
  REPEAT_LIMIT,
  SWEAR_LIMIT,
  VOLUNTEER_CHANCE,
  affectTrace,
  createParryState,
  normalizeInput,
  parryRespond,
} from './engine';
export type { CreateParryOptions } from './engine';
export {
  AFFECT_MAX,
  DELUSION_GATE,
  EXTREME_AFFECT,
  EXTREME_FEAR_IN_FLARE,
  FLARE_GATE,
  STRENGTHS,
  applyJump,
  decayAffect,
} from './affect';
export type { StrengthConfig } from './affect';
export { FLARES, FLARE_SCAN_ORDER, PERSONA_FACTS, STORY, DELUSION_FACTS } from './persona';
export { BYE_LINE } from './lines';
export { MAX_LINE_LENGTH, buildParryPrompt, finalizeParryLine } from './prompt';
export { nextRandom } from './rng';
