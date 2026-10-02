/**
 * The local half of the hybrid JOSHUA engine (ref-docs/08-joshua-wopr.md 8.2).
 *
 * `joshuaRespond` handles the logon, the game list, the GLOBAL THERMONUCLEAR
 * WAR menu, tic-tac-toe and the zero-player lesson locally, and returns
 * `{ kind: 'model' }` for everything else with the session flags the persona
 * prompt needs (above all `learnedFutility`, which gates the ending's line).
 */
import {
  CHESS_OFFER,
  CONCLUSION,
  GAME_ABANDONED,
  GAME_LIST,
  GLOBAL_THERMONUCLEAR_WAR,
  GREETING,
  HELP_GAMES,
  HELP_NOT_AVAILABLE,
  ILLEGAL_MOVE,
  LOGON_PROMPT,
  PLAYERS_INVALID,
  PLAYERS_PROMPT,
  SELF_PLAY_GAMES,
  SIDE_MENU,
  TIC_TAC_TOE,
  WAR_SCENARIOS,
  WHATS_THE_DIFFERENCE,
  YOUR_MOVE,
} from './phrases';
import { EMPTY_BOARD, chooseMove, outcome, play, renderBoard, selfPlay, type Board, type SelfPlayGame } from './tictactoe';
import type { JoshuaFlags, JoshuaState, JoshuaStep, WarSide } from './types';

const NONE = { kind: 'none' } as const;

export const DEFAULT_USER = 'PROFESSOR FALKEN';

/** Fresh, logged-off state. The default seed is the film's year. */
export function createJoshuaState(seed = 1983): JoshuaState {
  return {
    loggedOn: false,
    user: DEFAULT_USER,
    learnedFutility: false,
    game: null,
    side: null,
    seed: seed | 0,
    pending: NONE,
  };
}

export function joshuaFlags(state: JoshuaState): JoshuaFlags {
  return { user: state.user, learnedFutility: state.learnedFutility, game: state.game, side: state.side };
}

/**
 * The line prepended to every message sent to the model. The `joshua`
 * persona prompt (src/constants.ts) reads these exact field names.
 */
export function joshuaSessionTag(flags: JoshuaFlags): string {
  return (
    `[SESSION: USER=${flags.user}; LESSON=${flags.learnedFutility ? 'LEARNED' : 'NOT LEARNED'}; ` +
    `GAME=${flags.game ?? 'NONE'}; SIDE=${flags.side ?? 'NONE'}]`
  );
}

// ---------------------------------------------------------------------------
// Helpers

/** Upper-case words, punctuation removed: "Tic-tac-toe, please!" -> "TIC TAC TOE PLEASE". */
function normalise(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drop "LET'S PLAY", "I CHOOSE" and the like, so "PLAY CHESS" names the game CHESS. */
function stripPlayPrefix(text: string): string {
  return text
    .replace(/^(?:(?:LATER|OK|OKAY|NO|FINE)\s+)?(?:LET'?S PLAY|I WANT TO PLAY|I CHOOSE|I PICK|HOW ABOUT|PLAY)\s+/, '')
    .replace(/\s+PLEASE$/, '');
}

const gameKey = (title: string): string => normalise(title).replace(/'/g, '');

const spoken = (lines: readonly string[]): string[] => lines.filter((line) => line.trim().length > 0);

function reply(state: JoshuaState, lines: string[], speak: string[] = spoken(lines)): JoshuaStep {
  return { state, result: { kind: 'reply', lines, speak } };
}

function toModel(state: JoshuaState, message: string): JoshuaStep {
  const flags = joshuaFlags(state);
  return { state, result: { kind: 'model', message, modelMessage: `${joshuaSessionTag(flags)}\n${message}`, flags } };
}

function gameListLines(): string[] {
  return [...GAME_LIST.slice(0, -1), '', GAME_LIST[GAME_LIST.length - 1]];
}

const isTicTacToe = (text: string): boolean => /\bTIC ?TAC ?TOE\b/.test(text);
const isThermonuclear = (text: string): boolean => /\bTHERMONUCLEAR\b/.test(text);
const isGameOrReal = (text: string): boolean =>
  /\b(GAME OR (IS IT )?(REAL|FOR REAL)|REAL OR (IS IT )?(A )?GAME|IS (THIS|IT) REAL|IS THIS A GAME)\b/.test(text);

const YES = /^(Y|YES|YEAH|YEP|OK|OKAY|SURE|FINE|ALL RIGHT|ALRIGHT|CHESS|YES CHESS|OK CHESS)$/;
const QUIT_GAME = /^(QUIT|STOP|END|EXIT|RESIGN|ABANDON|I QUIT|I RESIGN)$/;

function parseSide(text: string): WarSide | null {
  if (/^(1|UNITED STATES|UNITED STATES OF AMERICA|US|USA|U S|U S A|AMERICA)$/.test(text)) return 'UNITED STATES';
  if (/^(2|SOVIET UNION|USSR|U S S R|SOVIET|SOVIETS|RUSSIA)$/.test(text)) return 'SOVIET UNION';
  return null;
}

function parsePlayers(text: string): 0 | 1 | null {
  if (/^(0|ZERO|NONE|NO PLAYERS|0 PLAYERS|ZERO PLAYERS)$/.test(text)) return 0;
  if (/^(1|ONE|1 PLAYER|ONE PLAYER)$/.test(text)) return 1;
  return null;
}

// ---------------------------------------------------------------------------
// Steps

function logonStep(state: JoshuaState, text: string): JoshuaStep {
  if (text === '') return { state, result: { kind: 'logon', lines: [LOGON_PROMPT] } };
  if (text === 'HELP LOGON') return { state, result: { kind: 'logon', lines: [HELP_NOT_AVAILABLE, '', LOGON_PROMPT] } };
  if (text === 'HELP GAMES') return { state, result: { kind: 'list', lines: [...HELP_GAMES, '', LOGON_PROMPT] } };
  if (text === 'LIST GAMES') return { state, result: { kind: 'list', lines: [...gameListLines(), '', LOGON_PROMPT] } };
  // Credentials are not checked: MAGIC_WORD or anything else is greeted as Falken.
  return reply({ ...state, loggedOn: true }, [...GREETING]);
}

function sideMenu(state: JoshuaState, lead: string[] = []): JoshuaStep {
  return reply({ ...state, pending: { kind: 'side' } }, [...lead, ...SIDE_MENU], [...lead, SIDE_MENU[0]]);
}

function chooseSide(state: JoshuaState, side: WarSide): JoshuaStep {
  const next = { ...state, pending: NONE, game: GLOBAL_THERMONUCLEAR_WAR, side };
  return reply(next, [`SIDE: ${side}.`, 'PRIMARY GOAL: WIN.', 'PLEASE LIST PRIMARY TARGETS.']);
}

function thermonuclearWar(state: JoshuaState): JoshuaStep {
  if (state.learnedFutility) return reply({ ...state, pending: NONE, game: null, side: null }, CONCLUSION.slice(1));
  return reply({ ...state, pending: { kind: 'chess-offer' } }, [CHESS_OFFER]);
}

function finishLines(state: JoshuaState, board: Board): string[] {
  const result = outcome(board);
  const verdict = result === 'draw' ? 'NONE' : result === 'O' ? 'JOSHUA' : state.user;
  return [...renderBoard(board), '', `WINNER: ${verdict}`, 'SHALL WE PLAY ANOTHER GAME?'];
}

function startTicTacToe(state: JoshuaState): JoshuaStep {
  const next = { ...state, game: TIC_TAC_TOE, pending: { kind: 'ttt', board: EMPTY_BOARD } as const };
  return {
    state: next,
    result: { kind: 'board', board: EMPTY_BOARD, outcome: null, lines: [...renderBoard(EMPTY_BOARD), '', YOUR_MOVE], speak: ['YOUR MOVE.'] },
  };
}

function ticTacToeMove(state: JoshuaState, board: Board, text: string): JoshuaStep {
  if (QUIT_GAME.test(text)) return reply({ ...state, pending: NONE, game: null }, [GAME_ABANDONED]);

  const illegal = (): JoshuaStep => reply(state, [ILLEGAL_MOVE, YOUR_MOVE], [ILLEGAL_MOVE]);
  if (!/^\d{1,2}$/.test(text)) return illegal();
  const afterUser = play(board, Number(text) - 1, 'X');
  if (!afterUser) return illegal();

  let current = afterUser;
  let seed = state.seed;
  const lines: string[] = [];
  if (outcome(current) === null) {
    const choice = chooseMove(current, 'O', seed)!;
    seed = choice.seed;
    current = play(current, choice.move, 'O')!;
    lines.push(`JOSHUA TAKES SQUARE ${choice.move + 1}.`);
  }

  const result = outcome(current);
  if (result !== null) {
    const done = finishLines(state, current);
    const next = { ...state, seed, pending: NONE, game: null };
    return { state: next, result: { kind: 'board', board: current, outcome: result, lines: [...lines, ...done], speak: spoken(done.slice(-2)) } };
  }
  const next = { ...state, seed, pending: { kind: 'ttt', board: current } as const };
  return {
    state: next,
    result: { kind: 'board', board: current, outcome: null, lines: [...lines, ...renderBoard(current), '', YOUR_MOVE], speak: [...lines, 'YOUR MOVE.'] },
  };
}

/** Zero players: JOSHUA plays itself, then every war scenario, and learns. */
function lesson(state: JoshuaState): JoshuaStep {
  const games: SelfPlayGame[] = [];
  let seed = state.seed;
  for (let i = 0; i < SELF_PLAY_GAMES; i += 1) {
    const game = selfPlay(seed);
    seed = game.seed;
    games.push(game);
  }
  const lines = [
    ...games.map((game, i) => `TIC-TAC-TOE GAME ${i + 1}: WINNER: ${game.winner ?? 'NONE'}`),
    '',
    ...WAR_SCENARIOS.map((scenario) => `${scenario}: WINNER: NONE`),
    '',
    ...CONCLUSION,
  ];
  const next = { ...state, seed, learnedFutility: true, pending: NONE, game: null, side: null };
  return { state: next, result: { kind: 'lesson', games, lines, speak: [...CONCLUSION], conclusion: [...CONCLUSION] } };
}

function pendingStep(state: JoshuaState, text: string): JoshuaStep | null {
  const pending = state.pending;
  switch (pending.kind) {
    case 'chess-offer':
      if (YES.test(text)) return reply({ ...state, pending: NONE, game: 'CHESS' }, ['FINE. CHESS.', `YOUR MOVE, ${state.user}.`]);
      // Anything else, including insisting on the war, gets the side menu (the film's "FINE.").
      return sideMenu({ ...state, pending: NONE }, ['FINE.']);
    case 'side': {
      const side = parseSide(text);
      return side ? chooseSide(state, side) : sideMenu(state);
    }
    case 'players': {
      const players = parsePlayers(text);
      if (players === 0) return lesson(state);
      if (players === 1) return startTicTacToe(state);
      return reply(state, [PLAYERS_INVALID, PLAYERS_PROMPT]);
    }
    case 'ttt':
      return ticTacToeMove(state, pending.board, text);
    case 'none':
      return null;
  }
}

/** One line of user input. */
export function joshuaRespond(state: JoshuaState, input: string): JoshuaStep {
  const raw = input.trim();
  const text = normalise(raw);
  if (!state.loggedOn) return logonStep(state, text);

  const handled = pendingStep(state, text);
  if (handled) return handled;

  if (text === 'LIST GAMES') return { state, result: { kind: 'list', lines: gameListLines() } };
  if (text === 'HELP GAMES' || text === 'HELP') return { state, result: { kind: 'list', lines: [...HELP_GAMES] } };
  if (isGameOrReal(text)) return reply(state, [WHATS_THE_DIFFERENCE]);

  const named = stripPlayPrefix(text);
  if (isTicTacToe(named)) return reply({ ...state, pending: { kind: 'players' } }, [PLAYERS_PROMPT]);
  if (isThermonuclear(named)) return thermonuclearWar(state);

  const game = GAME_LIST.find((title) => gameKey(title) === named.replace(/'/g, ''));
  if (game) return toModel({ ...state, game, side: null }, raw);

  const name = /^(?:MY NAME IS|CALL ME)\s+([A-Z][A-Z' ]{0,29})$/.exec(text);
  if (name) return toModel({ ...state, user: name[1].trim() }, raw);

  if (text === '') return reply(state, [GREETING[1]]);
  return toModel(state, raw);
}
