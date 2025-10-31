/**
 * Voice Commands Utility
 *
 * Defines and executes voice commands for hands-free operation.
 * Supports natural language command recognition with fuzzy matching.
 *
 * @version 1.6.0
 */

export interface VoiceCommand {
  id: string;
  name: string;
  phrases: string[]; // Alternative phrases that trigger this command
  description: string;
  category: 'conversation' | 'navigation' | 'settings' | 'character' | 'audio';
  requiresConfirmation?: boolean;
  action: (params?: any) => void;
}

export interface CommandMatch {
  command: VoiceCommand;
  confidence: number; // 0-1, higher is better match
  matchedPhrase: string;
}

/**
 * Wake words that activate voice control
 */
export const WAKE_WORDS = [
  'hey doctor',
  'hey sbaitso',
  'doctor sbaitso',
  'okay doctor',
  'listen doctor',
] as const;

/**
 * Command categories for better organization
 */
export const COMMAND_CATEGORIES = {
  CONVERSATION: 'conversation',
  NAVIGATION: 'navigation',
  SETTINGS: 'settings',
  CHARACTER: 'character',
  AUDIO: 'audio',
} as const;

/**
 * Calculate similarity between two strings using Levenshtein distance
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score 0-1
 */
export function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 * @param a - First string
 * @param b - Second string
 * @returns Edit distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if transcript contains wake word
 * @param transcript - Voice input transcript
 * @returns True if wake word detected
 */
export function detectWakeWord(transcript: string): boolean {
  const normalized = transcript.toLowerCase().trim();

  return WAKE_WORDS.some(wakeWord => {
    // Exact match
    if (normalized.includes(wakeWord)) {
      return true;
    }

    // Fuzzy match (80% similarity threshold)
    const similarity = calculateSimilarity(normalized, wakeWord);
    return similarity >= 0.8;
  });
}

/**
 * Extract command from transcript after wake word
 * @param transcript - Voice input transcript
 * @returns Command portion of transcript
 */
export function extractCommandFromTranscript(transcript: string): string {
  const normalized = transcript.toLowerCase().trim();

  // Remove wake word from beginning
  for (const wakeWord of WAKE_WORDS) {
    if (normalized.startsWith(wakeWord)) {
      return normalized.substring(wakeWord.length).trim();
    }
  }

  // Try to find and remove wake word anywhere in transcript
  for (const wakeWord of WAKE_WORDS) {
    const index = normalized.indexOf(wakeWord);
    if (index !== -1) {
      return normalized.substring(index + wakeWord.length).trim();
    }
  }

  return normalized;
}

/**
 * Match transcript to voice command
 * @param transcript - Voice input transcript
 * @param commands - Available commands
 * @param threshold - Minimum confidence threshold (0-1)
 * @returns Best matching command or null
 */
export function matchCommand(
  transcript: string,
  commands: VoiceCommand[],
  threshold: number = 0.7
): CommandMatch | null {
  const normalized = transcript.toLowerCase().trim();
  let bestMatch: CommandMatch | null = null;

  for (const command of commands) {
    for (const phrase of command.phrases) {
      const phraseNormalized = phrase.toLowerCase();

      // Check for exact substring match first
      if (normalized.includes(phraseNormalized)) {
        const match: CommandMatch = {
          command,
          confidence: 1.0,
          matchedPhrase: phrase,
        };
        return match; // Return immediately on exact match
      }

      // Check fuzzy match
      const similarity = calculateSimilarity(normalized, phraseNormalized);

      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.confidence)) {
        bestMatch = {
          command,
          confidence: similarity,
          matchedPhrase: phrase,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Create voice commands registry
 * @param handlers - Object with handler functions
 * @returns Array of voice commands
 */
export function createVoiceCommands(handlers: {
  onClear?: () => void;
  onExport?: () => void;
  onSwitchCharacter?: (characterId: string) => void;
  onToggleMute?: () => void;
  onToggleSettings?: () => void;
  onToggleStats?: () => void;
  onStopAudio?: () => void;
  onCycleTheme?: () => void;
  onCycleAudioQuality?: () => void;
  onOpenAccessibility?: () => void;
  onOpenSearch?: () => void;
  onOpenVisualizer?: () => void;
  onHelp?: () => void;
}): VoiceCommand[] {
  const commands: VoiceCommand[] = [];

  // Conversation commands
  if (handlers.onClear) {
    commands.push({
      id: 'clear',
      name: 'Clear Conversation',
      phrases: [
        'clear conversation',
        'clear chat',
        'reset conversation',
        'start over',
        'new conversation',
        'clear messages',
      ],
      description: 'Clear the current conversation',
      category: 'conversation',
      requiresConfirmation: true,
      action: handlers.onClear,
    });
  }

  if (handlers.onExport) {
    commands.push({
      id: 'export',
      name: 'Export Conversation',
      phrases: [
        'export conversation',
        'export chat',
        'save conversation',
        'download conversation',
        'export messages',
      ],
      description: 'Export the current conversation',
      category: 'conversation',
      action: handlers.onExport,
    });
  }

  // Character switching commands
  if (handlers.onSwitchCharacter) {
    commands.push({
      id: 'switch_sbaitso',
      name: 'Switch to Dr. Sbaitso',
      phrases: [
        'switch to doctor sbaitso',
        'switch to sbaitso',
        'change to doctor sbaitso',
        'talk to doctor sbaitso',
      ],
      description: 'Switch to Dr. Sbaitso character',
      category: 'character',
      action: () => handlers.onSwitchCharacter?.('sbaitso'),
    });

    commands.push({
      id: 'switch_eliza',
      name: 'Switch to ELIZA',
      phrases: [
        'switch to eliza',
        'change to eliza',
        'talk to eliza',
      ],
      description: 'Switch to ELIZA character',
      category: 'character',
      action: () => handlers.onSwitchCharacter?.('eliza'),
    });

    commands.push({
      id: 'switch_hal',
      name: 'Switch to HAL 9000',
      phrases: [
        'switch to hal',
        'switch to hal 9000',
        'change to hal',
        'talk to hal',
      ],
      description: 'Switch to HAL 9000 character',
      category: 'character',
      action: () => handlers.onSwitchCharacter?.('hal9000'),
    });

    commands.push({
      id: 'switch_joshua',
      name: 'Switch to JOSHUA',
      phrases: [
        'switch to joshua',
        'change to joshua',
        'talk to joshua',
      ],
      description: 'Switch to JOSHUA character',
      category: 'character',
      action: () => handlers.onSwitchCharacter?.('joshua'),
    });

    commands.push({
      id: 'switch_parry',
      name: 'Switch to PARRY',
      phrases: [
        'switch to parry',
        'change to parry',
        'talk to parry',
      ],
      description: 'Switch to PARRY character',
      category: 'character',
      action: () => handlers.onSwitchCharacter?.('parry'),
    });
  }

  // Audio commands
  if (handlers.onToggleMute) {
    commands.push({
      id: 'toggle_mute',
      name: 'Toggle Mute',
      phrases: [
        'mute',
        'unmute',
        'toggle sound',
        'turn off sound',
        'turn on sound',
      ],
      description: 'Mute or unmute audio',
      category: 'audio',
      action: handlers.onToggleMute,
    });
  }

  if (handlers.onStopAudio) {
    commands.push({
      id: 'stop_audio',
      name: 'Stop Audio',
      phrases: [
        'stop',
        'stop talking',
        'stop audio',
        'be quiet',
        'silence',
      ],
      description: 'Stop currently playing audio',
      category: 'audio',
      action: handlers.onStopAudio,
    });
  }

  if (handlers.onCycleAudioQuality) {
    commands.push({
      id: 'cycle_audio_quality',
      name: 'Cycle Audio Quality',
      phrases: [
        'change audio quality',
        'cycle audio quality',
        'next audio quality',
        'switch audio mode',
      ],
      description: 'Change audio quality preset',
      category: 'audio',
      action: handlers.onCycleAudioQuality,
    });
  }

  // Navigation commands
  if (handlers.onCycleTheme) {
    commands.push({
      id: 'cycle_theme',
      name: 'Cycle Theme',
      phrases: [
        'change theme',
        'next theme',
        'cycle theme',
        'switch theme',
      ],
      description: 'Change visual theme',
      category: 'navigation',
      action: handlers.onCycleTheme,
    });
  }

  if (handlers.onToggleSettings) {
    commands.push({
      id: 'open_settings',
      name: 'Open Settings',
      phrases: [
        'open settings',
        'show settings',
        'settings',
      ],
      description: 'Open settings panel',
      category: 'settings',
      action: handlers.onToggleSettings,
    });
  }

  if (handlers.onToggleStats) {
    commands.push({
      id: 'open_stats',
      name: 'Open Statistics',
      phrases: [
        'open statistics',
        'show statistics',
        'show stats',
        'statistics',
      ],
      description: 'Open statistics dashboard',
      category: 'settings',
      action: handlers.onToggleStats,
    });
  }

  if (handlers.onOpenAccessibility) {
    commands.push({
      id: 'open_accessibility',
      name: 'Open Accessibility',
      phrases: [
        'open accessibility',
        'accessibility settings',
        'accessibility',
      ],
      description: 'Open accessibility settings',
      category: 'settings',
      action: handlers.onOpenAccessibility,
    });
  }

  if (handlers.onOpenSearch) {
    commands.push({
      id: 'open_search',
      name: 'Open Search',
      phrases: [
        'search',
        'search conversations',
        'find',
      ],
      description: 'Open conversation search',
      category: 'navigation',
      action: handlers.onOpenSearch,
    });
  }

  if (handlers.onOpenVisualizer) {
    commands.push({
      id: 'toggle_visualizer',
      name: 'Toggle Visualizer',
      phrases: [
        'show visualizer',
        'hide visualizer',
        'toggle visualizer',
      ],
      description: 'Toggle audio visualizer',
      category: 'navigation',
      action: handlers.onOpenVisualizer,
    });
  }

  if (handlers.onHelp) {
    commands.push({
      id: 'help',
      name: 'Show Help',
      phrases: [
        'help',
        'show commands',
        'what can I say',
        'voice commands',
      ],
      description: 'Show available voice commands',
      category: 'navigation',
      action: handlers.onHelp,
    });
  }

  return commands;
}

/**
 * Get command suggestions based on partial transcript
 * @param transcript - Partial voice input
 * @param commands - Available commands
 * @param limit - Maximum number of suggestions
 * @returns Array of command suggestions
 */
export function getCommandSuggestions(
  transcript: string,
  commands: VoiceCommand[],
  limit: number = 5
): VoiceCommand[] {
  const normalized = transcript.toLowerCase().trim();
  const suggestions: Array<{ command: VoiceCommand; score: number }> = [];

  for (const command of commands) {
    for (const phrase of command.phrases) {
      const phraseNormalized = phrase.toLowerCase();

      if (phraseNormalized.startsWith(normalized)) {
        // Exact prefix match - highest priority
        suggestions.push({ command, score: 1.0 });
        break;
      } else if (phraseNormalized.includes(normalized)) {
        // Contains match
        suggestions.push({ command, score: 0.8 });
        break;
      } else {
        // Fuzzy match
        const similarity = calculateSimilarity(normalized, phraseNormalized);
        if (similarity >= 0.6) {
          suggestions.push({ command, score: similarity });
          break;
        }
      }
    }
  }

  // Sort by score and return top N
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.command);
}

/**
 * Format command list for help display
 * @param commands - Available commands
 * @returns Formatted help text
 */
export function formatCommandHelp(commands: VoiceCommand[]): string {
  const byCategory = commands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);

  let help = 'AVAILABLE VOICE COMMANDS:\n\n';

  for (const [category, cmds] of Object.entries(byCategory)) {
    help += `${category.toUpperCase()}:\n`;
    for (const cmd of cmds) {
      help += `  "${cmd.phrases[0]}" - ${cmd.description}\n`;
    }
    help += '\n';
  }

  help += 'TIP: You can say "Hey Doctor" followed by any command for hands-free operation.';

  return help;
}
