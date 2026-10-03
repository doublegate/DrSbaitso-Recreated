import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersona, PERSONA_KEY, CUSTOM_CHARACTERS_KEY, VOICE_PROFILE_KEY } from '@/hooks/usePersona';
import type { CustomCharacter } from '@/types';

const robo: CustomCharacter = {
  id: 'custom_robo',
  name: 'ROBO',
  description: 'A test robot',
  era: 1985,
  knowledgeCutoff: 1985,
  systemInstruction: 'You are ROBO.',
  voicePrompt: 'Say in a squeaky robot voice',
  responseStyle: 'lowercase',
  personalityTraits: [],
  glitchMessages: [],
  isCustom: true,
  createdAt: 1,
  usageCount: 0,
};

describe('usePersona', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to Dr. Sbaitso and lists the five built-in personas', () => {
    const { result } = renderHook(() => usePersona());
    expect(result.current.persona.id).toBe('sbaitso');
    expect(result.current.personas.map((p) => p.id)).toEqual(['sbaitso', 'eliza', 'hal9000', 'joshua', 'parry']);
  });

  it('switches persona and remembers the choice', () => {
    const { result } = renderHook(() => usePersona());
    act(() => result.current.selectPersona('hal9000'));
    expect(result.current.persona.name).toBe('HAL 9000');
    expect(localStorage.getItem(PERSONA_KEY)).toBe('hal9000');
    expect(renderHook(() => usePersona()).result.current.persona.id).toBe('hal9000');
  });

  it('ignores unknown ids and falls back from a deleted custom character', () => {
    localStorage.setItem(PERSONA_KEY, 'custom_gone');
    const { result } = renderHook(() => usePersona());
    expect(result.current.persona.id).toBe('sbaitso');
    act(() => result.current.selectPersona('nope'));
    expect(result.current.persona.id).toBe('sbaitso');
  });

  it('includes saved custom characters and routes them as custom requests', () => {
    localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify([robo]));
    const { result } = renderHook(() => usePersona());
    act(() => result.current.selectPersona('custom_robo'));
    expect(result.current.persona.isCustom).toBe(true);
    expect(result.current.chatOptions).toEqual({
      customCharacter: { name: 'ROBO', systemInstruction: 'You are ROBO.' },
    });
    expect(result.current.speechOptions).toEqual({ voicePrompt: 'Say in a squeaky robot voice' });
    expect(result.current.formatReply('Hello There')).toBe('hello there');
  });

  it('exposes the processing route of the active persona', () => {
    localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify([robo]));
    const { result } = renderHook(() => usePersona());
    expect(result.current.voiceProcessing).toBe('sbaitso');
    act(() => result.current.selectPersona('hal9000'));
    expect(result.current.voiceProcessing).toBe('hal');
    act(() => result.current.selectPersona('joshua'));
    expect(result.current.voiceProcessing).toBe('wopr');
    act(() => result.current.selectPersona('parry'));
    expect(result.current.voiceProcessing).toBe('clean');
    act(() => result.current.selectPersona('custom_robo'));
    expect(result.current.voiceProcessing).toBe('sbaitso');
  });

  it('built-in personas need no extra options', () => {
    const { result } = renderHook(() => usePersona());
    expect(result.current.chatOptions).toEqual({});
    expect(result.current.speechOptions).toEqual({});
    expect(result.current.formatReply('Why?')).toBe('Why?');
  });

  it('saves and deletes custom characters', () => {
    const { result } = renderHook(() => usePersona());
    act(() => result.current.saveCustomCharacter(robo));
    expect(JSON.parse(localStorage.getItem(CUSTOM_CHARACTERS_KEY)!)).toHaveLength(1);
    act(() => result.current.selectPersona('custom_robo'));
    act(() => result.current.deleteCustomCharacter('custom_robo'));
    expect(result.current.customCharacters).toEqual([]);
    expect(result.current.persona.id).toBe('sbaitso');
  });

  it('rejects malformed stored custom characters instead of crashing', () => {
    localStorage.setItem(CUSTOM_CHARACTERS_KEY, '{"not":"an array"}');
    const { result } = renderHook(() => usePersona());
    expect(result.current.customCharacters).toEqual([]);
  });

  describe('voice profile (ported from the AI Studio version)', () => {
    it('defaults to the classic voice and sends no profile', () => {
      const { result } = renderHook(() => usePersona());
      expect(result.current.voiceProfile).toBe('classic');
      expect(result.current.speechOptions).toEqual({});
    });

    it('sends the chosen profile for Dr. Sbaitso and remembers it', () => {
      const { result } = renderHook(() => usePersona());
      act(() => result.current.setVoiceProfile('deep'));
      expect(result.current.speechOptions).toEqual({ voiceProfile: 'deep' });
      expect(localStorage.getItem(VOICE_PROFILE_KEY)).toBe('deep');
      expect(renderHook(() => usePersona()).result.current.voiceProfile).toBe('deep');
    });

    it('applies to Dr. Sbaitso only', () => {
      const { result } = renderHook(() => usePersona());
      act(() => result.current.setVoiceProfile('glitchy'));
      act(() => result.current.selectPersona('hal9000'));
      expect(result.current.speechOptions).toEqual({});
      expect(result.current.voiceProfileApplies).toBe(false);
    });

    it('ignores an unknown stored profile', () => {
      localStorage.setItem(VOICE_PROFILE_KEY, 'robotic');
      expect(renderHook(() => usePersona()).result.current.voiceProfile).toBe('classic');
    });
  });

  it("exposes a custom character's glitch messages, and none for built-ins", () => {
    localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify([{ ...robo, glitchMessages: ['BUS ERROR'] }]));
    const { result } = renderHook(() => usePersona());
    expect(result.current.glitchMessages).toEqual([]);
    act(() => result.current.selectPersona('custom_robo'));
    expect(result.current.glitchMessages).toEqual(['BUS ERROR']);
  });
});
