import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalSwipe } from '@/hooks/useTouchGestures';

function touch(type: 'touchstart' | 'touchend', x: number) {
  const event = new Event(type);
  Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', { value: [{ clientX: x }] });
  document.dispatchEvent(event);
}

describe('useGlobalSwipe', () => {
  it('reports a long horizontal swipe in its direction, and ignores short ones', () => {
    const onSwipeRight = vi.fn();
    const onSwipeLeft = vi.fn();
    renderHook(() => useGlobalSwipe({ onSwipeRight, onSwipeLeft }));
    touch('touchstart', 10);
    touch('touchend', 200);
    touch('touchstart', 200);
    touch('touchend', 10);
    touch('touchstart', 10);
    touch('touchend', 40);
    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it('subscribes once, and calls the latest handlers after a re-render', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = renderHook(({ cb }) => useGlobalSwipe({ onSwipeRight: cb }), { initialProps: { cb: first } });
    rerender({ cb: latest });
    expect(add.mock.calls.filter(([type]) => type === 'touchstart')).toHaveLength(1);
    touch('touchstart', 10);
    touch('touchend', 200);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
    add.mockRestore();
  });
});
