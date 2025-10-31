import { ConversationSession, Message, SessionStats, AppSettings } from '../types';
import { DEFAULT_CHARACTER, DEFAULT_THEME, DEFAULT_AUDIO_QUALITY } from '../constants';

const SESSIONS_KEY = 'sbaitso_sessions';
const CURRENT_SESSION_KEY = 'sbaitso_current_session';
const SETTINGS_KEY = 'sbaitso_settings';
const STATS_KEY = 'sbaitso_stats';

export class SessionManager {
  // Session management
  static createSession(characterId: string, themeId: string, audioQualityId: string): ConversationSession {
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Session ${new Date().toLocaleString()}`,
      characterId,
      themeId,
      audioQualityId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      glitchCount: 0
    };
  }

  static saveSession(session: ConversationSession): void {
    try {
      const sessions = this.getAllSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);

      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }

  static getCurrentSession(): ConversationSession | null {
    try {
      const data = localStorage.getItem(CURRENT_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load current session:', e);
      return null;
    }
  }

  static getAllSessions(): ConversationSession[] {
    try {
      const data = localStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load sessions:', e);
      return [];
    }
  }

  static deleteSession(sessionId: string): void {
    try {
      const sessions = this.getAllSessions().filter(s => s.id !== sessionId);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

      const current = this.getCurrentSession();
      if (current?.id === sessionId) {
        localStorage.removeItem(CURRENT_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  }

  static clearAllSessions(): void {
    try {
      localStorage.removeItem(SESSIONS_KEY);
      localStorage.removeItem(CURRENT_SESSION_KEY);
    } catch (e) {
      console.error('Failed to clear sessions:', e);
    }
  }

  // Settings management
  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }

    // Return defaults
    return {
      characterId: DEFAULT_CHARACTER,
      themeId: DEFAULT_THEME,
      audioQualityId: DEFAULT_AUDIO_QUALITY,
      audioMode: 'authentic',
      soundEnabled: true,
      autoScroll: true,
      showTimestamps: false,
      compactMode: false
    };
  }

  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  // Statistics tracking
  static updateStats(session: ConversationSession): void {
    try {
      const stats = this.getStats();

      // Update basic counts
      stats.totalMessages = session.messageCount;
      stats.totalGlitches = session.glitchCount;

      // Track character usage
      if (!stats.charactersUsed[session.characterId]) {
        stats.charactersUsed[session.characterId] = 0;
      }
      stats.charactersUsed[session.characterId]++;

      // Track theme usage
      if (!stats.themesUsed[session.themeId]) {
        stats.themesUsed[session.themeId] = 0;
      }
      stats.themesUsed[session.themeId]++;

      // Calculate favorites
      stats.favoriteCharacter = Object.entries(stats.charactersUsed)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || DEFAULT_CHARACTER;

      stats.favoriteTheme = Object.entries(stats.themesUsed)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || DEFAULT_THEME;

      // Calculate conversation time
      if (session.messages.length > 1) {
        const firstMsg = session.messages[0];
        const lastMsg = session.messages[session.messages.length - 1];
        if (firstMsg.timestamp && lastMsg.timestamp) {
          stats.totalConversationTime += (lastMsg.timestamp - firstMsg.timestamp);
        }
      }

      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to update stats:', e);
    }
  }

  static getStats(): SessionStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }

    return {
      totalSessions: 0,
      totalMessages: 0,
      totalGlitches: 0,
      averageMessagesPerSession: 0,
      favoriteCharacter: DEFAULT_CHARACTER,
      favoriteTheme: DEFAULT_THEME,
      totalConversationTime: 0,
      charactersUsed: {},
      themesUsed: {}
    };
  }

  static incrementGlitchCount(session: ConversationSession, response: string): number {
    const glitchPhrases = ['PARITY CHECKING', 'IRQ CONFLICT'];
    let count = session.glitchCount;

    if (glitchPhrases.some(phrase => response.includes(phrase))) {
      count++;
    }

    return count;
  }
}
