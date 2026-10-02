/**
 * Web Share Target: the manifest sends shared content to `GET /share?title=&text=&url=`.
 * Any path serves the app (SPA rewrite and the service worker's navigation
 * fallback), so no server route is needed; the app reads the parameters here.
 */

export const SHARE_PATH = '/share';

/** Same cap as one chat message on the server (api/_lib/gemini.ts LIMITS.message). */
const MAX_SHARED_CHARS = 2000;

/** The shared text to put on the input line, or null when this is not a share. */
export function readSharedText(location: Pick<URL, 'pathname' | 'search'>): string | null {
  if (location.pathname !== SHARE_PATH) return null;
  const params = new URLSearchParams(location.search);
  const parts: string[] = [];
  for (const key of ['title', 'text', 'url']) {
    const value = params.get(key)?.trim();
    if (value && !parts.includes(value)) parts.push(value);
  }
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, MAX_SHARED_CHARS) : null;
}

/** Replaces the share URL with the app root, so a reload does not share again. */
export function clearSharePath(): void {
  if (typeof location !== 'undefined' && location.pathname === SHARE_PATH) {
    history.replaceState(null, '', '/');
  }
}

let taken: { text: string | null } | null = null;

/**
 * The text this page was opened to share, read once: the URL is cleared so a
 * reload does not share again, and later calls return the same value.
 */
export function takeSharedText(): string | null {
  if (!taken) {
    taken = { text: typeof location === 'undefined' ? null : readSharedText(location) };
    if (taken.text !== null) clearSharePath();
  }
  return taken.text;
}

export function __resetSharedTextForTests(): void {
  taken = null;
}
