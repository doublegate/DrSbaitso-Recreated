/**
 * The selected colour theme (built-in or custom), persisted and applied to
 * the --color-* CSS variables. Previously the selection was hard-coded to
 * DOS Blue and custom themes were kept in memory without being applied.
 */
import { useEffect, useState } from 'react';
import { THEMES, DEFAULT_THEME, type Theme } from '../constants';
import type { CustomTheme } from '../utils/themeValidator';
import { applyThemeVariables } from '../utils/themeVariables';

export const THEME_KEY = 'sbaitso_theme';
export const CUSTOM_THEMES_KEY = 'sbaitso_custom_themes';

const COLOR_KEYS = ['primary', 'background', 'text', 'border', 'accent'] as const;
const isHex = (v: unknown) => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);

function loadCustomThemes(): CustomTheme[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is CustomTheme =>
        typeof t?.id === 'string' &&
        typeof t?.name === 'string' &&
        typeof t?.colors === 'object' &&
        COLOR_KEYS.every((k) => isHex(t.colors?.[k])),
    );
  } catch {
    return [];
  }
}

export function useThemeChoice() {
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(loadCustomThemes);
  const [themeId, setThemeId] = useState<string>(() => {
    try {
      return localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const themes: Array<Theme | CustomTheme> = [...THEMES, ...customThemes];
  const theme = themes.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    applyThemeVariables(theme.colors);
  }, [theme.colors]);

  const selectTheme = (id: string) => {
    setThemeId(id);
    try {
      localStorage.setItem(THEME_KEY, id);
    } catch {
      // Not persisted.
    }
  };

  const cycleTheme = () => {
    const index = themes.findIndex((t) => t.id === theme.id);
    selectTheme(themes[(index + 1) % themes.length].id);
  };

  const addCustomTheme = (custom: CustomTheme) => {
    const next = [...customThemes.filter((t) => t.id !== custom.id), custom];
    setCustomThemes(next);
    try {
      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(next));
    } catch {
      // Not persisted.
    }
    selectTheme(custom.id);
  };

  return { theme, themes, customThemes, selectTheme, cycleTheme, addCustomTheme };
}
