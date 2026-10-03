/**
 * Captures the browser's `beforeinstallprompt` event so the app can show its
 * own install banner, and only when installation is actually possible.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export const INSTALL_DISMISSED_KEY = 'sbaitso_install_prompt_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useInstallPrompt() {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (wasDismissed()) return;
      deferred.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setCanInstall(false);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const event = deferred.current;
    if (!event) return;
    deferred.current = null; // the event can only be used once
    setCanInstall(false);
    await event.prompt();
    await event.userChoice;
  }, []);

  const dismiss = useCallback(() => {
    deferred.current = null;
    setCanInstall(false);
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    } catch {
      // Storage unavailable (private mode); the banner just returns next visit.
    }
  }, []);

  return { canInstall, install, dismiss };
}
