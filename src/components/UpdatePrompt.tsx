/**
 * Offers a waiting service-worker update. The page never reloads on its own,
 * which previously wiped the conversation mid-session.
 */
import { useRegisterSW } from 'virtual:pwa-register/react';

const HOURLY = 60 * 60 * 1000;

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Long-lived tabs still learn about new deploys.
      if (registration) setInterval(() => void registration.update(), HOURLY);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 border-2 border-(--color-border) bg-(--color-background) text-(--color-text) px-4 py-2 font-mono text-sm flex items-center gap-3"
    >
      <span>A NEW VERSION IS AVAILABLE.</span>
      <button
        onClick={() => void updateServiceWorker(true)}
        className="border-2 border-(--color-accent) text-(--color-accent) px-2"
      >
        RELOAD
      </button>
      <button onClick={() => setNeedRefresh(false)} className="border-2 border-(--color-border) px-2">
        LATER
      </button>
    </div>
  );
}
