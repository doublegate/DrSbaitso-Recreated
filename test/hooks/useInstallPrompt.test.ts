import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInstallPrompt, INSTALL_DISMISSED_KEY } from '@/hooks/useInstallPrompt';

function fireBeforeInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as any;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: 'web' });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

describe('useInstallPrompt', () => {
  beforeEach(() => localStorage.clear());

  it('is not available until the browser offers installation', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it('captures the event and suppresses the default mini-infobar', () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = fireBeforeInstallPrompt();
    expect(event.defaultPrevented).toBe(true);
    expect(result.current.canInstall).toBe(true);
  });

  it('install() shows the browser prompt once and then hides the banner', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = fireBeforeInstallPrompt('accepted');
    await act(() => result.current.install());
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(result.current.canInstall).toBe(false);
  });

  it('dismiss() hides the banner and remembers the choice', () => {
    const { result } = renderHook(() => useInstallPrompt());
    fireBeforeInstallPrompt();
    act(() => result.current.dismiss());
    expect(result.current.canInstall).toBe(false);
    expect(localStorage.getItem(INSTALL_DISMISSED_KEY)).toBe('true');

    const second = renderHook(() => useInstallPrompt());
    fireBeforeInstallPrompt();
    expect(second.result.current.canInstall).toBe(false);
  });

  it('removes its listener on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useInstallPrompt());
    unmount();
    expect(remove).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    remove.mockRestore();
  });
});
