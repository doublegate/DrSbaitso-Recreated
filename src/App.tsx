/**
 * Chooses between the faithful classic screen (default) and the enhanced UI.
 * Alt+Shift+X switches; the choice is remembered (utils/uiMode.ts).
 */
import { lazy, Suspense, useEffect, useEffectEvent, useState } from 'react';
import ClassicApp from './components/classic/ClassicApp';
import { matchShortcut } from './utils/shortcuts';
import { readUiMode, saveUiMode, type UiMode } from './utils/uiMode';
import { takeSharedText } from './utils/shareTarget';

const EnhancedApp = lazy(() => import('./EnhancedApp'));

export default function App() {
  const [mode, setMode] = useState<UiMode>(() => readUiMode());
  // Text shared to the installed app (manifest share_target), read once.
  const sharedText = takeSharedText();

  const switchMode = (next: UiMode) => {
    saveUiMode(next);
    setMode(next);
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (matchShortcut(e) === 'switchMode') {
      e.preventDefault();
      switchMode(mode === 'classic' ? 'enhanced' : 'classic');
    }
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (mode === 'classic') {
    return <ClassicApp onSwitchMode={() => switchMode('enhanced')} initialInput={sharedText ?? undefined} />;
  }
  return (
    <Suspense fallback={null}>
      <EnhancedApp onSwitchMode={() => switchMode('classic')} initialInput={sharedText} />
    </Suspense>
  );
}
