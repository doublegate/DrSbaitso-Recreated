/**
 * Conversation history, opt-in.
 *
 * The greeting promises "MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE",
 * so nothing is stored unless the user turns on "Keep session history". The
 * current conversation is always available in memory (for export); with
 * history on, it is saved to this browser after each change and listed for
 * search, replay and insights.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { SessionManager } from '../utils/sessionManager';
import type { ConversationSession, Message } from '../types';

export const KEEP_HISTORY_KEY = 'sbaitso_keep_history';
const SAVE_DEBOUNCE_MS = 1000;

interface SessionOptions {
  characterId: string;
  themeId: string;
  audioQualityId: string;
}

function readKeepHistory(): boolean {
  try {
    return localStorage.getItem(KEEP_HISTORY_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useSessionHistory(messages: Message[], options: SessionOptions) {
  const [keepHistory, setKeepHistoryState] = useState(readKeepHistory);
  const [savedSessions, setSavedSessions] = useState<ConversationSession[]>(() =>
    readKeepHistory() ? SessionManager.getAllSessions() : [],
  );

  // Identity of the current conversation; a cleared conversation starts a new one.
  const sessionRef = useRef<ConversationSession | null>(null);
  if (messages.length === 0) sessionRef.current = null;
  if (messages.length > 0 && !sessionRef.current) {
    sessionRef.current = SessionManager.createSession(options.characterId, options.themeId, options.audioQualityId);
  }

  const currentSession = useMemo<ConversationSession | null>(() => {
    const base = sessionRef.current;
    if (!base) return null;
    return {
      ...base,
      characterId: options.characterId,
      themeId: options.themeId,
      audioQualityId: options.audioQualityId,
      messages,
      messageCount: messages.length,
      startedAt: base.startedAt ?? messages[0]?.timestamp ?? base.createdAt,
      updatedAt: messages.at(-1)?.timestamp ?? base.updatedAt,
    };
  }, [messages, options.characterId, options.themeId, options.audioQualityId]);

  // Save after the conversation settles (messages change on every typed character).
  useEffect(() => {
    if (!keepHistory || !currentSession) return;
    const timer = setTimeout(() => {
      SessionManager.saveSession(currentSession);
      setSavedSessions(SessionManager.getAllSessions());
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keepHistory, currentSession]);

  const setKeepHistory = (on: boolean) => {
    setKeepHistoryState(on);
    try {
      if (on) {
        localStorage.setItem(KEEP_HISTORY_KEY, 'true');
      } else {
        localStorage.removeItem(KEEP_HISTORY_KEY);
        SessionManager.clearAllSessions();
      }
    } catch {
      // Storage unavailable: history simply is not kept.
    }
    setSavedSessions(on ? SessionManager.getAllSessions() : []);
  };

  return { keepHistory, setKeepHistory, currentSession, savedSessions };
}
