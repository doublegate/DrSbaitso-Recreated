/**
 * useAccessibility Hook
 *
 * React hook for managing accessibility settings and applying them to the application.
 * Provides state management for WCAG 2.1 AA compliance features.
 *
 * @module useAccessibility
 * @since 1.4.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AccessibilitySettings,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  prefersReducedMotion,
  prefersHighContrast
} from '../utils/accessibilityManager';

const STORAGE_KEY = 'dr-sbaitso-accessibility-settings';

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }

    // Detect user preferences from system
    return {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      reducedMotion: prefersReducedMotion(),
      highContrast: prefersHighContrast()
    };
  });

  /**
   * Save settings to localStorage
   */
  const saveSettings = useCallback((newSettings: AccessibilitySettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }, []);

  /**
   * Update a specific setting
   */
  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  /**
   * Toggle boolean setting
   */
  const toggleSetting = useCallback((key: keyof AccessibilitySettings) => {
    if (typeof settings[key] === 'boolean') {
      updateSetting(key, !settings[key] as any);
    }
  }, [settings, updateSetting]);

  /**
   * Reset to default settings
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    saveSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
  }, [saveSettings]);

  /**
   * Apply accessibility settings to the document
   */
  useEffect(() => {
    const root = document.documentElement;

    // Apply high contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply font size
    root.setAttribute('data-font-size', settings.fontSize);

    // Apply focus indicator style
    root.setAttribute('data-focus-style', settings.focusIndicatorStyle);

    // Apply screen reader optimizations
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }

    // Apply keyboard navigation hints
    if (settings.keyboardNavigationHints) {
      root.classList.add('show-keyboard-hints');
    } else {
      root.classList.remove('show-keyboard-hints');
    }
  }, [settings]);

  /**
   * Listen for system preference changes
   */
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        updateSetting('reducedMotion', e.matches);
      }
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        updateSetting('highContrast', e.matches);
      }
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, [updateSetting]);

  return {
    settings,
    updateSetting,
    toggleSetting,
    resetSettings
  };
}
