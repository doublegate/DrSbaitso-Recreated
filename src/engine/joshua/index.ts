/**
 * Local JOSHUA (WOPR) engine: the deterministic half of the hybrid design.
 *
 * Typical wiring (per user turn):
 *
 *   const { state, result } = joshuaRespond(stateRef.current, input);
 *   stateRef.current = state;
 *   switch (result.kind) {
 *     case 'model':  reply = await getAIResponse(result.modelMessage, 'joshua'); break;
 *     case 'board':  print result.lines (monospace); speak result.speak; break;
 *     case 'lesson': scroll result.lines; speak result.conclusion; break;
 *     case 'list':
 *     case 'logon':  print result.lines, do not speak; break;
 *     case 'reply':  print result.lines, speak result.speak; break;
 *   }
 */
export type { JoshuaFlags, JoshuaPending, JoshuaResult, JoshuaState, JoshuaStep, WarSide } from './types';
export { DEFAULT_USER, createJoshuaState, joshuaFlags, joshuaRespond, joshuaSessionTag } from './engine';
export {
  CHESS_OFFER,
  CONCLUSION,
  GAME_LIST,
  GREETING,
  LOGON_PROMPT,
  MAGIC_WORD,
  SELF_PLAY_GAMES,
  SIDE_MENU,
  WAR_SCENARIOS,
  WHATS_THE_DIFFERENCE,
} from './phrases';
export {
  EMPTY_BOARD,
  bestMoves,
  chooseMove,
  legalMoves,
  outcome,
  play,
  renderBoard,
  selfPlay,
  winner,
} from './tictactoe';
export type { Board, Cell, Mark, Outcome, SelfPlayGame } from './tictactoe';
