import { ConversationSession, Message, SessionStats, AppSettings, InsightsData, InsightsFilter } from '../types';
import { DEFAULT_CHARACTER, DEFAULT_THEME, DEFAULT_AUDIO_QUALITY, CHARACTERS } from '../constants';
import { analyzeSentiment, calculateSentimentTrend, extractTopKeywords } from './sentimentAnalysis';

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
      const sessions = data ? JSON.parse(data) : [];
      // Sort by updatedAt descending (newest first)
      return sessions.sort((a: ConversationSession, b: ConversationSession) => b.updatedAt - a.updatedAt);
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

  static saveSettings(settings: Partial<AppSettings>): void {
    try {
      const currentSettings = this.getSettings();
      const mergedSettings = { ...currentSettings, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  // Statistics tracking
  static updateStats(session: ConversationSession): void {
    try {
      const stats = this.getStats();

      // Update basic counts
      stats.totalSessions++;
      stats.totalMessages += session.messageCount;
      stats.totalGlitches += session.glitchCount;

      // Calculate average messages per session
      stats.averageMessagesPerSession = stats.totalMessages / stats.totalSessions;

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

  static resetStats(): void {
    try {
      localStorage.removeItem(STATS_KEY);
    } catch (e) {
      console.error('Failed to reset stats:', e);
    }
  }

  static incrementGlitchCount(session: ConversationSession, response: string): number {
    const glitchPhrases = ['PARITY CHECKING', 'IRQ CONFLICT'];
    let count = session.glitchCount;

    if (glitchPhrases.some(phrase => response.includes(phrase))) {
      count++;
    }

    return count;
  }

  // Insights and Analytics (v1.8.0)

  /**
   * Get messages within a specific date range
   * @param startDate - Start timestamp (ms)
   * @param endDate - End timestamp (ms)
   * @returns Filtered messages
   */
  static getMessagesInDateRange(startDate?: number, endDate?: number): Message[] {
    const sessions = this.getAllSessions();
    const allMessages: Message[] = [];

    sessions.forEach(session => {
      session.messages.forEach(message => {
        const timestamp = message.timestamp || session.createdAt;
        const afterStart = startDate === undefined || timestamp >= startDate;
        const beforeEnd = endDate === undefined || timestamp <= endDate;

        if (afterStart && beforeEnd) {
          allMessages.push({
            ...message,
            timestamp: timestamp,
            characterId: session.characterId
          });
        }
      });
    });

    return allMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  /**
   * Calculate date range timestamps based on filter
   * @param filter - Insights filter with date range option
   * @returns Start and end timestamps
   */
  static calculateDateRange(filter: InsightsFilter): { startDate?: number; endDate?: number } {
    const now = Date.now();
    let startDate: number | undefined;
    let endDate: number | undefined = now;

    switch (filter.dateRange) {
      case 'week':
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'quarter':
        startDate = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
        startDate = undefined;
        endDate = undefined;
        break;
      case 'custom':
        startDate = filter.startDate;
        endDate = filter.endDate;
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Get comprehensive insights data for the dashboard
   * @param filter - Insights filter options
   * @returns InsightsData with timeline, sentiment, topics, and character usage
   */
  static getInsightsData(filter: InsightsFilter): InsightsData {
    const { startDate, endDate } = this.calculateDateRange(filter);
    const sessions = this.getAllSessions();

    // Filter sessions by date range and character
    let filteredSessions = sessions.filter(session => {
      const sessionTime = session.updatedAt;
      const afterStart = startDate === undefined || sessionTime >= startDate;
      const beforeEnd = endDate === undefined || sessionTime <= endDate;
      const matchesCharacter = !filter.characterIds || filter.characterIds.length === 0 ||
                               filter.characterIds.includes(session.characterId);
      const matchesSession = !filter.sessionIds || filter.sessionIds.length === 0 ||
                              filter.sessionIds.includes(session.id);

      return afterStart && beforeEnd && matchesCharacter && matchesSession;
    });

    // Build timeline data (group by date)
    const timelineMap = new Map<string, Map<string, number>>();
    filteredSessions.forEach(session => {
      const date = new Date(session.createdAt).toLocaleDateString();

      if (!timelineMap.has(date)) {
        timelineMap.set(date, new Map());
      }

      const characterMap = timelineMap.get(date)!;
      const count = characterMap.get(session.characterId) || 0;
      characterMap.set(session.characterId, count + session.messageCount);
    });

    const timeline: Array<{ date: string; count: number; character: string }> = [];
    timelineMap.forEach((characterMap, date) => {
      characterMap.forEach((count, character) => {
        timeline.push({ date, count, character });
      });
    });

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get all messages for sentiment and topic analysis
    const allMessages: Message[] = [];
    filteredSessions.forEach(session => {
      allMessages.push(...session.messages.map(m => ({
        ...m,
        timestamp: m.timestamp || session.createdAt,
        characterId: session.characterId
      })));
    });

    // Calculate sentiment
    const sentimentAnalysis = analyzeSentiment(allMessages.map(m => m.text).join(' '));
    const trend = allMessages.length > 0 ? calculateSentimentTrend(allMessages) : 'stable';

    // Get recent messages for average (last 7 days)
    const recentDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentMessages = allMessages.filter(m => (m.timestamp || 0) >= recentDate);
    const recentSentiment = analyzeSentiment(recentMessages.map(m => m.text).join(' '));

    const sentiment = {
      score: sentimentAnalysis.score,
      trend,
      recentAverage: recentSentiment.score
    };

    // Extract topics
    const topics = extractTopKeywords(allMessages);

    // Calculate character usage
    const characterCounts = new Map<string, number>();
    filteredSessions.forEach(session => {
      const count = characterCounts.get(session.characterId) || 0;
      characterCounts.set(session.characterId, count + 1);
    });

    const totalSessions = filteredSessions.length;
    const characterUsage = Array.from(characterCounts.entries()).map(([character, count]) => ({
      character: CHARACTERS.find(c => c.id === character)?.name || character,
      count,
      percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0
    }));

    return {
      timeline,
      sentiment,
      topics,
      characterUsage
    };
  }

  /**
   * Calculate overall session statistics for insights
   * @returns Statistics summary
   */
  static calculateSessionStats(): {
    totalSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
    avgConversationDuration: number;
    oldestSession: number;
    newestSession: number;
  } {
    const sessions = this.getAllSessions();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        avgMessagesPerSession: 0,
        avgConversationDuration: 0,
        oldestSession: 0,
        newestSession: 0
      };
    }

    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    let totalDuration = 0;
    let sessionsWithDuration = 0;

    sessions.forEach(session => {
      if (session.messages.length > 1) {
        const first = session.messages[0];
        const last = session.messages[session.messages.length - 1];
        if (first.timestamp && last.timestamp) {
          totalDuration += (last.timestamp - first.timestamp);
          sessionsWithDuration++;
        }
      }
    });

    return {
      totalSessions: sessions.length,
      totalMessages,
      avgMessagesPerSession: Math.round(totalMessages / sessions.length),
      avgConversationDuration: sessionsWithDuration > 0
        ? Math.round(totalDuration / sessionsWithDuration)
        : 0,
      oldestSession: Math.min(...sessions.map(s => s.createdAt)),
      newestSession: Math.max(...sessions.map(s => s.updatedAt))
    };
  }
}
