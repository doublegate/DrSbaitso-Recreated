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
