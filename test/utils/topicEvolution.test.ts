import { describe, it, expect } from 'vitest';
import type { ConversationSession } from '@/types';
import {
  analyzeTopicEvolution,
  analyzeMultiSessionTopicEvolution,
  getTopicEvolutionSummary,
  formatTopicName,
  getTopicColor
} from '@/utils/topicEvolution';

describe('topicEvolution', () => {
  const createMockSession = (messages: Array<{ text: string; timestamp?: number }>): ConversationSession => ({
    id: 'test-session',
    name: 'Test Session',
    characterId: 'sbaitso',
    themeId: 'dos-blue',
    audioQualityId: 'authentic',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: messages.map((msg, index) => ({
      text: msg.text,
      author: index % 2 === 0 ? 'user' : 'dr',
      timestamp: msg.timestamp || Date.now() + index * 1000
    })),
    messageCount: messages.length,
    glitchCount: 0
  });

  describe('analyzeTopicEvolution', () => {
    it('should detect mental health topics', () => {
      const session = createMockSession([
        { text: 'I have been feeling a lot of anxiety lately' },
        { text: 'Tell me more about your anxiety' },
        { text: 'My stress levels are very high' }
      ]);

      const result = analyzeTopicEvolution(session);
      const mentalHealthTimeline = result.timelines.find(t => t.topic === 'mental_health');

      expect(mentalHealthTimeline).toBeDefined();
      expect(mentalHealthTimeline!.totalMentions).toBeGreaterThan(0);
    });

    it('should detect relationship topics', () => {
      const session = createMockSession([
        { text: 'My relationship with my family is strained' },
        { text: 'How is your relationship with your partner?' },
        { text: 'My friend is having marriage problems' }
      ]);

      const result = analyzeTopicEvolution(session);
      const relationshipTimeline = result.timelines.find(t => t.topic === 'relationships');

      expect(relationshipTimeline).toBeDefined();
      expect(relationshipTimeline!.totalMentions).toBeGreaterThan(0);
    });

    it('should detect work/career topics', () => {
      const session = createMockSession([
        { text: 'My job is very stressful' },
        { text: 'I have a big project deadline coming up' },
        { text: 'My boss expects too much from me' }
      ]);

      const result = analyzeTopicEvolution(session);
      const workTimeline = result.timelines.find(t => t.topic === 'work_career');

      expect(workTimeline).toBeDefined();
      expect(workTimeline!.totalMentions).toBeGreaterThan(0);
    });

    it('should track topic occurrences over time', () => {
      const session = createMockSession([
        { text: 'I am worried about my health', timestamp: 1000 },
        { text: 'My health is improving', timestamp: 2000 },
        { text: 'I saw a doctor about my health', timestamp: 3000 }
      ]);

      const result = analyzeTopicEvolution(session);
      const healthTimeline = result.timelines.find(t => t.topic === 'health');

      expect(healthTimeline).toBeDefined();
      expect(healthTimeline!.occurrences).toHaveLength(3);
      expect(healthTimeline!.firstAppearance).toBe(1000);
      expect(healthTimeline!.lastAppearance).toBe(3000);
    });

    it('should calculate peak and average intensity', () => {
      const session = createMockSession([
        { text: 'health health health' }, // High intensity
        { text: 'health' } // Lower intensity
      ]);

      const result = analyzeTopicEvolution(session);
      const healthTimeline = result.timelines.find(t => t.topic === 'health');

      expect(healthTimeline).toBeDefined();
      expect(healthTimeline!.peakIntensity).toBeGreaterThan(0);
      expect(healthTimeline!.averageIntensity).toBeGreaterThan(0);
    });

    it('should detect topic transitions', () => {
      const session = createMockSession([
        { text: 'I am worried about my health', timestamp: 1000 },
        { text: 'OK', timestamp: 2000 },
        { text: 'Now I need to talk about my job', timestamp: 3000 }
      ]);

      const result = analyzeTopicEvolution(session);

      expect(result.transitions.length).toBeGreaterThan(0);
      expect(result.transitions.some(t => t.transitionType === 'shift')).toBe(true);
    });

    it('should identify dominant topics', () => {
      const session = createMockSession([
        { text: 'mental health anxiety stress worry' },
        { text: 'more mental health discussion' },
        { text: 'relationship family' }
      ]);

      const result = analyzeTopicEvolution(session);

      expect(result.dominantTopics).toBeDefined();
      expect(result.dominantTopics.length).toBeGreaterThan(0);
      expect(result.dominantTopics[0]).toBe('mental_health');
    });

    it('should handle empty session', () => {
      const session = createMockSession([]);

      const result = analyzeTopicEvolution(session);

      expect(result.timelines).toHaveLength(0);
      expect(result.transitions).toHaveLength(0);
      expect(result.dominantTopics).toHaveLength(0);
    });

    it('should handle session with no topics', () => {
      const session = createMockSession([
        { text: 'hello' },
        { text: 'goodbye' }
      ]);

      const result = analyzeTopicEvolution(session);

      expect(result.timelines).toHaveLength(0);
      expect(result.dominantTopics).toHaveLength(0);
    });

    it('should sort timelines by total mentions', () => {
      const session = createMockSession([
        { text: 'health health health health' },
        { text: 'work' }
      ]);

      const result = analyzeTopicEvolution(session);

      if (result.timelines.length > 1) {
        for (let i = 1; i < result.timelines.length; i++) {
          expect(result.timelines[i - 1].totalMentions).toBeGreaterThanOrEqual(
            result.timelines[i].totalMentions
          );
        }
      }
    });
  });

  describe('analyzeMultiSessionTopicEvolution', () => {
    it('should merge multiple sessions chronologically', () => {
      const session1 = createMockSession([
        { text: 'health topic in first session', timestamp: 1000 }
      ]);

      const session2 = createMockSession([
        { text: 'health topic in second session', timestamp: 2000 }
      ]);

      const result = analyzeMultiSessionTopicEvolution([session1, session2]);
      const healthTimeline = result.timelines.find(t => t.topic === 'health');

      expect(healthTimeline).toBeDefined();
      expect(healthTimeline!.totalMentions).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty session array', () => {
      const result = analyzeMultiSessionTopicEvolution([]);

      expect(result.timelines).toHaveLength(0);
      expect(result.transitions).toHaveLength(0);
    });
  });

  describe('getTopicEvolutionSummary', () => {
    it('should generate summary with dominant topics', () => {
      const evolution = {
        timelines: [],
        transitions: [],
        dominantTopics: ['mental_health', 'relationships'],
        emergingTopics: [],
        decliningTopics: []
      };

      const summary = getTopicEvolutionSummary(evolution);

      expect(summary).toContain('mental health');
      expect(summary).toContain('relationships');
    });

    it('should include emerging topics', () => {
      const evolution = {
        timelines: [],
        transitions: [],
        dominantTopics: [],
        emergingTopics: ['technology'],
        decliningTopics: []
      };

      const summary = getTopicEvolutionSummary(evolution);

      expect(summary).toContain('Emerging');
      expect(summary).toContain('technology');
    });

    it('should include declining topics', () => {
      const evolution = {
        timelines: [],
        transitions: [],
        dominantTopics: [],
        emergingTopics: [],
        decliningTopics: ['work_career']
      };

      const summary = getTopicEvolutionSummary(evolution);

      expect(summary).toContain('Declining');
      expect(summary).toContain('work career');
    });

    it('should include transition count', () => {
      const evolution = {
        timelines: [],
        transitions: [
          { fromTopic: 'health', toTopic: 'work_career', timestamp: 1000, messageIndex: 0, transitionType: 'shift' as const }
        ],
        dominantTopics: [],
        emergingTopics: [],
        decliningTopics: []
      };

      const summary = getTopicEvolutionSummary(evolution);

      expect(summary).toContain('1 topic transitions');
    });
  });

  describe('formatTopicName', () => {
    it('should format topic name with underscores', () => {
      expect(formatTopicName('mental_health')).toBe('Mental Health');
    });

    it('should capitalize each word', () => {
      expect(formatTopicName('work_career')).toBe('Work Career');
    });

    it('should handle single word', () => {
      expect(formatTopicName('health')).toBe('Health');
    });
  });

  describe('getTopicColor', () => {
    it('should return color for known topics', () => {
      expect(getTopicColor('mental_health')).toBe('#9370DB');
      expect(getTopicColor('relationships')).toBe('#FF69B4');
      expect(getTopicColor('work_career')).toBe('#4169E1');
    });

    it('should return fallback color for unknown topic', () => {
      expect(getTopicColor('unknown_topic')).toBe('#808080');
    });
  });
});
