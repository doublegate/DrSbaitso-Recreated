/**
 * Global keyboard shortcuts: Alt+Shift+<key>, defined in utils/shortcuts.ts.
 *
 * One window listener for the component's lifetime. The actions map is read
 * through useEffectEvent, so callers can pass a fresh object every render
 * without re-registering the listener.
 */
import { useEffect, useEffectEvent } from 'react';
import { matchShortcut, type ShortcutId } from '../utils/shortcuts';

export type ShortcutActions = Record<ShortcutId, () => void>;

export function useGlobalShortcuts(actions: ShortcutActions) {
  const onShortcut = useEffectEvent((e: KeyboardEvent) => {
    const id = matchShortcut(e);
    if (!id) return;
    e.preventDefault();
    actions[id]();
  });

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => onShortcut(e);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
}
