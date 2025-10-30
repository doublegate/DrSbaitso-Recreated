/**
 * Speech Recognition Utilities
 *
 * Helper functions for voice input processing and formatting.
 *
 * @version 1.2.0
 */

/**
 * Clean and format voice input transcript
 * @param transcript - Raw transcript from speech recognition
 * @returns Formatted transcript
 */
export function formatTranscript(transcript: string): string {
  return transcript
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter
}

/**
 * Convert transcript to uppercase for Dr. Sbaitso style
 * @param transcript - Input transcript
 * @returns Uppercase transcript
 */
export function toRetroFormat(transcript: string): string {
  return formatTranscript(transcript).toUpperCase();
}

/**
 * Check if transcript contains valid content (not just noise)
 * @param transcript - Input transcript
 * @returns boolean
 */
export function isValidTranscript(transcript: string): boolean {
  const cleaned = transcript.trim();

  // Minimum length check
  if (cleaned.length < 2) {
    return false;
  }

  // Check if contains at least one letter
  if (!/[a-zA-Z]/.test(cleaned)) {
    return false;
  }

  return true;
}

/**
 * Filter out common speech recognition artifacts
 * @param transcript - Input transcript
 * @returns Cleaned transcript
 */
export function removeArtifacts(transcript: string): string {
  return transcript
    .replace(/\[.*?\]/g, '') // Remove bracketed text (e.g., [MUSIC])
    .replace(/\(.*?\)/g, '') // Remove parenthetical text
    .replace(/\.\.\./g, '') // Remove ellipsis
    .trim();
}

/**
 * Split long transcript into sentences for better processing
 * @param transcript - Input transcript
 * @param maxLength - Maximum length per sentence
 * @returns Array of sentences
 */
export function splitIntoSentences(transcript: string, maxLength: number = 200): string[] {
  const sentences: string[] = [];

  // Split by sentence boundaries
  const rawSentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();

    if (trimmed.length <= maxLength) {
      sentences.push(trimmed);
    } else {
      // Split long sentences by commas or spaces
      const parts = trimmed.split(/,\s+/);
      for (const part of parts) {
        if (part.trim().length > 0) {
          sentences.push(part.trim());
        }
      }
    }
  }

  return sentences;
}

/**
 * Get language code from browser locale
 * @returns BCP 47 language tag (e.g., 'en-US')
 */
export function getBrowserLanguage(): string {
  const lang = navigator.language || 'en-US';
  return lang;
}

/**
 * Get supported languages for speech recognition
 * @returns Array of language options
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
  ];
}

/**
 * Request microphone permission
 * @returns Promise<boolean> - True if permission granted
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Check if microphone is available
 * @returns Promise<boolean>
 */
export async function checkMicrophoneAvailability(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('Failed to check microphone availability:', error);
    return false;
  }
}

/**
 * Get microphone permission status
 * @returns Promise<'granted' | 'denied' | 'prompt'>
 */
export async function getMicrophonePermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    // Check if Permissions API is supported
    if (!navigator.permissions) {
      return 'prompt';
    }

    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch (error) {
    // Permissions API not supported or query failed
    return 'prompt';
  }
}

/**
 * Visual feedback states for voice input button
 */
export const VoiceInputStates = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export type VoiceInputState = typeof VoiceInputStates[keyof typeof VoiceInputStates];

/**
 * Get visual feedback class based on voice input state
 * @param state - Current voice input state
 * @returns CSS class string
 */
export function getVoiceInputStateClass(state: VoiceInputState): string {
  const classes: Record<VoiceInputState, string> = {
    idle: 'opacity-50 hover:opacity-100',
    listening: 'animate-pulse bg-red-500',
    processing: 'animate-spin',
    error: 'bg-red-600',
    success: 'bg-green-500',
  };

  return classes[state] || classes.idle;
}
