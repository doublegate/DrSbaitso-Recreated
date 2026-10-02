/**
 * Which experience to show: the faithful 80x25 "classic" screen (default) or
 * the "enhanced" UI with toolbar, panels and extra personas.
 */
export type UiMode = 'classic' | 'enhanced';

export const UI_MODE_KEY = 'sbaitso_ui_mode';

export function readUiMode(search: string = typeof location === 'undefined' ? '' : location.search): UiMode {
  const fromUrl = new URLSearchParams(search).get('mode');
  if (fromUrl === 'classic' || fromUrl === 'enhanced') return fromUrl;
  try {
    return localStorage.getItem(UI_MODE_KEY) === 'enhanced' ? 'enhanced' : 'classic';
  } catch {
    return 'classic';
  }
}

export function saveUiMode(mode: UiMode): void {
  try {
    localStorage.setItem(UI_MODE_KEY, mode);
  } catch {
    // Storage unavailable; the choice lasts for this page only.
  }
}
