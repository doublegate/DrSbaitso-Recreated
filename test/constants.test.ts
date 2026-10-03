import { describe, it, expect } from 'vitest';
import { CHARACTERS, VOICE_PROFILES, voiceProcessingFor } from '@/constants';

const byId = (id: string) => CHARACTERS.find((c) => c.id === id)!;

describe('persona voices (ref-docs/05, 06, 09)', () => {
  it('gives every persona its own voice, style, casing and processing route', () => {
    expect(CHARACTERS.map((c) => [c.id, c.voiceName, c.ttsCase, c.processing])).toEqual([
      ['sbaitso', 'Charon', 'upper', 'sbaitso'],
      ['eliza', 'Kore', 'sentence', 'clean'],
      ['hal9000', 'Alnilam', 'sentence', 'hal'],
      ['joshua', 'Iapetus', 'sentence', 'wopr'],
      ['parry', 'Orus', 'sentence', 'clean'],
    ]);
    for (const c of CHARACTERS) expect(c.voiceStyle.length).toBeGreaterThan(20);
  });

  it('directs HAL with the documented session direction (ref-docs/09 2.1), in qualities only', () => {
    const style = byId('hal9000').voiceStyle;
    for (const quality of ['mid-Atlantic', 'close to the microphone', 'sincere', 'concerned', 'never rise']) {
      expect(style).toContain(quality);
    }
  });

  it('keeps Dr. Sbaitso on the classic profile voice', () => {
    expect(byId('sbaitso').voiceName).toBe(VOICE_PROFILES.classic.voiceName);
  });

  it('never names a performer or film character in a style prompt', () => {
    for (const c of CHARACTERS) {
      expect(c.voiceStyle).not.toMatch(/HAL|Rain|John Wood|WOPR|Joshua|robot|computer/i);
    }
  });

  it('keeps the deprecated voicePrompt in step with voiceStyle', () => {
    for (const c of CHARACTERS) expect(c.voicePrompt).toBe(`Say in ${c.voiceStyle}`);
  });

  it('routes custom and unknown characters through the Sbaitso chain, as before', () => {
    expect(voiceProcessingFor('hal9000')).toBe('hal');
    expect(voiceProcessingFor('joshua')).toBe('wopr');
    expect(voiceProcessingFor('eliza')).toBe('clean');
    expect(voiceProcessingFor('custom_robo')).toBe('sbaitso');
  });
});
