/**
 * usePWA Hook - Progressive Web App Integration
 *
 * Handles:
 * - Access to the service worker registration (registration and updates are
 *   owned by vite-plugin-pwa; see components/UpdatePrompt.tsx)
 * - Install prompts and PWA installation
 * - Offline detection and notifications
 * - Update notifications for new service worker versions
 * - App shortcuts and share target handling
 *
 * @version 1.7.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PWAInstallPrompt {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOffline: boolean;
  installPromptEvent: PWAInstallPrompt | null;
  registration: ServiceWorkerRegistration | null;
}

export interface PWAActions {
  promptInstall: () => Promise<boolean>;
  clearCache: () => Promise<void>;
}

export function usePWA(): PWAState & PWAActions {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [installPromptEvent, setInstallPromptEvent] = useState<PWAInstallPrompt | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const deferredPromptRef = useRef<PWAInstallPrompt | null>(null);

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');

      setIsInstalled(isStandalone);
    };

    checkInstalled();
    window.addEventListener('appinstalled', checkInstalled);

    return () => {
      window.removeEventListener('appinstalled', checkInstalled);
    };
  }, []);

  // Handle offline/online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Capture beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as any;
      deferredPromptRef.current = promptEvent;
      setInstallPromptEvent(promptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Read the existing registration. Registration itself is done by
  // vite-plugin-pwa; registering here as well would race it.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let cancelled = false;
    void navigator.serviceWorker.ready.then((reg) => {
      if (!cancelled) setRegistration(reg);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Prompt user to install PWA
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptRef.current) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    try {
      const result = await deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;

      console.log(`[PWA] Install prompt outcome: ${outcome}`);

      // Clear the deferred prompt
      deferredPromptRef.current = null;
      setInstallPromptEvent(null);
      setIsInstallable(false);

      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }, []);

  // Clear all caches
  const clearCache = useCallback(async (): Promise<void> => {
    if (!registration) {
      console.warn('[PWA] No service worker registration found');
      return;
    }

    try {
      // Clear caches from client side as well
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );

      console.log('[PWA] Cache cleared successfully');

      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('[PWA] Cache clearing failed:', error);
    }
  }, [registration]);

  return {
    // State
    isInstalled,
    isInstallable,
    isOffline,
    installPromptEvent,
    registration,

    // Actions
    promptInstall,
    clearCache,
  };
}

/**
 * Hook to handle share target functionality
 */
export function useShareTarget() {
  const [sharedData, setSharedData] = useState<{ title?: string; text?: string } | null>(null);

  useEffect(() => {
    const handleShare = async () => {
      const url = new URL(window.location.href);
      const action = url.searchParams.get('action');

      if (action === 'share') {
        // Handle shared data from other apps
        const title = url.searchParams.get('title') || undefined;
        const text = url.searchParams.get('text') || undefined;

        if (title || text) {
          setSharedData({ title, text });
        }
      }
    };

    handleShare();
  }, []);

  const clearSharedData = useCallback(() => {
    setSharedData(null);
  }, []);

  return {
    sharedData,
    clearSharedData,
  };
}

/**
 * Hook to handle app shortcuts
 */
export function useAppShortcuts(onShortcut: (action: string) => void) {
  useEffect(() => {
    const url = new URL(window.location.href);
    const action = url.searchParams.get('action');

    if (action) {
      onShortcut(action);
      // Clear the action parameter from URL
      window.history.replaceState({}, '', '/');
    }
  }, [onShortcut]);
}

export default usePWA;
