/**
 * Local Dr. Sbaitso engine: the deterministic half of the hybrid design.
 *
 * Typical wiring (per user turn):
 *
 *   const { state, result } = processInput(stateRef.current, input);
 *   stateRef.current = state;
 *   switch (result.kind) {
 *     case 'model':   reply = await getAIResponse(result.message);
 *                     stateRef.current = recordReply(stateRef.current, reply); break;
 *     case 'reply':   print + speak result.lines / result.speak; apply result.settings; break;
 *     case 'parity':  play the glitch sound, print result.lines line by line; break;
 *     ...
 *   }
 */
export type {
  EngineResult,
  EngineStep,
  ExitChoice,
  NameValidation,
  Pending,
  SbaitsoSettings,
  SbaitsoState,
  ValueCommand,
} from './types';
export { DEFAULT_SEED, createSbaitsoState, nextRandom, processInput, recordReply, SHORT_INPUT_LENGTH } from './engine';
export { DEFAULT_SETTINGS, DOT_MESSAGES } from './dotCommands';
export { CALC_ERRORS, CALC_LABEL, calcReply, evaluateArithmetic, looksArithmetic } from './calc';
export type { CalcOutcome } from './calc';
export {
  HELP_40_COLUMNS,
  HELP_MORE,
  MAX_NAME_LENGTH,
  NAME_ERROR_TEXT,
  NAME_PROMPT,
  exitMenuText,
  greetingLines,
  greetingSpeech,
  helpPages,
  isNameCharAllowed,
  resolveExitChoice,
  validateName,
} from './screens';
export {
  GOOD_BYE,
  PARITY_TRIGGER_LINES,
  PROFANITY_WORDS,
  SEXUAL_WORDS,
  isParityText,
  paritySequence,
  paritySpeech,
} from './phrases';
