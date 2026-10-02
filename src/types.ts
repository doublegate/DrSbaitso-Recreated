export interface Message {
  author: 'user' | 'dr';
  text: string;
  timestamp?: number;
  characterId?: string;
}

export interface ConversationSession {
  id: string;
  name: string;
  characterId: string;
  themeId: string;
  audioQualityId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  glitchCount: number;
  startedAt?: number; // Optional: session start timestamp
  endedAt?: number; // Optional: session end timestamp
}

export interface SessionStats {
  totalSessions: number;
  totalMessages: number;
  totalGlitches: number;
  averageMessagesPerSession: number;
  favoriteCharacter: string;
  favoriteTheme: string;
  totalConversationTime: number; // milliseconds
  charactersUsed: Record<string, number>; // characterId -> count
  themesUsed: Record<string, number>; // themeId -> count
}

export interface AppSettings {
  characterId: string;
  themeId: string;
  audioQualityId: string;
  audioMode: 'modern' | 'subtle' | 'authentic' | 'ultra'; // Vintage audio processing level
  soundEnabled: boolean;
  autoScroll: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
}

export interface ExportFormat {
  format: 'markdown' | 'text' | 'json' | 'html';
  includeTimestamps: boolean;
  includeMetadata: boolean;
}

// Accessibility Settings (v1.4.0)
export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  screenReaderOptimized: boolean;
  focusIndicatorStyle: 'default' | 'thick' | 'underline';
  announceMessages: boolean;
  keyboardNavigationHints: boolean;
}

// Custom Character (v1.6.0)
export interface CustomCharacter {
  id: string;
  name: string;
  description: string;
  era: number;
  knowledgeCutoff: number;
  systemInstruction: string;
  voicePrompt: string;
  responseStyle: 'uppercase' | 'mixedcase' | 'lowercase';
  personalityTraits: string[];
  glitchMessages: string[];
  isCustom: true;
  createdAt: number;
  author?: string;
  usageCount: number;
}

// Export Options (v1.6.0)
export interface PDFExportOptions {
  includeCoverPage: boolean;
  includeStatistics: boolean;
  includeCharacterInfo: boolean;
  fontSize: 12 | 14 | 16;
  pageSize: 'A4' | 'Letter';
  includeThemeStyling: boolean;
}

export interface CSVExportOptions {
  delimiter: ',' | ';' | '\t';
  includeHeaders: boolean;
  dateFormat: 'iso' | 'locale' | 'timestamp';
}

// Replay Options (v1.6.0)
export interface ReplayState {
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  loop: boolean;
}

// Voice Control (v1.6.0)
export interface VoiceControlSettings {
  enabled: boolean;
  wakeWordEnabled: boolean;
  handsFreeModeEnabled: boolean;
  confirmDestructiveCommands: boolean;
  commandThreshold: number; // 0-1, confidence threshold for command matching
}

export interface VoiceCommandExecution {
  commandId: string;
  commandName: string;
  transcript: string;
  confidence: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
}

// Onboarding Tutorial (v1.8.0)
export interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for tooltip anchor
  action?: 'click' | 'type' | 'wait';
  actionTarget?: string;
  actionPlaceholder?: string;
  skipable?: boolean;
}

export interface OnboardingState {
  currentStep: number;
  completed: boolean;
  skipped: boolean;
  startedAt: number;
  completedAt?: number;
}

// Conversation Insights (v1.8.0)
export interface InsightsData {
  timeline: { date: string; count: number; character: string }[];
  sentiment: { score: number; trend: 'up' | 'down' | 'stable'; recentAverage: number };
  topics: { word: string; count: number; sentiment: number }[];
  characterUsage: { character: string; count: number; percentage: number }[];
}

export interface ChartOptions {
  width: number;
  height: number;
  colors?: string[];
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  padding?: number;
}

export interface SentimentAnalysis {
  score: number; // -100 to +100
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalWords: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface InsightsFilter {
  dateRange: 'week' | 'month' | 'quarter' | 'all' | 'custom';
  startDate?: number;
  endDate?: number;
  characterIds?: string[];
  sessionIds?: string[];
}
