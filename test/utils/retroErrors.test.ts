import { describe, it, expect } from 'vitest';
import { retroErrorMessage } from '@/utils/retroErrors';
import { GeminiServiceError } from '@/services/geminiService';

const err = (code: ConstructorParameters<typeof GeminiServiceError>[1]) => new GeminiServiceError('x', code, 0);

describe('retroErrorMessage', () => {
  it('tells the user to wait when rate limited', () => {
    expect(retroErrorMessage(err('RATE_LIMITED'))).toMatch(/WAIT/);
  });

  it('reports a busy processor when the model is overloaded', () => {
    expect(retroErrorMessage(err('UNAVAILABLE'))).toMatch(/BUSY/);
  });

  it('reports a lost carrier on network failure', () => {
    expect(retroErrorMessage(err('NETWORK_ERROR'))).toMatch(/CARRIER/);
  });

  it('says the system is not configured when the server has no key', () => {
    expect(retroErrorMessage(err('NOT_CONFIGURED'))).toMatch(/NOT CONFIGURED/);
  });

  it('falls back to a period-appropriate generic fault, all caps', () => {
    for (const e of [err('UPSTREAM_ERROR'), new Error('boom'), 'weird']) {
      const msg = retroErrorMessage(e, () => 0);
      expect(msg).toBe(msg.toUpperCase());
      expect(msg.length).toBeGreaterThan(10);
    }
  });
});
