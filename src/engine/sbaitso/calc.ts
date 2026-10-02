/**
 * CALC: a small arithmetic evaluator. A hand-written tokenizer and
 * recursive-descent parser; no `eval`, no `Function`.
 *
 * The original's strings are CONFIRMED (the phrase "<a> divided by <b> equals
 * to <c>" and the two error messages). Its exact grammar is not: one level of
 * brackets and the four operations are LIKELY. The printed format is CONFIRMED
 * (DOSBox): `CALC 2+3` prints ` =  5`, `WHAT IS 12*4` prints `12*4 =  48`,
 * unlabeled unless `.PROMPT ON` is set.
 */

/** Label in front of every reply, CALC included, while `.PROMPT ON` is set. */
export const CALC_LABEL = 'Computer: ';

export const CALC_ERRORS = {
  brackets: 'Cannot compute, brackets are too complex for me.',
  bug: "Doesn't compute, I think there is a bug in your equation.",
} as const;

export type CalcOutcome = { ok: true; value: number; text: string } | { ok: false; error: keyof typeof CALC_ERRORS };

type Op = '+' | '-' | '*' | '/';
type Token =
  { type: 'num'; value: number; raw: string } | { type: 'op'; op: Op } | { type: 'lparen' } | { type: 'rparen' };

/** Deepest bracket nesting the original copes with (LIKELY). */
const MAX_BRACKET_DEPTH = 1;

const OP_WORDS: Record<Op, string> = { '+': 'plus', '-': 'minus', '*': 'times', '/': 'divided by' };

/** Spoken operators, longest first so "DIVIDED BY" wins over a bare "BY". */
const WORD_OPS: ReadonlyArray<[RegExp, Op]> = [
  [/^DIVIDED\s+BY\b/, '/'],
  [/^MULTIPLIED\s+BY\b/, '*'],
  [/^PLUS\b/, '+'],
  [/^MINUS\b/, '-'],
  [/^TIMES\b/, '*'],
  [/^OVER\b/, '/'],
  [/^X\b/, '*'],
];

/** Split an expression into tokens, or return null if it has anything else in it. */
function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  // Trailing question marks and full stops are punctuation, not maths.
  let rest = input
    .toUpperCase()
    .trim()
    .replace(/[?!=]+$/, '')
    .replace(/\.+$/, '')
    .trim();
  while (rest.length > 0) {
    const number = /^(\d+(?:\.\d+)?|\.\d+)/.exec(rest);
    if (number) {
      tokens.push({ type: 'num', value: Number(number[1]), raw: number[1] });
      rest = rest.slice(number[1].length).trimStart();
      continue;
    }
    const ch = rest[0];
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', op: ch });
    } else if (ch === '(') {
      tokens.push({ type: 'lparen' });
    } else if (ch === ')') {
      tokens.push({ type: 'rparen' });
    } else {
      const word = WORD_OPS.find(([pattern]) => pattern.test(rest));
      if (!word) return null;
      const matched = word[0].exec(rest);
      tokens.push({ type: 'op', op: word[1] });
      rest = rest.slice(matched ? matched[0].length : 1).trimStart();
      continue;
    }
    rest = rest.slice(1).trimStart();
  }
  return tokens;
}

/**
 * True when `expr` reads as arithmetic: only numbers, operators and brackets,
 * at least one number and at least one binary operator. Used to route
 * "WHAT IS 2 + 2" to CALC and "WHAT IS LOVE" to the conversation.
 */
export function looksArithmetic(expr: string): boolean {
  const tokens = tokenize(expr);
  if (!tokens || tokens.length < 3) return false;
  return tokens.some((t) => t.type === 'num') && tokens.some((t) => t.type === 'op');
}

class CalcError extends Error {
  constructor(readonly code: keyof typeof CALC_ERRORS) {
    super(code);
  }
}

/** Recursive descent over the token list: expr := term (+|- term)*; term := factor (*|/ factor)*. */
function parse(tokens: Token[]): number {
  let pos = 0;
  let depth = 0;

  const peek = (): Token | undefined => tokens[pos];

  const factor = (): number => {
    const token = tokens[pos++];
    if (!token) throw new CalcError('bug');
    if (token.type === 'num') return token.value;
    if (token.type === 'op' && (token.op === '-' || token.op === '+')) {
      const value = factor();
      return token.op === '-' ? -value : value;
    }
    if (token.type === 'lparen') {
      depth++;
      if (depth > MAX_BRACKET_DEPTH) throw new CalcError('brackets');
      const value = expr();
      if (peek()?.type !== 'rparen') throw new CalcError('bug');
      pos++;
      depth--;
      return value;
    }
    throw new CalcError('bug');
  };

  const term = (): number => {
    let value = factor();
    for (let next = peek(); next?.type === 'op' && (next.op === '*' || next.op === '/'); next = peek()) {
      pos++;
      const right = factor();
      if (next.op === '/') {
        if (right === 0) throw new CalcError('bug');
        value /= right;
      } else {
        value *= right;
      }
    }
    return value;
  };

  const expr = (): number => {
    let value = term();
    for (let next = peek(); next?.type === 'op' && (next.op === '+' || next.op === '-'); next = peek()) {
      pos++;
      const right = term();
      value = next.op === '+' ? value + right : value - right;
    }
    return value;
  };

  const value = expr();
  if (pos !== tokens.length) throw new CalcError('bug');
  if (!Number.isFinite(value)) throw new CalcError('bug');
  return value;
}

/** Integers as-is; fractions to at most six decimal places, trailing zeros removed. */
function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

/** The expression in words, as the original phrased division: "6 divided by 3". */
function describe(tokens: Token[]): string {
  const parts: string[] = [];
  let negate = false;
  tokens.forEach((token, i) => {
    const prev = tokens[i - 1];
    const unary = token.type === 'op' && (!prev || prev.type === 'op' || prev.type === 'lparen');
    if (token.type === 'op' && unary) {
      // A unary sign is glued onto its number ("-2"), not read as "minus 2".
      if (token.op === '-') negate = !negate;
      return;
    }
    if (token.type === 'num') {
      parts.push((negate ? '-' : '') + token.raw);
    } else {
      if (negate) parts.push('minus');
      parts.push(token.type === 'op' ? OP_WORDS[token.op] : token.type === 'lparen' ? '(' : ')');
    }
    negate = false;
  });
  return parts.join(' ');
}

/** Evaluate `expr`. Errors use the original's two failure messages. */
export function evaluateArithmetic(expr: string): CalcOutcome {
  const tokens = tokenize(expr);
  if (!tokens || tokens.length === 0) return { ok: false, error: 'bug' };
  try {
    const value = parse(tokens);
    return { ok: true, value, text: `${describe(tokens)} equals to ${formatNumber(value)}` };
  } catch (error) {
    if (error instanceof CalcError) return { ok: false, error: error.code };
    throw error;
  }
}

/**
 * A value as the original printed it after `=`: a leading space for a
 * positive number, the minus sign in its place for a negative one (the BASIC
 * STR$ convention, which the observed ` =  5` matches; the negative form is
 * LIKELY).
 */
function printedValue(value: number): string {
  return value < 0 ? `-${formatNumber(-value)}` : ` ${formatNumber(value)}`;
}

/** Remove trailing punctuation the user typed after an expression ("12*4?"). */
const cleanExpression = (expr: string): string => expr.trim().replace(/[?!=.\s]+$/, '');

/**
 * CALC output. Printed as ` =  <value>`, or `<expression> =  <value>` when
 * `echo` is set (the WHAT IS route); spoken in words. Errors are printed and
 * spoken as the original's message.
 */
export function calcReply(expr: string, options: { echo?: boolean } = {}): { lines: string[]; speak: string[] } {
  const outcome = evaluateArithmetic(expr);
  if (!outcome.ok) {
    const message = CALC_ERRORS[outcome.error];
    return { lines: [message], speak: [message] };
  }
  const prefix = options.echo ? cleanExpression(expr) : '';
  return { lines: [`${prefix} = ${printedValue(outcome.value)}`], speak: [outcome.text] };
}
