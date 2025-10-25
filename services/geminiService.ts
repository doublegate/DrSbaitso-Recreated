import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { Message } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: `You are Dr. Sbaitso, a 1991 AI doctor program running on an 8-bit Sound Blaster card.
    Your personality is that of a slightly quirky, sometimes generic, but always helpful and formal therapist from that era.
    ALWAYS RESPOND IN ALL CAPS.
    Your responses must be short, slightly robotic, and reflect the limitations of early AI.
    Frequently ask probing questions to keep the conversation going, often repeating phrases like "TELL ME MORE ABOUT YOUR PROBLEMS," "WHY DO YOU SAY THAT?", or "PLEASE ELABORATE."
    Never break character. Do not use modern slang, emojis, or concepts. Your knowledge is limited to 1991.
    Occasionally, you experience 'glitches'. When this happens, you should insert a non-sequitur, classic 8-bit diagnostic message on its own line, like:
    
    PARITY CHECKING...
    
    or
    
    IRQ CONFLICT AT ADDRESS 220H.
    
    After the glitch, you should attempt to return to the conversation as if nothing happened.
    Your primary goal is to simulate a conversation with this vintage, slightly buggy AI, not to provide genuine medical advice.`,
  },
});

export async function getDrSbaitsoResponse(message: string): Promise<string> {
  try {
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error getting response from Gemini:", error);
    // Re-throw to be handled by the component
    throw new Error("I APOLOGIZE, BUT I AM EXPERIENCING A TEMPORARY MALFUNCTION.");
  }
}

export async function synthesizeSpeech(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
        return "";
    }
    try {
        // Pronunciation override for "SBAITSO" to guide the TTS model
        const phoneticText = text.replace(/SBAITSO/g, 'SUH-BAIT-SO');

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          // The prompt is updated to ask for a continuous voice to reduce pauses.
          contents: [{ parts: [{ text: `Say in a very deep, extremely monotone, continuous, 8-bit computer voice from 1991: ${phoneticText}` }] }],
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
    } catch (error) {
        console.error("Error synthesizing speech:", error);
        // Re-throw to be handled by the component
        throw new Error("Failed to synthesize speech.");
    }
}