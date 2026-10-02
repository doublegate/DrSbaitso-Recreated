import { describe, it, expect } from 'vitest';
import {
  EMPTY_BOARD,
  bestMoves,
  legalMoves,
  outcome,
  play,
  renderBoard,
  selfPlay,
  winner,
  type Board,
} from '@/engine/joshua';

/** Build a board from a 9-character string: X, O or '.' for empty. */
const board = (cells: string): Board => [...cells].map((c) => (c === '.' ? null : (c as 'X' | 'O')));

describe('tic-tac-toe rules', () => {
  it('detects every line', () => {
    expect(winner(board('XXX......'))).toBe('X');
    expect(winner(board('...OOO...'))).toBe('O');
    expect(winner(board('X..X..X..'))).toBe('X');
    expect(winner(board('..O.O.O..'))).toBe('O');
    expect(winner(board('X...X...X'))).toBe('X');
    expect(winner(board('XOXXOOOXX'))).toBeNull();
  });

  it('reports a draw only on a full board with no line', () => {
    expect(outcome(board('XOXXOOOXX'))).toBe('draw');
    expect(outcome(board('XOX......'))).toBeNull();
    expect(outcome(board('OOOXX.X..'))).toBe('O');
  });

  it('lists the empty squares as legal moves', () => {
    expect(legalMoves(board('X.O.X.O..'))).toEqual([1, 3, 5, 7, 8]);
    expect(legalMoves(EMPTY_BOARD)).toHaveLength(9);
  });

  it('refuses illegal moves', () => {
    const b = board('X........');
    expect(play(b, 0, 'O')).toBeNull();
    expect(play(b, 9, 'O')).toBeNull();
    expect(play(b, -1, 'O')).toBeNull();
    expect(play(b, 1.5, 'O')).toBeNull();
    expect(play(board('XXX......'), 4, 'O')).toBeNull(); // game already over
  });

  it('never mutates the board it is given', () => {
    const b = board('X........');
    const next = play(b, 4, 'O');
    expect(next).not.toBeNull();
    expect(b[4]).toBeNull();
    expect(next?.[4]).toBe('O');
  });
});

describe('minimax', () => {
  it('takes an immediate win', () => {
    // O to move can win on square 2 (top right).
    expect(bestMoves(board('OO.XX.X..'), 'O')).toEqual([2]);
  });

  it('blocks an immediate loss', () => {
    // X threatens 0-1-2; O must block 2.
    expect(bestMoves(board('XX..O....'), 'O')).toEqual([2]);
  });

  it('only returns legal moves', () => {
    const b = board('XO.......');
    for (const move of bestMoves(b, 'X')) expect(b[move]).toBeNull();
  });

  it('never loses against any sequence of human moves', () => {
    // Exhaustive: X (human) tries every move at every turn, O plays any best move.
    const endings: string[] = [];
    const explore = (b: Board): void => {
      const result = outcome(b);
      if (result !== null) {
        endings.push(result);
        return;
      }
      for (const move of legalMoves(b)) {
        const afterX = play(b, move, 'X')!;
        if (outcome(afterX) !== null) {
          explore(afterX);
          continue;
        }
        for (const reply of bestMoves(afterX, 'O')) explore(play(afterX, reply, 'O')!);
      }
    };
    explore(EMPTY_BOARD);
    expect(endings.length).toBeGreaterThan(100);
    expect(endings).not.toContain('X');
    expect(endings).toContain('O');
  });
});

describe('selfPlay', () => {
  it('always ends in a draw under perfect play', () => {
    let seed = 1;
    for (let i = 0; i < 25; i += 1) {
      const game = selfPlay(seed);
      seed = game.seed;
      expect(game.winner).toBeNull();
      expect(game.moves).toHaveLength(9);
      expect(new Set(game.moves).size).toBe(9);
    }
  });

  it('is deterministic for a seed and varies across seeds', () => {
    expect(selfPlay(42)).toEqual(selfPlay(42));
    const openings = new Set(Array.from({ length: 20 }, (_, i) => selfPlay(i + 1).moves.join('')));
    expect(openings.size).toBeGreaterThan(1);
  });
});

describe('renderBoard', () => {
  it('draws marks and numbers the empty squares', () => {
    expect(renderBoard(board('X...O...X'))).toEqual([
      ' X | 2 | 3 ',
      '---+---+---',
      ' 4 | O | 6 ',
      '---+---+---',
      ' 7 | 8 | X ',
    ]);
  });
});
