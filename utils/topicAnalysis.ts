/**
 * Topic Analysis Utilities (v1.11.0 - Option C3)
 *
 * Analyzes conversation messages to extract topics, track topic transitions,
 * and identify topic clusters for visualization.
 */

export interface Topic {
  id: string;
  name: string;
  keywords: string[];
  frequency: number;
  firstMention: number;
  lastMention: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface TopicTransition {
  from: string;
  to: string;
  count: number;
  messages: number[];
}

export interface TopicCluster {
  id: string;
  topics: string[];
  centralTopic: string;
  cohesion: number;
}

export interface ConversationAnalysis {
  topics: Topic[];
  transitions: TopicTransition[];
  clusters: TopicCluster[];
  dominantTopic: string | null;
  topicDiversity: number;
}

/**
 * Common topic keywords for categorization
 */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  emotions: ['feel', 'feeling', 'emotion', 'happy', 'sad', 'angry', 'afraid', 'anxious', 'worried', 'excited', 'depressed', 'stressed'],
  relationships: ['family', 'friend', 'partner', 'relationship', 'marriage', 'divorce', 'parent', 'child', 'sibling', 'colleague', 'boss'],
  work: ['job', 'work', 'career', 'office', 'employee', 'manager', 'business', 'project', 'meeting', 'deadline', 'stress', 'salary'],
  health: ['health', 'doctor', 'medicine', 'therapy', 'treatment', 'illness', 'pain', 'hospital', 'medical', 'diagnosis', 'symptoms'],
  goals: ['goal', 'plan', 'future', 'dream', 'aspiration', 'achievement', 'success', 'ambition', 'motivation', 'progress'],
  problems: ['problem', 'issue', 'trouble', 'difficult', 'challenge', 'struggle', 'conflict', 'concern', 'worry', 'obstacle'],
  past: ['remember', 'memory', 'childhood', 'past', 'history', 'before', 'used to', 'grew up', 'reminisce'],
  present: ['now', 'today', 'currently', 'present', 'right now', 'at the moment', 'these days'],
  future: ['will', 'going to', 'plan to', 'hope to', 'want to', 'future', 'tomorrow', 'next', 'someday'],
  self: ['myself', 'identity', 'who am I', 'personality', 'character', 'values', 'beliefs', 'self-esteem', 'confidence'],
  social: ['people', 'society', 'community', 'social', 'friends', 'interaction', 'communication', 'conversation'],
  technology: ['computer', 'internet', 'phone', 'technology', 'digital', 'online', 'social media', 'app', 'software'],
  finance: ['money', 'financial', 'budget', 'savings', 'debt', 'income', 'expenses', 'investment', 'purchase'],
  education: ['school', 'college', 'university', 'study', 'learn', 'education', 'course', 'degree', 'teacher', 'student'],
  hobbies: ['hobby', 'interest', 'leisure', 'pastime', 'activity', 'recreation', 'fun', 'enjoy', 'like to']
};

/**
 * Analyze messages to extract topics
 */
export function analyzeTopics(messages: Array<{ author: string; text: string }>): ConversationAnalysis {
  const userMessages = messages.filter(m => m.author === 'user');

  if (userMessages.length === 0) {
    return {
      topics: [],
      transitions: [],
      clusters: [],
      dominantTopic: null,
      topicDiversity: 0
    };
  }

  // Extract topics from messages
  const topics = extractTopics(userMessages);

  // Analyze topic transitions
  const transitions = analyzeTransitions(userMessages, topics);

  // Identify topic clusters
  const clusters = identifyCluster(topics, transitions);

  // Calculate topic diversity (0-1, higher = more diverse)
  const topicDiversity = calculateTopicDiversity(topics);

  // Find dominant topic
  const dominantTopic = topics.length > 0
    ? topics.reduce((max, t) => (t.frequency > max.frequency ? t : max), topics[0]).id
    : null;

  return {
    topics,
    transitions,
    clusters,
    dominantTopic,
    topicDiversity
  };
}

/**
 * Extract topics from messages
 */
function extractTopics(messages: Array<{ author: string; text: string }>): Topic[] {
  const topicMap = new Map<string, {
    keywords: Set<string>;
    frequency: number;
    firstMention: number;
    lastMention: number;
    sentimentScore: number;
  }>();

  messages.forEach((message, index) => {
    const text = message.text.toLowerCase();
    const words = text.split(/\W+/);

    // Match against known topic keywords
    Object.entries(TOPIC_KEYWORDS).forEach(([topicName, keywords]) => {
      const matchedKeywords = keywords.filter(keyword =>
        text.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        const existing = topicMap.get(topicName) || {
          keywords: new Set<string>(),
          frequency: 0,
          firstMention: index,
          lastMention: index,
          sentimentScore: 0
        };

        matchedKeywords.forEach(kw => existing.keywords.add(kw));
        existing.frequency += matchedKeywords.length;
        existing.lastMention = index;
        existing.sentimentScore += getSentimentScore(text);

        topicMap.set(topicName, existing);
      }
    });

    // Extract custom topics from frequent nouns (simple heuristic)
    const importantWords = words.filter(w =>
      w.length > 4 && !isCommonWord(w)
    );

    importantWords.forEach(word => {
      const topicId = `custom_${word}`;
      const existing = topicMap.get(topicId) || {
        keywords: new Set<string>([word]),
        frequency: 0,
        firstMention: index,
        lastMention: index,
        sentimentScore: 0
      };

      existing.frequency++;
      existing.lastMention = index;
      existing.sentimentScore += getSentimentScore(text);

      if (existing.frequency >= 2) { // Only keep if mentioned at least twice
        topicMap.set(topicId, existing);
      }
    });
  });

  // Convert to Topic array
  const topics: Topic[] = Array.from(topicMap.entries()).map(([id, data]) => {
    const avgSentiment = data.sentimentScore / data.frequency;

    return {
      id,
      name: id.startsWith('custom_') ? id.replace('custom_', '') : id,
      keywords: Array.from(data.keywords),
      frequency: data.frequency,
      firstMention: data.firstMention,
      lastMention: data.lastMention,
      sentiment: avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral'
    };
  });

  // Sort by frequency and return top topics
  return topics.sort((a, b) => b.frequency - a.frequency).slice(0, 15);
}

/**
 * Analyze topic transitions (topic A → topic B)
 */
function analyzeTransitions(
  messages: Array<{ author: string; text: string }>,
  topics: Topic[]
): TopicTransition[] {
  const transitions = new Map<string, { count: number; messages: number[] }>();

  for (let i = 0; i < messages.length - 1; i++) {
    const currentTopics = getMessageTopics(messages[i].text, topics);
    const nextTopics = getMessageTopics(messages[i + 1].text, topics);

    currentTopics.forEach(from => {
      nextTopics.forEach(to => {
        if (from !== to) {
          const key = `${from}->${to}`;
          const existing = transitions.get(key) || { count: 0, messages: [] };
          existing.count++;
          existing.messages.push(i);
          transitions.set(key, existing);
        }
      });
    });
  }

  return Array.from(transitions.entries())
    .map(([key, data]) => {
      const [from, to] = key.split('->');
      return { from, to, count: data.count, messages: data.messages };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 transitions
}

/**
 * Get topics mentioned in a message
 */
function getMessageTopics(text: string, topics: Topic[]): string[] {
  const lowerText = text.toLowerCase();
  return topics
    .filter(topic =>
      topic.keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
    )
    .map(topic => topic.id);
}

/**
 * Identify topic clusters (groups of related topics)
 */
function identifyCluster(topics: Topic[], transitions: TopicTransition[]): TopicCluster[] {
  if (topics.length < 3) return [];

  // Build adjacency map
  const adjacency = new Map<string, Set<string>>();

  topics.forEach(topic => {
    adjacency.set(topic.id, new Set());
  });

  transitions.forEach(t => {
    adjacency.get(t.from)?.add(t.to);
    adjacency.get(t.to)?.add(t.from);
  });

  // Find clusters using simple greedy clustering
  const clusters: TopicCluster[] = [];
  const visited = new Set<string>();

  topics.forEach(topic => {
    if (visited.has(topic.id)) return;

    const cluster: string[] = [topic.id];
    visited.add(topic.id);

    const neighbors = adjacency.get(topic.id) || new Set();
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        cluster.push(neighborId);
        visited.add(neighborId);
      }
    });

    if (cluster.length >= 2) {
      // Find central topic (most connected)
      const centralTopic = cluster.reduce((central, topicId) => {
        const connections = adjacency.get(topicId)?.size || 0;
        const centralConnections = adjacency.get(central)?.size || 0;
        return connections > centralConnections ? topicId : central;
      }, cluster[0]);

      clusters.push({
        id: `cluster_${clusters.length}`,
        topics: cluster,
        centralTopic,
        cohesion: cluster.length / topics.length
      });
    }
  });

  return clusters;
}

/**
 * Calculate topic diversity (Shannon entropy)
 */
function calculateTopicDiversity(topics: Topic[]): number {
  if (topics.length === 0) return 0;

  const totalFrequency = topics.reduce((sum, t) => sum + t.frequency, 0);
  if (totalFrequency === 0) return 0;

  const entropy = topics.reduce((sum, topic) => {
    const p = topic.frequency / totalFrequency;
    return sum - (p * Math.log2(p));
  }, 0);

  // Normalize to 0-1 range
  const maxEntropy = Math.log2(topics.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * Simple sentiment scoring based on positive/negative words
 */
function getSentimentScore(text: string): number {
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'wonderful', 'amazing', 'fantastic', 'better', 'best'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'poor', 'disappointed', 'worse', 'worst'];

  const lowerText = text.toLowerCase();

  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

  return (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
}

/**
 * Check if word is common (stop word)
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'that', 'this', 'with', 'from', 'have', 'they', 'would', 'there', 'their', 'what',
    'about', 'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'people',
    'into', 'year', 'your', 'some', 'could', 'them', 'than', 'then', 'look', 'only',
    'come', 'over', 'think', 'also', 'back', 'after', 'where', 'well', 'very', 'much'
  ]);

  return commonWords.has(word.toLowerCase());
}

/**
 * Get topic color for visualization
 */
export function getTopicColor(topicId: string, sentiment: 'positive' | 'neutral' | 'negative'): string {
  // Base colors by sentiment
  const sentimentColors = {
    positive: '#22c55e',  // Green
    neutral: '#3b82f6',   // Blue
    negative: '#ef4444'   // Red
  };

  // Predefined colors for common topics
  const topicColors: Record<string, string> = {
    emotions: '#a855f7',      // Purple
    relationships: '#ec4899', // Pink
    work: '#f59e0b',          // Amber
    health: '#10b981',        // Emerald
    goals: '#06b6d4',         // Cyan
    problems: '#dc2626',      // Red
    past: '#6366f1',          // Indigo
    present: '#8b5cf6',       // Violet
    future: '#0ea5e9',        // Sky
    self: '#d946ef',          // Fuchsia
  };

  return topicColors[topicId] || sentimentColors[sentiment];
}

/**
 * Format topic name for display
 */
export function formatTopicName(topicId: string): string {
  return topicId
    .replace('custom_', '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default {
  analyzeTopics,
  getTopicColor,
  formatTopicName
};
