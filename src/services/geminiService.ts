/**
 * Browser client for the Gemini proxy (`/api/chat`, `/api/tts`).
 *
 * The API key lives only on the server. This module keeps each persona's
 * visible conversation history in memory and sends it with every turn, since
 * the proxy is stateless.
 */
import type { VoiceProfileId } from '../constants';

export type ServiceErrorCode =
  | 'BAD_REQUEST'
  | 'RATE_LIMITED'
  | 'EMPTY_RESPONSE'
  | 'UPSTREAM_ERROR'
  | 'UNAVAILABLE'
  | 'NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class GeminiServiceError extends Error {
  constructor(
    message: string,
    readonly code: ServiceErrorCode,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface CustomCharacterInput {
  name: string;
  systemInstruction: string;
}

const histories = new Map<string, ChatTurn[]>();

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GeminiServiceError('Network request failed.', 'NETWORK_ERROR', 0);
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON error page (e.g. a platform 5xx); handled below.
  }

  if (!response.ok) {
    const code: ServiceErrorCode = data?.code ?? 'UNKNOWN';
    const detail = data?.error ?? response.statusText;
    // Keep the status and Google's quota wording in the message: older
    // callers detect rate limiting by matching these strings.
    const suffix = code === 'RATE_LIMITED' ? ' RESOURCE_EXHAUSTED' : '';
    throw new GeminiServiceError(`${response.status} ${code}${suffix}: ${detail}`, code, response.status);
  }
  return data as T;
}

export function getHistory(characterId: string): ChatTurn[] {
  return [...(histories.get(characterId) ?? [])];
}

export function resetChat(characterId: string): void {
  histories.delete(characterId);
}

export function resetAllChats(): void {
  histories.clear();
}

export async function getAIResponse(
  message: string,
  characterId: string,
  options: { customCharacter?: CustomCharacterInput } = {},
): Promise<string> {
  const history = histories.get(characterId) ?? [];
  const target = options.customCharacter ? { customCharacter: options.customCharacter } : { characterId };

  const { text } = await post<{ text: string }>('/api/chat', { ...target, history, message });

  histories.set(characterId, [...history, { role: 'user', text: message }, { role: 'model', text }]);
  return text;
}

/** Returns base64-encoded PCM16 mono audio (24 kHz), or '' for empty text. */
export async function synthesizeSpeech(
  text: string,
  characterId: string,
  options: { voiceProfile?: VoiceProfileId; voicePrompt?: string } = {},
): Promise<string> {
  if (!text || text.trim().length === 0) return '';

  const target = options.voicePrompt ? { voicePrompt: options.voicePrompt } : { characterId };
  const body = options.voiceProfile ? { text, ...target, voiceProfile: options.voiceProfile } : { text, ...target };

  const { audio } = await post<{ audio: string }>('/api/tts', body);
  return audio ?? '';
}

/** Legacy entry point kept for existing callers. */
export function getDrSbaitsoResponse(message: string): Promise<string> {
  return getAIResponse(message, 'sbaitso');
}
