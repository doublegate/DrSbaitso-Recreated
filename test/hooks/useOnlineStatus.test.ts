import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const setOnline = (online: boolean) => {
  // test/setup.ts makes onLine writable but not configurable: assign it.
  (navigator as { onLine: boolean }).onLine = online;
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
};

describe('useOnlineStatus', () => {
  afterEach(() => setOnline(true));

  it('follows the browser online and offline events', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
    act(() => setOnline(false));
    expect(result.current).toBe(false);
    act(() => setOnline(true));
    expect(result.current).toBe(true);
  });
});
