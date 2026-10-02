/**
 * Tic-tac-toe for JOSHUA: rules, a perfect minimax player and self-play.
 *
 * Squares are indexed 0-8, row by row; the UI numbers them 1-9. X always moves
 * first. Everything here is pure; randomness comes from an explicit seed.
 */
import { nextRandom } from './random';

export type Mark = 'X' | 'O';
export type Cell = Mark | null;
/** Nine cells, row by row. */
export type Board = readonly Cell[];
/** `null` while the game is still running. */
export type Outcome = Mark | 'draw' | null;

export const EMPTY_BOARD: Board = Object.freeze(Array.from({ length: 9 }, () => null));

const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const other = (mark: Mark): Mark => (mark === 'X' ? 'O' : 'X');

export function winner(board: Board): Mark | null {
  for (const [a, b, c] of LINES) {
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) return mark;
  }
  return null;
}

export function outcome(board: Board): Outcome {
  const won = winner(board);
  if (won) return won;
  return board.every((cell) => cell !== null) ? 'draw' : null;
}

export function legalMoves(board: Board): number[] {
  if (outcome(board) !== null) return [];
  const moves: number[] = [];
  board.forEach((cell, index) => {
    if (cell === null) moves.push(index);
  });
  return moves;
}

/** The board after `mark` takes `square`, or `null` if the move is illegal. */
export function play(board: Board, square: number, mark: Mark): Board | null {
  if (!Number.isInteger(square) || square < 0 || square > 8) return null;
  if (board[square] !== null || outcome(board) !== null) return null;
  const next = [...board];
  next[square] = mark;
  return next;
}

// ---------------------------------------------------------------------------
// Minimax

/**
 * Value of `board` for the side to move: positive is a win, negative a loss,
 * 0 a draw. Faster wins score higher (the number of empty squares left), so the
 * player takes a win at once instead of dawdling. Memoised: there are only a
 * few thousand reachable positions.
 */
const memo = new Map<string, number>();

function score(board: Board, toMove: Mark): number {
  const key = board.map((c) => c ?? '.').join('') + toMove;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const empties = board.filter((c) => c === null).length;
  let value: number;
  if (winner(board)) {
    value = -(empties + 1); // the previous mover won
  } else if (empties === 0) {
    value = 0;
  } else {
    value = -Infinity;
    for (const move of legalMoves(board)) {
      value = Math.max(value, -score(play(board, move, toMove)!, other(toMove)));
    }
  }
  memo.set(key, value);
  return value;
}

/** Every move that is optimal for `mark`, in square order. Empty if the game is over. */
export function bestMoves(board: Board, mark: Mark): number[] {
  const moves = legalMoves(board);
  if (moves.length === 0) return [];
  const values = moves.map((move) => -score(play(board, move, mark)!, other(mark)));
  const best = Math.max(...values);
  return moves.filter((_, i) => values[i] === best);
}

/** One optimal move, chosen among the equals with the seed. Returns the next seed. */
export function chooseMove(board: Board, mark: Mark, seed: number): { move: number; seed: number } | null {
  const moves = bestMoves(board, mark);
  if (moves.length === 0) return null;
  const [r, nextSeed] = nextRandom(seed);
  return { move: moves[Math.floor(r * moves.length)], seed: nextSeed };
}

// ---------------------------------------------------------------------------
// Self-play

export interface SelfPlayGame {
  /** Squares (0-8) in the order they were taken; X moved first. */
  moves: number[];
  winner: Mark | null;
  /** The seed after the game, for the next one. */
  seed: number;
}

/** JOSHUA plays both sides perfectly. Always a draw; the seed only varies the path. */
export function selfPlay(seed: number): SelfPlayGame {
  let board = EMPTY_BOARD;
  let mark: Mark = 'X';
  let current = seed;
  const moves: number[] = [];
  while (outcome(board) === null) {
    const choice = chooseMove(board, mark, current)!;
    current = choice.seed;
    board = play(board, choice.move, mark)!;
    moves.push(choice.move);
    mark = other(mark);
  }
  return { moves, winner: winner(board), seed: current };
}

/** Five text rows; empty squares show their number (1-9) so the user knows what to type. */
export function renderBoard(board: Board): string[] {
  const cell = (i: number): string => board[i] ?? String(i + 1);
  const row = (r: number): string => ` ${cell(r * 3)} | ${cell(r * 3 + 1)} | ${cell(r * 3 + 2)} `;
  const rule = '---+---+---';
  return [row(0), rule, row(1), rule, row(2)];
}
