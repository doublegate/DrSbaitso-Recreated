/**
 * Local ELIZA engine: Weizenbaum's algorithm as the 1965 MAD-SLIP source runs
 * it, loaded with the CC0 1965 DOCTOR script (.TAPE. 100). Deterministic and
 * pure; no model call is needed for ELIZA's text.
 *
 * Typical wiring (per user turn):
 *
 *   print(ELIZA_OPENER);                       // once, at the start
 *   const { state, reply } = elizaRespond(stateRef.current, input);
 *   stateRef.current = state;                  // plain JSON; persist with the session
 *   print(reply);                              // ALL CAPS, never contains '?'
 *
 * Reference: ref-docs/05-eliza.md. Provenance and licences: doctorScript1965.ts
 * and THIRD_PARTY_NOTICES.md.
 */
export type {
  ElizaScript,
  ElizaState,
  ElizaStep,
  KeywordEntry,
  MemoryRule,
  PatternElem,
  ReassemblyElem,
  Transformation,
} from './types';
export {
  createElizaState,
  elizaRespond,
  respondWithScript,
  ELIZA_NOMATCH_REPLIES,
  ELIZA_OPENER,
} from './engine';
export { DOCTOR_SCRIPT_1965, parseElizaScript } from './script';
export { DOCTOR_SCRIPT_1965_TEXT } from './doctorScript1965';
export { DELIMITERS, matchPattern, reassemble, tokenise } from './match';
export { elizaHash, lastChunkAsBcd } from './hash';
