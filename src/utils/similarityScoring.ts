/**
 * Conversation Similarity Scoring (v1.10.0)
 *
 * Compares conversation sessions to identify similar discussions,
 * recurring patterns, and conversation clusters.
 */

import type { ConversationSession, Message } from '@/types';
import { analyzeSentiment } from './sentimentAnalysis';
import { detectEmotions } from './emotionDetection';

export interface SimilarityScore {
  sessionId1: string;
  sessionId2: string;
  overallScore: number; // 0-100
  topicSimilarity: number; // 0-100
  sentimentSimilarity: number; // 0-100
  emotionSimilarity: number; // 0-100
  lengthSimilarity: number; // 0-100
  characterMatch: boolean;
}

export interface ConversationCluster {
  id: string;
  sessions: string[]; // Session IDs
  commonTopics: string[];
  averageSentiment: number;
  dominantEmotion: string;
  size: number;
}

export interface RecurringPattern {
  pattern: string;
  occurrences: number;
  sessions: string[];
  confidence: number; // 0-100
}

// Simple keyword extraction for topic comparison
function extractKeywords(text: string): Map<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter short words

  // Common stop words to exclude
  const stopWords = new Set([
    'that', 'this', 'with', 'from', 'have', 'been', 'were', 'said',
    'will', 'would', 'could', 'about', 'what', 'when', 'where', 'which',
    'your', 'their', 'there', 'they', 'them', 'then', 'than', 'these',
    'those', 'very', 'just', 'even', 'also', 'only', 'much', 'more',
    'some', 'such', 'into', 'like', 'well', 'make', 'made', 'want',
    'need', 'know', 'think', 'tell', 'hello', 'okay'
  ]);

  const keywords = new Map<string, number>();

  words.forEach(word => {
    if (!stopWords.has(word)) {
      keywords.set(word, (keywords.get(word) || 0) + 1);
    }
  });

  return keywords;
}

/**
 * Calculate cosine similarity between two keyword frequency maps
 */
function calculateCosineSimilarity(
  keywords1: Map<string, number>,
  keywords2: Map<string, number>
): number {
  // Get all unique words
  const allWords = new Set([...keywords1.keys(), ...keywords2.keys()]);

  if (allWords.size === 0) return 0;

  // Create vectors
  const vector1: number[] = [];
  const vector2: number[] = [];

  allWords.forEach(word => {
    vector1.push(keywords1.get(word) || 0);
    vector2.push(keywords2.get(word) || 0);
  });

  // Calculate dot product
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return (dotProduct / (magnitude1 * magnitude2)) * 100;
}

/**
 * Extract text from all messages in a session
 */
function getSessionText(session: ConversationSession): string {
  return session.messages
    .map(m => m.text)
    .join(' ');
}

/**
 * Calculate average sentiment across session
 */
function getSessionSentiment(session: ConversationSession): number {
  const sentiments = session.messages.map(m => analyzeSentiment(m.text));
  const sum = sentiments.reduce((acc, s) => acc + s.score, 0);
  return sum / sentiments.length;
}

/**
 * Get dominant emotion across session
 */
function getSessionDominantEmotion(session: ConversationSession): string {
  const emotionCounts = new Map<string, number>();

  session.messages.forEach(message => {
    const emotions = detectEmotions(message.text);
    const dominant = emotions.dominant;
    emotionCounts.set(dominant, (emotionCounts.get(dominant) || 0) + 1);
  });

  let maxEmotion = 'neutral';
  let maxCount = 0;

  emotionCounts.forEach((count, emotion) => {
    if (count > maxCount) {
      maxCount = count;
      maxEmotion = emotion;
    }
  });

  return maxEmotion;
}

/**
 * Calculate similarity between two conversation sessions
 */
export function calculateSessionSimilarity(
  session1: ConversationSession,
  session2: ConversationSession
): SimilarityScore {
  // Topic similarity (via keyword overlap)
  const text1 = getSessionText(session1);
  const text2 = getSessionText(session2);
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);
  const topicSimilarity = calculateCosineSimilarity(keywords1, keywords2);

  // Sentiment similarity
  const sentiment1 = getSessionSentiment(session1);
  const sentiment2 = getSessionSentiment(session2);
  const sentimentDiff = Math.abs(sentiment1 - sentiment2);
  const sentimentSimilarity = Math.max(0, 100 - sentimentDiff);

  // Emotion similarity
  const emotion1 = getSessionDominantEmotion(session1);
  const emotion2 = getSessionDominantEmotion(session2);
  const emotionSimilarity = emotion1 === emotion2 ? 100 : 30; // Full match or partial credit

  // Length similarity (message count)
  const count1 = session1.messageCount;
  const count2 = session2.messageCount;
  const maxCount = Math.max(count1, count2);
  const minCount = Math.min(count1, count2);
  const lengthSimilarity = maxCount > 0 ? (minCount / maxCount) * 100 : 0;

  // Character match
  const characterMatch = session1.characterId === session2.characterId;

  // Overall score (weighted average)
  const overallScore = Math.round(
    topicSimilarity * 0.4 +
    sentimentSimilarity * 0.2 +
    emotionSimilarity * 0.2 +
    lengthSimilarity * 0.1 +
    (characterMatch ? 10 : 0)
  );

  return {
    sessionId1: session1.id,
    sessionId2: session2.id,
    overallScore,
    topicSimilarity: Math.round(topicSimilarity),
    sentimentSimilarity: Math.round(sentimentSimilarity),
    emotionSimilarity: Math.round(emotionSimilarity),
    lengthSimilarity: Math.round(lengthSimilarity),
    characterMatch
  };
}

/**
 * Find most similar sessions to a given session
 */
export function findSimilarSessions(
  targetSession: ConversationSession,
  allSessions: ConversationSession[],
  limit: number = 5
): SimilarityScore[] {
  const scores: SimilarityScore[] = [];

  allSessions.forEach(session => {
    if (session.id !== targetSession.id) {
      const score = calculateSessionSimilarity(targetSession, session);
      scores.push(score);
    }
  });

  return scores
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit);
}

/**
 * Cluster conversations by similarity
 */
export function clusterConversations(
  sessions: ConversationSession[],
  similarityThreshold: number = 60
): ConversationCluster[] {
  if (sessions.length === 0) return [];

  const clusters: ConversationCluster[] = [];
  const assigned = new Set<string>();

  sessions.forEach((session, index) => {
    if (assigned.has(session.id)) return;

    // Start new cluster with this session
    const clusterSessions = [session.id];
    assigned.add(session.id);

    // Find similar sessions
    sessions.forEach((otherSession, otherIndex) => {
      if (otherIndex <= index || assigned.has(otherSession.id)) return;

      const similarity = calculateSessionSimilarity(session, otherSession);

      if (similarity.overallScore >= similarityThreshold) {
        clusterSessions.push(otherSession.id);
        assigned.add(otherSession.id);
      }
    });

    // Extract common topics
    const allKeywords = new Map<string, number>();
    clusterSessions.forEach(sessionId => {
      const clusterSession = sessions.find(s => s.id === sessionId);
      if (clusterSession) {
        const text = getSessionText(clusterSession);
        const keywords = extractKeywords(text);
        keywords.forEach((count, word) => {
          allKeywords.set(word, (allKeywords.get(word) || 0) + count);
        });
      }
    });

    const commonTopics = Array.from(allKeywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    // Calculate average sentiment
    let totalSentiment = 0;
    const emotionCounts = new Map<string, number>();

    clusterSessions.forEach(sessionId => {
      const clusterSession = sessions.find(s => s.id === sessionId);
      if (clusterSession) {
        totalSentiment += getSessionSentiment(clusterSession);
        const emotion = getSessionDominantEmotion(clusterSession);
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
      }
    });

    const averageSentiment = totalSentiment / clusterSessions.length;

    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxEmotionCount = 0;
    emotionCounts.forEach((count, emotion) => {
      if (count > maxEmotionCount) {
        maxEmotionCount = count;
        dominantEmotion = emotion;
      }
    });

    clusters.push({
      id: `cluster-${clusters.length + 1}`,
      sessions: clusterSessions,
      commonTopics,
      averageSentiment: Math.round(averageSentiment),
      dominantEmotion,
      size: clusterSessions.length
    });
  });

  return clusters.sort((a, b) => b.size - a.size);
}

/**
 * Detect recurring patterns across conversations
 */
export function detectRecurringPatterns(
  sessions: ConversationSession[],
  minOccurrences: number = 3
): RecurringPattern[] {
  // Extract all phrases (2-4 word sequences)
  const phraseCounts = new Map<string, { count: number; sessions: Set<string> }>();

  sessions.forEach(session => {
    const text = getSessionText(session);
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Generate 2-word, 3-word, and 4-word phrases
    for (let len = 2; len <= 4; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');

        if (!phraseCounts.has(phrase)) {
          phraseCounts.set(phrase, { count: 0, sessions: new Set() });
        }

        const entry = phraseCounts.get(phrase)!;
        entry.count++;
        entry.sessions.add(session.id);
      }
    }
  });

  // Filter patterns that appear in multiple sessions
  const patterns: RecurringPattern[] = [];

  phraseCounts.forEach((data, phrase) => {
    const sessionCount = data.sessions.size;

    if (sessionCount >= minOccurrences) {
      // Calculate confidence based on how many sessions contain this pattern
      const confidence = Math.min(100, Math.round((sessionCount / sessions.length) * 200));

      patterns.push({
        pattern: phrase,
        occurrences: data.count,
        sessions: Array.from(data.sessions),
        confidence
      });
    }
  });

  return patterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 20); // Top 20 patterns
}

/**
 * Get similarity analysis summary
 */
export function getSimilarityAnalysisSummary(
  sessions: ConversationSession[]
): string {
  if (sessions.length < 2) {
    return 'Not enough sessions for similarity analysis';
  }

  const clusters = clusterConversations(sessions, 60);
  const patterns = detectRecurringPatterns(sessions, 3);

  const parts: string[] = [];

  if (clusters.length > 0) {
    parts.push(`${clusters.length} conversation clusters identified`);

    const largestCluster = clusters[0];
    if (largestCluster.size > 1) {
      parts.push(
        `Largest cluster: ${largestCluster.size} similar conversations about ${largestCluster.commonTopics[0] || 'various topics'}`
      );
    }
  }

  if (patterns.length > 0) {
    parts.push(`${patterns.length} recurring patterns detected`);

    const topPattern = patterns[0];
    if (topPattern) {
      parts.push(`Most common: "${topPattern.pattern}" (${topPattern.confidence}% confidence)`);
    }
  }

  return parts.join(' • ');
}
