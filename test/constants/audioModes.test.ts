import { describe, it, expect } from 'vitest';
import { AUDIO_MODES } from '@/constants';
import { AuthenticityLevel, getAuthenticitySpecs } from '@/utils/vintageAudioProcessing';

const LEVEL: Record<string, AuthenticityLevel> = {
  modern: AuthenticityLevel.Modern,
  subtle: AuthenticityLevel.SubtleVintage,
  authentic: AuthenticityLevel.Authentic,
  ultra: AuthenticityLevel.UltraAuthentic,
};

describe('AUDIO_MODES labels', () => {
  it.each(AUDIO_MODES.map((m) => [m.id, m] as const))('%s states the specs the chain really uses', (id, mode) => {
    expect(mode.technicalSpecs).toBe(getAuthenticitySpecs(LEVEL[id]));
  });

  it('dates the original correctly (1990-1992, not 1991)', () => {
    for (const mode of AUDIO_MODES) {
      expect(`${mode.name} ${mode.description} ${mode.details}`).not.toMatch(/1991/);
    }
  });

  it('promises no artifacts the chain removed', () => {
    for (const mode of AUDIO_MODES) {
      expect(`${mode.description} ${mode.details}`).not.toMatch(/aliasing|artifact/i);
    }
  });
});
