# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dr. Sbaitso Recreated is a web-based recreation of the classic 1991 AI therapist program that ran on Sound Blaster cards. Built with React, TypeScript, Vite, and Google's Gemini AI (gemini-2.5-flash for chat, gemini-2.5-flash-preview-tts for voice synthesis).

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

- **App.tsx** (267 lines): Main application component managing the entire user flow
  - Name collection screen with greeting preparation
  - Conversation interface with typewriter effect
  - State management for messages, audio playback, and UI states
  - AudioContext lifecycle management (24kHz sample rate)

- **geminiService.ts**: Gemini API integration
  - `getDrSbaitsoResponse()`: Chat API using persistent Chat object with system instruction
  - `synthesizeSpeech()`: TTS API with 'Charon' voice, phonetic override for "SBAITSO" → "SUH-BAIT-SO"

- **audio.ts**: Audio processing utilities
  - `decode()`: Base64 to Uint8Array conversion
  - `decodeAudioData()`: Raw PCM (Int16) to AudioBuffer conversion
  - `playAudio()`: 8-bit audio effects pipeline (bit-crusher at 6-bit/64 levels, 1.1x playback rate)
  - `playGlitchSound()`: White noise for "PARITY CHECKING" / "IRQ CONFLICT" messages
  - `playErrorBeep()`: 300Hz square wave for error states

### Application Flow

1. **Name Entry Phase**
   - Focus automatically set to name input
   - On submit: pre-generates all 7 greeting audio chunks in parallel
   - Sets `isPreparingGreeting` during audio generation

2. **Greeting Sequence**
   - Sequential playback of 7 pre-generated greeting messages
   - Each message: display → play audio → wait for completion → next
   - Uses `playingGreetingIndexRef` to prevent double-playback in React StrictMode

3. **Conversation Phase**
   - User input → API request → typewriter effect (40ms/char) → audio playback
   - Glitch detection: searches response for "PARITY CHECKING" or "IRQ CONFLICT" phrases
   - Error handling: displays retro error messages with error beep sound

### Key Technical Details

- **AudioContext Management**: Created on-demand via `ensureAudioContext()`, shared across all audio operations
- **Audio Effects Chain**: source → bit-crusher (ScriptProcessorNode) → destination
- **Concurrent Operations**: Typewriter effect runs while TTS API generates audio
- **Focus Management**: Auto-focus on name input (50ms delay) or chat input based on state
- **Error Recovery**: Removes empty message placeholder on API failure, displays random retro error

### Character Constraints

Dr. Sbaitso system instruction enforces:
- ALL CAPS responses only
- Knowledge cutoff: 1991 (no modern references)
- Robotic, short, probing questions
- Random "glitches" with 8-bit diagnostic messages
- No emojis, modern slang, or breaking character

### Audio Processing Pipeline

1. Gemini TTS returns base64-encoded PCM audio (24kHz, mono)
2. Decode base64 → Uint8Array → Int16Array
3. Convert Int16 samples to Float32 AudioBuffer
4. Apply bit-crusher effect (6-bit quantization)
5. Playback at 1.1x speed for deeper/faster voice

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
