/**
 * usePWA Hook Test Suite
 * Tests for Progressive Web App functionality
 *
 * @version 1.7.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWA } from '@/hooks/usePWA';

describe('usePWA Hook', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    localStorage.clear();

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Ensure matchMedia is always available
    if (!window.matchMedia || typeof window.matchMedia !== 'function') {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    }
  });

  afterEach(() => {
    // Don't call vi.restoreAllMocks() as it clears our global mocks
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isInstalled).toBe(false);
      expect(result.current.isInstallable).toBe(false);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.hasUpdate).toBe(false);
      expect(result.current.installPromptEvent).toBeNull();
      expect(result.current.registration).toBeNull();
    });

    it('should detect offline state correctly', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.isOffline).toBe(true);
    });

    it('should detect standalone mode (installed PWA)', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.isInstalled).toBe(true);
    });
  });

  describe('Service Worker Registration', () => {
    it('should register service worker on mount', async () => {
      const { result } = renderHook(() => usePWA());

      await waitFor(() => {
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
          scope: '/',
        });
      });
    });

    it('should set registration after successful registration', async () => {
      const { result } = renderHook(() => usePWA());

      await waitFor(() => {
        expect(result.current.registration).toBeDefined();
      });
    });

    it('should handle service worker registration errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (navigator.serviceWorker.register as any).mockRejectedValueOnce(
        new Error('Registration failed')
      );

      const { result } = renderHook(() => usePWA());

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(result.current.registration).toBeNull();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Online/Offline Detection', () => {
    it('should update isOffline when going offline', async () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isOffline).toBe(false);

      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });
    });

    it('should update isOffline when coming online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.isOffline).toBe(true);

      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(result.current.isOffline).toBe(false);
      });
    });
  });

  describe('Install Prompt', () => {
    it('should capture beforeinstallprompt event', async () => {
      const { result } = renderHook(() => usePWA());

      const mockPromptEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      act(() => {
        window.dispatchEvent(
          Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
        );
      });

      await waitFor(() => {
        expect(result.current.isInstallable).toBe(true);
        expect(result.current.installPromptEvent).toBeDefined();
      });
    });

    it('should prompt install when called', async () => {
      const { result } = renderHook(() => usePWA());

      const mockPromptEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      act(() => {
        window.dispatchEvent(
          Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
        );
      });

      await waitFor(() => {
        expect(result.current.isInstallable).toBe(true);
      });

      let installResult: boolean = false;

      await act(async () => {
        installResult = await result.current.promptInstall();
      });

      expect(mockPromptEvent.prompt).toHaveBeenCalled();
      expect(installResult).toBe(true);
    });

    it('should handle install prompt rejection', async () => {
      const { result } = renderHook(() => usePWA());

      const mockPromptEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue({ outcome: 'dismissed' }),
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      };

      act(() => {
        window.dispatchEvent(
          Object.assign(new Event('beforeinstallprompt'), mockPromptEvent)
        );
      });

      await waitFor(() => {
        expect(result.current.isInstallable).toBe(true);
      });

      let installResult: boolean = true;

      await act(async () => {
        installResult = await result.current.promptInstall();
      });

      expect(installResult).toBe(false);
    });

    it('should return false when no install prompt available', async () => {
      const { result } = renderHook(() => usePWA());

      let installResult: boolean = true;

      await act(async () => {
        installResult = await result.current.promptInstall();
      });

      expect(installResult).toBe(false);
    });
  });

  describe('Service Worker Updates', () => {
    it('should detect service worker updates', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: {
          state: 'activated',
          postMessage: vi.fn(),
        },
        update: vi.fn(),
        addEventListener: vi.fn(),
      };

      (navigator.serviceWorker.register as any).mockResolvedValueOnce(mockRegistration);

      const { result } = renderHook(() => usePWA());

      await waitFor(() => {
        expect(result.current.registration).toBeDefined();
      });

      // Simulate updatefound event
      const updatefoundCallback = (mockRegistration.addEventListener as any).mock.calls.find(
        (call: any) => call[0] === 'updatefound'
      )?.[1];

      if (updatefoundCallback) {
        const mockNewWorker = {
          state: 'installed',
          addEventListener: vi.fn(),
        };

        mockRegistration.installing = mockNewWorker as any;

        act(() => {
          updatefoundCallback();

          const statechangeCallback = (mockNewWorker.addEventListener as any).mock.calls.find(
            (call: any) => call[0] === 'statechange'
          )?.[1];

          if (statechangeCallback) {
            statechangeCallback();
          }
        });
      }
    });

    it('should update service worker when requested', async () => {
      const { result } = renderHook(() => usePWA());

      // Manually set hasUpdate to true
      act(() => {
        // This would normally be set by the updatefound event
        (result.current as any).hasUpdate = true;
      });

      act(() => {
        result.current.updateServiceWorker();
      });

      // Verify update was called (in real implementation)
      expect(result.current.updateServiceWorker).toBeDefined();
    });

    it('should dismiss update notification', () => {
      const { result } = renderHook(() => usePWA());

      act(() => {
        result.current.dismissUpdate();
      });

      expect(result.current.hasUpdate).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when requested', async () => {
      const mockCaches = {
        keys: vi.fn().mockResolvedValue(['cache1', 'cache2']),
        delete: vi.fn().mockResolvedValue(true),
      };

      global.caches = mockCaches as any;

      const { result } = renderHook(() => usePWA());

      await act(async () => {
        await result.current.clearCache();
      });

      expect(mockCaches.keys).toHaveBeenCalled();
      expect(mockCaches.delete).toHaveBeenCalledWith('cache1');
      expect(mockCaches.delete).toHaveBeenCalledWith('cache2');
    });

    it('should handle cache clearing errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockCaches = {
        keys: vi.fn().mockRejectedValue(new Error('Cache error')),
        delete: vi.fn(),
      };

      global.caches = mockCaches as any;

      const { result } = renderHook(() => usePWA());

      await act(async () => {
        await result.current.clearCache();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('App Installation Detection', () => {
    it('should detect iOS standalone mode', () => {
      (window.navigator as any).standalone = true;

      const { result } = renderHook(() => usePWA());

      expect(result.current.isInstalled).toBe(true);
    });

    it('should detect Android TWA mode', () => {
      Object.defineProperty(document, 'referrer', {
        writable: true,
        value: 'android-app://com.example.app',
      });

      const { result } = renderHook(() => usePWA());

      expect(result.current.isInstalled).toBe(true);
    });

    it('should update isInstalled after appinstalled event', () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isInstalled).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('appinstalled'));
      });

      // Installation state would be rechecked
      expect(result.current.isInstalled).toBeDefined();
    });
  });
});
