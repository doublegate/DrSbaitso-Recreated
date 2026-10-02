import type { Theme } from '../constants';

/**
 * Publishes a theme's colours as `--color-<name>` custom properties so that
 * components styled with `var(--color-text)` etc. follow the active theme.
 */
export function applyThemeVariables(colors: Theme['colors'], target: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(colors)) {
    target.style.setProperty(`--color-${name}`, value);
  }
}
