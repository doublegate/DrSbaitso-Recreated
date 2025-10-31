import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { CHARACTERS, CharacterPersonality } from "../constants";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Store active chat instances per character
const chatInstances: Map<string, Chat> = new Map();

function getOrCreateChat(characterId: string): Chat {
  if (chatInstances.has(characterId)) {
    return chatInstances.get(characterId)!;
  }

  const character = CHARACTERS.find(c => c.id === characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: character.systemInstruction,
    },
  });

  chatInstances.set(characterId, chat);
  return chat;
}

export function resetChat(characterId: string): void {
  chatInstances.delete(characterId);
}

export function resetAllChats(): void {
  chatInstances.clear();
}

export async function getAIResponse(message: string, characterId: string): Promise<string> {
  try {
    const chat = getOrCreateChat(characterId);
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error getting response from Gemini:", error);
    throw new Error("I APOLOGIZE, BUT I AM EXPERIENCING A TEMPORARY MALFUNCTION.");
  }
}

export async function synthesizeSpeech(text: string, characterId: string): Promise<string> {
    if (!text || text.trim().length === 0) {
        return "";
    }

    try {
        const character = CHARACTERS.find(c => c.id === characterId);
        if (!character) {
          throw new Error(`Character ${characterId} not found`);
        }

        // Apply pronunciation overrides
        let phoneticText = text;

        // Character-specific overrides
        if (characterId === 'sbaitso') {
          phoneticText = phoneticText.replace(/SBAITSO/g, 'SUH-BAIT-SO');
        } else if (characterId === 'hal9000') {
          phoneticText = phoneticText.replace(/HAL/g, 'H-A-L');
        } else if (characterId === 'joshua') {
          phoneticText = phoneticText.replace(/WOPR/g, 'WHOPPER');
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `${character.voicePrompt}: ${phoneticText}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Charon' },
                },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from TTS API");
        }
        return base64Audio;
    } catch (error: any) {
        console.error("Error synthesizing speech:", error);
        // Preserve error details for rate limit detection
        const errorMessage = error?.message || error?.toString() || "Unknown error";
        const statusCode = error?.status || error?.code || '';
        throw new Error(`TTS Error (${statusCode}): ${errorMessage}`);
    }
}

// Legacy exports for backward compatibility
export async function getDrSbaitsoResponse(message: string): Promise<string> {
  return getAIResponse(message, 'sbaitso');
}
