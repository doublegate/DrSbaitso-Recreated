/**
 * The active persona in Enhanced mode: one of the five built-ins or a custom
 * character, persisted across visits. Resolves the options the Gemini proxy
 * needs (built-ins are resolved server-side by id; custom characters send
 * their own instruction and voice prompt).
 */
import { useState } from 'react';
import {
  CHARACTERS,
  DEFAULT_CHARACTER,
  DEFAULT_VOICE_PROFILE,
  VOICE_PROFILES,
  voiceProcessingFor,
  type VoiceProcessing,
  type VoiceProfileId,
} from '../constants';
import type { CustomCharacter } from '../types';

export const PERSONA_KEY = 'sbaitso_persona';
export const CUSTOM_CHARACTERS_KEY = 'customCharacters';
/** Same key as the Google AI Studio version of the app, so a choice made there carries over. */
export const VOICE_PROFILE_KEY = 'drSbaitsoVoice';

function loadVoiceProfile(): VoiceProfileId {
  try {
    const stored = localStorage.getItem(VOICE_PROFILE_KEY);
    return stored !== null && Object.hasOwn(VOICE_PROFILES, stored)
      ? (stored as VoiceProfileId)
      : DEFAULT_VOICE_PROFILE;
  } catch {
    return DEFAULT_VOICE_PROFILE;
  }
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
}

function loadCustomCharacters(): CustomCharacter[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CUSTOM_CHARACTERS_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is CustomCharacter =>
        typeof c === 'object' &&
        c !== null &&
        typeof (c as CustomCharacter).id === 'string' &&
        typeof (c as CustomCharacter).name === 'string' &&
        typeof (c as CustomCharacter).systemInstruction === 'string',
    );
  } catch {
    return [];
  }
}

function storeCustomCharacters(characters: CustomCharacter[]) {
  try {
    localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(characters));
  } catch {
    // Storage full or unavailable; the change lasts for this page only.
  }
}

export function usePersona() {
  const [customCharacters, setCustomCharacters] = useState<CustomCharacter[]>(loadCustomCharacters);
  const [personaId, setPersonaId] = useState<string>(() => {
    try {
      return localStorage.getItem(PERSONA_KEY) ?? DEFAULT_CHARACTER;
    } catch {
      return DEFAULT_CHARACTER;
    }
  });

  const [voiceProfile, setVoiceProfileState] = useState<VoiceProfileId>(loadVoiceProfile);
  const setVoiceProfile = (id: VoiceProfileId) => {
    setVoiceProfileState(id);
    try {
      localStorage.setItem(VOICE_PROFILE_KEY, id);
    } catch {
      // Storage unavailable: the choice lasts for this page only.
    }
  };

  const personas: Persona[] = [
    ...CHARACTERS.map((c) => ({ id: c.id, name: c.name, description: c.description, isCustom: false })),
    ...customCharacters.map((c) => ({ id: c.id, name: c.name, description: c.description, isCustom: true })),
  ];

  const persona = personas.find((p) => p.id === personaId) ?? personas[0];
  const custom = persona.isCustom ? customCharacters.find((c) => c.id === persona.id) : undefined;

  const selectPersona = (id: string) => {
    if (!personas.some((p) => p.id === id)) return;
    setPersonaId(id);
    try {
      localStorage.setItem(PERSONA_KEY, id);
    } catch {
      // Not persisted; selection still applies now.
    }
  };

  const saveCustomCharacter = (character: CustomCharacter) => {
    const next = [...customCharacters.filter((c) => c.id !== character.id), character];
    setCustomCharacters(next);
    storeCustomCharacters(next);
  };

  const deleteCustomCharacter = (id: string) => {
    const next = customCharacters.filter((c) => c.id !== id);
    setCustomCharacters(next);
    storeCustomCharacters(next);
    if (personaId === id) setPersonaId(DEFAULT_CHARACTER);
  };

  const chatOptions = custom
    ? { customCharacter: { name: custom.name, systemInstruction: custom.systemInstruction } }
    : {};
  // Voice profiles are Dr. Sbaitso's only (the server ignores them for other personas).
  const voiceProfileApplies = persona.id === 'sbaitso';
  const speechOptions = custom
    ? { voicePrompt: custom.voicePrompt }
    : voiceProfileApplies && voiceProfile !== DEFAULT_VOICE_PROFILE
      ? { voiceProfile }
      : {};
  /** Playback processing route: pass to useSpeechPlayer's speak(). Custom characters keep the Sbaitso chain. */
  const voiceProcessing: VoiceProcessing = custom ? 'sbaitso' : voiceProcessingFor(persona.id);

  /** A custom character's glitch lines, used now and then after a reply (none for built-ins). */
  const glitchMessages = custom?.glitchMessages ?? [];

  /** Applies a custom character's chosen letter case to a reply. */
  const formatReply = (text: string) => {
    if (custom?.responseStyle === 'uppercase') return text.toUpperCase();
    if (custom?.responseStyle === 'lowercase') return text.toLowerCase();
    return text;
  };

  return {
    persona,
    personas,
    customCharacters,
    selectPersona,
    saveCustomCharacter,
    deleteCustomCharacter,
    chatOptions,
    speechOptions,
    voiceProcessing,
    voiceProfile,
    setVoiceProfile,
    voiceProfileApplies,
    glitchMessages,
    formatReply,
  };
}
