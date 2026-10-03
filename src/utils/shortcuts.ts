/**
 * Global keyboard shortcuts: the single source of truth for the key handler,
 * button labels and help text.
 *
 * Every shortcut is Alt+Shift+<key>, matched on the physical key (`code`).
 * The previous Ctrl/Cmd bindings collided with browser shortcuts (select all,
 * paste as plain text, DevTools, reopen tab, private window), and one combo
 * was bound to two actions. Matching `code` rather than `key` keeps macOS
 * working, where Option+Shift+A produces the character "Å".
 */

export type ShortcutId =
  | 'accessibility'
  | 'cycleAudioMode'
  | 'insights'
  | 'tutorial'
  | 'soundSettings'
  | 'musicPlayer'
  | 'soundPacks'
  | 'voiceInput'
  | 'emotionViz'
  | 'topicDiagram'
  | 'templates'
  | 'switchMode';

export interface AppShortcut {
  id: ShortcutId;
  code: string;
  description: string;
}

export const APP_SHORTCUTS: readonly AppShortcut[] = [
  { id: 'accessibility', code: 'KeyA', description: 'Accessibility settings' },
  { id: 'cycleAudioMode', code: 'KeyQ', description: 'Cycle audio quality mode' },
  { id: 'insights', code: 'KeyI', description: 'Conversation insights' },
  { id: 'tutorial', code: 'KeyH', description: 'Show the tutorial' },
  { id: 'soundSettings', code: 'KeyS', description: 'Sound settings' },
  { id: 'musicPlayer', code: 'KeyM', description: 'Music player' },
  { id: 'soundPacks', code: 'KeyP', description: 'Sound pack manager' },
  { id: 'voiceInput', code: 'KeyV', description: 'Voice input' },
  { id: 'emotionViz', code: 'KeyE', description: 'Emotion visualizer' },
  { id: 'topicDiagram', code: 'KeyT', description: 'Topic diagram' },
  { id: 'templates', code: 'KeyL', description: 'Conversation templates' },
  { id: 'switchMode', code: 'KeyX', description: 'Switch between the classic screen and the enhanced UI' },
];

/** The KeyboardEvent fields matchShortcut reads (structural, so this module needs no DOM types). */
export interface ShortcutKeyEvent {
  code: string;
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

export function matchShortcut(event: ShortcutKeyEvent): ShortcutId | null {
  if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return null;
  return APP_SHORTCUTS.find((s) => s.code === event.code)?.id ?? null;
}

export function shortcutLabel(id: ShortcutId): string {
  const shortcut = APP_SHORTCUTS.find((s) => s.id === id);
  return shortcut ? `Alt+Shift+${shortcut.code.replace(/^Key/, '')}` : '';
}
