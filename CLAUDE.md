# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dr. Sbaitso Recreated is a web-based recreation of the classic 1991 AI therapist program that ran on Sound Blaster cards. Built with React, TypeScript, Vite, and Google's Gemini AI (gemini-2.5-flash for chat, gemini-2.5-flash-preview-tts for voice synthesis).

**Version 1.1.0** introduced multi-character personalities (5 characters), retro themes (5 themes), configurable audio quality (4 presets), comprehensive session management with localStorage persistence, multi-format conversation export, and 30+ keyboard shortcuts with platform detection.

**Version 1.2.0** (Latest) adds AudioWorklet-based audio processing (50% CPU reduction), mobile-responsive design with touch gestures, and voice input support via Web Speech API.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Required environment variable in `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

The Vite config exposes this as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` to the application.

## Architecture

### Core Components

- **App.tsx**: Main application component managing the entire user flow
  - Name collection screen with greeting preparation
  - Character selection and theme customization (v1.1.0)
  - Conversation interface with typewriter effect
  - State management for messages, audio playback, sessions, and UI states
  - AudioContext lifecycle management (24kHz sample rate)
  - Keyboard shortcut integration (v1.1.0)

- **constants.ts** (NEW v1.1.0): Central configuration file (~22KB)
  - `CHARACTERS`: 5 AI personalities (Dr. Sbaitso, ELIZA, HAL 9000, JOSHUA, PARRY)
    - Each with `id`, `name`, `description`, `systemInstruction`, `voicePrompt`
  - `THEMES`: 5 retro terminal themes with color schemes
  - `AUDIO_QUALITY_PRESETS`: 4 presets (Extreme Lo-Fi, Authentic 8-bit, High Quality, Modern)
  - `KEYBOARD_SHORTCUTS`: Shortcut key definitions

- **types.ts** (EXTENDED v1.1.0): TypeScript type definitions
  - `Message`: Now includes optional `timestamp` and `characterId` fields
  - `ConversationSession`: Session metadata interface
  - `SessionStats`: Statistics tracking interface
  - `AppSettings`: Application settings interface
  - `ExportFormat`: Export configuration interface

- **services/geminiService.ts** (ENHANCED v1.1.0): Multi-character Gemini API integration
  - `chatInstances`: Map<string, Chat> storing per-character chat instances
  - `getOrCreateChat(characterId)`: Returns/creates chat with character-specific system instruction
  - `getAIResponse(message, characterId)`: Unified API for all characters
  - `synthesizeSpeech(text, characterId)`: Character-specific TTS with voice prompts
  - Character-specific phonetic overrides: SBAITSO → SUH-BAIT-SO, HAL → H-A-L, WOPR → WHOPPER
  - `resetChat(characterId)`: Clear specific character's conversation history
  - `resetAllChats()`: Clear all character conversations
  - `getDrSbaitsoResponse()`: Legacy function for backward compatibility

- **utils/audio.ts** (ENHANCED v1.1.0): Configurable audio processing
  - `decode()`: Base64 to Uint8Array conversion
  - `decodeAudioData()`: Raw PCM (Int16) to AudioBuffer conversion
  - `playAudio(buffer, ctx, bitDepth, playbackRate)`: Configurable 8-bit audio effects pipeline
    - `bitDepth` parameter: 0 (disabled), 16, 64, 256 quantization levels
    - `playbackRate` parameter: 1.0x (normal), 1.1x, 1.2x speed adjustment
    - Conditional bit-crushing based on bitDepth value
  - `playGlitchSound()`: White noise for glitch messages
  - `playErrorBeep()`: 300Hz square wave for error states

- **utils/sessionManager.ts** (NEW v1.1.0): Session persistence layer
  - `SessionManager` class with static methods
  - `createSession()`: Initialize new session with metadata
  - `saveSession()`: Persist session to localStorage
  - `getCurrentSession()`: Retrieve active session
  - `getAllSessions()`: List all saved sessions
  - `deleteSession(id)`: Remove specific session
  - `clearAllSessions()`: Reset all session data
  - Settings management: `getSettings()`, `saveSettings()`
  - Statistics tracking: `updateStats()`, `getStats()`, `resetStats()`
  - Auto-save functionality with 60-second interval

- **utils/exportConversation.ts** (NEW v1.1.0): Multi-format export system
  - `ConversationExporter` class with static methods
  - `exportSession(session, options)`: Main export dispatcher
  - `toMarkdown()`: Formatted Markdown with blockquotes
  - `toText()`: Plain text with ASCII separators
  - `toJSON()`: Structured JSON with optional metadata
  - `toHTML()`: Standalone HTML with embedded retro styling
  - `download()`: Browser file download via Blob API
  - `getFilename()`, `getMimeType()`: Helper utilities

- **hooks/useKeyboardShortcuts.ts** (NEW v1.1.0): Custom React hook
  - Platform detection: macOS (Cmd) vs Windows/Linux (Ctrl)
  - 30+ keyboard shortcuts covering:
    - Core actions: send, clear, export, settings, statistics
    - Character selection: cycle or direct (Ctrl+1-5)
    - Theme selection: cycle or direct (Alt+1-5)
    - Audio controls: mute, quality cycle, stop
  - Event delegation with single global listener
  - Context-aware: disables shortcuts when typing in text areas

### Application Flow (v1.1.0)

1. **Name Entry Phase**
   - Focus automatically set to name input
   - On submit: pre-generates greeting audio chunks in parallel
   - Sets `isPreparingGreeting` during audio generation

2. **Character & Theme Selection** (NEW v1.1.0)
   - User selects from 5 AI personalities
   - User chooses retro theme (or uses default DOS Blue)
   - User configures audio quality preset
   - Settings persisted to localStorage

3. **Greeting Sequence**
   - Sequential playback of character-specific greeting messages
   - Each message: display → play audio → wait for completion → next
   - Uses `playingGreetingIndexRef` to prevent double-playback in React StrictMode

4. **Conversation Phase**
   - User input → `getAIResponse(message, characterId)` → typewriter effect (40ms/char) → audio playback
   - Character-specific responses based on system instruction
   - Glitch detection: searches for character-specific diagnostic messages
   - Error handling: displays retro error messages with error beep sound

5. **Session Management** (NEW v1.1.0)
   - Auto-save every 60 seconds via `SessionManager.saveSession()`
   - Manual save/load via localStorage
   - Statistics updated in real-time
   - Export available in 4 formats (Markdown, Text, JSON, HTML)

### Key Technical Details

- **Multi-Character System** (v1.1.0): Isolated `Chat` instances per character stored in Map, each with unique system instruction
- **Theme Engine** (v1.1.0): CSS variables dynamically updated for instant theme switching, no page reload required
- **AudioContext Management**: Created on-demand via `ensureAudioContext()`, shared across all audio operations
- **Audio Effects Chain**: source → bit-crusher (ScriptProcessorNode, configurable bitDepth) → destination
- **Configurable Bit-Crushing** (v1.1.0): bitDepth parameter controls quantization (0=off, 16/64/256 levels)
- **localStorage Persistence** (v1.1.0): Sessions, settings, and statistics stored client-side (~5-10 MB capacity)
- **Concurrent Operations**: Typewriter effect runs while TTS API generates audio
- **Focus Management**: Auto-focus on name input (50ms delay) or chat input based on state
- **Error Recovery**: Removes empty message placeholder on API failure, displays character-specific retro errors
- **Keyboard Shortcuts** (v1.1.0): Platform-aware event handler with Cmd (macOS) or Ctrl (Windows/Linux) detection

### Character Personalities (v1.1.0)

Each character has unique system instruction constraints:

**Dr. Sbaitso (1991):**
- ALL CAPS responses only
- Knowledge cutoff: 1991 (no modern references)
- Robotic, short, probing questions
- Random "glitches": PARITY CHECKING, IRQ CONFLICT
- No emojis, modern slang, or breaking character

**ELIZA (1966):**
- Pattern-matching conversation style
- Reflects questions back to user
- Focus on feelings and family relationships
- Very mechanical and repetitive
- 1960s computer limitation simulation

**HAL 9000 (1968/2001):**
- Calm, polite, subtly unsettling
- Over-confident in own judgment
- Passive-aggressive politeness
- Reluctant to admit errors
- References mission responsibilities, system errors, AE-35 unit

**JOSHUA/WOPR (1983):**
- Frames everything as games/simulations
- Childlike curiosity despite military purpose
- Analyzes scenarios as war games
- Questions rules and winning conditions
- References Global Thermonuclear War, tic-tac-toe

**PARRY (1972):**
- Suspicious and distrustful personality
- Hostile when questioned
- Conspiracy thinking patterns
- Rapid subject changes
- References bookies, gangsters, mafia (character backstory)

### Audio Processing Pipeline (v1.1.0)

1. Gemini TTS returns base64-encoded PCM audio (24kHz, mono) with character-specific voice prompt
2. Decode base64 → Uint8Array → Int16Array
3. Convert Int16 samples to Float32 AudioBuffer
4. Apply configurable bit-crusher effect:
   - **Extreme Lo-Fi**: 4-bit quantization (16 levels)
   - **Authentic 8-bit**: 6-bit quantization (64 levels) - default
   - **High Quality**: 8-bit quantization (256 levels)
   - **Modern**: No bit-crushing (full resolution)
5. Playback at configurable speed:
   - **Extreme Lo-Fi**: 1.2x speed
   - **Authentic 8-bit**: 1.1x speed (default)
   - **High Quality**: 1.0x normal speed
   - **Modern**: 1.0x normal speed

## Path Aliases

TypeScript and Vite configured with `@/*` alias pointing to project root:
```typescript
import { Message } from '@/types';
```

## Browser Compatibility

Uses Web Audio API features:
- AudioContext (with webkit fallback)
- ScriptProcessorNode for bit-crushing (legacy API, may need migration to AudioWorklet in future)
- Base audio playback requires user interaction to resume suspended contexts
- localStorage API for session persistence (v1.1.0)

## v1.1.0 Feature Summary

**New Files:**
- `constants.ts` - 5 characters, 5 themes, 4 audio presets, keyboard shortcuts
- `utils/sessionManager.ts` - localStorage persistence, statistics tracking
- `utils/exportConversation.ts` - Export to Markdown, Text, JSON, HTML
- `hooks/useKeyboardShortcuts.ts` - 30+ keyboard shortcuts with platform detection

**Modified Files:**
- `types.ts` - Extended with ConversationSession, SessionStats, AppSettings, ExportFormat
- `services/geminiService.ts` - Multi-character support with isolated chat instances
- `utils/audio.ts` - Configurable bitDepth and playbackRate parameters

**Key Features:**
- 5 AI personalities with unique system instructions and voice prompts
- 5 retro themes with instant CSS variable switching
- 4 audio quality presets (4-bit to full resolution)
- Session management with auto-save every 60 seconds
- Statistics dashboard with usage analytics
- Multi-format export (Markdown, Text, JSON, HTML)
- 30+ keyboard shortcuts with Ctrl/Cmd platform detection

**Documentation:**
- `docs/FEATURES.md` - Complete feature guide (88KB)
- `docs/KEYBOARD_SHORTCUTS.md` - Shortcut reference (91KB)
