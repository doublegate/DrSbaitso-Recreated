/**
 * Advanced Conversation Insights Engine (v1.9.0)
 *
 * Provides sophisticated pattern recognition, conversation health analysis,
 * and predictive insights for Dr. Sbaitso conversations.
 *
 * Features:
 * - Conversation Health Score (0-100)
 * - Topic Clustering with TF-IDF-inspired algorithm
 * - Sentiment Trajectory Analysis
 * - Character Effectiveness Metrics
 * - Conversation Loop Detection
 * - Engagement Pattern Recognition
 */

import { Message, ConversationSession, SentimentAnalysis } from '../types';
import { analyzeSentiment } from './sentimentAnalysis';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationHealth {
  score: number; // 0-100
  breakdown: {
    sentimentBalance: number; // 0-100
    topicDiversity: number; // 0-100
    engagementLevel: number; // 0-100
    responsiveness: number; // 0-100
  };
  recommendation: string;
  concerns: string[];
}

export interface TopicCluster {
  topic: string;
  keywords: string[];
  frequency: number;
  sentiment: number; // -100 to +100
  sessions: string[];
  firstSeen: number;
  lastSeen: number;
}

export interface SentimentTrajectory {
  timeline: Array<{ timestamp: number; score: number; sessionId: string }>;
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  trendStrength: number; // 0-1
  volatility: number; // 0-1, how much scores vary
  recentAverage: number; // Last 5 data points
  overallAverage: number;
}

export interface CharacterEffectiveness {
  characterId: string;
  conversationCount: number;
  avgSessionLength: number; // messages per session
  avgSessionDuration: number; // milliseconds
  avgSentimentChange: number; // change from start to end of sessions
  userRetention: number; // percentage of sessions user continued past 5 messages
  effectiveness: number; // 0-100 composite score
}

export interface ConversationLoop {
  pattern: string[];
  occurrences: number;
  sessions: string[];
  avgPosition: number; // average message index where loop starts
  potentialCause: string;
}

export interface EngagementMetrics {
  avgMessageLength: number; // characters
  avgResponseTime: number; // milliseconds between messages
  avgSessionDuration: number; // milliseconds
  messageFrequency: Array<{ hour: number; count: number }>; // when user chats most
  peakEngagementTime: number | null; // hour of day (0-23)
  consistencyScore: number; // 0-100, how regular are conversation times
}

export interface InsightSummary {
  health: ConversationHealth;
  topTopics: TopicCluster[];
  sentimentTrend: SentimentTrajectory;
  characterPerformance: CharacterEffectiveness[];
  detectedLoops: ConversationLoop[];
  engagement: EngagementMetrics;
  generatedAt: number;
}

// ============================================================================
// CONVERSATION HEALTH ANALYSIS
// ============================================================================

export function calculateConversationHealth(
  sessions: ConversationSession[]
): ConversationHealth {
  if (sessions.length === 0) {
    return {
      score: 0,
      breakdown: {
        sentimentBalance: 0,
        topicDiversity: 0,
        engagementLevel: 0,
        responsiveness: 0,
      },
      recommendation: 'Start conversations to generate insights',
      concerns: [],
    };
  }

  const recentSessions = sessions.slice(-10); // Last 10 sessions
  const allMessages = recentSessions.flatMap((s) => s.messages);

  // 1. Sentiment Balance (0-100) - ideal is neutral to slightly positive
  const sentiments = allMessages
    .filter((m) => m.author === 'user')
    .map((m) => analyzeSentiment(m.text).score);
  const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length || 0;
  const sentimentBalance = Math.min(100, Math.max(0, 50 + avgSentiment / 2));

  // 2. Topic Diversity (0-100) - variety of discussion topics
  const topics = extractTopics(allMessages);
  const topicDiversity = Math.min(100, (topics.length / 10) * 100); // 10+ topics = perfect

  // 3. Engagement Level (0-100) - message count and session frequency
  const avgMessagesPerSession =
    recentSessions.reduce((sum, s) => sum + s.messageCount, 0) / recentSessions.length;
  const engagementLevel = Math.min(100, (avgMessagesPerSession / 20) * 100); // 20+ messages = perfect

  // 4. Responsiveness (0-100) - user continuing conversations
  const shortSessions = recentSessions.filter((s) => s.messageCount < 5).length;
  const responsiveness = Math.max(0, 100 - (shortSessions / recentSessions.length) * 100);

  // Overall score (weighted average)
  const score = Math.round(
    sentimentBalance * 0.3 +
      topicDiversity * 0.2 +
      engagementLevel * 0.3 +
      responsiveness * 0.2
  );

  // Generate recommendation
  const recommendation = getHealthRecommendation(score, {
    sentimentBalance,
    topicDiversity,
    engagementLevel,
    responsiveness,
  });

  // Identify concerns
  const concerns: string[] = [];
  if (sentimentBalance < 40) concerns.push('Low sentiment scores detected');
  if (topicDiversity < 30) concerns.push('Limited topic variety');
  if (engagementLevel < 40) concerns.push('Short conversations');
  if (responsiveness < 50) concerns.push('High abandonment rate');

  return {
    score,
    breakdown: {
      sentimentBalance: Math.round(sentimentBalance),
      topicDiversity: Math.round(topicDiversity),
      engagementLevel: Math.round(engagementLevel),
      responsiveness: Math.round(responsiveness),
    },
    recommendation,
    concerns,
  };
}

function getHealthRecommendation(
  score: number,
  breakdown: ConversationHealth['breakdown']
): string {
  if (score >= 80) return 'Excellent conversation health! Keep engaging.';
  if (score >= 60) return 'Good conversation patterns. Consider exploring new topics.';
  if (score >= 40) {
    if (breakdown.topicDiversity < 40)
      return 'Try discussing different topics to increase variety.';
    if (breakdown.sentimentBalance < 40)
      return 'Detected negative sentiment. Consider positive topics.';
    return 'Moderate health. Increase engagement length.';
  }
  return 'Low conversation health. Try longer, varied discussions.';
}

// ============================================================================
// TOPIC CLUSTERING
// ============================================================================

// Simple stop words to filter out
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
  'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'am', 'is', 'are', 'was', 'were',
  'im', 'dont', 'cant', 'wont', 'didnt', 'doesnt', 'isnt', 'arent', 'wasnt',
]);

function extractTopics(messages: Message[]): string[] {
  const text = messages
    .filter((m) => m.author === 'user')
    .map((m) => m.text.toLowerCase())
    .join(' ');

  const words = text
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  const wordFreq = new Map<string, number>();
  words.forEach((w) => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));

  // Return top words as topics
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

export function clusterTopics(sessions: ConversationSession[]): TopicCluster[] {
  const clusters = new Map<string, TopicCluster>();

  sessions.forEach((session) => {
    const messages = session.messages.filter((m) => m.author === 'user');
    const text = messages.map((m) => m.text.toLowerCase()).join(' ');
    const words = text
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    const wordFreq = new Map<string, number>();
    words.forEach((w) => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));

    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    topWords.forEach(([word, freq]) => {
      const existing = clusters.get(word);
      const sentiment = analyzeSentiment(messages.map(m => m.text).join(' ')).score;

      if (existing) {
        existing.frequency += freq;
        existing.sessions.push(session.id);
        existing.lastSeen = Math.max(existing.lastSeen, session.updatedAt);
        // Update average sentiment
        existing.sentiment =
          (existing.sentiment * (existing.sessions.length - 1) + sentiment) /
          existing.sessions.length;
      } else {
        clusters.set(word, {
          topic: word,
          keywords: [word],
          frequency: freq,
          sentiment,
          sessions: [session.id],
          firstSeen: session.createdAt,
          lastSeen: session.updatedAt,
        });
      }
    });
  });

  return Array.from(clusters.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20); // Top 20 topics
}

// ============================================================================
// SENTIMENT TRAJECTORY
// ============================================================================

export function analyzeSentimentTrajectory(
  sessions: ConversationSession[]
): SentimentTrajectory {
  if (sessions.length === 0) {
    return {
      timeline: [],
      trend: 'stable',
      trendStrength: 0,
      volatility: 0,
      recentAverage: 0,
      overallAverage: 0,
    };
  }

  // Calculate sentiment for each session
  const timeline = sessions.map((session) => ({
    timestamp: session.updatedAt,
    score: analyzeSentiment(session.messages.filter((m) => m.author === 'user').map(m => m.text).join(' ')).score,
    sessionId: session.id,
  }));

  const scores = timeline.map((t) => t.score);
  const overallAverage = scores.reduce((a, b) => a + b, 0) / scores.length;
  const recentScores = scores.slice(-5);
  const recentAverage = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

  // Calculate trend using linear regression
  const trend = calculateTrend(scores);
  const volatility = calculateVolatility(scores);

  return {
    timeline,
    trend: trend.direction,
    trendStrength: trend.strength,
    volatility,
    recentAverage,
    overallAverage,
  };
}

function calculateTrend(scores: number[]): {
  direction: 'improving' | 'declining' | 'stable' | 'volatile';
  strength: number;
} {
  if (scores.length < 3) return { direction: 'stable', strength: 0 };

  // Simple linear regression
  const n = scores.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = scores.reduce((a, b) => a + b, 0) / n;

  const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (scores[i] - yMean), 0);
  const denominator = xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  const slope = numerator / denominator;

  const strength = Math.min(1, Math.abs(slope) / 20); // Normalize to 0-1

  if (Math.abs(slope) < 2) return { direction: 'stable', strength };
  if (calculateVolatility(scores) > 0.6) return { direction: 'volatile', strength };
  if (slope > 0) return { direction: 'improving', strength };
  return { direction: 'declining', strength };
}

function calculateVolatility(scores: number[]): number {
  if (scores.length < 2) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  return Math.min(1, stdDev / 50); // Normalize to 0-1
}

// ============================================================================
// CHARACTER EFFECTIVENESS
// ============================================================================

export function analyzeCharacterEffectiveness(
  sessions: ConversationSession[]
): CharacterEffectiveness[] {
  const characterStats = new Map<string, {
    sessions: ConversationSession[];
    sentimentChanges: number[];
    continuedSessions: number;
  }>();

  sessions.forEach((session) => {
    const existing = characterStats.get(session.characterId) || {
      sessions: [],
      sentimentChanges: [],
      continuedSessions: 0,
    };

    existing.sessions.push(session);

    // Calculate sentiment change
    const userMessages = session.messages.filter((m) => m.author === 'user');
    if (userMessages.length >= 2) {
      const firstHalf = userMessages.slice(0, Math.floor(userMessages.length / 2));
      const secondHalf = userMessages.slice(Math.floor(userMessages.length / 2));
      const firstSentiment = analyzeSentiment(firstHalf.map(m => m.text).join(' ')).score;
      const secondSentiment = analyzeSentiment(secondHalf.map(m => m.text).join(' ')).score;
      existing.sentimentChanges.push(secondSentiment - firstSentiment);
    }

    if (session.messageCount > 5) {
      existing.continuedSessions++;
    }

    characterStats.set(session.characterId, existing);
  });

  return Array.from(characterStats.entries()).map(([characterId, stats]) => {
    const avgSessionLength =
      stats.sessions.reduce((sum, s) => sum + s.messageCount, 0) / stats.sessions.length;
    const avgSessionDuration =
      stats.sessions
        .filter((s) => s.endedAt && s.startedAt)
        .reduce((sum, s) => sum + ((s.endedAt || 0) - (s.startedAt || 0)), 0) /
      stats.sessions.length;
    const avgSentimentChange =
      stats.sentimentChanges.reduce((a, b) => a + b, 0) / stats.sentimentChanges.length || 0;
    const userRetention = (stats.continuedSessions / stats.sessions.length) * 100;

    // Composite effectiveness score
    const effectiveness = Math.round(
      Math.min(
        100,
        (avgSessionLength / 20) * 30 + // 30% weight: longer sessions
          Math.min(50 + avgSentimentChange, 100) * 0.4 + // 40% weight: positive sentiment change
          userRetention * 0.3 // 30% weight: retention
      )
    );

    return {
      characterId,
      conversationCount: stats.sessions.length,
      avgSessionLength,
      avgSessionDuration,
      avgSentimentChange,
      userRetention,
      effectiveness,
    };
  }).sort((a, b) => b.effectiveness - a.effectiveness);
}

// ============================================================================
// CONVERSATION LOOP DETECTION
// ============================================================================

export function detectConversationLoops(sessions: ConversationSession[]): ConversationLoop[] {
  const patterns = new Map<string, ConversationLoop>();

  sessions.forEach((session) => {
    const userMessages = session.messages
      .filter((m) => m.author === 'user')
      .map((m) => m.text.toLowerCase().trim());

    // Look for repeated sequences (3+ messages)
    for (let len = 3; len <= Math.min(5, userMessages.length - 1); len++) {
      for (let i = 0; i <= userMessages.length - len * 2; i++) {
        const pattern = userMessages.slice(i, i + len);
        const next = userMessages.slice(i + len, i + len * 2);

        if (arraysEqual(pattern, next)) {
          const key = pattern.join('|');
          const existing = patterns.get(key);

          if (existing) {
            existing.occurrences++;
            existing.sessions.push(session.id);
            existing.avgPosition = (existing.avgPosition + i) / 2;
          } else {
            patterns.set(key, {
              pattern,
              occurrences: 1,
              sessions: [session.id],
              avgPosition: i,
              potentialCause: inferLoopCause(pattern),
            });
          }
        }
      }
    }
  });

  return Array.from(patterns.values())
    .filter((loop) => loop.occurrences >= 2)
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 10);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

function inferLoopCause(pattern: string[]): string {
  const text = pattern.join(' ');
  if (text.includes('why') || text.includes('how')) return 'Seeking repeated clarification';
  if (text.includes('help') || text.includes('what')) return 'Stuck on problem';
  if (text.length < 20) return 'Short repetitive inputs';
  return 'Recurring topic of interest';
}

// ============================================================================
// ENGAGEMENT METRICS
// ============================================================================

export function analyzeEngagementMetrics(sessions: ConversationSession[]): EngagementMetrics {
  if (sessions.length === 0) {
    return {
      avgMessageLength: 0,
      avgResponseTime: 0,
      avgSessionDuration: 0,
      messageFrequency: [],
      peakEngagementTime: null,
      consistencyScore: 0,
    };
  }

  // Average message length
  const allUserMessages = sessions.flatMap((s) =>
    s.messages.filter((m) => m.author === 'user')
  );
  const avgMessageLength =
    allUserMessages.reduce((sum, m) => sum + m.text.length, 0) / allUserMessages.length || 0;

  // Average response time (estimated based on message timestamps if available)
  const avgResponseTime = 5000; // Placeholder: would need message-level timestamps

  // Average session duration
  const sessionsWithDuration = sessions.filter((s) => s.endedAt && s.startedAt);
  const avgSessionDuration =
    sessionsWithDuration.reduce((sum, s) => sum + ((s.endedAt || 0) - (s.startedAt || 0)), 0) /
    sessionsWithDuration.length || 0;

  // Message frequency by hour
  const hourCounts = new Array(24).fill(0);
  sessions.forEach((s) => {
    const hour = new Date(s.createdAt).getHours();
    hourCounts[hour] += s.messageCount;
  });
  const messageFrequency = hourCounts.map((count, hour) => ({ hour, count }));
  const peakEngagementTime = hourCounts.indexOf(Math.max(...hourCounts));

  // Consistency score (based on variance in session times)
  const sessionHours = sessions.map((s) => new Date(s.createdAt).getHours());
  const hourMean = sessionHours.reduce((a, b) => a + b, 0) / sessionHours.length;
  const hourVariance =
    sessionHours.reduce((sum, h) => sum + (h - hourMean) ** 2, 0) / sessionHours.length;
  const consistencyScore = Math.max(0, 100 - hourVariance * 2);

  return {
    avgMessageLength,
    avgResponseTime,
    avgSessionDuration,
    messageFrequency,
    peakEngagementTime,
    consistencyScore,
  };
}

// ============================================================================
// COMPREHENSIVE INSIGHT GENERATION
// ============================================================================

export function generateInsightSummary(sessions: ConversationSession[]): InsightSummary {
  return {
    health: calculateConversationHealth(sessions),
    topTopics: clusterTopics(sessions),
    sentimentTrend: analyzeSentimentTrajectory(sessions),
    characterPerformance: analyzeCharacterEffectiveness(sessions),
    detectedLoops: detectConversationLoops(sessions),
    engagement: analyzeEngagementMetrics(sessions),
    generatedAt: Date.now(),
  };
}
