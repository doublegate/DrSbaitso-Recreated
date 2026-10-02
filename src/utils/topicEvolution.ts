/**
 * Topic Evolution Tracking (v1.10.0)
 *
 * Analyzes how conversation topics emerge, evolve, and decline over time.
 * Provides timeline visualization data for topic progression.
 */

import type { ConversationSession, Message } from '@/types';

export interface TopicOccurrence {
  topic: string;
  timestamp: number;
  messageIndex: number;
  intensity: number; // 0-100, based on keyword density
}

export interface TopicTimeline {
  topic: string;
  firstAppearance: number;
  lastAppearance: number;
  occurrences: TopicOccurrence[];
  peakIntensity: number;
  averageIntensity: number;
  totalMentions: number;
}

export interface TopicTransition {
  fromTopic: string;
  toTopic: string;
  timestamp: number;
  messageIndex: number;
  transitionType: 'shift' | 'emergence' | 'decline';
}

export interface TopicEvolution {
  timelines: TopicTimeline[];
  transitions: TopicTransition[];
  dominantTopics: string[]; // Top 5 by total mentions
  emergingTopics: string[]; // Topics gaining intensity
  decliningTopics: string[]; // Topics losing intensity
}

// Topic keyword categories for detection
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'mental_health': [
    'anxiety', 'depression', 'stress', 'worry', 'therapy', 'counseling',
    'mental', 'emotional', 'feelings', 'mood', 'psychology', 'psychiatrist'
  ],
  'relationships': [
    'relationship', 'family', 'friend', 'partner', 'spouse', 'boyfriend',
    'girlfriend', 'marriage', 'divorce', 'parent', 'child', 'sibling'
  ],
  'work_career': [
    'work', 'job', 'career', 'boss', 'coworker', 'office', 'business',
    'employee', 'employer', 'project', 'deadline', 'meeting', 'promotion'
  ],
  'health': [
    'health', 'sick', 'illness', 'disease', 'doctor', 'hospital', 'medicine',
    'pain', 'symptom', 'treatment', 'diagnosis', 'medical', 'wellness'
  ],
  'technology': [
    'computer', 'software', 'programming', 'code', 'internet', 'website',
    'app', 'digital', 'tech', 'ai', 'robot', 'algorithm', 'data'
  ],
  'education': [
    'school', 'college', 'university', 'student', 'teacher', 'study',
    'class', 'exam', 'grade', 'homework', 'learn', 'education', 'degree'
  ],
  'finance': [
    'money', 'finance', 'budget', 'debt', 'loan', 'bank', 'credit',
    'savings', 'investment', 'cost', 'expensive', 'cheap', 'pay', 'bill'
  ],
  'hobbies_leisure': [
    'hobby', 'game', 'sport', 'music', 'art', 'movie', 'book', 'travel',
    'vacation', 'entertainment', 'fun', 'play', 'relax', 'enjoy'
  ],
  'life_goals': [
    'goal', 'dream', 'ambition', 'future', 'plan', 'hope', 'aspiration',
    'success', 'achieve', 'accomplish', 'purpose', 'meaning', 'change'
  ],
  'personal_growth': [
    'growth', 'improve', 'better', 'change', 'develop', 'progress',
    'self', 'identity', 'confidence', 'skill', 'learning', 'motivation'
  ]
};

/**
 * Detect topics in a message based on keyword matching
 */
function detectTopicsInMessage(message: Message): Map<string, number> {
  const text = message.text.toLowerCase();
  const words = text.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);

  const topicScores = new Map<string, number>();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let matches = 0;
    for (const word of words) {
      if (keywords.includes(word)) {
        matches++;
      }
    }

    if (matches > 0) {
      // Calculate intensity as percentage of message that's topic-related
      const intensity = Math.min(100, Math.round((matches / words.length) * 300));
      topicScores.set(topic, intensity);
    }
  }

  return topicScores;
}

/**
 * Analyze topic evolution across a conversation session
 */
export function analyzeTopicEvolution(session: ConversationSession): TopicEvolution {
  const messages = session.messages;
  const topicTimelines = new Map<string, TopicTimeline>();
  const transitions: TopicTransition[] = [];

  let previousDominantTopic: string | null = null;

  // Process each message
  messages.forEach((message, index) => {
    const timestamp = message.timestamp || Date.now();
    const topics = detectTopicsInMessage(message);

    // Update timelines for detected topics
    topics.forEach((intensity, topic) => {
      if (!topicTimelines.has(topic)) {
        topicTimelines.set(topic, {
          topic,
          firstAppearance: timestamp,
          lastAppearance: timestamp,
          occurrences: [],
          peakIntensity: 0,
          averageIntensity: 0,
          totalMentions: 0
        });
      }

      const timeline = topicTimelines.get(topic)!;
      timeline.lastAppearance = timestamp;
      timeline.occurrences.push({
        topic,
        timestamp,
        messageIndex: index,
        intensity
      });
      timeline.peakIntensity = Math.max(timeline.peakIntensity, intensity);
      timeline.totalMentions++;
    });

    // Detect topic transitions
    if (topics.size > 0) {
      // Find dominant topic in this message
      const dominantTopic = Array.from(topics.entries())
        .sort((a, b) => b[1] - a[1])[0][0];

      if (previousDominantTopic && previousDominantTopic !== dominantTopic) {
        // Topic shift detected
        transitions.push({
          fromTopic: previousDominantTopic,
          toTopic: dominantTopic,
          timestamp,
          messageIndex: index,
          transitionType: 'shift'
        });
      } else if (!previousDominantTopic) {
        // Topic emergence (first topic in conversation)
        transitions.push({
          fromTopic: '',
          toTopic: dominantTopic,
          timestamp,
          messageIndex: index,
          transitionType: 'emergence'
        });
      }

      previousDominantTopic = dominantTopic;
    }
  });

  // Calculate average intensities
  topicTimelines.forEach(timeline => {
    const totalIntensity = timeline.occurrences.reduce((sum, occ) => sum + occ.intensity, 0);
    timeline.averageIntensity = Math.round(totalIntensity / timeline.occurrences.length);
  });

  // Sort timelines by total mentions
  const sortedTimelines = Array.from(topicTimelines.values())
    .sort((a, b) => b.totalMentions - a.totalMentions);

  // Identify dominant topics (top 5)
  const dominantTopics = sortedTimelines
    .slice(0, 5)
    .map(t => t.topic);

  // Identify emerging topics (intensity increasing in recent messages)
  const emergingTopics = sortedTimelines
    .filter(timeline => {
      if (timeline.occurrences.length < 3) return false;

      const recent = timeline.occurrences.slice(-3);
      const earlier = timeline.occurrences.slice(0, 3);

      const recentAvg = recent.reduce((sum, o) => sum + o.intensity, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, o) => sum + o.intensity, 0) / earlier.length;

      return recentAvg > earlierAvg * 1.3; // 30% increase
    })
    .slice(0, 3)
    .map(t => t.topic);

  // Identify declining topics (intensity decreasing)
  const decliningTopics = sortedTimelines
    .filter(timeline => {
      if (timeline.occurrences.length < 3) return false;

      const recent = timeline.occurrences.slice(-3);
      const earlier = timeline.occurrences.slice(0, 3);

      const recentAvg = recent.reduce((sum, o) => sum + o.intensity, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, o) => sum + o.intensity, 0) / earlier.length;

      return recentAvg < earlierAvg * 0.7; // 30% decrease
    })
    .slice(0, 3)
    .map(t => t.topic);

  return {
    timelines: sortedTimelines,
    transitions,
    dominantTopics,
    emergingTopics,
    decliningTopics
  };
}

/**
 * Analyze topic evolution across multiple sessions
 */
export function analyzeMultiSessionTopicEvolution(sessions: ConversationSession[]): TopicEvolution {
  // Merge all sessions into a virtual mega-session
  const allMessages: Message[] = [];

  sessions
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach(session => {
      allMessages.push(...session.messages);
    });

  const virtualSession: ConversationSession = {
    id: 'multi-session',
    name: 'Multi-Session Analysis',
    characterId: sessions[0]?.characterId || 'sbaitso',
    themeId: sessions[0]?.themeId || 'dos-blue',
    audioQualityId: sessions[0]?.audioQualityId || 'authentic',
    createdAt: sessions[0]?.createdAt || Date.now(),
    updatedAt: sessions[sessions.length - 1]?.updatedAt || Date.now(),
    messages: allMessages,
    messageCount: allMessages.length,
    glitchCount: 0
  };

  return analyzeTopicEvolution(virtualSession);
}

/**
 * Get topic evolution summary for display
 */
export function getTopicEvolutionSummary(evolution: TopicEvolution): string {
  const { dominantTopics, emergingTopics, decliningTopics, transitions } = evolution;

  const parts: string[] = [];

  if (dominantTopics.length > 0) {
    const formatted = dominantTopics.map(t => t.replace(/_/g, ' ')).join(', ');
    parts.push(`Dominant topics: ${formatted}`);
  }

  if (emergingTopics.length > 0) {
    const formatted = emergingTopics.map(t => t.replace(/_/g, ' ')).join(', ');
    parts.push(`Emerging: ${formatted}`);
  }

  if (decliningTopics.length > 0) {
    const formatted = decliningTopics.map(t => t.replace(/_/g, ' ')).join(', ');
    parts.push(`Declining: ${formatted}`);
  }

  if (transitions.length > 0) {
    parts.push(`${transitions.length} topic transitions detected`);
  }

  return parts.join(' • ');
}

/**
 * Format topic name for display
 */
export function formatTopicName(topic: string): string {
  return topic
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get color for topic visualization
 */
export function getTopicColor(topic: string): string {
  const colors: Record<string, string> = {
    mental_health: '#9370DB',    // Purple
    relationships: '#FF69B4',    // Pink
    work_career: '#4169E1',      // Royal Blue
    health: '#32CD32',           // Lime Green
    technology: '#00CED1',       // Dark Turquoise
    education: '#FFD700',        // Gold
    finance: '#228B22',          // Forest Green
    hobbies_leisure: '#FF8C00',  // Dark Orange
    life_goals: '#DC143C',       // Crimson
    personal_growth: '#8A2BE2'   // Blue Violet
  };

  return colors[topic] || '#808080'; // Gray as fallback
}
