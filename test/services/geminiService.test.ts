import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Set environment variable BEFORE ANY imports
process.env.API_KEY = 'test-api-key-for-testing';
process.env.GEMINI_API_KEY = 'test-api-key-for-testing';

// Create module-level mock function references
const mockSendMessage = vi.fn();
const mockGenerateContent = vi.fn();
const mockCreate = vi.fn(() => ({
  sendMessage: mockSendMessage,
}));

// Mock the GoogleGenAI module - must be a proper class constructor
vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    chats = {
      create: mockCreate,
    };
    models = {
      generateContent: mockGenerateContent,
    };
    constructor() {}
  }

  return {
    GoogleGenAI: MockGoogleGenAI,
    Modality: {
      AUDIO: 'AUDIO',
    },
  };
});

// Dynamic import to ensure env vars are set first
const geminiServiceModule = await import('@/services/geminiService');
const { getAIResponse, synthesizeSpeech, resetChat, resetAllChats, getDrSbaitsoResponse } = geminiServiceModule;

describe('geminiService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockSendMessage.mockReset();
    mockGenerateContent.mockReset();

    // Reset all chats to ensure clean state
    resetAllChats();
  });

  afterEach(() => {
    resetAllChats();
  });

  describe('getAIResponse', () => {
    it('should successfully get AI response for Dr. Sbaitso character', async () => {
      mockSendMessage.mockResolvedValue({ text: 'HELLO. I AM DR. SBAITSO.' });

      const response = await getAIResponse('Hello', 'sbaitso');

      expect(response).toBe('HELLO. I AM DR. SBAITSO.');
      expect(mockSendMessage).toHaveBeenCalledWith({ message: 'Hello' });
    });

    it('should successfully get AI response for ELIZA character', async () => {
      mockSendMessage.mockResolvedValue({ text: 'How does that make you feel?' });

      const response = await getAIResponse('I am sad', 'eliza');

      expect(response).toBe('How does that make you feel?');
    });

    it('should successfully get AI response for HAL 9000 character', async () => {
      mockSendMessage.mockResolvedValue({ text: "I'm sorry, Dave. I'm afraid I can't do that." });

      const response = await getAIResponse('Open the pod bay doors', 'hal9000');

      expect(response).toBe("I'm sorry, Dave. I'm afraid I can't do that.");
    });

    it('should reuse existing chat instance for same character', async () => {
      mockSendMessage.mockResolvedValue({ text: 'RESPONSE 1' });
      await getAIResponse('Message 1', 'sbaitso');

      mockSendMessage.mockResolvedValue({ text: 'RESPONSE 2' });
      await getAIResponse('Message 2', 'sbaitso');

      // Both messages should be sent to the same chat instance
      expect(mockSendMessage).toHaveBeenCalledTimes(2);
      expect(mockSendMessage).toHaveBeenNthCalledWith(1, { message: 'Message 1' });
      expect(mockSendMessage).toHaveBeenNthCalledWith(2, { message: 'Message 2' });
    });

    it('should create separate chat instances for different characters', async () => {
      mockSendMessage.mockResolvedValue({ text: 'RESPONSE' });

      await getAIResponse('Hello', 'sbaitso');
      await getAIResponse('Hello', 'eliza');

      expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid character ID', async () => {
      // Invalid character causes error which gets wrapped in generic message
      await expect(getAIResponse('Hello', 'invalid-character')).rejects.toThrow(
        'I APOLOGIZE, BUT I AM EXPERIENCING A TEMPORARY MALFUNCTION.'
      );
    });

    it('should handle API errors gracefully', async () => {
      mockSendMessage.mockRejectedValue(new Error('API Error'));

      await expect(getAIResponse('Hello', 'sbaitso')).rejects.toThrow(
        'I APOLOGIZE, BUT I AM EXPERIENCING A TEMPORARY MALFUNCTION.'
      );
    });

    it('should handle network errors', async () => {
      mockSendMessage.mockRejectedValue(new Error('Network timeout'));

      await expect(getAIResponse('Hello', 'sbaitso')).rejects.toThrow(
        'I APOLOGIZE, BUT I AM EXPERIENCING A TEMPORARY MALFUNCTION.'
      );
    });
  });

  describe('synthesizeSpeech', () => {
    it('should successfully synthesize speech for Dr. Sbaitso', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'base64audiodata',
              },
            }],
          },
        }],
      });

      const audioData = await synthesizeSpeech('HELLO', 'sbaitso');

      expect(audioData).toBe('base64audiodata');
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: expect.stringContaining('HELLO') }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });
    });

    it('should apply phonetic override for SBAITSO character name', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'base64audiodata',
              },
            }],
          },
        }],
      });

      await synthesizeSpeech('I AM DR. SBAITSO', 'sbaitso');

      // Should replace SBAITSO with phonetic pronunciation
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [{ parts: [{ text: expect.stringContaining('SUH-BAIT-SO') }] }],
        })
      );
    });

    it('should apply phonetic override for HAL 9000', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'base64audiodata',
              },
            }],
          },
        }],
      });

      await synthesizeSpeech('I AM HAL', 'hal9000');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [{ parts: [{ text: expect.stringContaining('H-A-L') }] }],
        })
      );
    });

    it('should apply phonetic override for JOSHUA/WOPR', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'base64audiodata',
              },
            }],
          },
        }],
      });

      await synthesizeSpeech('WOPR SYSTEMS ONLINE', 'joshua');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [{ parts: [{ text: expect.stringContaining('WHOPPER') }] }],
        })
      );
    });

    it('should return empty string for empty text', async () => {
      const audioData = await synthesizeSpeech('', 'sbaitso');
      expect(audioData).toBe('');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should return empty string for whitespace-only text', async () => {
      const audioData = await synthesizeSpeech('   ', 'sbaitso');
      expect(audioData).toBe('');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should throw error when no audio data received', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {},
            }],
          },
        }],
      });

      await expect(synthesizeSpeech('HELLO', 'sbaitso')).rejects.toThrow(
        'No audio data received from TTS API'
      );
    });

    it('should throw error for invalid character ID', async () => {
      await expect(synthesizeSpeech('Hello', 'invalid-character')).rejects.toThrow(
        'Character invalid-character not found'
      );
    });

    it('should preserve error details for rate limit errors', async () => {
      const rateLimitError = {
        message: 'Rate limit exceeded',
        status: 429,
      };
      mockGenerateContent.mockRejectedValue(rateLimitError);

      await expect(synthesizeSpeech('HELLO', 'sbaitso')).rejects.toThrow(
        /TTS Error \(429\):/
      );
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(synthesizeSpeech('HELLO', 'sbaitso')).rejects.toThrow(
        /TTS Error/
      );
    });
  });

  describe('resetChat', () => {
    it('should reset specific character chat instance', async () => {
      mockSendMessage.mockResolvedValue({ text: 'RESPONSE' });

      // Create a chat instance
      await getAIResponse('Hello', 'sbaitso');

      // Reset it
      resetChat('sbaitso');

      // Next call should create a new instance
      await getAIResponse('Hello again', 'sbaitso');

      expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });

    it('should not affect other character chat instances', async () => {
      mockSendMessage.mockResolvedValue({ text: 'RESPONSE' });

      // Create multiple chat instances
      await getAIResponse('Hello', 'sbaitso');
      await getAIResponse('Hello', 'eliza');

      // Reset only sbaitso
      resetChat('sbaitso');

      // Eliza should still have its instance
      await getAIResponse('Hello again', 'eliza');

      expect(mockSendMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('resetAllChats', () => {
    it('should reset all character chat instances', async () => {
      mockSendMessage.mockResolvedValue({ text: 'RESPONSE' });

      // Create multiple chat instances
      await getAIResponse('Hello', 'sbaitso');
      await getAIResponse('Hello', 'eliza');
      await getAIResponse('Hello', 'hal9000');

      // Reset all
      resetAllChats();

      // Next calls should create new instances
      await getAIResponse('Hello again', 'sbaitso');
      await getAIResponse('Hello again', 'eliza');

      expect(mockSendMessage).toHaveBeenCalledTimes(5);
    });
  });

  describe('getDrSbaitsoResponse (legacy)', () => {
    it('should call getAIResponse with sbaitso character ID', async () => {
      mockSendMessage.mockResolvedValue({ text: 'HELLO. I AM DR. SBAITSO.' });

      const response = await getDrSbaitsoResponse('Hello');

      expect(response).toBe('HELLO. I AM DR. SBAITSO.');
      expect(mockSendMessage).toHaveBeenCalledWith({ message: 'Hello' });
    });

    it('should maintain backward compatibility', async () => {
      mockSendMessage.mockResolvedValue({ text: 'RESPONSE' });

      const legacyResponse = await getDrSbaitsoResponse('Test');
      const newResponse = await getAIResponse('Test', 'sbaitso');

      // Both should return the same format
      expect(typeof legacyResponse).toBe('string');
      expect(typeof newResponse).toBe('string');
    });
  });
});
