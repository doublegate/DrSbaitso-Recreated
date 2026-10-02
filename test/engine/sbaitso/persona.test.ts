import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '@/constants';
import { retroErrorMessage } from '@/utils/retroErrors';
import { SessionManager } from '@/utils/sessionManager';
import { parityFlood } from '@/engine/sbaitso';
import type { ConversationSession } from '@/types';

const sbaitso = CHARACTERS.find((c) => c.id === 'sbaitso')!;

describe('Dr. Sbaitso persona prompt', () => {
  it('drops the catchphrases and glitches the original never had', () => {
    for (const invented of [
      'TELL ME MORE ABOUT YOUR PROBLEMS',
      'PLEASE ELABORATE',
      'PARITY CHECKING',
      'IRQ CONFLICT',
    ]) {
      expect(sbaitso.systemInstruction).not.toContain(invented);
    }
  });

  it('dates the program 1990-1992, not 1991', () => {
    expect(sbaitso.systemInstruction).not.toMatch(/1991/);
    expect(sbaitso.description).not.toMatch(/1991/);
    expect(sbaitso.systemInstruction).toMatch(/1992/);
  });

  it('teaches the documented register', () => {
    for (const line of ['WHY DO YOU FEEL THAT WAY?', 'I SEE, GO ON', "THAT'S NOT MY PROBLEM", 'C P U']) {
      expect(sbaitso.systemInstruction).toContain(line);
    }
  });

  it('leaves the parity error to the local engine', () => {
    expect(sbaitso.systemInstruction).toMatch(/Never:[\s\S]*print PARITY errors[^\n]*you never do/);
  });

  it('keeps the name the server-side check expects', () => {
    expect(sbaitso.systemInstruction).toContain('Dr. Sbaitso');
  });
});

describe('retroErrorMessage generic faults', () => {
  it('never uses the invented IRQ or parity-checking glitches', () => {
    for (let i = 0; i < 10; i++) {
      const msg = retroErrorMessage(new Error('boom'), () => i / 10);
      expect(msg).not.toMatch(/IRQ|PARITY CHECKING/);
    }
  });
});

describe('SessionManager.incrementGlitchCount', () => {
  const session = { glitchCount: 2 } as ConversationSession;

  it('counts the real parity flood', () => {
    expect(SessionManager.incrementGlitchCount(session, parityFlood(1).join('\n'))).toBe(3);
  });

  it('does not count invented glitch strings or ordinary replies', () => {
    expect(SessionManager.incrementGlitchCount(session, 'PARITY CHECKING...')).toBe(2);
    expect(SessionManager.incrementGlitchCount(session, 'WHY DO YOU FEEL THAT WAY?')).toBe(2);
  });
});
