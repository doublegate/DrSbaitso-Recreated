/**
 * Open/closed state of every Enhanced-mode panel, dialog and floating tool,
 * plus the session shown in the replay dialog.
 *
 * One record instead of a useState per panel: callers name a panel by id.
 * Setting a panel to the value it already has keeps the same state object,
 * so React bails out exactly as it did with separate booleans.
 */
import { useCallback, useState } from 'react';
import type { ConversationSession } from '../types';

export type PanelId =
  | 'accessibility'
  | 'themeCustomizer'
  | 'conversationSearch'
  | 'audioVisualizer'
  | 'advancedExport'
  | 'characterCreator'
  | 'conversationReplay'
  | 'voiceControlHelp'
  | 'onboarding'
  | 'insights'
  | 'soundSettings'
  | 'musicPlayer'
  | 'soundPackManager'
  | 'soundPackCreator'
  | 'cloudSync'
  | 'voiceInput'
  | 'emotionViz'
  | 'topicDiagram'
  | 'templates';

export type PanelState = Record<PanelId, boolean>;

export const ONBOARDING_COMPLETED_KEY = 'sbaitso_onboarding_completed';

/** First-run tutorial: shown until it has been completed or skipped once. */
function onboardingPending(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== 'true';
  } catch {
    return false;
  }
}

function initialPanels(): PanelState {
  return {
    accessibility: false,
    themeCustomizer: false,
    conversationSearch: false,
    audioVisualizer: false,
    advancedExport: false,
    characterCreator: false,
    conversationReplay: false,
    voiceControlHelp: false,
    onboarding: onboardingPending(),
    insights: false,
    soundSettings: false,
    musicPlayer: false,
    soundPackManager: false,
    soundPackCreator: false,
    cloudSync: false,
    voiceInput: false,
    emotionViz: false,
    topicDiagram: false,
    templates: false,
  };
}

export function usePanels() {
  const [open, setOpen] = useState<PanelState>(initialPanels);
  const [replaySession, setReplaySession] = useState<ConversationSession | null>(null);

  /** Sets one panel, from a value or from its previous value. */
  const setPanel = useCallback((id: PanelId, value: boolean | ((prev: boolean) => boolean)) => {
    setOpen((prev) => {
      const next = typeof value === 'function' ? value(prev[id]) : value;
      return next === prev[id] ? prev : { ...prev, [id]: next };
    });
  }, []);

  const show = useCallback((id: PanelId) => setPanel(id, true), [setPanel]);
  const hide = useCallback((id: PanelId) => setPanel(id, false), [setPanel]);
  const toggle = useCallback((id: PanelId) => setPanel(id, (prev) => !prev), [setPanel]);

  /** Opens a saved session in the replay dialog, closing the search it came from. */
  const openReplay = useCallback(
    (session: ConversationSession) => {
      setReplaySession(session);
      setPanel('conversationReplay', true);
      setPanel('conversationSearch', false);
    },
    [setPanel],
  );

  const closeReplay = useCallback(() => {
    setPanel('conversationReplay', false);
    setReplaySession(null);
  }, [setPanel]);

  return { open, replaySession, setPanel, show, hide, toggle, openReplay, closeReplay };
}

export type Panels = ReturnType<typeof usePanels>;
