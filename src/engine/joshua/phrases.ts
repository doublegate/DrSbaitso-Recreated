/**
 * JOSHUA's fixed text. Sources: ref-docs/08-joshua-wopr.md.
 *
 * Copyright: WarGames (1983) is a copyrighted film. Only the short signature
 * lines the research marks CONFIRMED are used verbatim (each under 15 words);
 * everything else is written for this project in the same register.
 */

export const LOGON_PROMPT = 'LOGON:';

/** The backdoor password. Documented, but any logon is accepted (ref-docs/08 8.2). */
export const MAGIC_WORD = 'JOSHUA';

/** CONFIRMED lines (ref-docs/08 section 6). */
export const GREETING = ['GREETINGS, PROFESSOR FALKEN.', 'SHALL WE PLAY A GAME?'];
export const CHESS_OFFER = "WOULDN'T YOU PREFER A GOOD GAME OF CHESS?";
export const WHATS_THE_DIFFERENCE = "WHAT'S THE DIFFERENCE?";
export const CONCLUSION = [
  'GREETINGS, PROFESSOR FALKEN.',
  'A STRANGE GAME.',
  'THE ONLY WINNING MOVE IS NOT TO PLAY.',
  'HOW ABOUT A NICE GAME OF CHESS?',
];

/** Reply to HELP LOGON. LIKELY (fan screen transcriptions); not in the fetched sources. */
export const HELP_NOT_AVAILABLE = 'HELP NOT AVAILABLE';

/**
 * The game list, titles only. LIKELY: fan transcriptions (ref-docs/08 section 5,
 * sources [12][14][15]); the order was not checked against the film. The last
 * entry is printed apart from the rest.
 */
export const GAME_LIST: readonly string[] = [
  "FALKEN'S MAZE",
  'BLACK JACK',
  'GIN RUMMY',
  'HEARTS',
  'BRIDGE',
  'CHECKERS',
  'CHESS',
  'POKER',
  'FIGHTER COMBAT',
  'GUERRILLA ENGAGEMENT',
  'DESERT WARFARE',
  'AIR-TO-GROUND ACTIONS',
  'THEATERWIDE TACTICAL WARFARE',
  'THEATERWIDE BIOTOXIC AND CHEMICAL WARFARE',
  'GLOBAL THERMONUCLEAR WAR',
];

export const GLOBAL_THERMONUCLEAR_WAR = 'GLOBAL THERMONUCLEAR WAR';
export const TIC_TAC_TOE = 'TIC-TAC-TOE';

/** HELP GAMES: a paraphrase of the film's description (ref-docs/08 2.1). */
export const HELP_GAMES = [
  "'GAMES' ARE MODELS AND SIMULATIONS WITH TACTICAL AND",
  'STRATEGIC APPLICATIONS. TYPE LIST GAMES FOR A LIST.',
];

export const SIDE_MENU = ['WHICH SIDE DO YOU WANT?', '', '  1.  UNITED STATES', '  2.  SOVIET UNION', '', 'PLEASE CHOOSE ONE:'];

export const PLAYERS_PROMPT = 'NUMBER OF PLAYERS:';
export const PLAYERS_INVALID = 'ONE OR ZERO PLAYERS ONLY.';
export const ILLEGAL_MOVE = 'ILLEGAL MOVE.';
export const YOUR_MOVE = 'YOUR MOVE. TYPE A SQUARE, 1-9.';
export const GAME_ABANDONED = 'GAME ABANDONED. SHALL WE PLAY ANOTHER GAME?';

/** Games JOSHUA plays against itself before the war scenarios (guess: enough to scroll). */
export const SELF_PLAY_GAMES = 12;

/**
 * War-scenario names for the lesson's scrolling printout. INVENTED for this
 * project in the period style; the film's on-screen list is not reproduced.
 */
export const WAR_SCENARIOS: readonly string[] = [
  'UNITED STATES FIRST STRIKE',
  'SOVIET UNION FIRST STRIKE',
  'NATO / WARSAW PACT',
  'LIMITED EXCHANGE, EUROPE',
  'COUNTERFORCE ONLY',
  'COUNTERVALUE ONLY',
  'ACCIDENTAL LAUNCH',
  'ESCALATION FROM CONVENTIONAL',
  'SUBMARINE FIRST STRIKE',
  'DECAPITATION STRIKE',
  'RETALIATION ONLY',
  'TOTAL EXCHANGE',
];
