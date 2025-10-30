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
