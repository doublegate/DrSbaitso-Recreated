import { describe, it, expect } from 'vitest';
import type { ConversationSession } from '@/types';
import {
  calculateSessionSimilarity,
  findSimilarSessions,
  clusterConversations,
  detectRecurringPatterns,
  getSimilarityAnalysisSummary
} from '@/utils/similarityScoring';

describe('similarityScoring', () => {
  const createMockSession = (
    id: string,
    messages: string[],
    characterId: string = 'sbaitso'
  ): ConversationSession => ({
    id,
    name: 'Test Session',
    characterId,
    themeId: 'dos-blue',
    audioQualityId: 'authentic',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: messages.map((text, index) => ({
      text,
      author: index % 2 === 0 ? 'user' : 'dr',
      timestamp: Date.now() + index * 1000
    })),
    messageCount: messages.length,
    glitchCount: 0
  });

  describe('calculateSessionSimilarity', () => {
    it('should return high similarity for identical sessions', () => {
      const session1 = createMockSession('1', [
        'I am feeling anxious today',
        'Tell me about your anxiety'
      ]);

      const session2 = createMockSession('2', [
        'I am feeling anxious today',
        'Tell me about your anxiety'
      ]);

      const result = calculateSessionSimilarity(session1, session2);

      expect(result.overallScore).toBeGreaterThan(70);
      expect(result.topicSimilarity).toBeGreaterThan(70);
    });

    it('should return low similarity for different sessions', () => {
      const session1 = createMockSession('1', [
        'I love programming and coding'
      ]);

      const session2 = createMockSession('2', [
        'I am sad about my family'
      ]);

      const result = calculateSessionSimilarity(session1, session2);

      expect(result.overallScore).toBeLessThan(50);
    });

    it('should compare topic similarity', () => {
      const session1 = createMockSession('1', [
        'mental health anxiety stress'
      ]);

      const session2 = createMockSession('2', [
        'mental health depression worry'
      ]);

      const result = calculateSessionSimilarity(session1, session2);

      expect(result.topicSimilarity).toBeGreaterThan(30);
    });

    it('should detect character match', () => {
      const session1 = createMockSession('1', ['test'], 'sbaitso');
      const session2 = createMockSession('2', ['test'], 'sbaitso');

      const result = calculateSessionSimilarity(session1, session2);

      expect(result.characterMatch).toBe(true);
    });

    it('should detect character mismatch', () => {
      const session1 = createMockSession('1', ['test'], 'sbaitso');
      const session2 = createMockSession('2', ['test'], 'eliza');

      const result = calculateSessionSimilarity(session1, session2);

      expect(result.characterMatch).toBe(false);
    });

    it('should include session IDs in result', () => {
      const session1 = createMockSession('session-1', ['test']);
      const session2 = createMockSession('session-2', ['test']);

      const result = calculateSessionSimilarity(session1, session2);

      expect(result.sessionId1).toBe('session-1');
      expect(result.sessionId2).toBe('session-2');
    });

    it('should calculate length similarity', () => {
      const session1 = createMockSession('1', ['a', 'b', 'c', 'd', 'e']);
      const session2 = createMockSession('2', ['x', 'y', 'z']);

      const result = calculateSessionSimilarity(session1, session2);

      expect(result.lengthSimilarity).toBeGreaterThan(0);
      expect(result.lengthSimilarity).toBeLessThan(100);
    });

    it('should return all required similarity components', () => {
      const session1 = createMockSession('1', ['test']);
      const session2 = createMockSession('2', ['test']);

      const result = calculateSessionSimilarity(session1, session2);

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('topicSimilarity');
      expect(result).toHaveProperty('sentimentSimilarity');
      expect(result).toHaveProperty('emotionSimilarity');
      expect(result).toHaveProperty('lengthSimilarity');
      expect(result).toHaveProperty('characterMatch');
    });
  });

  describe('findSimilarSessions', () => {
    it('should find similar sessions', () => {
      const target = createMockSession('target', [
        'I am anxious about my health'
      ]);

      const allSessions = [
        createMockSession('1', ['I am worried about my health']),
        createMockSession('2', ['I love programming']),
        createMockSession('3', ['Health anxiety is common'])
      ];

      const result = findSimilarSessions(target, allSessions, 5);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].overallScore).toBeGreaterThanOrEqual(result[result.length - 1].overallScore);
    });

    it('should exclude target session from results', () => {
      const target = createMockSession('target', ['test']);
      const allSessions = [
        target,
        createMockSession('1', ['test'])
      ];

      const result = findSimilarSessions(target, allSessions, 5);

      expect(result.every(r => r.sessionId1 !== 'target' && r.sessionId2 !== 'target')).toBe(false);
      expect(result.every(r => r.sessionId2 !== 'target')).toBe(true);
    });

    it('should limit results to specified count', () => {
      const target = createMockSession('target', ['test']);
      const allSessions = Array.from({ length: 10 }, (_, i) =>
        createMockSession(`${i}`, ['test'])
      );

      const result = findSimilarSessions(target, allSessions, 3);

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should sort by descending similarity', () => {
      const target = createMockSession('target', ['health anxiety']);
      const allSessions = [
        createMockSession('1', ['completely different topic']),
        createMockSession('2', ['health anxiety stress']),
        createMockSession('3', ['health'])
      ];

      const result = findSimilarSessions(target, allSessions, 5);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].overallScore).toBeGreaterThanOrEqual(result[i].overallScore);
      }
    });
  });

  describe('clusterConversations', () => {
    it('should create clusters of similar sessions', () => {
      const sessions = [
        createMockSession('1', ['health anxiety stress']),
        createMockSession('2', ['health worry concern']),
        createMockSession('3', ['programming code software']),
        createMockSession('4', ['programming development technology'])
      ];

      const result = clusterConversations(sessions, 40);

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(cluster => cluster.sessions.length > 0)).toBe(true);
    });

    it('should include common topics in clusters', () => {
      const sessions = [
        createMockSession('1', ['health health health']),
        createMockSession('2', ['health health health'])
      ];

      const result = clusterConversations(sessions, 50);

      if (result.length > 0) {
        expect(result[0].commonTopics.length).toBeGreaterThan(0);
      }
    });

    it('should calculate average sentiment for clusters', () => {
      const sessions = [
        createMockSession('1', ['I am happy']),
        createMockSession('2', ['I am sad'])
      ];

      const result = clusterConversations(sessions, 30);

      result.forEach(cluster => {
        expect(cluster.averageSentiment).toBeDefined();
        expect(typeof cluster.averageSentiment).toBe('number');
      });
    });

    it('should identify dominant emotion in clusters', () => {
      const sessions = [
        createMockSession('1', ['happy joyful']),
        createMockSession('2', ['happy excited'])
      ];

      const result = clusterConversations(sessions, 30);

      result.forEach(cluster => {
        expect(cluster.dominantEmotion).toBeDefined();
        expect(typeof cluster.dominantEmotion).toBe('string');
      });
    });

    it('should handle empty session array', () => {
      const result = clusterConversations([], 50);

      expect(result).toHaveLength(0);
    });

    it('should sort clusters by size', () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createMockSession(`${i}`, ['test message'])
      );

      const result = clusterConversations(sessions, 70);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].size).toBeGreaterThanOrEqual(result[i].size);
      }
    });
  });

  describe('detectRecurringPatterns', () => {
    it('should detect recurring phrases', () => {
      const sessions = [
        createMockSession('1', ['I feel anxious about this']),
        createMockSession('2', ['I feel anxious about that']),
        createMockSession('3', ['I feel anxious about everything'])
      ];

      const result = detectRecurringPatterns(sessions, 3);

      expect(result.length).toBeGreaterThan(0);
      const anxiousPattern = result.find(p => p.pattern.includes('feel anxious'));
      expect(anxiousPattern).toBeDefined();
    });

    it('should track pattern occurrences', () => {
      const sessions = [
        createMockSession('1', ['mental health']),
        createMockSession('2', ['mental health']),
        createMockSession('3', ['mental health'])
      ];

      const result = detectRecurringPatterns(sessions, 3);

      const mentalHealthPattern = result.find(p => p.pattern === 'mental health');
      expect(mentalHealthPattern).toBeDefined();
      expect(mentalHealthPattern!.occurrences).toBeGreaterThanOrEqual(3);
    });

    it('should calculate confidence scores', () => {
      const sessions = [
        createMockSession('1', ['common phrase']),
        createMockSession('2', ['common phrase'])
      ];

      const result = detectRecurringPatterns(sessions, 2);

      result.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should include session IDs for patterns', () => {
      const sessions = [
        createMockSession('session-1', ['test pattern']),
        createMockSession('session-2', ['test pattern']),
        createMockSession('session-3', ['test pattern'])
      ];

      const result = detectRecurringPatterns(sessions, 3);

      if (result.length > 0) {
        expect(Array.isArray(result[0].sessions)).toBe(true);
        expect(result[0].sessions.length).toBeGreaterThan(0);
      }
    });

    it('should handle minimum occurrence threshold', () => {
      const sessions = [
        createMockSession('1', ['rare phrase']),
        createMockSession('2', ['common common common']),
        createMockSession('3', ['common common common'])
      ];

      const result = detectRecurringPatterns(sessions, 2);

      const rarePattern = result.find(p => p.pattern === 'rare phrase');
      expect(rarePattern).toBeUndefined();
    });

    it('should limit results to top patterns', () => {
      const sessions = Array.from({ length: 100 }, (_, i) =>
        createMockSession(`${i}`, [`pattern${i % 25} word`])
      );

      const result = detectRecurringPatterns(sessions, 3);

      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should sort by confidence', () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createMockSession(`${i}`, ['test phrase'])
      );

      const result = detectRecurringPatterns(sessions, 3);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].confidence).toBeGreaterThanOrEqual(result[i].confidence);
      }
    });
  });

  describe('getSimilarityAnalysisSummary', () => {
    it('should indicate insufficient sessions', () => {
      const summary = getSimilarityAnalysisSummary([]);

      expect(summary).toContain('Not enough sessions');
    });

    it('should include cluster information', () => {
      const sessions = [
        createMockSession('1', ['health anxiety']),
        createMockSession('2', ['health worry'])
      ];

      const summary = getSimilarityAnalysisSummary(sessions);

      expect(summary).toBeTruthy();
    });

    it('should include pattern information', () => {
      const sessions = [
        createMockSession('1', ['feel anxious']),
        createMockSession('2', ['feel anxious']),
        createMockSession('3', ['feel anxious'])
      ];

      const summary = getSimilarityAnalysisSummary(sessions);

      expect(summary).toContain('recurring patterns');
    });
  });
});
