# API Documentation

## Overview

Dr. Sbaitso Recreated uses Google's Gemini AI platform for two purposes:
1. **Chat Generation** - Gemini 2.5 Flash for conversational responses
2. **Text-to-Speech** - Gemini 2.5 Flash Preview TTS for voice synthesis

## Setup

### API Key Configuration

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://aistudio.google.com/apikey

### Vite Environment Variable Mapping

The `vite.config.ts` exposes the API key to the application:

```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

Both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` are available in the application code.

## Gemini Chat API

### Configuration

**File:** `services/geminiService.ts`

```typescript
const ai = new GoogleGenAI({ apiKey: API_KEY });

const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: `...`,
  },
});
```

### System Instruction

The complete system instruction that defines Dr. Sbaitso's personality:

```
You are Dr. Sbaitso, a 1991 AI doctor program running on an 8-bit Sound Blaster card.
Your personality is that of a slightly quirky, sometimes generic, but always helpful
and formal therapist from that era.

ALWAYS RESPOND IN ALL CAPS.

Your responses must be short, slightly robotic, and reflect the limitations of early AI.
Frequently ask probing questions to keep the conversation going, often repeating phrases
like "TELL ME MORE ABOUT YOUR PROBLEMS," "WHY DO YOU SAY THAT?", or "PLEASE ELABORATE."

Never break character. Do not use modern slang, emojis, or concepts. Your knowledge is
limited to 1991.

Occasionally, you experience 'glitches'. When this happens, you should insert a
non-sequitur, classic 8-bit diagnostic message on its own line, like:

PARITY CHECKING...

or

IRQ CONFLICT AT ADDRESS 220H.

After the glitch, you should attempt to return to the conversation as if nothing happened.

Your primary goal is to simulate a conversation with this vintage, slightly buggy AI,
not to provide genuine medical advice.
```

### Key Personality Traits

| Trait | Implementation |
|-------|---------------|
| **All Caps** | Enforced in system instruction |
| **Knowledge Cutoff** | 1991 - no modern technology, slang, or events |
| **Response Style** | Short, robotic, formal |
| **Conversation Pattern** | Probing questions, repetitive phrases |
| **Glitches** | Random 8-bit diagnostic messages (PARITY CHECKING, IRQ CONFLICT) |
| **Error Handling** | Never breaks character, even on errors |

### getDrSbaitsoResponse()

```typescript
async function getDrSbaitsoResponse(message: string): Promise<string>
```

**Parameters:**
- `message` (string) - User's input message

**Returns:**
- Promise resolving to Dr. Sbaitso's response text (ALL CAPS)

**Behavior:**
1. Sends message to persistent Chat object
2. Maintains conversation history automatically
3. Returns response text from first candidate
4. Throws error on API failure (caught by App component)

**Error Handling:**
```typescript
catch (error) {
  console.error("Error getting response from Gemini:", error);
  throw new Error("I APOLOGIZE, BUT I AM EXPERIENCING A TEMPORARY MALFUNCTION.");
}
```

**Usage Example:**
```typescript
const response = await getDrSbaitsoResponse("I'M FEELING SAD");
// Returns: "WHY DO YOU SAY YOU ARE FEELING SAD? TELL ME MORE."
```

### Chat Persistence

The `chat` object maintains conversation history:
- First user message: "HELLO"
- Dr. Sbaitso remembers previous context
- No manual history management required
- History cleared on page reload

## Gemini Text-to-Speech API

### Configuration

**Model:** `gemini-2.5-flash-preview-tts`

```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-preview-tts",
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
```

### synthesizeSpeech()

```typescript
async function synthesizeSpeech(text: string): Promise<string>
```

**Parameters:**
- `text` (string) - Text to synthesize (typically ALL CAPS)

**Returns:**
- Promise resolving to base64-encoded PCM audio string

**Behavior:**
1. Checks for empty/whitespace-only input (returns empty string)
2. Applies phonetic override: "SBAITSO" → "SUH-BAIT-SO"
3. Prepends voice instruction prompt
4. Requests audio output with 'Charon' voice
5. Extracts base64 audio from response
6. Returns base64 string

**Phonetic Overrides:**
```typescript
const phoneticText = text.replace(/SBAITSO/g, 'SUH-BAIT-SO');
```

This ensures the TTS model pronounces "SBAITSO" correctly.

**Voice Configuration:**
- **Voice Name:** 'Charon' (deep, male voice)
- **Instruction:** "very deep, extremely monotone, continuous, 8-bit computer voice from 1991"
- **Output Format:** PCM audio (24kHz, mono, Int16 samples)
- **Encoding:** Base64 string

**Error Handling:**
```typescript
if (!base64Audio) {
  throw new Error("No audio data received from TTS API");
}
```

**Usage Example:**
```typescript
const audio = await synthesizeSpeech("HELLO, MY NAME IS DOCTOR SBAITSO.");
// Returns: "//uQRAAA..." (base64 PCM audio)
```

## Audio Format Specification

### TTS Output Format

- **Sample Rate:** 24,000 Hz (24 kHz)
- **Channels:** 1 (mono)
- **Sample Format:** Int16 (16-bit signed integer)
- **Encoding:** Base64 string
- **Byte Order:** Little-endian

### Decoding Process

```typescript
// 1. Base64 → Uint8Array
const bytes = decode(base64Audio);

// 2. Uint8Array → Int16Array
const dataInt16 = new Int16Array(bytes.buffer);

// 3. Int16 → Float32 AudioBuffer
const buffer = ctx.createBuffer(1, frameCount, 24000);
for (let i = 0; i < frameCount; i++) {
  channelData[i] = dataInt16[i] / 32768.0;
}
```

## API Rate Limits and Quotas

### Gemini API Free Tier

- **Requests per minute (RPM):** 15
- **Requests per day (RPD):** 1,500
- **Tokens per minute (TPM):** 1,000,000

### Application Impact

**Typical Usage:**
- Greeting sequence: 7 TTS requests (one-time)
- Each user message: 1 Chat request + 1 TTS request
- Average conversation: ~20 requests total

**Rate Limit Strategy:**
- No retry logic implemented (future enhancement)
- No request queuing
- Errors displayed as retro error messages
- User can manually retry by resubmitting input

## Error Responses

### Chat API Errors

**Network Errors:**
```
Error getting response from Gemini: TypeError: Failed to fetch
```

**API Key Errors:**
```
Error getting response from Gemini: Error: Invalid API key
```

**Rate Limit Errors:**
```
Error getting response from Gemini: Error: 429 Resource Exhausted
```

**Displayed to User:**
```
IRQ CONFLICT AT ADDRESS 220H. SESSION TERMINATED.
```
(Random selection from 4 retro error messages)

### TTS API Errors

**No Audio Data:**
```
No audio data received from TTS API
```

**Network Errors:**
```
Error synthesizing speech: TypeError: Failed to fetch
```

**Displayed to User:**
- Name submission: "SYSTEM ERROR: FAILED TO INITIALIZE. PLEASE REFRESH."
- Conversation: Generic retro error message + error beep sound

## Testing API Integration

### Manual Testing

```typescript
// Test chat API
import { getDrSbaitsoResponse } from './services/geminiService';

const response = await getDrSbaitsoResponse("HELLO");
console.log(response); // Should be ALL CAPS

// Test TTS API
import { synthesizeSpeech } from './services/geminiService';

const audio = await synthesizeSpeech("TEST");
console.log(audio.substring(0, 20)); // Should be base64 string
```

### Expected Behavior

**Chat API:**
- ✅ Returns ALL CAPS text
- ✅ Maintains 1991 context (no modern references)
- ✅ Occasionally includes glitch messages
- ✅ Asks probing questions

**TTS API:**
- ✅ Returns base64 string
- ✅ Pronounces "SBAITSO" correctly as "SUH-BAIT-SO"
- ✅ Deep, monotone voice
- ✅ Consistent audio format (24kHz, mono, Int16)

## API Cost Estimation

### Gemini Pricing (Pay-as-you-go)

**Gemini 2.5 Flash (Chat):**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

**Gemini 2.5 Flash TTS:**
- Characters: $3.50 per 1M characters

### Typical Session Costs

**Assumptions:**
- 20 user messages per session
- Average response: 50 tokens output, 150 characters

**Costs:**
- Chat: ~$0.00015 per session
- TTS: ~$0.0105 per session
- **Total: ~$0.0107 per session**

**100 sessions/day = $1.07/day = ~$32/month**

## Best Practices

### API Key Security

❌ **Never:**
- Commit `.env.local` to git
- Expose API key in client-side code (only safe due to Vite define injection)
- Share API key in public repositories

✅ **Always:**
- Use `.env.local` for local development
- Add `.env*.local` to `.gitignore`
- Use environment variables in production
- Rotate keys if exposed

### Error Handling

✅ **Good Practices:**
- Display user-friendly error messages
- Log errors to console for debugging
- Provide audio feedback (error beep)
- Allow user to retry

❌ **Avoid:**
- Exposing raw API errors to users
- Silent failures
- Infinite retry loops

### Performance Optimization

✅ **Current Optimizations:**
- Parallel TTS requests for greeting sequence
- Concurrent typewriter effect and TTS generation
- Single AudioContext instance

🚀 **Future Optimizations:**
- Cache common phrases (e.g., greeting lines)
- Implement request queuing for rate limits
- Add retry logic with exponential backoff
- Stream longer responses
