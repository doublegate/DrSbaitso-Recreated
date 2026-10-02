import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeChoice, THEME_KEY, CUSTOM_THEMES_KEY } from '@/hooks/useThemeChoice';
import type { CustomTheme } from '@/utils/themeValidator';

const mine: CustomTheme = {
  id: 'custom_mine',
  name: 'Mine',
  description: 'test',
  colors: { primary: '#111111', background: '#222222', text: '#333333', border: '#444444', accent: '#555555' },
  isCustom: true,
  createdAt: 1,
} as CustomTheme;

describe('useThemeChoice', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
  });

  it('defaults to DOS Blue and applies its colours', () => {
    const { result } = renderHook(() => useThemeChoice());
    expect(result.current.theme.id).toBe('dos-blue');
    expect(document.documentElement.style.getPropertyValue('--color-background')).toBe(
      result.current.theme.colors.background,
    );
  });

  it('selects, applies and remembers a theme', () => {
    const { result } = renderHook(() => useThemeChoice());
    act(() => result.current.selectTheme('phosphor-green'));
    expect(localStorage.getItem(THEME_KEY)).toBe('phosphor-green');
    expect(document.documentElement.style.getPropertyValue('--color-text')).toBe(result.current.theme.colors.text);
    expect(renderHook(() => useThemeChoice()).result.current.theme.id).toBe('phosphor-green');
  });

  it('cycles through every theme and wraps around', () => {
    const { result } = renderHook(() => useThemeChoice());
    const ids = result.current.themes.map((t) => t.id);
    for (let i = 0; i < ids.length; i++) act(() => result.current.cycleTheme());
    expect(result.current.theme.id).toBe(ids[0]);
  });

  it('saves a custom theme, persists it, and switches to it', () => {
    const { result } = renderHook(() => useThemeChoice());
    act(() => result.current.addCustomTheme(mine));
    expect(result.current.theme.id).toBe('custom_mine');
    expect(JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY)!)).toHaveLength(1);
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#555555');
  });

  it('ignores malformed stored custom themes', () => {
    localStorage.setItem(CUSTOM_THEMES_KEY, '[{"id":1}]');
    const { result } = renderHook(() => useThemeChoice());
    expect(result.current.themes.some((t) => (t as { isCustom?: boolean }).isCustom)).toBe(false);
  });
});
