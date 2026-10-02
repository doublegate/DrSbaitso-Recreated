/**
 * Lets the music player's 'auto' mood follow the conversation: after each
 * finished turn, the sentiment of the user's last few lines is passed to the
 * music engine (-1 negative .. 1 positive).
 */
import { useEffect } from 'react';
import { analyzeSentiment } from '../utils/sentimentAnalysis';
import { musicEngine } from '../utils/musicEngine';
import type { Message } from '../types';

/** User lines that set the mood. */
const RECENT_LINES = 3;

export function useMusicMood(messages: Message[], busy: boolean): void {
  useEffect(() => {
    if (busy) return;
    const recent = messages
      .filter((m) => m.author === 'user')
      .slice(-RECENT_LINES)
      .map((m) => m.text)
      .join(' ');
    if (recent) musicEngine.setSentiment(analyzeSentiment(recent).score / 100);
  }, [messages, busy]);
}
