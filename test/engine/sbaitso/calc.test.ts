import { describe, it, expect } from 'vitest';
import { evaluateArithmetic, looksArithmetic, calcReply, CALC_ERRORS } from '@/engine/sbaitso';

describe('looksArithmetic', () => {
  it.each(['2+2', '3 * 4', '(1 + 2) / 3', '10 divided by 4', '7 PLUS 8?', '-3 - 4', '6 x 7', '1.5 times 2'])(
    'accepts %s',
    (expr) => {
      expect(looksArithmetic(expr)).toBe(true);
    },
  );

  it.each(['', 'love', 'the meaning of life', '42', 'my 2 cats', '+', 'what'])('rejects %s', (expr) => {
    expect(looksArithmetic(expr)).toBe(false);
  });
});

describe('evaluateArithmetic', () => {
  it('respects precedence', () => {
    expect(evaluateArithmetic('2 + 3 * 4')).toMatchObject({ ok: true, value: 14 });
  });

  it('handles one level of brackets', () => {
    expect(evaluateArithmetic('(2 + 3) * 4')).toMatchObject({ ok: true, value: 20 });
  });

  it('handles unary minus and decimals', () => {
    expect(evaluateArithmetic('-1.5 * -2')).toMatchObject({ ok: true, value: 3 });
    expect(evaluateArithmetic('.5 + .25')).toMatchObject({ ok: true, value: 0.75 });
  });

  it('understands spoken operators', () => {
    expect(evaluateArithmetic('9 MULTIPLIED BY 3')).toMatchObject({ ok: true, value: 27 });
    expect(evaluateArithmetic('9 minus 3 over 3')).toMatchObject({ ok: true, value: 8 });
  });

  it('refuses nested brackets as too complex', () => {
    expect(evaluateArithmetic('((1 + 2) * 3)')).toEqual({ ok: false, error: 'brackets' });
  });

  it.each(['1 +', '(1 + 2', '1 + 2)', '1 / 0', '2 $ 3', '1 2', '()'])('reports a bug in %s', (expr) => {
    expect(evaluateArithmetic(expr)).toEqual({ ok: false, error: 'bug' });
  });
});

describe('calcReply', () => {
  it('phrases division the way the original did', () => {
    expect(calcReply('6 / 3')).toEqual({
      lines: ['Computer: 6 divided by 3 equals to 2'],
      speak: ['6 divided by 3 equals to 2'],
    });
  });

  it('spells every operator as a word', () => {
    expect(calcReply('(2+3)*4-1').lines[0]).toBe('Computer: ( 2 plus 3 ) times 4 minus 1 equals to 19');
  });

  it('rounds long fractions', () => {
    expect(calcReply('1/3').lines[0]).toBe('Computer: 1 divided by 3 equals to 0.333333');
  });

  it('uses the original error text', () => {
    expect(calcReply('((1))').lines[0]).toBe(`Computer: ${CALC_ERRORS.brackets}`);
    expect(calcReply('1/0').lines[0]).toBe(`Computer: ${CALC_ERRORS.bug}`);
    expect(CALC_ERRORS.brackets).toBe('Cannot compute, brackets are too complex for me.');
    expect(CALC_ERRORS.bug).toBe("Doesn't compute, I think there is a bug in your equation.");
  });
});
