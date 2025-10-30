# Architecture Documentation

## Overview

Dr. Sbaitso Recreated is a single-page React application that recreates the 1991 AI therapist program. The architecture is built around six core systems: UI/State Management, AI Integration, Audio Processing, Session Management, Export System, and Keyboard Navigation.

**Version 1.1.0** introduces substantial architectural enhancements:
- Multi-character personality system with isolated chat instances
- Theme engine with CSS variable-based dynamic styling
- Configurable audio quality pipeline with 4 presets
- localStorage-based session persistence and statistics tracking
- Multi-format conversation export system
- Comprehensive keyboard shortcut system with platform detection

## System Architecture (v1.1.0)

```
┌─────────────────────────────────────────────────────────────┐
│                           App.tsx                           │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐  │
│  │   Name   │→ │ Character │→ │ Greeting │→ │Conversation│  │
│  │  Entry   │  │ Selection │  │ Sequence │  │   Phase    │  │
│  └──────────┘  └───────────┘  └──────────┘  └────────────┘  │
└─────┬──────────┬───────────┬───────────┬───────────────┬────┘
      │          │           │           │               │
┌─────▼──────┐ ┌─▼────────┐ ┌▼────────┐ ┌▼────────────┐ ┌▼─────────┐
│ constants  │ │ gemini   │ │ audio   │ │ session     │ │ keyboard │
│  5 chars   │ │ Service  │ │ utils   │ │ Manager     │ │shortcuts │
│  5 themes  │ │Multi-ch  │ │Config   │ │localStorage │ │30+ keys  │
│  4 presets │ │ Chat     │ │Quality  │ │Auto-save    │ │Ctrl/Cmd  │
└────────────┘ │ Map      │ │Presets  │ │Stats        │ └──────────┘
               └──────────┘ └─────────┘ └────┬────────┘
                                             │
                                        ┌────▼─────┐
                                        │  Export  │
                                        │ 4 Formats│
                                        │MD/TXT/   │
                                        │JSON/HTML │
                                        └──────────┘
```

## Component Structure

### App.tsx - Main Application (ENHANCED v1.1.0)

The main component managing the entire application lifecycle, now with multi-character support, themes, and session management.

**State Variables (v1.1.0 Extended):**
- `userName` - User's name (null until provided)
- `nameInput` - Controlled input for name entry
- `currentCharacter` - Selected AI personality (id from CHARACTERS)
- `currentTheme` - Active theme (id from THEMES)
- `audioQuality` - Current audio preset (id from AUDIO_QUALITY_PRESETS)
- `messages` - Array of Message objects with timestamps and characterId
- `userInput` - Controlled input for chat
- `isLoading` - Blocks input during processing
- `isGreeting` - True during greeting sequence
- `greetingIndex` - Current greeting line index
- `greetingLines` - Character-specific greeting text array
- `isPreparingGreeting` - True while generating greeting audio
- `greetingAudio` - Pre-generated base64 audio array
- `nameError` - Error message for name submission failures
- `currentSession` - Active ConversationSession object
- `showSettings` - Settings panel visibility toggle
- `showStatistics` - Statistics dashboard visibility toggle
- `showExport` - Export dialog visibility toggle

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

**Bit-Crusher Algorithm (v1.1.0 Enhanced):**
```javascript
// Configurable quality presets
numLevels = bitDepth  // 16, 64, 256, or 0 (disabled)
step = 2.0 / (numLevels - 1)
output[i] = Math.round(input[i] / step) * step
```

This quantizes float samples from [-1.0, 1.0] to configurable discrete levels (16, 64, or 256), creating adjustable 8-bit audio artifacts. When `bitDepth` is 0, bit-crushing is disabled for modern quality output.

### constants.ts (NEW v1.1.0)

Central configuration file containing all customization data.

**CHARACTERS Array (5 personalities):**
```typescript
interface CharacterPersonality {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;  // Complete AI personality definition
  voicePrompt: string;         // TTS voice instruction
}
```

- Dr. Sbaitso, ELIZA, HAL 9000, JOSHUA, PARRY
- Each ~1-2KB system instruction defining personality, era, constraints
- Unique voice prompts for TTS characterization

**THEMES Array (5 retro themes):**
```typescript
interface Theme {
  id: string;
  name: string;
  colors: {
    primary, background, text, accent, border, shadow
  };
}
```

- DOS Blue, Phosphor Green, Amber Monochrome, Paper White, Matrix Green
- CSS color values for instant theme switching via CSS variables

**AUDIO_QUALITY_PRESETS Array (4 presets):**
```typescript
interface AudioQualityPreset {
  id: string;
  name: string;
  bitDepth: number;      // 16, 64, 256, or 0
  playbackRate: number;  // 1.0, 1.1, or 1.2
  description: string;
}
```

- Extreme Lo-Fi, Authentic 8-bit, High Quality, Modern
- Maps directly to audio.ts `playAudio()` parameters

**KEYBOARD_SHORTCUTS Object:**
- Key definitions for all shortcuts
- Used by useKeyboardShortcuts hook

### utils/sessionManager.ts (NEW v1.1.0)

Static class managing localStorage-based session persistence.

**Key Methods:**

`createSession(characterId, themeId, audioQualityId): ConversationSession`
- Generates unique session ID with timestamp and random string
- Initializes metadata (name, timestamps, counts)
- Returns new session object

`saveSession(session: ConversationSession): void`
- Serializes session to JSON
- Stores in localStorage under `sbaitso_sessions` key
- Updates existing or appends new
- ~5-10 KB per 50-100 message session

`getCurrentSession(): ConversationSession | null`
- Retrieves `sbaitso_current_session` from localStorage
- Returns null if not found or invalid

`getAllSessions(): ConversationSession[]`
- Retrieves all sessions array
- Returns empty array if none exist

`deleteSession(id: string): void`
- Removes session by ID from array
- Updates localStorage

`clearAllSessions(): void`
- Removes all session data from localStorage

**Settings Management:**

`getSettings(): AppSettings`
- Returns saved settings or defaults
- Settings include: soundEnabled, autoScroll, showTimestamps

`saveSettings(settings: AppSettings): void`
- Persists settings to localStorage under `sbaitso_settings` key

**Statistics Tracking:**

`updateStats(session: ConversationSession): void`
- Increments totalSessions, totalMessages, totalGlitches
- Updates charactersUsed and themesUsed counts
- Recalculates averageMessagesPerSession
- Determines favoriteCharacter and favoriteTheme

`getStats(): SessionStats`
- Returns aggregated statistics object

`resetStats(): void`
- Clears all statistics

**Auto-Save Integration:**
- App.tsx calls `saveSession()` every 60 seconds via setInterval
- Triggered on every message send
- No network requests, all client-side

### utils/exportConversation.ts (NEW v1.1.0)

Static class for multi-format conversation export.

**Main Method:**

`exportSession(session: ConversationSession, options: ExportFormat): string`
- Dispatcher routing to format-specific methods
- Returns formatted string ready for download

**Format Methods:**

`toMarkdown(session, options): string`
- Formats with `# Session Name` header
- Metadata block with character, date, counts
- Messages as blockquotes: `> Text here`
- Timestamps in italic if `includeTimestamps: true`

`toText(session, options): string`
- Plain text with ASCII separators
- `=` underline for title, `-` separator for metadata
- ALL CAPS author labels
- Human-readable timestamps

`toJSON(session, options): string`
- Pretty-printed JSON with 2-space indentation
- Full session object or messages-only based on `includeMetadata`
- Machine-readable, parseable format

`toHTML(session, options): string`
- Standalone HTML document with embedded CSS
- Retro styling matching DOS Blue theme
- Monospace font, blue background, styled messages
- Viewable directly in browser

**Helper Methods:**

`download(content: string, filename: string, mimeType: string): void`
- Creates Blob from content string
- Generates object URL
- Triggers browser download via temporary `<a>` element
- Cleanup: removes element and revokes URL

`getFilename(session, format): string`
- Generates timestamped filename: `session-name_2025-10-29T23-45-30.md`

`getMimeType(format): string`
- Returns correct MIME type for each format

**Usage Pattern:**
```typescript
const content = ConversationExporter.exportSession(session, {
  format: 'markdown',
  includeTimestamps: true,
  includeMetadata: true
});
const filename = ConversationExporter.getFilename(session, 'md');
const mimeType = ConversationExporter.getMimeType('markdown');
ConversationExporter.download(content, filename, mimeType);
```

### hooks/useKeyboardShortcuts.ts (NEW v1.1.0)

Custom React hook providing keyboard shortcut functionality.

**Features:**
- Platform detection (macOS vs Windows/Linux)
- Single global event listener via event delegation
- Context-awareness (disables when typing in text inputs)
- 30+ shortcuts covering all major actions

**Platform Detection:**
```typescript
const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const modKey = isMac ? 'Meta' : 'Control';
```

**Shortcut Categories:**

**Core Actions:**
- `Enter` - Send message
- `${modKey}+L` - Clear conversation
- `${modKey}+E` - Export
- `${modKey}+,` - Settings
- `${modKey}+S` - Statistics

**Character Selection:**
- `${modKey}+]` / `${modKey}+[` - Cycle characters
- `${modKey}+1-5` - Direct character selection

**Theme Selection:**
- `Alt+]` / `Alt+[` - Cycle themes
- `Alt+1-5` - Direct theme selection

**Audio Controls:**
- `${modKey}+M` - Toggle mute
- `${modKey}+Shift+Q` - Cycle audio quality
- `${modKey}+0` - Stop audio

**Event Handler Pattern:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip if typing in input/textarea
    if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Check modifiers and key combination
    if (e.key === 'l' && e[modKey + 'Key'] && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      onClearConversation();
    }
    // ... etc for all shortcuts
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [dependencies]);
```

**Benefits:**
- No library dependencies
- Minimal performance overhead (<1ms response)
- Prevents browser default behaviors where appropriate
- Respects user context (doesn't interfere with typing)

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
