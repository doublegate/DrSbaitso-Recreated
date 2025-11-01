/**
 * React Hook for Sound Effects (v1.9.0)
 *
 * Provides easy integration of retro sound effects into components
 */

import { useEffect, useRef, useCallback } from 'react';
import { getSoundManager, SoundEventType, SoundSettings } from '../utils/soundEffects';

export interface UseSoundEffectsReturn {
  playSound: (eventType: SoundEventType, volume?: number) => Promise<void>;
  startAmbience: () => Promise<void>;
  stopAmbience: () => void;
  updateSettings: (settings: Partial<SoundSettings>) => void;
  getSettings: () => SoundSettings;
  initialized: boolean;
}

export function useSoundEffects(): UseSoundEffectsReturn {
  const soundManager = useRef(getSoundManager());
  const initialized = useRef(false);

  // Initialize on first user interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (!initialized.current) {
        await soundManager.current.initialize();
        initialized.current = true;
      }
    };

    // Listen for first user interaction
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const playSound = useCallback(async (eventType: SoundEventType, volume: number = 1) => {
    await soundManager.current.playSound(eventType, volume);
  }, []);

  const startAmbience = useCallback(async () => {
    await soundManager.current.startAmbience();
  }, []);

  const stopAmbience = useCallback(() => {
    soundManager.current.stopAmbience();
  }, []);

  const updateSettings = useCallback((settings: Partial<SoundSettings>) => {
    soundManager.current.updateSettings(settings);
    soundManager.current.saveSettings();
  }, []);

  const getSettings = useCallback(() => {
    return soundManager.current.getSettings();
  }, []);

  return {
    playSound,
    startAmbience,
    stopAmbience,
    updateSettings,
    getSettings,
    initialized: initialized.current,
  };
}
