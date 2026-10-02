import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalShortcuts, type ShortcutActions } from '@/hooks/useGlobalShortcuts';
import { APP_SHORTCUTS } from '@/utils/shortcuts';

function actions(): ShortcutActions {
  return Object.fromEntries(APP_SHORTCUTS.map((s) => [s.id, vi.fn()])) as unknown as ShortcutActions;
}

function press(code: string, mods: KeyboardEventInit = { altKey: true, shiftKey: true }) {
  const event = new KeyboardEvent('keydown', { code, cancelable: true, ...mods });
  window.dispatchEvent(event);
  return event;
}

describe('useGlobalShortcuts', () => {
  it('runs the matching action and prevents the browser default', () => {
    const map = actions();
    renderHook(() => useGlobalShortcuts(map));
    const event = press('KeyI');
    expect(map.insights).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores keys without Alt+Shift, and unbound keys', () => {
    const map = actions();
    renderHook(() => useGlobalShortcuts(map));
    const plain = press('KeyI', {});
    const unbound = press('KeyZ');
    expect(Object.values(map).some((fn) => vi.mocked(fn).mock.calls.length > 0)).toBe(false);
    expect(plain.defaultPrevented).toBe(false);
    expect(unbound.defaultPrevented).toBe(false);
  });

  it('uses the latest actions without re-registering the listener', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const first = actions();
    const second = actions();
    const { rerender, unmount } = renderHook(({ map }) => useGlobalShortcuts(map), { initialProps: { map: first } });
    rerender({ map: second });
    press('KeyT');
    expect(first.topicDiagram).not.toHaveBeenCalled();
    expect(second.topicDiagram).toHaveBeenCalledTimes(1);
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
    unmount();
    press('KeyT');
    expect(second.topicDiagram).toHaveBeenCalledTimes(1);
    add.mockRestore();
  });
});
