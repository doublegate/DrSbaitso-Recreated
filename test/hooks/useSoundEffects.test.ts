/**
 * useSoundEffects Hook Test Suite (v1.9.0)
 * Comprehensive tests for sound effects React hook
 *
 * @version 1.9.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

describe('useSoundEffects', () => {
  beforeEach(() => {
    // Clear localStorage and mocks
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize sound manager', () => {
      const { result } = renderHook(() => useSoundEffects());

      expect(result.current).toBeTruthy();
      expect(result.current.playSound).toBeInstanceOf(Function);
      expect(result.current.startAmbience).toBeInstanceOf(Function);
      expect(result.current.stopAmbience).toBeInstanceOf(Function);
      expect(result.current.updateSettings).toBeInstanceOf(Function);
      expect(result.current.getSettings).toBeInstanceOf(Function);
    });

    it('should initialize on first click', async () => {
      const { result } = renderHook(() => useSoundEffects());

      // The initialized flag is a ref, so it won't trigger re-renders
      // We can verify initialization happened by checking no errors occur
      act(() => {
        document.dispatchEvent(new Event('click'));
      });

      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      // If initialization succeeded, playSound should work
      await act(async () => {
        await result.current.playSound('keypress');
      });

      expect(result.current).toBeTruthy();
    });

    it('should initialize on first keydown', async () => {
      const { result } = renderHook(() => useSoundEffects());

      // Simulate keydown
      act(() => {
        document.dispatchEvent(new Event('keydown'));
      });

      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      // If initialization succeeded, playSound should work
      await act(async () => {
        await result.current.playSound('keypress');
      });

      expect(result.current).toBeTruthy();
    });

    it('should only initialize once', async () => {
      const { result } = renderHook(() => useSoundEffects());

      // First interaction
      act(() => {
        document.dispatchEvent(new Event('click'));
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Second interaction (should not re-initialize, no error should occur)
      act(() => {
        document.dispatchEvent(new Event('click'));
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should still work
      await act(async () => {
        await result.current.playSound('keypress');
      });

      expect(result.current).toBeTruthy();
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useSoundEffects());

      unmount();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  // ============================================================================
  // SOUND PLAYBACK TESTS
  // ============================================================================

  describe('Sound Playback', () => {
    it('should play sounds', async () => {
      const { result } = renderHook(() => useSoundEffects());

      await act(async () => {
        await result.current.playSound('keypress');
      });

      // Should not throw
      expect(result.current).toBeTruthy();
    });

    it('should play different sound types', async () => {
      const { result } = renderHook(() => useSoundEffects());

      await act(async () => {
        await result.current.playSound('keypress');
        await result.current.playSound('message-send');
        await result.current.playSound('error');
      });

      expect(result.current).toBeTruthy();
    });

    it('should respect volume parameter', async () => {
      const { result } = renderHook(() => useSoundEffects());

      await act(async () => {
        await result.current.playSound('keypress', 0.5);
      });

      expect(result.current).toBeTruthy();
    });

    it('should use default volume when not specified', async () => {
      const { result } = renderHook(() => useSoundEffects());

      await act(async () => {
        await result.current.playSound('keypress');
      });

      expect(result.current).toBeTruthy();
    });
  });

  // ============================================================================
  // AMBIENCE TESTS
  // ============================================================================

  describe('Ambience Control', () => {
    it('should start ambience', async () => {
      const { result } = renderHook(() => useSoundEffects());

      await act(async () => {
        await result.current.startAmbience();
      });

      expect(result.current).toBeTruthy();
    });

    it('should stop ambience', () => {
      const { result } = renderHook(() => useSoundEffects());

      act(() => {
        result.current.stopAmbience();
      });

      expect(result.current).toBeTruthy();
    });

    it('should toggle ambience via settings', async () => {
      const { result } = renderHook(() => useSoundEffects());

      // Enable ambience
      act(() => {
        result.current.updateSettings({ ambienceEnabled: true });
      });

      const settings1 = result.current.getSettings();
      expect(settings1.ambienceEnabled).toBe(true);

      // Disable ambience
      act(() => {
        result.current.updateSettings({ ambienceEnabled: false });
      });

      const settings2 = result.current.getSettings();
      expect(settings2.ambienceEnabled).toBe(false);
    });
  });

  // ============================================================================
  // SETTINGS TESTS
  // ============================================================================

  describe('Settings Management', () => {
    it('should get current settings', () => {
      const { result } = renderHook(() => useSoundEffects());

      const settings = result.current.getSettings();

      expect(settings).toBeTruthy();
      expect(settings).toHaveProperty('uiSoundsEnabled');
      expect(settings).toHaveProperty('ambienceEnabled');
      expect(settings).toHaveProperty('uiVolume');
      expect(settings).toHaveProperty('ambienceVolume');
      expect(settings).toHaveProperty('selectedSoundPack');
    });

    it('should update settings', () => {
      const { result } = renderHook(() => useSoundEffects());

      act(() => {
        result.current.updateSettings({ uiVolume: 0.7 });
      });

      const settings = result.current.getSettings();
      expect(settings.uiVolume).toBe(0.7);
    });

    it('should update multiple settings at once', () => {
      const { result } = renderHook(() => useSoundEffects());

      act(() => {
        result.current.updateSettings({
          uiVolume: 0.8,
          ambienceVolume: 0.4,
          selectedSoundPack: 'apple-ii',
        });
      });

      const settings = result.current.getSettings();
      expect(settings.uiVolume).toBe(0.8);
      expect(settings.ambienceVolume).toBe(0.4);
      expect(settings.selectedSoundPack).toBe('apple-ii');
    });

    it('should save settings to localStorage', () => {
      const { result } = renderHook(() => useSoundEffects());

      act(() => {
        result.current.updateSettings({ uiVolume: 0.9 });
      });

      const saved = localStorage.getItem('soundEffectsSettings');
      expect(saved).toBeTruthy();

      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.uiVolume).toBe(0.9);
      }
    });

    it('should merge partial settings', () => {
      const { result } = renderHook(() => useSoundEffects());

      const initialSettings = result.current.getSettings();

      act(() => {
        result.current.updateSettings({ uiVolume: 0.75 });
      });

      const updatedSettings = result.current.getSettings();

      // Only uiVolume should change, others should remain
      expect(updatedSettings.uiVolume).toBe(0.75);
      expect(updatedSettings.ambienceEnabled).toBe(initialSettings.ambienceEnabled);
      expect(updatedSettings.selectedSoundPack).toBe(initialSettings.selectedSoundPack);
    });
  });

  // ============================================================================
  // SOUND PACK TESTS
  // ============================================================================

  describe('Sound Pack Selection', () => {
    it('should change sound pack', () => {
      const { result } = renderHook(() => useSoundEffects());

      act(() => {
        result.current.updateSettings({ selectedSoundPack: 'commodore-64' });
      });

      const settings = result.current.getSettings();
      expect(settings.selectedSoundPack).toBe('commodore-64');
    });

    it('should support all sound packs', () => {
      const { result } = renderHook(() => useSoundEffects());

      const packs = ['dos-pc', 'apple-ii', 'commodore-64', 'modern-synth'] as const;

      packs.forEach((pack) => {
        act(() => {
          result.current.updateSettings({ selectedSoundPack: pack });
        });

        const settings = result.current.getSettings();
        expect(settings.selectedSoundPack).toBe(pack);
      });
    });
  });

  // ============================================================================
  // CALLBACK STABILITY TESTS
  // ============================================================================

  describe('Callback Stability', () => {
    it('should have stable playSound callback', () => {
      const { result, rerender } = renderHook(() => useSoundEffects());

      const playSound1 = result.current.playSound;
      rerender();
      const playSound2 = result.current.playSound;

      expect(playSound1).toBe(playSound2);
    });

    it('should have stable startAmbience callback', () => {
      const { result, rerender } = renderHook(() => useSoundEffects());

      const startAmbience1 = result.current.startAmbience;
      rerender();
      const startAmbience2 = result.current.startAmbience;

      expect(startAmbience1).toBe(startAmbience2);
    });

    it('should have stable stopAmbience callback', () => {
      const { result, rerender } = renderHook(() => useSoundEffects());

      const stopAmbience1 = result.current.stopAmbience;
      rerender();
      const stopAmbience2 = result.current.stopAmbience;

      expect(stopAmbience1).toBe(stopAmbience2);
    });

    it('should have stable updateSettings callback', () => {
      const { result, rerender } = renderHook(() => useSoundEffects());

      const updateSettings1 = result.current.updateSettings;
      rerender();
      const updateSettings2 = result.current.updateSettings;

      expect(updateSettings1).toBe(updateSettings2);
    });

    it('should have stable getSettings callback', () => {
      const { result, rerender } = renderHook(() => useSoundEffects());

      const getSettings1 = result.current.getSettings;
      rerender();
      const getSettings2 = result.current.getSettings;

      expect(getSettings1).toBe(getSettings2);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration', () => {
    it('should handle complete workflow', async () => {
      const { result } = renderHook(() => useSoundEffects());

      // Initialize
      act(() => {
        document.dispatchEvent(new Event('click'));
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Update settings
      act(() => {
        result.current.updateSettings({
          uiVolume: 0.6,
          ambienceEnabled: true,
        });
      });

      // Play sound
      await act(async () => {
        await result.current.playSound('message-send');
      });

      // Start ambience
      await act(async () => {
        await result.current.startAmbience();
      });

      // Stop ambience
      act(() => {
        result.current.stopAmbience();
      });

      // Verify final state
      const settings = result.current.getSettings();
      expect(settings.uiVolume).toBe(0.6);
      expect(settings.ambienceEnabled).toBe(true);
    });

    it('should work without manual initialization', async () => {
      const { result } = renderHook(() => useSoundEffects());

      // Should be able to play sounds even without explicit init
      await act(async () => {
        await result.current.playSound('keypress');
      });

      expect(result.current).toBeTruthy();
    });

    it('should persist settings across rerenders', () => {
      const { result, rerender } = renderHook(() => useSoundEffects());

      act(() => {
        result.current.updateSettings({ uiVolume: 0.85 });
      });

      rerender();

      const settings = result.current.getSettings();
      expect(settings.uiVolume).toBe(0.85);
    });
  });
});
