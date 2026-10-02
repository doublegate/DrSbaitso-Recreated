/**
 * Emotion Detection Utility (v1.11.0)
 *
 * Detects specific emotions beyond basic sentiment.
 * Provides nuanced emotional analysis with 5 core emotions.
 */

export interface EmotionAnalysis {
  joy: number;      // 0-100
  anger: number;    // 0-100
  fear: number;     // 0-100
  sadness: number;  // 0-100
  surprise: number; // 0-100
  dominant: 'joy' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'neutral';
}

// Emotion keyword dictionaries
const JOY_KEYWORDS = [
  'happy', 'joy', 'excited', 'wonderful', 'amazing', 'great', 'fantastic',
  'love', 'loved', 'loving', 'cheerful', 'delighted', 'pleased', 'glad',
  'thrilled', 'ecstatic', 'elated', 'joyful', 'blissful', 'content'
];

const ANGER_KEYWORDS = [
  'angry', 'mad', 'furious', 'rage', 'hate', 'hated', 'annoyed', 'irritated',
  'frustrated', 'outraged', 'enraged', 'livid', 'resentful', 'hostile',
  'bitter', 'aggravated', 'infuriated', 'exasperated'
];

const FEAR_KEYWORDS = [
  'afraid', 'scared', 'fear', 'fearful', 'anxious', 'worried', 'terrified',
  'frightened', 'nervous', 'panic', 'alarmed', 'dread', 'threatened',
  'uneasy', 'apprehensive', 'timid', 'startled'
];

const SADNESS_KEYWORDS = [
  'sad', 'unhappy', 'depressed', 'miserable', 'lonely', 'upset', 'down',
  'blue', 'heartbroken', 'disappointed', 'gloomy', 'melancholy', 'sorrowful',
  'dejected', 'despondent', 'grief', 'mourning', 'hopeless'
];

const SURPRISE_KEYWORDS = [
  'surprised', 'shock', 'shocked', 'amazed', 'astonished', 'stunned',
  'astounded', 'startled', 'unexpected', 'suddenly', 'wow', 'unbelievable',
  'incredible', 'remarkable', 'extraordinary'
];

/**
 * Analyze text for specific emotions
 */
export function detectEmotions(text: string): EmotionAnalysis {
  if (!text || text.trim().length === 0) {
    return {
      joy: 0,
      anger: 0,
      fear: 0,
      sadness: 0,
      surprise: 0,
      dominant: 'neutral'
    };
  }

  // Normalize text
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(word => word.length > 0);

  if (words.length === 0) {
    return {
      joy: 0,
      anger: 0,
      fear: 0,
      sadness: 0,
      surprise: 0,
      dominant: 'neutral'
    };
  }

  // Count keywords for each emotion
  let joyCount = 0;
  let angerCount = 0;
  let fearCount = 0;
  let sadnessCount = 0;
  let surpriseCount = 0;

  words.forEach(word => {
    if (JOY_KEYWORDS.includes(word)) joyCount++;
    if (ANGER_KEYWORDS.includes(word)) angerCount++;
    if (FEAR_KEYWORDS.includes(word)) fearCount++;
    if (SADNESS_KEYWORDS.includes(word)) sadnessCount++;
    if (SURPRISE_KEYWORDS.includes(word)) surpriseCount++;
  });

  // Calculate intensities (0-100 scale)
  const total = words.length;
  const joy = Math.min(100, Math.round((joyCount / total) * 500)); // Scale factor for sensitivity
  const anger = Math.min(100, Math.round((angerCount / total) * 500));
  const fear = Math.min(100, Math.round((fearCount / total) * 500));
  const sadness = Math.min(100, Math.round((sadnessCount / total) * 500));
  const surprise = Math.min(100, Math.round((surpriseCount / total) * 500));

  // Determine dominant emotion
  const emotions = { joy, anger, fear, sadness, surprise };
  const max = Math.max(joy, anger, fear, sadness, surprise);

  let dominant: EmotionAnalysis['dominant'] = 'neutral';
  if (max > 10) { // Threshold for considering an emotion dominant
    dominant = (Object.keys(emotions) as Array<keyof typeof emotions>).find(
      key => emotions[key] === max
    ) || 'neutral';
  }

  return {
    joy,
    anger,
    fear,
    sadness,
    surprise,
    dominant
  };
}

/**
 * Get emoji representation of emotion
 */
export function getEmotionEmoji(emotion: EmotionAnalysis['dominant']): string {
  const emojiMap: Record<EmotionAnalysis['dominant'], string> = {
    joy: '😊',
    anger: '😠',
    fear: '😨',
    sadness: '😢',
    surprise: '😲',
    neutral: '😐'
  };
  return emojiMap[emotion];
}

/**
 * Get color for emotion (for UI visualization)
 */
export function getEmotionColor(emotion: EmotionAnalysis['dominant']): string {
  const colorMap: Record<EmotionAnalysis['dominant'], string> = {
    joy: '#FFD700',      // Gold
    anger: '#FF4444',    // Red
    fear: '#9370DB',     // Purple
    sadness: '#4169E1',  // Royal Blue
    surprise: '#FF8C00', // Dark Orange
    neutral: '#808080'   // Gray
  };
  return colorMap[emotion];
}
