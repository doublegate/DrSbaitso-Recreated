import { describe, it, expect } from 'vitest';
import {
  GAME_LIST,
  GREETING,
  LOGON_PROMPT,
  SELF_PLAY_GAMES,
  createJoshuaState,
  joshuaRespond,
  joshuaSessionTag,
  outcome,
  type JoshuaResult,
  type JoshuaState,
} from '@/engine/joshua';

/** Feed inputs in order; return the final state and every result. */
function run(
  inputs: string[],
  state: JoshuaState = createJoshuaState(7),
): { state: JoshuaState; results: JoshuaResult[] } {
  const results: JoshuaResult[] = [];
  let current = state;
  for (const input of inputs) {
    const step = joshuaRespond(current, input);
    current = step.state;
    results.push(step.result);
  }
  return { state: current, results };
}

const last = (results: JoshuaResult[]): JoshuaResult => results[results.length - 1];
const linesOf = (result: JoshuaResult): string[] => ('lines' in result ? result.lines : []);

/** Narrow a result to one kind, failing the test otherwise (keeps expects unconditional). */
function as<K extends JoshuaResult['kind']>(
  result: JoshuaResult | undefined,
  kind: K,
): Extract<JoshuaResult, { kind: K }> {
  if (result?.kind !== kind) throw new Error(`expected a '${kind}' result, got '${result?.kind}'`);
  return result as Extract<JoshuaResult, { kind: K }>;
}

/** Cells of the board the user is playing on (fails if no game is running). */
function boardOf(state: JoshuaState): readonly (string | null)[] {
  if (state.pending.kind !== 'ttt') throw new Error(`no game running (pending: ${state.pending.kind})`);
  return state.pending.board;
}

describe('logon', () => {
  it('starts at the LOGON: prompt', () => {
    expect(LOGON_PROMPT).toBe('LOGON:');
    expect(createJoshuaState().loggedOn).toBe(false);
  });

  it('greets the backdoor password as Professor Falken', () => {
    const { state, results } = run(['joshua']);
    expect(state.loggedOn).toBe(true);
    expect(results[0]).toMatchObject({ kind: 'reply', lines: GREETING });
    expect(GREETING).toEqual(['GREETINGS, PROFESSOR FALKEN.', 'SHALL WE PLAY A GAME?']);
  });

  it('does not really check credentials: any logon is greeted', () => {
    const { state, results } = run(['pencil']);
    expect(state.loggedOn).toBe(true);
    expect(linesOf(results[0])).toEqual(GREETING);
  });

  it('re-prompts on an empty logon', () => {
    const { state, results } = run(['   ']);
    expect(state.loggedOn).toBe(false);
    expect(results[0]).toEqual({ kind: 'logon', lines: ['LOGON:'] });
  });

  it('answers HELP LOGON and LIST GAMES at the prompt without logging on', () => {
    const help = run(['help logon']);
    expect(help.state.loggedOn).toBe(false);
    expect(linesOf(help.results[0])).toEqual(['HELP NOT AVAILABLE', '', 'LOGON:']);

    const list = run(['LIST GAMES']);
    expect(list.state.loggedOn).toBe(false);
    expect(list.results[0].kind).toBe('list');
    expect(linesOf(list.results[0])).toContain('GLOBAL THERMONUCLEAR WAR');
    expect(linesOf(list.results[0]).at(-1)).toBe('LOGON:');
  });
});

describe('LIST GAMES / HELP GAMES', () => {
  it('prints the game list with global thermonuclear war last, separated', () => {
    expect(GAME_LIST[0]).toBe("FALKEN'S MAZE");
    expect(GAME_LIST.at(-1)).toBe('GLOBAL THERMONUCLEAR WAR');
    const { results } = run(['joshua', 'list games']);
    const lines = linesOf(last(results));
    expect(last(results).kind).toBe('list');
    for (const game of GAME_LIST) expect(lines).toContain(game);
    // A blank line separates the last entry from the rest.
    expect(lines[lines.indexOf('GLOBAL THERMONUCLEAR WAR') - 1]).toBe('');
  });

  it('describes games on HELP GAMES', () => {
    const { results } = run(['joshua', 'HELP GAMES']);
    expect(last(results).kind).toBe('list');
    expect(linesOf(last(results)).join(' ')).toMatch(/MODELS.*SIMULATIONS/);
  });
});

describe('global thermonuclear war', () => {
  it('counter-offers chess first', () => {
    const { state, results } = run(['joshua', 'Global Thermonuclear War']);
    expect(linesOf(last(results))).toEqual(["WOULDN'T YOU PREFER A GOOD GAME OF CHESS?"]);
    expect(state.pending.kind).toBe('chess-offer');
  });

  it('accepts chess', () => {
    const { state, results } = run(['joshua', 'play global thermonuclear war', 'yes']);
    expect(state.game).toBe('CHESS');
    expect(last(results).kind).toBe('reply');
  });

  it('shows the side menu when the user insists', () => {
    const { state, results } = run([
      'joshua',
      'global thermonuclear war',
      "later. let's play global thermonuclear war",
    ]);
    const lines = linesOf(last(results));
    expect(lines[0]).toBe('FINE.');
    expect(lines).toContain('WHICH SIDE DO YOU WANT?');
    expect(lines.join('\n')).toMatch(/1\.\s+UNITED STATES[\s\S]*2\.\s+SOVIET UNION/);
    expect(state.pending.kind).toBe('side');
  });

  it.each([
    ['1', 'UNITED STATES'],
    ['2', 'SOVIET UNION'],
    ['soviet union', 'SOVIET UNION'],
    ['USA', 'UNITED STATES'],
  ] as const)('takes side %s', (choice, side) => {
    const { state, results } = run(['joshua', 'global thermonuclear war', 'no', choice]);
    expect(state.side).toBe(side);
    expect(state.game).toBe('GLOBAL THERMONUCLEAR WAR');
    expect(state.pending.kind).toBe('none');
    expect(last(results).kind).toBe('reply');
  });

  it('repeats the menu on an invalid side', () => {
    const { state, results } = run(['joshua', 'global thermonuclear war', 'no', '3']);
    expect(state.pending.kind).toBe('side');
    expect(linesOf(last(results))).toContain('PLEASE CHOOSE ONE:');
  });

  it('hands the war to the model with the side in the flags', () => {
    const { results } = run(['joshua', 'global thermonuclear war', 'no', '2', 'Las Vegas']);
    expect(last(results)).toMatchObject({
      kind: 'model',
      message: 'Las Vegas',
      flags: { game: 'GLOBAL THERMONUCLEAR WAR', side: 'SOVIET UNION', learnedFutility: false },
    });
  });
});

describe('game or real', () => {
  it('cannot tell the difference', () => {
    const { results } = run(['joshua', 'Is this a game, or is it real?']);
    expect(linesOf(last(results))).toEqual(["WHAT'S THE DIFFERENCE?"]);
  });
});

describe('tic-tac-toe against the human', () => {
  it('asks for the number of players', () => {
    const { state, results } = run(['joshua', 'tic-tac-toe']);
    expect(linesOf(last(results))).toEqual(['NUMBER OF PLAYERS:']);
    expect(state.pending.kind).toBe('players');
  });

  it('plays a legal game to the end and never loses', () => {
    let { state } = run(['joshua', 'play tic tac toe', '1']);
    expect(state.pending.kind).toBe('ttt');
    let final: JoshuaResult | undefined;
    // The human always picks the lowest free square; the game must end within five human moves.
    for (let turn = 0; turn < 5 && state.pending.kind === 'ttt'; turn += 1) {
      const before = boardOf(state);
      const square = before.findIndex((c) => c === null) + 1;
      const step = joshuaRespond(state, String(square));
      state = step.state;
      final = step.result;
      const after = as(step.result, 'board').board;
      // Each turn adds exactly one X and at most one O, without overwriting anything.
      const added = after.filter((c, i) => c !== before[i]);
      expect(added.filter((c) => c === 'X')).toHaveLength(1);
      expect(added.filter((c) => c === 'O').length).toBeLessThanOrEqual(1);
      const kept = before.map((c, i) => (c === null ? null : after[i]));
      expect(kept).toEqual(before);
    }
    const ended = as(final, 'board');
    expect(ended.outcome).not.toBeNull();
    expect(ended.outcome).not.toBe('X');
    expect(outcome(ended.board)).toBe(ended.outcome);
    expect(state.pending.kind).toBe('none');
  });

  it('rejects an occupied square without changing the board', () => {
    const first = run(['joshua', 'tic-tac-toe', '1', '5']);
    const board = boardOf(first.state);
    const occupied = board.findIndex((c) => c !== null) + 1;
    const step = joshuaRespond(first.state, String(occupied));
    expect(step.result.kind).toBe('reply');
    expect(linesOf(step.result)[0]).toBe('ILLEGAL MOVE.');
    expect(step.state.pending).toEqual(first.state.pending);
  });

  it.each(['0', '10', 'banana'])('rejects %s as a move', (input) => {
    const { state } = run(['joshua', 'tic-tac-toe', '1']);
    const step = joshuaRespond(state, input);
    expect(linesOf(step.result)[0]).toBe('ILLEGAL MOVE.');
  });

  it('lets the user abandon the game', () => {
    const { state, results } = run(['joshua', 'tic-tac-toe', '1', 'quit']);
    expect(state.pending.kind).toBe('none');
    expect(last(results).kind).toBe('reply');
  });
});

describe('the lesson (zero players)', () => {
  it('plays itself to a draw every time, then concludes and offers chess', () => {
    const { state, results } = run(['joshua', 'tic-tac-toe', 'zero']);
    const result = as(last(results), 'lesson');
    expect(result.games).toHaveLength(SELF_PLAY_GAMES);
    for (const game of result.games) {
      expect(game.winner).toBeNull();
      expect(new Set(game.moves).size).toBe(9);
    }
    expect(result.conclusion).toEqual([
      'GREETINGS, PROFESSOR FALKEN.',
      'A STRANGE GAME.',
      'THE ONLY WINNING MOVE IS NOT TO PLAY.',
      'HOW ABOUT A NICE GAME OF CHESS?',
    ]);
    expect(result.lines.slice(-4)).toEqual(result.conclusion);
    expect(result.lines.filter((l) => l.includes('WINNER: NONE')).length).toBeGreaterThan(SELF_PLAY_GAMES);
    expect(state.learnedFutility).toBe(true);
  });

  it('accepts 0 and NONE as zero players', () => {
    expect(last(run(['joshua', 'tic-tac-toe', '0']).results).kind).toBe('lesson');
    expect(last(run(['joshua', 'tictactoe', 'none']).results).kind).toBe('lesson');
  });

  it('never states the conclusion before the lesson', () => {
    const inputs = ['joshua', 'list games', 'global thermonuclear war', 'no', '1', 'tic-tac-toe', '1', '5', 'quit'];
    const { results } = run(inputs);
    for (const result of results) expect(linesOf(result).join(' ')).not.toMatch(/ONLY WINNING MOVE/);
  });

  it('after the lesson, declines global thermonuclear war', () => {
    const { state, results } = run(['joshua', 'tic-tac-toe', '0', 'global thermonuclear war']);
    expect(linesOf(last(results))).toContain('THE ONLY WINNING MOVE IS NOT TO PLAY.');
    expect(state.pending.kind).toBe('none');
  });
});

describe('model hand-off', () => {
  it('sends open conversation to the model with a session tag', () => {
    const { results } = run(['joshua', 'How are you?']);
    const result = as(last(results), 'model');
    expect(result.flags).toEqual({ user: 'PROFESSOR FALKEN', learnedFutility: false, game: null, side: null });
    expect(result.modelMessage).toBe(`${joshuaSessionTag(result.flags)}\nHow are you?`);
    expect(joshuaSessionTag(result.flags)).toBe(
      '[SESSION: USER=PROFESSOR FALKEN; LESSON=NOT LEARNED; GAME=NONE; SIDE=NONE]',
    );
  });

  it('marks the lesson in the flags once learned', () => {
    const { results } = run(['joshua', 'tic-tac-toe', '0', 'what did you learn?']);
    const result = as(last(results), 'model');
    expect(result.flags.learnedFutility).toBe(true);
    expect(result.modelMessage).toMatch(/LESSON=LEARNED/);
  });

  it('uses a name the user gives instead of Professor Falken', () => {
    const { state, results } = run(['joshua', 'My name is David.']);
    expect(state.user).toBe('DAVID');
    expect(last(results)).toMatchObject({ kind: 'model', flags: { user: 'DAVID' } });
  });

  it('records other games from the list and hands them to the model', () => {
    const { state, results } = run(['joshua', 'chess']);
    expect(state.game).toBe('CHESS');
    expect(last(results)).toMatchObject({ kind: 'model', flags: { game: 'CHESS' } });
  });
});

describe('determinism', () => {
  it('gives identical results for the same seed and input', () => {
    const inputs = ['joshua', 'tic-tac-toe', '1', '5', '1', '9', '0'];
    expect(run(inputs, createJoshuaState(3))).toEqual(run(inputs, createJoshuaState(3)));
  });

  it('keeps all output upper case', () => {
    const inputs = ['joshua', 'list games', 'global thermonuclear war', 'no', '1', 'tic-tac-toe', '0'];
    for (const result of run(inputs).results) {
      for (const line of linesOf(result)) expect(line).toBe(line.toUpperCase());
    }
  });
});
