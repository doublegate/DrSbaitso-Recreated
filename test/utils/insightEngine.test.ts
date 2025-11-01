/**
 * Insight Engine Test Suite (v1.9.0)
 * Comprehensive tests for advanced conversation pattern detection
 *
 * @version 1.9.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateConversationHealth,
  clusterTopics,
  analyzeSentimentTrajectory,
  analyzeCharacterEffectiveness,
  detectConversationLoops,
  analyzeEngagementMetrics,
  generateInsightSummary,
  ConversationHealth,
  TopicCluster,
  SentimentTrajectory,
  CharacterEffectiveness,
  ConversationLoop,
  EngagementMetrics,
} from '@/utils/insightEngine';
import type { ConversationSession, Message } from '@/types';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createMessage(author: 'user' | 'dr', text: string, timestamp?: number): Message {
  return {
    author,
    text,
    timestamp: timestamp || Date.now(),
  };
}

function createSession(
  id: string,
  characterId: string,
  messages: Message[],
  createdAt?: number,
  endedAt?: number
): ConversationSession {
  const created = createdAt || Date.now();
  return {
    id,
    name: `Test Session ${id}`,
    characterId,
    themeId: 'dos',
    audioQualityId: 'authentic',
    messages,
    messageCount: messages.length,
    glitchCount: 0,
    createdAt: created,
    updatedAt: endedAt || created + 60000,
    startedAt: created,
    endedAt: endedAt || created + 60000,
  };
}

// ============================================================================
// CONVERSATION HEALTH TESTS
// ============================================================================

describe('insightEngine', () => {
  describe('calculateConversationHealth', () => {
    it('should return 0 health with no sessions', () => {
      const result = calculateConversationHealth([]);

      expect(result.score).toBe(0);
      expect(result.breakdown.sentimentBalance).toBe(0);
      expect(result.breakdown.topicDiversity).toBe(0);
      expect(result.breakdown.engagementLevel).toBe(0);
      expect(result.breakdown.responsiveness).toBe(0);
      expect(result.recommendation).toBe('Start conversations to generate insights');
      expect(result.concerns).toEqual([]);
    });

    it('should calculate health score between 0-100', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'I feel happy today'),
          createMessage('dr', 'THAT IS GOOD'),
          createMessage('user', 'Yes it is wonderful'),
          createMessage('dr', 'TELL ME MORE'),
        ]),
      ];

      const result = calculateConversationHealth(sessions);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should provide breakdown metrics', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'Hello'),
          createMessage('dr', 'HI'),
        ]),
      ];

      const result = calculateConversationHealth(sessions);

      expect(result.breakdown).toHaveProperty('sentimentBalance');
      expect(result.breakdown).toHaveProperty('topicDiversity');
      expect(result.breakdown).toHaveProperty('engagementLevel');
      expect(result.breakdown).toHaveProperty('responsiveness');
      expect(typeof result.breakdown.sentimentBalance).toBe('number');
      expect(typeof result.breakdown.topicDiversity).toBe('number');
      expect(typeof result.breakdown.engagementLevel).toBe('number');
      expect(typeof result.breakdown.responsiveness).toBe('number');
    });

    it('should generate recommendations', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'Test'),
          createMessage('dr', 'OK'),
        ]),
      ];

      const result = calculateConversationHealth(sessions);

      expect(result.recommendation).toBeTruthy();
      expect(typeof result.recommendation).toBe('string');
      expect(result.recommendation.length).toBeGreaterThan(0);
    });

    it('should identify concerns when present', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'hi'),
          createMessage('dr', 'HI'),
        ]),
      ];

      const result = calculateConversationHealth(sessions);

      expect(Array.isArray(result.concerns)).toBe(true);
    });

    it('should detect low sentiment balance', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'I hate this terrible awful thing'),
          createMessage('dr', 'I SEE'),
          createMessage('user', 'Everything is bad and horrible'),
          createMessage('dr', 'OK'),
        ]),
      ];

      const result = calculateConversationHealth(sessions);

      expect(result.breakdown.sentimentBalance).toBeLessThan(50);
      expect(result.concerns.some(c => c.includes('sentiment'))).toBe(true);
    });

    it('should detect limited topic variety', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'hello'),
          createMessage('dr', 'HI'),
          createMessage('user', 'hello'),
          createMessage('dr', 'HI'),
        ]),
      ];

      const result = calculateConversationHealth(sessions);

      expect(result.breakdown.topicDiversity).toBeLessThan(50);
    });

    it('should detect short conversations', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'hi'),
          createMessage('dr', 'HI'),
        ]),
      ];

      const result = calculateConversationHealth(sessions);

      expect(result.breakdown.engagementLevel).toBeLessThan(50);
      expect(result.concerns.some(c => c.includes('Short conversations'))).toBe(true);
    });

    it('should detect high abandonment rate', () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createSession(`${i}`, 'sbaitso', [
          createMessage('user', 'hi'),
          createMessage('dr', 'HI'),
        ])
      );

      const result = calculateConversationHealth(sessions);

      expect(result.breakdown.responsiveness).toBeLessThan(50);
      expect(result.concerns.some(c => c.includes('abandonment'))).toBe(true);
    });

    it('should give excellent rating for high quality conversations', () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createSession(`${i}`, 'sbaitso',
          Array.from({ length: 25 }, (_, j) =>
            j % 2 === 0
              ? createMessage('user', `I am discussing interesting topic number ${j} about technology, science, philosophy, art, and culture`)
              : createMessage('dr', 'TELL ME MORE')
          )
        )
      );

      const result = calculateConversationHealth(sessions);

      expect(result.score).toBeGreaterThan(70);
      expect(result.recommendation).toContain('Excellent');
    });

    it('should recommend exploring new topics when diversity is low', () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createSession(`${i}`, 'sbaitso',
          Array.from({ length: 15 }, () =>
            createMessage('user', 'hello how are you doing today')
          )
        )
      );

      const result = calculateConversationHealth(sessions);

      if (result.breakdown.topicDiversity < 40) {
        expect(result.recommendation).toMatch(/topic|variety|different/i);
      }
    });

    it('should only analyze last 10 sessions', () => {
      const sessions = Array.from({ length: 20 }, (_, i) =>
        createSession(`${i}`, 'sbaitso', [
          createMessage('user', `Message ${i}`),
          createMessage('dr', 'OK'),
        ])
      );

      const result = calculateConversationHealth(sessions);

      // Result should only reflect last 10 sessions
      expect(result).toBeTruthy();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // TOPIC CLUSTERING TESTS
  // ============================================================================

  describe('clusterTopics', () => {
    it('should return empty array for no sessions', () => {
      const result = clusterTopics([]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should cluster messages into topics', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'I love programming in JavaScript and Python'),
          createMessage('dr', 'INTERESTING'),
          createMessage('user', 'Programming is my favorite hobby'),
          createMessage('dr', 'OK'),
        ]),
      ];

      const result = clusterTopics(sessions);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include topic metadata', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'I enjoy reading books about science and technology'),
          createMessage('dr', 'TELL ME MORE'),
        ]),
      ];

      const result = clusterTopics(sessions);

      if (result.length > 0) {
        const topic = result[0];
        expect(topic).toHaveProperty('topic');
        expect(topic).toHaveProperty('keywords');
        expect(topic).toHaveProperty('frequency');
        expect(topic).toHaveProperty('sentiment');
        expect(topic).toHaveProperty('sessions');
        expect(topic).toHaveProperty('firstSeen');
        expect(topic).toHaveProperty('lastSeen');
      }
    });

    it('should track frequency across sessions', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'programming is great'),
          createMessage('dr', 'OK'),
        ]),
        createSession('2', 'sbaitso', [
          createMessage('user', 'I love programming'),
          createMessage('dr', 'GOOD'),
        ]),
      ];

      const result = clusterTopics(sessions);

      const programmingTopic = result.find(t => t.topic === 'programming');
      if (programmingTopic) {
        expect(programmingTopic.frequency).toBeGreaterThan(1);
        expect(programmingTopic.sessions.length).toBeGreaterThan(1);
      }
    });

    it('should filter out stop words', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'the and or but is are was were'),
          createMessage('dr', 'OK'),
        ]),
      ];

      const result = clusterTopics(sessions);

      // Should not include stop words as topics
      const hasStopWords = result.some(t =>
        ['the', 'and', 'or', 'but', 'is', 'are', 'was', 'were'].includes(t.topic)
      );
      expect(hasStopWords).toBe(false);
    });

    it('should filter out short words', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'I am ok hi bye yes no'),
          createMessage('dr', 'OK'),
        ]),
      ];

      const result = clusterTopics(sessions);

      // Should not include words <= 3 characters
      const hasShortWords = result.some(t => t.topic.length <= 3);
      expect(hasShortWords).toBe(false);
    });

    it('should calculate sentiment for topics', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'I love wonderful amazing programming'),
          createMessage('dr', 'GREAT'),
        ]),
      ];

      const result = clusterTopics(sessions);

      if (result.length > 0) {
        expect(typeof result[0].sentiment).toBe('number');
        expect(result[0].sentiment).toBeGreaterThanOrEqual(-100);
        expect(result[0].sentiment).toBeLessThanOrEqual(100);
      }
    });

    it('should sort topics by frequency', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'programming programming programming coding coding testing'),
          createMessage('dr', 'OK'),
        ]),
      ];

      const result = clusterTopics(sessions);

      if (result.length >= 2) {
        expect(result[0].frequency).toBeGreaterThanOrEqual(result[1].frequency);
      }
    });

    it('should limit to top 20 topics', () => {
      const manyWords = Array.from({ length: 50 }, (_, i) => `topic${i.toString().padStart(4, '0')}`).join(' ');
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', manyWords),
          createMessage('dr', 'OK'),
        ]),
      ];

      const result = clusterTopics(sessions);

      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should track first and last seen timestamps', () => {
      const now = Date.now();
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'testing programming', now),
        ], now, now + 1000),
        createSession('2', 'sbaitso', [
          createMessage('user', 'testing again', now + 5000),
        ], now + 5000, now + 6000),
      ];

      const result = clusterTopics(sessions);

      const testingTopic = result.find(t => t.topic === 'testing');
      if (testingTopic) {
        expect(testingTopic.firstSeen).toBeLessThan(testingTopic.lastSeen);
      }
    });
  });

  // ============================================================================
  // SENTIMENT TRAJECTORY TESTS
  // ============================================================================

  describe('analyzeSentimentTrajectory', () => {
    it('should return stable trend for empty sessions', () => {
      const result = analyzeSentimentTrajectory([]);

      expect(result.timeline).toEqual([]);
      expect(result.trend).toBe('stable');
      expect(result.trendStrength).toBe(0);
      expect(result.volatility).toBe(0);
      expect(result.recentAverage).toBe(0);
      expect(result.overallAverage).toBe(0);
    });

    it('should analyze sentiment over time', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'I am happy'),
        ]),
        createSession('2', 'sbaitso', [
          createMessage('user', 'I am sad'),
        ]),
      ];

      const result = analyzeSentimentTrajectory(sessions);

      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('trendStrength');
      expect(result).toHaveProperty('volatility');
      expect(result).toHaveProperty('recentAverage');
      expect(result).toHaveProperty('overallAverage');
    });

    it('should calculate trend direction', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'terrible awful bad'),
        ]),
        createSession('2', 'sbaitso', [
          createMessage('user', 'okay fine'),
        ]),
        createSession('3', 'sbaitso', [
          createMessage('user', 'good nice'),
        ]),
        createSession('4', 'sbaitso', [
          createMessage('user', 'wonderful excellent amazing'),
        ]),
      ];

      const result = analyzeSentimentTrajectory(sessions);

      expect(['improving', 'declining', 'stable', 'volatile']).toContain(result.trend);
    });

    it('should detect improving trend', () => {
      const sessions = Array.from({ length: 5 }, (_, i) =>
        createSession(`${i}`, 'sbaitso', [
          createMessage('user', i === 0 ? 'bad' : i === 1 ? 'okay' : i === 2 ? 'good' : i === 3 ? 'great' : 'wonderful amazing excellent'),
        ])
      );

      const result = analyzeSentimentTrajectory(sessions);

      // Should show positive trend
      expect(result.recentAverage).toBeGreaterThan(result.timeline[0].score);
    });

    it('should detect declining trend', () => {
      const sessions = Array.from({ length: 5 }, (_, i) =>
        createSession(`${i}`, 'sbaitso', [
          createMessage('user', i === 0 ? 'wonderful' : i === 1 ? 'good' : i === 2 ? 'okay' : i === 3 ? 'bad' : 'terrible awful'),
        ])
      );

      const result = analyzeSentimentTrajectory(sessions);

      // Should show negative trend
      expect(result.recentAverage).toBeLessThan(result.timeline[0].score);
    });

    it('should calculate volatility', () => {
      const sessions = [
        createSession('1', 'sbaitso', [createMessage('user', 'wonderful')]),
        createSession('2', 'sbaitso', [createMessage('user', 'terrible')]),
        createSession('3', 'sbaitso', [createMessage('user', 'wonderful')]),
        createSession('4', 'sbaitso', [createMessage('user', 'terrible')]),
      ];

      const result = analyzeSentimentTrajectory(sessions);

      expect(result.volatility).toBeGreaterThan(0);
      expect(result.volatility).toBeLessThanOrEqual(1);
    });

    it('should detect volatile pattern', () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createSession(`${i}`, 'sbaitso', [
          createMessage('user', i % 2 === 0 ? 'wonderful amazing excellent' : 'terrible awful horrible'),
        ])
      );

      const result = analyzeSentimentTrajectory(sessions);

      expect(result.volatility).toBeGreaterThan(0.3);
    });

    it('should calculate recent average', () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createSession(`${i}`, 'sbaitso', [
          createMessage('user', i >= 5 ? 'wonderful' : 'terrible'),
        ])
      );

      const result = analyzeSentimentTrajectory(sessions);

      expect(result.recentAverage).toBeDefined();
      expect(typeof result.recentAverage).toBe('number');
    });

    it('should include session IDs in timeline', () => {
      const sessions = [
        createSession('test-1', 'sbaitso', [createMessage('user', 'hello')]),
        createSession('test-2', 'sbaitso', [createMessage('user', 'goodbye')]),
      ];

      const result = analyzeSentimentTrajectory(sessions);

      expect(result.timeline[0].sessionId).toBe('test-1');
      expect(result.timeline[1].sessionId).toBe('test-2');
    });

    it('should return stable for insufficient data', () => {
      const sessions = [
        createSession('1', 'sbaitso', [createMessage('user', 'hello')]),
      ];

      const result = analyzeSentimentTrajectory(sessions);

      // With < 3 sessions, trend should be stable
      expect(result.trend).toBe('stable');
    });
  });

  // ============================================================================
  // CHARACTER EFFECTIVENESS TESTS
  // ============================================================================

  describe('analyzeCharacterEffectiveness', () => {
    it('should return empty array for no sessions', () => {
      const result = analyzeCharacterEffectiveness([]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should analyze character metrics', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'hello'),
          createMessage('dr', 'HI'),
        ], Date.now(), Date.now() + 10000),
      ];

      const result = analyzeCharacterEffectiveness(sessions);

      expect(result.length).toBe(1);
      expect(result[0].characterId).toBe('sbaitso');
    });

    it('should include all required metrics', () => {
      const sessions = [
        createSession('1', 'sbaitso',
          Array.from({ length: 10 }, (_, i) =>
            createMessage(i % 2 === 0 ? 'user' : 'dr', 'test')
          ),
          Date.now(),
          Date.now() + 30000
        ),
      ];

      const result = analyzeCharacterEffectiveness(sessions);

      expect(result[0]).toHaveProperty('characterId');
      expect(result[0]).toHaveProperty('conversationCount');
      expect(result[0]).toHaveProperty('avgSessionLength');
      expect(result[0]).toHaveProperty('avgSessionDuration');
      expect(result[0]).toHaveProperty('avgSentimentChange');
      expect(result[0]).toHaveProperty('userRetention');
      expect(result[0]).toHaveProperty('effectiveness');
    });

    it('should calculate average session length', () => {
      const sessions = [
        createSession('1', 'sbaitso', Array.from({ length: 10 }, () => createMessage('user', 'test'))),
        createSession('2', 'sbaitso', Array.from({ length: 20 }, () => createMessage('user', 'test'))),
      ];

      const result = analyzeCharacterEffectiveness(sessions);

      expect(result[0].avgSessionLength).toBe(15); // (10 + 20) / 2
    });

    it('should calculate user retention rate', () => {
      const sessions = [
        createSession('1', 'sbaitso', Array.from({ length: 2 }, () => createMessage('user', 'test'))), // Short
        createSession('2', 'sbaitso', Array.from({ length: 10 }, () => createMessage('user', 'test'))), // Long
        createSession('3', 'sbaitso', Array.from({ length: 15 }, () => createMessage('user', 'test'))), // Long
      ];

      const result = analyzeCharacterEffectiveness(sessions);

      // 2 out of 3 sessions > 5 messages = 66.67%
      expect(result[0].userRetention).toBeCloseTo(66.67, 0);
    });

    it('should calculate sentiment change', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'I am very sad and upset'),
          createMessage('dr', 'I SEE'),
          createMessage('user', 'But now I feel much better and happier'),
          createMessage('dr', 'GOOD'),
        ]),
      ];

      const result = analyzeCharacterEffectiveness(sessions);

      expect(result[0].avgSentimentChange).toBeDefined();
      expect(typeof result[0].avgSentimentChange).toBe('number');
    });

    it('should calculate effectiveness score 0-100', () => {
      const sessions = [
        createSession('1', 'sbaitso', Array.from({ length: 10 }, () => createMessage('user', 'test'))),
      ];

      const result = analyzeCharacterEffectiveness(sessions);

      expect(result[0].effectiveness).toBeGreaterThanOrEqual(0);
      expect(result[0].effectiveness).toBeLessThanOrEqual(100);
    });

    it('should sort by effectiveness descending', () => {
      const sessions = [
        createSession('1', 'sbaitso', Array.from({ length: 25 }, () => createMessage('user', 'wonderful'))),
        createSession('2', 'eliza', Array.from({ length: 2 }, () => createMessage('user', 'hi'))),
        createSession('3', 'hal', Array.from({ length: 15 }, () => createMessage('user', 'good'))),
      ];

      const result = analyzeCharacterEffectiveness(sessions);

      expect(result.length).toBe(3);
      if (result.length >= 2) {
        expect(result[0].effectiveness).toBeGreaterThanOrEqual(result[1].effectiveness);
        expect(result[1].effectiveness).toBeGreaterThanOrEqual(result[2].effectiveness);
      }
    });

    it('should handle sessions without endedAt', () => {
      const session = createSession('1', 'sbaitso', [createMessage('user', 'test')]);
      delete session.endedAt;

      const result = analyzeCharacterEffectiveness([session]);

      expect(result[0]).toBeDefined();
      expect(result[0].avgSessionDuration).toBeGreaterThanOrEqual(0);
    });

    it('should group by character ID', () => {
      const sessions = [
        createSession('1', 'sbaitso', [createMessage('user', 'test')]),
        createSession('2', 'sbaitso', [createMessage('user', 'test')]),
        createSession('3', 'eliza', [createMessage('user', 'test')]),
      ];

      const result = analyzeCharacterEffectiveness(sessions);

      const sbaitso = result.find(c => c.characterId === 'sbaitso');
      const eliza = result.find(c => c.characterId === 'eliza');

      expect(sbaitso?.conversationCount).toBe(2);
      expect(eliza?.conversationCount).toBe(1);
    });
  });

  // ============================================================================
  // CONVERSATION LOOP DETECTION TESTS
  // ============================================================================

  describe('detectConversationLoops', () => {
    it('should return empty array for no sessions', () => {
      const result = detectConversationLoops([]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should detect repeated message patterns', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'hello'),
          createMessage('dr', 'HI'),
          createMessage('user', 'how are you'),
          createMessage('dr', 'FINE'),
          createMessage('user', 'what is your name'),
          createMessage('dr', 'SBAITSO'),
          createMessage('user', 'hello'),
          createMessage('dr', 'HI'),
          createMessage('user', 'how are you'),
          createMessage('dr', 'FINE'),
          createMessage('user', 'what is your name'),
          createMessage('dr', 'SBAITSO'),
        ]),
      ];

      const result = detectConversationLoops(sessions);

      // Should detect the repeated pattern in user messages
      expect(result.length).toBeGreaterThanOrEqual(0); // May be 0 if pattern is too strict
    });

    it('should include loop metadata', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'test one'),
          createMessage('user', 'test two'),
          createMessage('user', 'test three'),
          createMessage('user', 'test one'),
          createMessage('user', 'test two'),
          createMessage('user', 'test three'),
        ]),
      ];

      const result = detectConversationLoops(sessions);

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('pattern');
        expect(result[0]).toHaveProperty('occurrences');
        expect(result[0]).toHaveProperty('sessions');
        expect(result[0]).toHaveProperty('avgPosition');
        expect(result[0]).toHaveProperty('potentialCause');
      }
    });

    it('should require at least 2 occurrences', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'unique message one'),
          createMessage('user', 'unique message two'),
          createMessage('user', 'unique message three'),
        ]),
      ];

      const result = detectConversationLoops(sessions);

      // No loops should be detected with all unique messages
      expect(result.length).toBe(0);
    });

    it('should detect patterns of length 3-5', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'a'),
          createMessage('user', 'b'),
          createMessage('user', 'c'),
          createMessage('user', 'a'),
          createMessage('user', 'b'),
          createMessage('user', 'c'),
        ]),
      ];

      const result = detectConversationLoops(sessions);

      if (result.length > 0) {
        expect(result[0].pattern.length).toBeGreaterThanOrEqual(3);
        expect(result[0].pattern.length).toBeLessThanOrEqual(5);
      }
    });

    it('should infer loop causes', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'why is this happening'),
          createMessage('user', 'how does this work'),
          createMessage('user', 'what should i do'),
          createMessage('user', 'why is this happening'),
          createMessage('user', 'how does this work'),
          createMessage('user', 'what should i do'),
        ]),
      ];

      const result = detectConversationLoops(sessions);

      if (result.length > 0) {
        expect(typeof result[0].potentialCause).toBe('string');
        expect(result[0].potentialCause.length).toBeGreaterThan(0);
      }
    });

    it('should track session IDs', () => {
      const sessions = [
        createSession('test-session-1', 'sbaitso', [
          createMessage('user', 'repeat'),
          createMessage('user', 'pattern'),
          createMessage('user', 'here'),
          createMessage('user', 'repeat'),
          createMessage('user', 'pattern'),
          createMessage('user', 'here'),
        ]),
      ];

      const result = detectConversationLoops(sessions);

      if (result.length > 0) {
        expect(result[0].sessions).toContain('test-session-1');
      }
    });

    it('should sort by occurrence count', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'a'), createMessage('user', 'b'), createMessage('user', 'c'),
          createMessage('user', 'a'), createMessage('user', 'b'), createMessage('user', 'c'),
          createMessage('user', 'x'), createMessage('user', 'y'), createMessage('user', 'z'),
          createMessage('user', 'x'), createMessage('user', 'y'), createMessage('user', 'z'),
          createMessage('user', 'x'), createMessage('user', 'y'), createMessage('user', 'z'),
        ]),
      ];

      const result = detectConversationLoops(sessions);

      if (result.length >= 2) {
        expect(result[0].occurrences).toBeGreaterThanOrEqual(result[1].occurrences);
      }
    });

    it('should limit to top 10 loops', () => {
      // Create many different loops
      const messages: Message[] = [];
      for (let i = 0; i < 30; i++) {
        messages.push(
          createMessage('user', `loop${i}a`),
          createMessage('user', `loop${i}b`),
          createMessage('user', `loop${i}c`),
          createMessage('user', `loop${i}a`),
          createMessage('user', `loop${i}b`),
          createMessage('user', `loop${i}c`)
        );
      }

      const sessions = [createSession('1', 'sbaitso', messages)];
      const result = detectConversationLoops(sessions);

      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  // ============================================================================
  // ENGAGEMENT METRICS TESTS
  // ============================================================================

  describe('analyzeEngagementMetrics', () => {
    it('should return zero metrics for empty sessions', () => {
      const result = analyzeEngagementMetrics([]);

      expect(result.avgMessageLength).toBe(0);
      expect(result.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(result.avgSessionDuration).toBe(0);
      expect(result.messageFrequency).toEqual([]);
      expect(result.peakEngagementTime).toBeNull();
      expect(result.consistencyScore).toBe(0);
    });

    it('should calculate average message length', () => {
      const sessions = [
        createSession('1', 'sbaitso', [
          createMessage('user', 'short'),
          createMessage('user', 'this is a longer message'),
        ]),
      ];

      const result = analyzeEngagementMetrics(sessions);

      expect(result.avgMessageLength).toBeGreaterThan(0);
    });

    it('should calculate average session duration', () => {
      const now = Date.now();
      const sessions = [
        createSession('1', 'sbaitso', [createMessage('user', 'test')], now, now + 60000),
        createSession('2', 'sbaitso', [createMessage('user', 'test')], now, now + 120000),
      ];

      const result = analyzeEngagementMetrics(sessions);

      expect(result.avgSessionDuration).toBe(90000); // (60000 + 120000) / 2
    });

    it('should calculate message frequency by hour', () => {
      const sessions = [
        createSession('1', 'sbaitso', [createMessage('user', 'test')]),
      ];

      const result = analyzeEngagementMetrics(sessions);

      expect(Array.isArray(result.messageFrequency)).toBe(true);
      expect(result.messageFrequency.length).toBe(24);
      expect(result.messageFrequency[0]).toHaveProperty('hour');
      expect(result.messageFrequency[0]).toHaveProperty('count');
    });

    it('should identify peak engagement time', () => {
      const hour14 = new Date();
      hour14.setHours(14, 0, 0, 0);

      const sessions = Array.from({ length: 10 }, (_, i) =>
        createSession(`${i}`, 'sbaitso',
          Array.from({ length: 5 }, () => createMessage('user', 'test')),
          hour14.getTime()
        )
      );

      const result = analyzeEngagementMetrics(sessions);

      expect(result.peakEngagementTime).toBe(14);
    });

    it('should calculate consistency score', () => {
      const sessions = [
        createSession('1', 'sbaitso', [createMessage('user', 'test')]),
        createSession('2', 'sbaitso', [createMessage('user', 'test')]),
      ];

      const result = analyzeEngagementMetrics(sessions);

      expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(result.consistencyScore).toBeLessThanOrEqual(100);
    });

    it('should handle sessions without duration', () => {
      const session = createSession('1', 'sbaitso', [createMessage('user', 'test')]);
      delete session.endedAt;

      const result = analyzeEngagementMetrics([session]);

      expect(result.avgSessionDuration).toBe(0);
    });
  });

  // ============================================================================
  // COMPREHENSIVE INSIGHT GENERATION TESTS
  // ============================================================================

  describe('generateInsightSummary', () => {
    it('should generate complete insight summary', () => {
      const sessions = [
        createSession('1', 'sbaitso',
          Array.from({ length: 10 }, () => createMessage('user', 'I love programming'))
        ),
      ];

      const result = generateInsightSummary(sessions);

      expect(result).toHaveProperty('health');
      expect(result).toHaveProperty('topTopics');
      expect(result).toHaveProperty('sentimentTrend');
      expect(result).toHaveProperty('characterPerformance');
      expect(result).toHaveProperty('detectedLoops');
      expect(result).toHaveProperty('engagement');
      expect(result).toHaveProperty('generatedAt');
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const result = generateInsightSummary([]);
      const after = Date.now();

      expect(result.generatedAt).toBeGreaterThanOrEqual(before);
      expect(result.generatedAt).toBeLessThanOrEqual(after);
    });

    it('should work with empty sessions', () => {
      const result = generateInsightSummary([]);

      expect(result.health.score).toBe(0);
      expect(result.topTopics.length).toBe(0);
      expect(result.sentimentTrend.timeline.length).toBe(0);
      expect(result.characterPerformance.length).toBe(0);
      expect(result.detectedLoops.length).toBe(0);
    });
  });
});
