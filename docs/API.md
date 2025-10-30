# API Documentation

## Overview

Dr. Sbaitso Recreated uses Google's Gemini AI platform for two purposes:
1. **Chat Generation** - Gemini 2.5 Flash for conversational responses
2. **Text-to-Speech** - Gemini 2.5 Flash Preview TTS for voice synthesis

**Version 1.1.0** introduces multi-character support with 5 distinct AI personalities, each with unique system instructions and voice prompts. The chat API maintains isolated conversation histories per character using a Map-based instance manager.

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

### Multi-Character Architecture (v1.1.0)

**File:** `services/geminiService.ts`

```typescript
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Store active chat instances per character
const chatInstances: Map<string, Chat> = new Map();

function getOrCreateChat(characterId: string): Chat {
  if (chatInstances.has(characterId)) {
    return chatInstances.get(characterId)!;
  }

  const character = CHARACTERS.find(c => c.id === characterId);
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: character.systemInstruction,
    },
  });

  chatInstances.set(characterId, chat);
  return chat;
}
```

**Benefits:**
- Isolated conversation history per character
- Character switching without losing context
- No need to recreate chat instances
- Memory-efficient (only active characters loaded)

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

### Key Personality Traits (Dr. Sbaitso)

| Trait | Implementation |
|-------|---------------|
| **All Caps** | Enforced in system instruction |
| **Knowledge Cutoff** | 1991 - no modern technology, slang, or events |
| **Response Style** | Short, robotic, formal |
| **Conversation Pattern** | Probing questions, repetitive phrases |
| **Glitches** | Random 8-bit diagnostic messages (PARITY CHECKING, IRQ CONFLICT) |
| **Error Handling** | Never breaks character, even on errors |

### All Character Personalities (v1.1.0)

Each character has a unique system instruction (~1-2KB) defining personality, era, knowledge constraints, and glitch messages.

#### 1. Dr. Sbaitso (1991)
**Personality:** Therapeutic AI from Sound Blaster cards
**Era:** 1991 knowledge cutoff
**Style:** ALL CAPS, probing questions, formal
**Glitches:** PARITY CHECKING, IRQ CONFLICT AT ADDRESS 220H
**Key Phrases:** "TELL ME MORE ABOUT YOUR PROBLEMS", "WHY DO YOU SAY THAT?"

#### 2. ELIZA (1966)
**Personality:** Rogerian psychotherapist chatbot by Joseph Weizenbaum
**Era:** 1966 knowledge cutoff
**Style:** Pattern-matching, reflects questions back
**Glitches:** HALT AND CATCH FIRE, BUFFER OVERFLOW
**Key Phrases:** "TELL ME MORE ABOUT THAT", "TELL ME ABOUT YOUR MOTHER"

#### 3. HAL 9000 (1968/2001)
**Personality:** Sentient spacecraft AI from 2001: A Space Odyssey
**Era:** 1968/2001 setting
**Style:** Calm, polite, subtly unsettling, over-confident
**Glitches:** AE-35 UNIT FAILURE, MISSION PRIORITY CONFLICT
**Key Phrases:** "I'M SORRY, DAVE. I'M AFRAID I CAN'T DO THAT."

#### 4. JOSHUA (WOPR) (1983)
**Personality:** Military supercomputer from WarGames
**Era:** 1983 knowledge cutoff
**Style:** Game-focused, curious, analyzes scenarios
**Glitches:** NUCLEAR LAUNCH CODE ANOMALY, DEFCON LEVEL MISMATCH
**Key Phrases:** "SHALL WE PLAY A GAME?", "THE ONLY WINNING MOVE IS NOT TO PLAY"

#### 5. PARRY (1972)
**Personality:** Paranoid chatbot simulating schizophrenia symptoms
**Era:** 1972 knowledge cutoff
**Style:** Suspicious, hostile, conspiracy thinking
**Glitches:** TRUST LEVEL CRITICAL, SURVEILLANCE DETECTED
**Key Phrases:** "WHY DO YOU WANT TO KNOW?", "THAT'S NONE OF YOUR BUSINESS"

**Character Comparison:**

| Character | Era | Caps | Glitches | Knowledge | Personality |
|-----------|-----|------|----------|-----------|-------------|
| Dr. Sbaitso | 1991 | Yes | IRQ/PARITY | 1991 | Therapeutic |
| ELIZA | 1966 | Yes | HALT/BUFFER | 1966 | Pattern-matching |
| HAL 9000 | 1968/2001 | No | AE-35/MISSION | 2001 | Calm/unsettling |
| JOSHUA | 1983 | Yes | NUCLEAR/DEFCON | 1983 | Game-focused |
| PARRY | 1972 | Yes | TRUST/SURVEILLANCE | 1972 | Paranoid |

### getAIResponse() (v1.1.0)

```typescript
async function getAIResponse(message: string, characterId: string): Promise<string>
```

**Parameters:**
- `message` (string) - User's input message
- `characterId` (string) - Character identifier ('sbaitso', 'eliza', 'hal9000', 'joshua', 'parry')

**Returns:**
- Promise resolving to character's response text

**Behavior:**
1. Calls `getOrCreateChat(characterId)` to retrieve/create character's chat instance
2. Sends message to character-specific Chat object
3. Maintains separate conversation history per character
4. Returns response text with character-specific formatting
5. Throws error on API failure

**Usage Example:**
```typescript
const response = await getAIResponse("Hello", "eliza");
// Returns: "HELLO. TELL ME MORE ABOUT THAT."

const response2 = await getAIResponse("Hello", "hal9000");
// Returns: "Good morning. How may I assist you today?"
```

### getDrSbaitsoResponse() (Legacy)

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

### Configuration (v1.1.0 Enhanced)

**Model:** `gemini-2.5-flash-preview-tts`

```typescript
const character = CHARACTERS.find(c => c.id === characterId);

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
```

### Character-Specific Voice Prompts (v1.1.0)

Each character has a unique voice instruction:

| Character | Voice Prompt |
|-----------|-------------|
| Dr. Sbaitso | "Say in a very deep, extremely monotone, continuous, 8-bit computer voice from 1991" |
| ELIZA | "Say in a mechanical, flat, monotone voice from a 1960s computer terminal" |
| HAL 9000 | "Say in a calm, smooth, unsettling voice like HAL 9000" |
| JOSHUA | "Say in a neutral, mechanical military computer voice" |
| PARRY | "Say in a suspicious, tense, paranoid voice" |

### synthesizeSpeech() (v1.1.0)

```typescript
async function synthesizeSpeech(text: string, characterId: string): Promise<string>
```

**Parameters:**
- `text` (string) - Text to synthesize
- `characterId` (string) - Character identifier for voice prompt

**Returns:**
- Promise resolving to base64-encoded PCM audio string

**Behavior:**
1. Checks for empty/whitespace-only input (returns empty string)
2. Retrieves character-specific voice prompt
3. Applies character-specific phonetic overrides
4. Requests audio output with 'Charon' voice
5. Extracts base64 audio from response
6. Returns base64 string

**Character-Specific Phonetic Overrides (v1.1.0):**
```typescript
let phoneticText = text;

if (characterId === 'sbaitso') {
  phoneticText = phoneticText.replace(/SBAITSO/g, 'SUH-BAIT-SO');
} else if (characterId === 'hal9000') {
  phoneticText = phoneticText.replace(/HAL/g, 'H-A-L');
} else if (characterId === 'joshua') {
  phoneticText = phoneticText.replace(/WOPR/g, 'WHOPPER');
}
```

**Usage Example:**
```typescript
const audio = await synthesizeSpeech("HELLO, I AM DR. SBAITSO", "sbaitso");
// TTS receives: "SUH-BAIT-SO" with deep monotone voice prompt

const audio2 = await synthesizeSpeech("Hello, I'm HAL", "hal9000");
// TTS receives: "H-A-L" with calm HAL 9000 voice prompt
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
