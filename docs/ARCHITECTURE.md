# Architecture Documentation

## Overview

Dr. Sbaitso Recreated is a single-page React application that recreates the 1991 AI therapist program. The architecture is built around three core systems: UI/State Management, AI Integration, and Audio Processing.

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│                         App.tsx                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Name Entry   │→ │  Greeting    │→ │ Conversation │  │
│  │    Phase     │  │  Sequence    │  │    Phase     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────┬────────────────┬────────────────┬─────────┘
             │                │                │
    ┌────────▼────────┐  ┌───▼────────┐  ┌───▼──────────┐
    │ geminiService   │  │ audio.ts   │  │ React State  │
    │  - Chat API     │  │ - Decode   │  │ - messages   │
    │  - TTS API      │  │ - Effects  │  │ - loading    │
    └─────────────────┘  │ - Playback │  │ - userName   │
                         └────────────┘  └──────────────┘
```

## Component Structure

### App.tsx - Main Application (267 lines)

The monolithic component managing the entire application lifecycle.

**State Variables:**
- `userName` - User's name (null until provided)
- `nameInput` - Controlled input for name entry
- `messages` - Array of Message objects (chat history)
- `userInput` - Controlled input for chat
- `isLoading` - Blocks input during processing
- `isGreeting` - True during greeting sequence
- `greetingIndex` - Current greeting line index (0-6)
- `greetingLines` - Pre-defined greeting text array
- `isPreparingGreeting` - True while generating greeting audio
- `greetingAudio` - Pre-generated base64 audio array
- `nameError` - Error message for name submission failures

**Refs:**
- `audioContextRef` - Singleton AudioContext instance
- `messagesEndRef` - Auto-scroll target
- `nameInputRef` - Name input focus control
- `inputRef` - Chat input focus control
- `playingGreetingIndexRef` - StrictMode double-render guard

**Key Methods:**

#### ensureAudioContext()
Lazy initialization of AudioContext with webkit fallback. Required before any audio operation.

#### handleNameSubmit()
1. Validates name input
2. Sets `isPreparingGreeting` to true
3. Generates 7 greeting lines with user's name
4. Calls `synthesizeSpeech()` in parallel for all lines
5. Stores audio in state
6. Transitions to greeting phase

#### playAndProgress(base64Audio, onFinished)
Generic audio player with callback:
1. Decodes base64 audio
2. Converts to AudioBuffer
3. Plays audio with effects
4. Calls `onFinished()` on completion or error

#### handleUserInput()
Main conversation handler:
1. Adds user message to state
2. Calls `getDrSbaitsoResponse()` API
3. Checks for glitch phrases, plays glitch sound if found
4. Starts typewriter effect (40ms per character)
5. Simultaneously requests TTS audio
6. Plays audio when both typing and API complete
7. Error handling with retro error messages

### services/geminiService.ts

**Exports:**
- `getDrSbaitsoResponse(message: string): Promise<string>`
- `synthesizeSpeech(text: string): Promise<string>`

**Chat Configuration:**
- Model: `gemini-2.5-flash`
- Persistent Chat object (maintains conversation history)
- System instruction defines Dr. Sbaitso personality:
  - ALL CAPS responses only
  - 1991 knowledge cutoff
  - Robotic, probing questions
  - Random glitches with 8-bit diagnostics
  - No modern slang or concepts

**TTS Configuration:**
- Model: `gemini-2.5-flash-preview-tts`
- Voice: 'Charon' (deep, monotone)
- Prompt: "Say in a very deep, extremely monotone, continuous, 8-bit computer voice from 1991"
- Phonetic override: "SBAITSO" → "SUH-BAIT-SO"
- Returns: Base64-encoded PCM audio

### utils/audio.ts

**Audio Processing Pipeline:**

```
Base64 String
    ↓ decode()
Uint8Array
    ↓ decodeAudioData()
AudioBuffer (24kHz, Float32)
    ↓ playAudio()
┌─────────────────────────────┐
│   Audio Effects Chain       │
│  ┌──────────────────────┐   │
│  │ BufferSource         │   │
│  │ (playbackRate: 1.1)  │   │
│  └──────────┬───────────┘   │
│             ↓               │
│  ┌──────────────────────┐   │
│  │ ScriptProcessorNode  │   │
│  │ (6-bit bit-crusher)  │   │
│  │ (64 quantization     │   │
│  │  levels)             │   │
│  └──────────┬───────────┘   │
│             ↓               │
│  ┌──────────────────────┐   │
│  │  AudioDestination    │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
    ↓
Speaker Output (8-bit retro sound)
```

**Key Functions:**

- `decode()` - Base64 to Uint8Array using atob()
- `decodeAudioData()` - Int16 PCM to Float32 AudioBuffer conversion
- `playAudio()` - Applies bit-crusher and playback rate effects
- `playGlitchSound()` - 200ms white noise with exponential fade-out
- `playErrorBeep()` - 300ms square wave at 300Hz

**Bit-Crusher Algorithm:**
```javascript
numLevels = 64  // 6-bit audio
step = 2.0 / (numLevels - 1)  // 0.031746...
output[i] = Math.round(input[i] / step) * step
```

This quantizes float samples from [-1.0, 1.0] to 64 discrete levels, creating the characteristic 8-bit audio artifact.

## Data Flow

### Greeting Sequence Flow

```
User enters name → handleNameSubmit()
                         ↓
    Promise.all([synthesizeSpeech(line1),
                 synthesizeSpeech(line2),
                 ...
                 synthesizeSpeech(line7)])
                         ↓
              Store in greetingAudio[]
                         ↓
              setIsGreeting(true)
                         ↓
         useEffect triggers on greetingIndex
                         ↓
    Display message → Play audio → Increment index
                         ↓
              (Repeat for all 7 lines)
                         ↓
         greetingIndex >= greetingLines.length
                         ↓
    setIsGreeting(false), setIsLoading(false)
```

### Conversation Flow

```
User submits input → handleUserInput()
                          ↓
            Add user message to messages[]
                          ↓
      ┌──────────────────┴───────────────────┐
      ↓                                      ↓
getDrSbaitsoResponse()              Add empty dr message
      ↓                                      ↓
Response text received              Typewriter effect
      ↓                              (40ms/char)
Check for glitch phrases                     ↓
      ↓                              Update message text
Play glitch sound (if match)                 ↓
      ↓                              Typing complete
synthesizeSpeech(response)                   ↓
      ↓                              Wait for audio
Audio generated ─────────────────────────────┤
                                             ↓
                                  Play audio with effects
                                             ↓
                                    setIsLoading(false)
```

## State Transitions

```
┌────────────────┐
│     INIT       │
│ userName=null  │
│ isLoading=true │
└──────┬─────────┘
       │ User enters name
       ↓
┌──────────────────────────┐
│    PREPARING_GREETING    │
│ isPreparingGreeting=true │
└──────┬───────────────────┘
       │ Audio generated
       ↓
┌──────────────────┐
│  GREETING        │
│ isGreeting=true  │
│ greetingIndex++  │
└──────┬───────────┘
       │ All lines played
       ↓
┌─────────────────┐
│    READY        │
│ isLoading=false │
└──────┬──────────┘
       │ User submits input
       ↓
┌────────────────┐
│   PROCESSING   │
│ isLoading=true │
└──────┬─────────┘
       │ Response complete
       ↓
┌────────────────┐
│  READY         │
└────────────────┘
```

## Performance Considerations

### Concurrent Operations

1. **Greeting Audio Pre-generation**: All 7 greeting audio chunks generated in parallel before greeting starts
2. **Response Processing**: Typewriter effect runs concurrently with TTS API call
3. **Audio Streaming**: Audio plays immediately after generation without blocking UI

### Memory Management

- AudioContext: Singleton instance, never recreated
- Audio nodes: Disconnected after playback completes (garbage collection)
- ScriptProcessorNode: Legacy API, potential memory leak on long sessions

### React StrictMode Guards

`playingGreetingIndexRef` prevents double audio playback during development:
```javascript
if (playingGreetingIndexRef.current !== greetingIndex) {
  playingGreetingIndexRef.current = greetingIndex;
  // Play audio
}
```

## Browser Compatibility

### Required APIs
- Web Audio API (AudioContext, ScriptProcessorNode)
- AudioContext.resume() for autoplay policy compliance
- atob() for base64 decoding
- ES2022 features (async/await, optional chaining)

### Known Limitations
- ScriptProcessorNode deprecated (future: migrate to AudioWorklet)
- Autoplay policy requires user interaction before audio plays
- Safari requires webkitAudioContext fallback
- Mobile browsers may have different sample rate support

## Type System

```typescript
// types.ts
interface Message {
  author: 'user' | 'dr';
  text: string;
}
```

Simple message model supports bi-directional conversation display.

## Future Architecture Improvements

1. **AudioWorklet Migration**: Replace ScriptProcessorNode for better performance
2. **State Management**: Extract to Context API or Zustand for better separation
3. **Message Streaming**: Add real-time streaming for longer responses
4. **Audio Caching**: Cache common phrases to reduce TTS API calls
5. **Error Recovery**: Implement retry logic for failed API calls
6. **Accessibility**: Add ARIA labels and keyboard navigation
