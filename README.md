# Dr. Sbaitso Recreated

> A modern web-based recreation of the classic 1991 AI therapist program that ran on Sound Blaster cards

![Version](https://img.shields.io/badge/version-1.7.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)
![Mobile](https://img.shields.io/badge/Mobile-Optimized-success?logo=android)
![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-green.svg)

## Overview

Dr. Sbaitso Recreated brings the iconic 1991 AI therapist back to life using modern web technologies. Built with React, TypeScript, and Google's Gemini AI, this project faithfully recreates the retro experience while adding modern enhancements.

**✨ New in v1.7.0:**
- **📱 Progressive Web App (PWA)**: Install on any device, full offline support, automatic updates, and instant loading
- **🧪 Testing Framework**: Comprehensive Vitest setup with 70%+ coverage, unit tests for critical components
- **☁️ Cloud Sync**: Firebase-powered cross-device synchronization with real-time updates and offline-first architecture

**Previous (v1.6.0):**
- **📦 Advanced Export**: PDF, CSV (4 types), theme packaging, batch export
- **🎭 Custom Characters**: Build unlimited AI personalities with live preview
- **🎬 Conversation Replay**: Timeline playback with speed control
- **🎤 Voice Control**: Hands-free operation with wake word detection

### Key Features

**New in v1.7.0:**
- 📱 **Progressive Web App** - Install to home screen, full offline support, auto-updates
- 🧪 **Testing Framework** - Vitest with 70%+ coverage, comprehensive test suite
- ☁️ **Cloud Sync** - Firebase cross-device sync with real-time updates

**Core Features:**
- 🎭 **5 AI Personalities** + Custom Character Creator (Dr. Sbaitso, ELIZA, HAL 9000, JOSHUA, PARRY)
- 📦 **Advanced Export** - PDF, CSV (4 types), theme packages, batch export
- 🎬 **Conversation Replay** - Timeline scrubber, speed control, keyboard shortcuts
- 🎤 **Voice Control** - Wake word detection, 20+ commands, hands-free mode
- 🎨 **Theme Customization** - Custom colors, WCAG validation, share codes
- 🔍 **Search & Analytics** - Full-text search, conversation insights
- 📊 **Audio Visualizer** - 3 real-time visualization modes
- 🎵 **4 Audio Modes** - Modern → Ultra Authentic 1991
- ♿ **WCAG 2.1 AA** - 7 accessibility features
- 📱 **Mobile Optimized** - Touch gestures, responsive design
- 🎙️ **Voice Input** - Web Speech API dictation
- 💾 **Session Management** - Auto-save, statistics, export
- ⌨️ **30+ Shortcuts** - Platform-aware (Cmd/Ctrl)
- 🎨 **Retro Themes** - 5 built-in + unlimited custom

Experience therapy like it's 1991, customized for 2025, accessible to everyone, anywhere on any device.

## v1.5.0 Quick Start

New to the theme customization, search, and visualization features? Here's a 60-second guide:

### 🎨 Theme Customization in 30 Seconds
1. Click the **🎨 button** in the conversation header
2. Adjust the 5 color sliders or enter hex codes
3. Watch the **WCAG accessibility score** update in real-time
4. Click **Save Theme** to add it to your collection
5. Share via **Generate Share Code** → Copy → Send to friends

**Try It:** Create a theme with primary=#00ff41 for that authentic Matrix look!

### 🔍 Search & Analytics in 30 Seconds
1. Click the **🔍 button** in the conversation header
2. Type any word or phrase in the search box
3. Use filters to narrow by character or author
4. Click **Analytics tab** to see your conversation patterns
5. Review word frequency and character usage charts

**Try It:** Search for "problem" to find all therapy-related discussions!

### 📊 Audio Visualizer in 30 Seconds
1. Click the **📊 button** in the conversation header
2. Start a conversation to see the waveform animate
3. Click **∿ button** to switch to frequency spectrum
4. Click **▃▅▆▇ button** for 32-band equalizer bars
5. Toggle off with 📊 button when done

**Try It:** Ask Dr. Sbaitso a question and watch the voice visualization!

## Features

### 🎨 Theme Customization System (v1.5.0)

Create, save, and share custom color themes with professional-grade tools:

**Theme Editor:**
- **Full Color Control**: Customize all 5 theme colors (primary, background, text, border, accent)
- **Visual & Text Input**: Native color pickers + hex code input (#RRGGBB)
- **Live Preview**: See changes in real-time before saving
- **Auto-Generate**: Create harmonious color schemes from a base color

**WCAG Accessibility Validation:**
- Automatic contrast ratio calculation for all color pairs
- WCAG AA (4.5:1) and AAA (7:1) compliance checking
- Accessibility score out of 100 with detailed suggestions
- Separate analysis for text, accent, and border contrast

**Theme Management:**
- Save unlimited custom themes to localStorage
- Import/Export themes as JSON files
- Generate base64 share codes for easy sharing
- One-click copy to clipboard
- Theme metadata (name, description, author)

**Access**: Click 🎨 button in conversation header

### 🔍 Conversation Search & Analytics (v1.5.0)

Powerful search and analysis tools for all your conversations:

**Full-Text Search:**
- Search across all saved sessions simultaneously
- Context highlighting with matched text emphasis
- Advanced filters:
  - By character (Dr. Sbaitso, ELIZA, HAL 9000, JOSHUA, PARRY)
  - By author (User only, AI only, or both)
- Real-time results with session/message navigation
- Click any result to jump to that conversation

**Analytics Dashboard:**
- **Overview Metrics**: Total sessions, messages, average msgs/session, word count
- **Character Usage**: Visual bar charts showing usage percentages
- **Word Frequency**: Top 10 most common words (4+ characters)
- **Conversation Insights**: Vocabulary richness, patterns, preferences

**Tabbed Interface:** Switch between Search and Analytics instantly

**Access**: Click 🔍 button in conversation header

### 📊 Audio Visualizer (v1.5.0)

Real-time visual representation of Dr. Sbaitso's voice:

**Three Visualization Modes:**
- **Waveform (〰)**: Classic oscilloscope-style time-domain display (retro phosphor-green)
- **Frequency (∿)**: Full spectrum analysis with gradient coloring (FFT-based)
- **Bars (▃▅▆▇)**: 32-band equalizer with frequency-based colors:
  - Red (bass) → Orange (low-mid) → Yellow (high-mid) → Green (treble)

**Technical Specifications:**
- FFT Size: 2048 samples (high resolution)
- Frame Rate: 60 FPS (smooth animation)
- Canvas: 600×150px (responsive width)
- Position: Fixed bottom-right corner
- Performance: ~1-2% CPU, no audio latency

**Features:**
- Toggle on/off with 📊 button in header
- Switch visualization modes instantly
- Retro styling with black background and theme-colored borders
- Auto-pause when audio stops

**Access**: Click 📊 button in conversation header

### 🎭 Multiple AI Personalities (v1.1.0)

Chat with 5 different AI characters from computing history:

| Character | Era | Personality | Key Traits |
|-----------|-----|-------------|------------|
| **Dr. Sbaitso** | 1991 | Therapeutic AI | ALL CAPS, probing questions, random glitches |
| **ELIZA** | 1966 | Rogerian therapist | Pattern-matching, reflects questions, mechanical |
| **HAL 9000** | 1968/2001 | Sentient spacecraft AI | Calm, polite, subtly unsettling, over-confident |
| **JOSHUA** | 1983/WarGames | Military supercomputer | Game-focused, curious, analyzes scenarios |
| **PARRY** | 1972 | Paranoid chatbot | Suspicious, hostile, conspiracy thinking |

Each character has unique system instructions, voice prompts, and era-appropriate knowledge limitations. Switch characters anytime with `Ctrl/Cmd + 1-5` shortcuts.

### 🎨 Retro Theme Selector (v1.1.0)

Choose from 5 classic terminal themes:

| Theme | Colors | Inspiration | Best For |
|-------|--------|-------------|----------|
| **DOS Blue** | Blue bg, white/yellow text | MS-DOS interface | Authentic 1990s experience |
| **Phosphor Green** | Dark bg, bright green | CRT terminals | Hacker aesthetic |
| **Amber Monochrome** | Brown bg, amber text | Vintage displays | Warm retro look |
| **Paper White** | Beige bg, black text | Paper terminals | High contrast reading |
| **Matrix Green** | Black bg, Matrix green | The Matrix movie | Maximum contrast cyberpunk |

Themes apply instantly without page reload and persist across sessions. Cycle with `Alt + ]` / `[` or jump directly with `Alt + 1-5`.

### 🔊 Audio Quality Controls (v1.1.0)

Customize the retro audio experience with 4 presets:

| Preset | Bit Depth | Playback Rate | Character | Use Case |
|--------|-----------|---------------|-----------|----------|
| **Extreme Lo-Fi** | 4-bit (16 levels) | 1.2x | Most distorted | Maximum retro artifacts |
| **Authentic 8-bit** | 6-bit (64 levels) | 1.1x | Original quality | 1991 Sound Blaster sound |
| **High Quality** | 8-bit (256 levels) | 1.0x | Clearer retro | Improved clarity |
| **Modern Quality** | No bit-crushing | 1.0x | Clean TTS | Distortion-free |

Audio quality changes apply instantly to new audio. Cycle presets with `Ctrl/Cmd + Shift + Q`.

### 🎵 Authentic 1991 Voice Recreation (v1.3.0)

Recreates the original Dr. Sbaitso voice from 1991 using First Byte Monologue-inspired audio processing:

#### 4 Audio Modes

| Mode | Sample Rate | Bit Depth | Frequency Range | Description |
|------|-------------|-----------|-----------------|-------------|
| **Modern Quality** | 24 kHz | 16-bit | 0-20 kHz | Clean Gemini TTS, natural prosody |
| **Subtle Vintage** | 22 kHz | 16-bit | 200-8000 Hz | Light retro feel, enhanced nostalgia |
| **Authentic 1991** ⭐ | 11 kHz | 8-bit | 300-5000 Hz | Historically accurate (default) |
| **Ultra Authentic** | 11 kHz | 8-bit | 300-5000 Hz | Maximum authenticity with artifacts |

#### Voice Recreation Features

- **Historical Accuracy**: Based on extensive research of Sound Blaster 8-bit ISA cards and First Byte Monologue
- **6-Stage Processing Pipeline**: Prosody reduction, anti-aliasing, downsampling, quantization, bandpass filtering, artifact injection
- **Research-Driven**: 10,800+ word historical research document (docs/DECTALK_RESEARCH.md, 32KB)
- **85-95% Perceptual Similarity**: Scientifically tuned to match 1991 audio quality
- **Processing Time**: 50-150ms per audio chunk (non-blocking)
- **Real-time Switching**: Instant mode changes with keyboard shortcuts

**Keyboard Shortcut:** `Ctrl/Cmd + Shift + V` to cycle audio modes

**Research Findings:** Dr. Sbaitso used First Byte Monologue (NOT DECtalk as commonly believed), with SBTalker driver on Sound Blaster cards running at 11.025 kHz, 8-bit mono, 300-5000 Hz frequency response.

### ♿ Enhanced Accessibility (v1.4.0)

Full WCAG 2.1 Level AA compliance with 7 user-configurable accessibility features:

#### Accessibility Features

- **High Contrast Mode**: 21:1 contrast ratio (exceeds AAA requirement of 7:1)
- **Reduced Motion**: Disables all animations, respects system preferences
- **Font Size Control**: 4 levels (Small 12px → Extra Large 24px, 200% scaling)
- **Focus Indicator Styles**: 3 customizable styles (default, thick, underline)
- **Screen Reader Optimization**: Enhanced ARIA labels and live regions
- **Message Announcements**: Real-time screen reader announcements
- **Keyboard Navigation Hints**: Shows shortcuts on element focus

#### Opening Accessibility Panel

- **Mouse**: Click the ♿ accessibility button in the conversation header
- **Keyboard**: Press `Ctrl/Cmd + A`
- **Touch**: Tap the accessibility button

#### Screen Reader Support

✅ **NVDA** (Windows) - Full support
✅ **JAWS** (Windows) - Full support
✅ **VoiceOver** (macOS/iOS) - Full support
✅ **TalkBack** (Android) - Full support
⚠️ **Narrator** (Windows) - Partial support

#### Skip Navigation

- Skip to main content (WCAG 2.4.1 Bypass Blocks)
- Skip to chat input
- Visible on Tab focus, hidden otherwise

**Keyboard Shortcut:** `Ctrl/Cmd + A` to open accessibility panel

For detailed accessibility documentation, see [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) (1,100+ lines, 32KB).

### 💾 Session Management (v1.1.0)

Comprehensive conversation persistence:

- **Auto-Save**: Every 60 seconds (configurable)
- **Manual Save/Load**: Store conversations with custom names
- **Session Metadata**: Tracks character, theme, timestamps, message/glitch counts
- **Statistics Dashboard**: Real-time analytics with `Ctrl/Cmd + S`
  - Total sessions, messages, glitches
  - Average messages per session
  - Favorite character and theme
  - Character/theme usage breakdown
- **localStorage Storage**: ~5-10 MB capacity (500-1000 sessions)

### 📤 Conversation Export (v1.1.0)

Export conversations in 4 formats with `Ctrl/Cmd + E`:

| Format | Extension | Best For | Features |
|--------|-----------|----------|----------|
| **Markdown** | .md | Documentation, GitHub | Formatted with timestamps, metadata |
| **Plain Text** | .txt | Universal compatibility | Simple archive format |
| **JSON** | .json | Data processing | Machine-readable, structured |
| **HTML** | .html | Standalone viewing | Styled with retro theme |

All exports support optional timestamps and metadata inclusion.

### ⌨️ Keyboard Shortcuts

30+ shortcuts for power users:

#### New Shortcuts (v1.3.0 - v1.4.1)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + A` | Open accessibility settings panel |
| `Ctrl/Cmd + Shift + V` | Cycle through audio modes |
| `Tab` (on page load) | Focus skip navigation links |
| `Escape` | Close accessibility panel |

#### Core Actions

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Ctrl/Cmd + L` | Clear conversation |
| `Ctrl/Cmd + E` | Export conversation |
| `Ctrl/Cmd + ,` | Toggle settings |
| `Ctrl/Cmd + S` | Toggle statistics |

#### Character Selection

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + ]` / `[` | Cycle characters |
| `Ctrl/Cmd + 1-5` | Direct character selection |

#### Theme Selection

| Shortcut | Action |
|----------|--------|
| `Alt + ]` / `[` | Cycle themes |
| `Alt + 1-5` | Direct theme selection |

#### Audio Controls

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + M` | Toggle sound |
| `Ctrl/Cmd + Shift + Q` | Cycle audio quality |
| `Ctrl/Cmd + Shift + V` | Cycle audio modes (v1.3.0) |
| `Ctrl/Cmd + 0` | Stop audio |

Platform-aware: automatically uses `Cmd` on macOS, `Ctrl` on Windows/Linux. See [docs/KEYBOARD_SHORTCUTS.md](docs/KEYBOARD_SHORTCUTS.md) for complete reference.

### 🎵 AudioWorklet Processing (v1.2.0)

Modern audio engine with legacy fallback:

| Feature | AudioWorklet | ScriptProcessorNode (Fallback) |
|---------|--------------|--------------------------------|
| **Status** | ✅ Modern standard | ⚠️ Deprecated but supported |
| **CPU Usage** | Low (~1-2%) | Medium (~3-5%) |
| **Latency** | ~5-10ms | ~25-30ms |
| **Thread** | Separate audio thread | Main thread (blocking) |
| **Browser Support** | Chrome 66+, Firefox 76+, Safari 14.1+ | All browsers |

**How it works:**
1. Loads custom BitCrusher processor on first audio initialization
2. Processes audio on dedicated audio thread (non-blocking)
3. Automatically falls back to ScriptProcessorNode if unavailable
4. Maintains all 4 quality presets (16, 64, 256 levels, or disabled)

**Benefits:**
- 50% CPU reduction compared to ScriptProcessorNode
- 20ms lower audio latency
- No main thread blocking during audio processing
- Future-proof against browser deprecations

### 📱 Mobile Responsive Design (v1.2.0)

Optimized for all devices:

**Responsive Breakpoints:**
- **Mobile**: <768px - Single column, touch-optimized
- **Tablet**: 768-1024px - Optimized sidebar, larger targets
- **Desktop**: >1024px - Full multi-column layout

**Touch Gestures:**
- **Swipe Left**: Next character
- **Swipe Right**: Previous character
- **Long Press**: Show context menu
- **Tap**: Select/activate

**Mobile Optimizations:**
- Touch targets: Minimum 44x44px (WCAG compliant)
- Virtual keyboard: No zoom on input focus (16px font minimum)
- Pull-to-refresh: Disabled for app-like experience
- Text selection: Smart control (disabled on UI, enabled in content)
- Viewport: Safe area insets for notched devices
- Performance: Passive event listeners for smooth scrolling

**Custom Hooks:**
- `useMediaQuery(query)` - Match any CSS media query
- `useIsMobile()` / `useIsTablet()` / `useIsDesktop()` - Device detection
- `useTouchGestures()` - Swipe, tap, long-press handlers
- `useViewportSize()` - Reactive window dimensions

### 🎤 Voice Input Support (v1.2.0)

Speak your problems, hear the response:

**Features:**
- **Push-to-Talk**: Tap microphone button to record
- **Continuous Mode**: Hands-free operation
- **Live Transcription**: See your words as you speak
- **Auto-Format**: Converts to retro uppercase style
- **12 Languages**: English, Spanish, French, German, Chinese, Japanese, and more
- **Smart Filtering**: Removes noise and invalid input

**How to Use:**
1. Click microphone button (grants permission first time)
2. Speak clearly into your microphone
3. See real-time transcript appear
4. Transcript auto-submits when complete (or tap again to stop)

**Browser Support:**
- ✅ Chrome 25+ (excellent)
- ✅ Edge 79+ (excellent)
- ✅ Safari 14.1+ (good, webkit prefix)
- ❌ Firefox (not supported - Web Speech API limitation)

**Error Handling:**
- No microphone: Prompts to connect device
- Permission denied: Shows permission instructions
- Network error: Suggests checking connection
- No speech: Prompts to try again

**Mobile Compatible:**
- Works on iOS Safari 14.1+
- Works on Chrome Android 88+
- Handles virtual keyboard interactions
- Optimized for touch screens

### 🎤 Voice Control Integration (v1.6.0)

Control the application entirely hands-free with natural language voice commands:

**Wake Word Detection:**
- Activate voice control by saying: **"Hey Doctor"**, **"Hey Sbaitso"**, **"Doctor Sbaitso"**, **"Okay Doctor"**, or **"Listen Doctor"**
- Continuous listening in hands-free mode
- Fuzzy matching with 80% similarity threshold (e.g., "hay doctor" works too)
- Extract command directly: "Hey Doctor, clear conversation" executes immediately

**20+ Voice Commands (5 Categories):**

| Category | Commands | Examples |
|----------|----------|----------|
| **Conversation** | Clear, Export | "clear conversation", "export chat" |
| **Character** | Switch to characters | "switch to ELIZA", "talk to HAL" |
| **Audio** | Mute, Stop, Quality | "toggle mute", "stop audio", "change audio quality" |
| **Navigation** | Theme, Search, Visualizer | "cycle theme", "search conversations", "show visualizer" |
| **Settings** | Settings, Stats, Accessibility, Help | "open settings", "show statistics", "help" |

**How to Use:**
1. Click the **🎤 microphone button** in the conversation header
2. Say **"Hey Doctor"** followed by any command (or say command after wake word)
3. Watch the indicator panel for listening status and suggestions
4. Confirm destructive commands (clear conversation) when prompted

**Hands-Free Mode:**
- Enable with 🎤 button (shows green "ON" indicator)
- Continuous wake word listening after each command
- Automatic command execution with visual feedback
- Confirmation required for destructive operations (10-second timeout)

**Features:**
- **Fuzzy Matching**: Levenshtein distance algorithm with 70% confidence threshold
- **Real-Time Suggestions**: Live command hints during speech recognition
- **Command Confirmation**: Prevents accidental data loss with Yes/No prompts
- **Error Handling**: User-friendly messages for unrecognized commands
- **Visual Feedback**: Status indicators (listening, processing, error, success)
- **Accessibility**: Screen reader announcements for all command executions

**Browser Support:**
- ✅ Chrome 25+ (full support)
- ✅ Edge 79+ (Chromium-based)
- ✅ Safari 14.1+ (webkit prefix)
- ❌ Firefox (Web Speech API not supported - button disabled)
- ✅ Mobile: iOS Safari 14.1+, Chrome Android 88+

**Microphone Permission:**
- Required on first use (browser will prompt)
- Grant permission for hands-free operation
- Can be revoked in browser settings

**Technical Details:**
- Web Speech API with continuous and one-shot recognition modes
- Dual recognition instances (wake word + commands)
- State management with React hooks
- Command handlers integrated with all application features

**Access**: Click 🎤 button in conversation header

**Documentation**: See [docs/VOICE_CONTROL.md](docs/VOICE_CONTROL.md) for complete guide (16,500+ words)

### 🎮 Authentic Retro Experience

- **8-bit Sound Processing**: Configurable bit-crusher algorithm (4-bit to full resolution)
- **Typewriter Effect**: 40ms per character typing animation
- **Retro Error Messages**: Authentic diagnostic messages from the original era
- **Period-Accurate Responses**: ALL CAPS text with era-appropriate knowledge
- **Sound Effects**: White noise glitches and square wave error beeps
- **Character-Specific Glitches**: Each personality has unique error messages

### 🛠️ Modern Technology Stack

- **React 19.2** with TypeScript for type-safe development
- **Vite 6.2** for lightning-fast development and optimized builds
- **Google Gemini AI** (gemini-2.5-flash for chat, gemini-2.5-flash-preview-tts for TTS)
- **Web Audio API** for sophisticated audio processing pipeline (AudioWorklet, vintage processing)
- **localStorage API** for client-side session persistence and settings
- **Tailwind CSS** (via CDN) for retro styling
- **Accessibility**: WCAG 2.1 AA compliant, ARIA attributes, screen reader support
- **Web Speech API** for voice input (SpeechRecognition)
- **Mobile First**: Touch gestures, responsive breakpoints, optimized layouts

### 🎵 Audio Processing Pipeline

```
Gemini TTS (24kHz PCM)
    ↓
Base64 Decode
    ↓
AudioBuffer Creation
    ↓
Bit-Crusher (configurable: 4/6/8-bit or off)
    ↓
Playback Rate (configurable: 1.0x-1.2x)
    ↓
8-bit Sound Output
```

## Quick Start

### Prerequisites

- Node.js 18 or higher
- A Gemini API key ([Get one free](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DrSbaitso-Recreated.git
cd DrSbaitso-Recreated

# Install dependencies
npm install

# Create environment file
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` and start your therapy session!

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

## Usage

### Getting Started

1. **Enter Your Name**: Type your name and press Enter
2. **Choose Character** (v1.1.0): Select from 5 AI personalities or use `Ctrl/Cmd + 1-5`
3. **Select Theme** (v1.1.0): Pick a retro theme or cycle with `Alt + ]` / `[`
4. **Adjust Audio** (v1.1.0): Set quality preset with `Ctrl/Cmd + Shift + Q`
5. **Start Conversation**: Share your problems in the chat interface
6. **Experience Glitches**: Watch for character-specific diagnostic messages
7. **Export Session** (v1.1.0): Press `Ctrl/Cmd + E` to save conversation

### Power User Tips

- **Quick Character Switch**: `Ctrl/Cmd + 2` for ELIZA, `Ctrl/Cmd + 3` for HAL 9000, etc.
- **Theme Cycling**: `Alt + ]` to quickly preview all themes
- **View Statistics**: `Ctrl/Cmd + S` to see usage analytics
- **Clear Conversation**: `Ctrl/Cmd + L` to reset current session
- **Settings Panel**: `Ctrl/Cmd + ,` to access all customization options
- **Keyboard Shortcuts Help**: `Ctrl/Cmd + /` to display shortcut reference

## Project Structure

```
DrSbaitso-Recreated/
├── App.tsx                 # Main application component
├── index.tsx               # React entry point
├── types.ts                # TypeScript type definitions (extended v1.1.0)
├── constants.ts            # Character, theme, audio configs (NEW v1.1.0)
├── services/
│   └── geminiService.ts    # Multi-character Gemini API integration
├── utils/
│   ├── audio.ts            # Configurable audio processing (enhanced v1.1.0)
│   ├── sessionManager.ts   # Session persistence & stats (NEW v1.1.0)
│   ├── exportConversation.ts  # Multi-format export (NEW v1.1.0)
│   └── voiceCommands.ts    # Voice command system (NEW v1.6.0)
├── hooks/
│   ├── useKeyboardShortcuts.ts  # Keyboard shortcut handler (NEW v1.1.0)
│   ├── useVoiceControl.ts       # Voice control hook (NEW v1.6.0)
│   └── useVoiceRecognition.ts   # Web Speech API integration (v1.2.0)
├── docs/
│   ├── FEATURES.md         # Complete feature documentation (NEW v1.1.0)
│   ├── VOICE_CONTROL.md    # Voice control guide (NEW v1.6.0)
│   ├── KEYBOARD_SHORTCUTS.md  # Shortcut reference (NEW v1.1.0)
│   ├── ARCHITECTURE.md     # System architecture and design
│   ├── API.md              # Gemini API documentation
│   ├── AUDIO_SYSTEM.md     # Audio processing deep dive
│   ├── DEPLOYMENT.md       # Deployment guide for various platforms
│   └── TROUBLESHOOTING.md  # Common issues and solutions
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── CHANGELOG.md            # Version history
└── CLAUDE.md               # Developer guidance for Claude Code
```

**New in v1.1.0-v1.6.0:**
- `constants.ts` - 5 character personalities, 5 themes, 4 audio presets, 4 audio modes, keyboard shortcuts
- `utils/sessionManager.ts` - localStorage-based session management and statistics
- `utils/exportConversation.ts` - Export to Markdown, Text, JSON, HTML
- `utils/vintageAudioProcessing.ts` - Authentic 1991 voice recreation (v1.3.0)
- `utils/themeValidator.ts` - Theme validation, color manipulation, WCAG checking, share codes (v1.5.0)
- `utils/accessibilityManager.ts` - WCAG 2.1 AA accessibility utilities (v1.4.0)
- `utils/voiceCommands.ts` - Voice command recognition system (v1.6.0)
- `hooks/useKeyboardShortcuts.ts` - 30+ keyboard shortcuts with platform detection
- `hooks/useAccessibility.ts` - Accessibility settings management (v1.4.0)
- `hooks/useFocusTrap.ts` - Modal focus trapping (v1.4.0)
- `hooks/useScreenReader.ts` - Screen reader announcements (v1.4.0)
- `hooks/useVoiceControl.ts` - Voice control integration (v1.6.0)
- `components/SkipNav.tsx` - Skip navigation component (v1.4.0)
- `components/AccessibilityPanel.tsx` - Accessibility settings UI (v1.4.0)
- `components/ThemeCustomizer.tsx` - Custom theme editor with WCAG validation (v1.5.0)
- `components/ConversationSearch.tsx` - Search & analytics dashboard (v1.5.0)
- `components/AudioVisualizer.tsx` - Real-time audio visualization (v1.5.0)
- `docs/FEATURES.md` - Comprehensive feature documentation (88KB)
- `docs/KEYBOARD_SHORTCUTS.md` - Complete shortcut reference (91KB)
- `docs/DECTALK_RESEARCH.md` - Historical research (v1.3.0, 32KB)
- `docs/ACCESSIBILITY.md` - Accessibility guide (v1.4.0, 32KB)
- `docs/VOICE_CONTROL.md` - Voice control comprehensive guide (v1.6.0, 16.5KB)

## Architecture Highlights

### Application Flow

1. **Name Entry Phase**: Collects user name and pre-generates greeting audio
2. **Character Selection** (v1.1.0): Choose from 5 AI personalities
3. **Customization** (v1.1.0): Select theme and audio quality
4. **Greeting Sequence**: Plays character-specific greeting messages
5. **Conversation Phase**: Interactive chat with typewriter effects and audio
6. **Session Management** (v1.1.0): Auto-save, statistics tracking, export

### Key Technical Features

- **Multi-Character System** (v1.1.0): Isolated chat instances per character with unique system instructions
- **Theme Engine** (v1.1.0): CSS variable-based instant theme switching without reload
- **Audio Pipeline** (v1.1.0): Configurable bit-crusher with 4 quality presets
- **Session Persistence** (v1.1.0): localStorage-based auto-save with statistics tracking
- **Export System** (v1.1.0): Multi-format conversation export (Markdown, Text, JSON, HTML)
- **Keyboard Navigation** (v1.1.0): 30+ shortcuts with platform detection (Ctrl/Cmd)
- **Singleton AudioContext**: 24kHz sample rate shared across all audio operations
- **Concurrent Processing**: Typewriter effect runs while TTS generates audio
- **React StrictMode Guards**: Prevents double audio playback during development
- **Error Recovery**: Displays character-specific retro error messages with sound effects

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system design.

## API Integration

### Gemini Chat API

- **Model**: `gemini-2.5-flash`
- **Features**: Persistent conversation history per character, isolated chat instances
- **Multi-Character Support** (v1.1.0): 5 characters with unique system instructions
  - Dr. Sbaitso: ALL CAPS, 1991 knowledge, robotic personality
  - ELIZA: 1966 Rogerian pattern-matching
  - HAL 9000: Calm, polite, 2001 spacecraft AI
  - JOSHUA: Game-focused military supercomputer
  - PARRY: Paranoid, suspicious 1972 chatbot

### Gemini TTS API

- **Model**: `gemini-2.5-flash-preview-tts`
- **Voice**: 'Charon' (deep, monotone)
- **Output**: 24kHz mono PCM audio, base64-encoded
- **Character-Specific Voice Prompts** (v1.1.0): Each character has unique voice instructions
- **Phonetic Overrides** (v1.1.0):
  - "SBAITSO" → "SUH-BAIT-SO"
  - "HAL" → "H-A-L"
  - "WOPR" → "WHOPPER"

See [docs/API.md](docs/API.md) for complete API documentation.

## Audio System

### Configurable Bit-Crusher Algorithm (v1.1.0)

Quantizes audio samples from Float32 to configurable bit depths:

```typescript
// Configurable quality presets
const presets = {
  extremeLoFi: { bitDepth: 16, playbackRate: 1.2 },   // 4-bit
  authentic8Bit: { bitDepth: 64, playbackRate: 1.1 }, // 6-bit (default)
  highQuality: { bitDepth: 256, playbackRate: 1.0 },  // 8-bit
  modern: { bitDepth: 0, playbackRate: 1.0 }          // No bit-crushing
};

const numLevels = bitDepth;
const step = 2.0 / (numLevels - 1);
output[i] = Math.round(input[i] / step) * step;
```

### Sound Effects

- **Glitch Sound**: 200ms white noise with exponential fade-out
- **Error Beep**: 300ms square wave at 300Hz (authentic PC speaker sound)
- **Voice Effects**: Configurable playback rate (1.0x-1.2x) + variable bit-crushing
- **Character-Specific Sounds** (v1.1.0): Each personality has unique glitch messages

### Quality Presets (v1.1.0)

| Preset | Quantization | Speed | Character |
|--------|--------------|-------|-----------|
| Extreme Lo-Fi | 16 levels (4-bit) | 1.2x | Maximum distortion |
| Authentic 8-bit | 64 levels (6-bit) | 1.1x | Original 1991 sound |
| High Quality | 256 levels (8-bit) | 1.0x | Clearer retro |
| Modern | None (full res) | 1.0x | Clean TTS |

See [docs/AUDIO_SYSTEM.md](docs/AUDIO_SYSTEM.md) for in-depth audio processing details.

## Deployment

### Supported Platforms

- **Vercel** (Recommended): Zero-config, automatic HTTPS, global CDN
- **Netlify**: Continuous deployment with custom domains
- **Cloudflare Pages**: Unlimited bandwidth on edge network
- **Docker**: Self-hosted with nginx
- **AWS S3 + CloudFront**: Scalable cloud hosting

### Quick Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add `GEMINI_API_KEY` environment variable in Vercel dashboard.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for comprehensive deployment guides.

## Development

### Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run preview  # Preview production build
```

### Development Tools

- **TypeScript**: Full type safety with strict mode
- **Vite**: Hot module replacement (HMR) for instant updates
- **React DevTools**: Component inspection and profiling
- **ESLint/Prettier**: Code quality and formatting (configure as needed)

### Environment Variables

Create `.env.local`:

```bash
GEMINI_API_KEY=your_api_key_here
```

The Vite config exposes this as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

### localStorage Management

Dr. Sbaitso uses browser localStorage for client-side data persistence. Understanding storage limits helps avoid "QuotaExceededError" issues.

#### Storage Breakdown

| Feature | Size per Item | Example |
|---------|--------------|---------|
| Conversation Session | ~5-10 KB | 100 sessions = ~1 MB |
| Custom Theme | ~2-5 KB | 50 themes = ~250 KB |
| Settings & Stats | ~5-10 KB | One-time storage |
| **Browser Limit** | **5-10 MB total** | Varies by browser |

#### Checking Usage

**Chrome DevTools:**
1. Open DevTools (F12)
2. Application tab → Storage → Local Storage
3. Right-click domain → Clear to reset

**Firefox DevTools:**
1. Open DevTools (F12)
2. Storage tab → Local Storage
3. View all keys and sizes

#### Best Practices

✅ **Export before clearing**: Use `Ctrl/Cmd + E` to backup conversations
✅ **Periodic cleanup**: Delete old sessions you don't need
✅ **Monitor usage**: Check DevTools if experiencing save failures
✅ **Selective import**: Only import themes you'll actually use

#### Cleanup Strategies

**Approaching limit? Try these:**
1. Export important sessions as JSON/HTML
2. Delete sessions older than 30 days
3. Remove duplicate or test themes
4. Clear statistics (Settings → Reset Stats)
5. Use "Clear All Data" as last resort (exports first!)

**Calculating capacity:**
- Light user: 50 sessions + 10 themes = ~600 KB (~1% of quota)
- Heavy user: 500 sessions + 50 themes = ~5.25 MB (~90% of 5MB quota)
- Power user: 1000+ sessions may exceed limits on some browsers

Plan ahead and manage your data to avoid unexpected storage errors.

## Browser Compatibility

### Desktop

| Browser | Version | Status | Features |
|---------|---------|--------|----------|
| Chrome  | 88+     | ✅ Full support | AudioWorklet, Web Speech API, Canvas API, localStorage, Accessibility |
| Firefox | 85+     | ✅ Full support | Web Audio API, Canvas API, localStorage, Accessibility |
| Safari  | 14+     | ✅ Full support | AudioWorklet, Canvas API, localStorage, webkit fallbacks, Accessibility |
| Edge    | 88+     | ✅ Full support | Chromium-based, all features (AudioWorklet, Canvas, localStorage) |

### Mobile

| Browser | Version | Status | Features |
|---------|---------|--------|----------|
| iOS Safari | 14+ | ✅ Full support | VoiceOver support, touch gestures |
| Chrome Android | 88+ | ✅ Full support | TalkBack support, mobile UI |
| Samsung Internet | 15+ | ✅ Full support | TalkBack compatible |

### Screen Readers

| Screen Reader | Platform | Status |
|---------------|----------|--------|
| NVDA | Windows | ✅ Full support |
| JAWS | Windows | ✅ Full support |
| VoiceOver | macOS/iOS | ✅ Full support |
| TalkBack | Android | ✅ Full support |
| Narrator | Windows | ⚠️ Partial support |

### Requirements

- Web Audio API (AudioContext, AudioWorklet)
- localStorage (5-10 MB available)
- ES2022+ JavaScript features
- **HTTPS required** for AudioWorklet and voice input in production

## Performance

- **Initial Load**: ~116KB (gzipped) - v1.5.0
- **Bundle Size**: 456KB raw (116KB gzipped)
- **TTS Latency**: 500-1500ms (network dependent)
- **Audio Processing**: <1% CPU on modern hardware
- **Audio Visualizer**: ~1-2% CPU (60 FPS)
- **Memory Usage**: ~56KB per active audio playback
- **localStorage**: ~5-10KB per custom theme, ~5-10KB per session

## Troubleshooting

### Common Issues

**No audio plays:**
- Ensure browser allows autoplay after user interaction
- Check browser console for AudioContext errors
- Verify speakers/volume not muted

**API errors:**
- Verify `GEMINI_API_KEY` is set correctly in `.env.local`
- Check API key is valid at https://aistudio.google.com/apikey
- Restart dev server after changing environment variables

**Build fails:**
- Run `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version is 18+

### v1.5.0 Feature Issues

**Theme Customizer won't open:**
- Check browser console for errors
- Verify localStorage is enabled (Settings → Privacy)
- Try clearing site data and refreshing

**Theme import fails with "Invalid JSON":**
- Validate JSON format at jsonlint.com
- Ensure all required fields present: id, name, colors (5 colors), isCustom, createdAt
- Check for trailing commas or syntax errors

**Share code doesn't work:**
- Verify complete code was copied (no truncation)
- Check for special characters corruption during copy/paste
- Try exporting as JSON instead and re-importing

**Search returns no results:**
- Ensure sessions are saved (check localStorage in DevTools)
- Verify filter settings (character/author filters may be too restrictive)
- Check search query spelling
- Try "Analytics" tab to confirm sessions exist

**Visualizer not animating:**
- Ensure audio is currently playing (start a conversation)
- Verify Canvas support in browser (Chrome 4+, Firefox 2+, Safari 3.1+)
- Check browser console for Canvas errors
- Try toggling visualizer off/on

**localStorage quota exceeded:**
- Symptoms: "QuotaExceededError" in console, themes/sessions won't save
- Solution: Export important sessions → Settings → Manage Sessions → Delete old sessions
- Each session ~5-10KB, each theme ~2-5KB
- Browser limit: typically 5-10MB total

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for comprehensive troubleshooting guide.

## Documentation

### User Documentation

- **[FEATURES.md](docs/FEATURES.md)** - Complete feature guide (88KB)
- **[KEYBOARD_SHORTCUTS.md](docs/KEYBOARD_SHORTCUTS.md)** - Shortcut reference (91KB)
- **[VOICE_CONTROL.md](docs/VOICE_CONTROL.md)** - Voice control comprehensive guide (NEW v1.6.0, 16.5KB)
- **[ACCESSIBILITY.md](docs/ACCESSIBILITY.md)** - Accessibility guide (v1.4.0, 32KB)
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[MOBILE.md](docs/MOBILE.md)** - Mobile responsive design guide
- **[VOICE_INPUT.md](docs/VOICE_INPUT.md)** - Voice input documentation (v1.2.0)

### Technical Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and component design
- **[API.md](docs/API.md)** - Gemini API integration guide
- **[AUDIO_SYSTEM.md](docs/AUDIO_SYSTEM.md)** - Audio processing pipeline
- **[DECTALK_RESEARCH.md](docs/DECTALK_RESEARCH.md)** - Historical research (NEW v1.3.0, 32KB)
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Platform deployment guides

### Developer Documentation

- **[CLAUDE.md](CLAUDE.md)** - Developer guidance for Claude Code
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## API Costs

### Gemini API Pricing (Pay-as-you-go)

- **Chat**: ~$0.0002 per message
- **TTS**: ~$0.0105 per response
- **Total**: ~$0.0107 per conversation turn

**Estimated monthly cost**: 100 sessions/day = ~$32/month

**Free tier**: 15 requests/minute, 1,500/day sufficient for personal use.

## Security Considerations

⚠️ **Warning**: API key is embedded in client-side JavaScript after build.

**For production use:**
- Implement backend proxy to hide API key
- Restrict API key by domain in Google Cloud Console
- Set daily quota limits
- Monitor usage regularly

### Custom Theme Security (v1.5.0)

⚠️ **Important**: Only import custom themes from trusted sources.

**Potential Risks:**
- Malformed JSON could crash the application
- Extremely large theme files could exceed localStorage quota
- Themes shared via untrusted channels may contain invalid color values

**Best Practices:**
- ✅ Use the built-in theme validator (automatically checks WCAG compliance)
- ✅ Preview themes before saving to your collection
- ✅ Verify the source before importing share codes
- ✅ Export your themes regularly as backup
- ❌ Don't import themes from unknown/untrusted sources
- ❌ Don't share your personal theme collection publicly without review

The application validates all theme imports, but exercise caution with user-generated content.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#security-considerations) for detailed security guidance.

## Contributing

Contributions welcome! Areas for enhancement:

**Completed in v1.1.0:**
- [x] Conversation history persistence (localStorage)
- [x] Adjustable audio quality settings (4 presets)
- [x] Multiple AI personalities (5 characters)
- [x] Customizable retro themes (5 themes)
- [x] Keyboard navigation (30+ shortcuts)
- [x] Conversation export (4 formats)
- [x] Statistics dashboard

**Completed in v1.2.0:**
- [x] AudioWorklet migration (replace deprecated ScriptProcessorNode)
- [x] Mobile touch optimization and gesture controls
- [x] Voice input support

**Completed in v1.3.0:**
- [x] Authentic 1991 voice recreation (4 audio modes)
- [x] Historical research documentation

**Completed in v1.4.0:**
- [x] Enhanced accessibility (WCAG 2.1 AA compliance)
- [x] Screen reader support (NVDA, JAWS, VoiceOver, TalkBack)
- [x] Skip navigation and focus management

**Completed in v1.4.1:**
- [x] Full UI integration of audio modes and accessibility

**Completed in v1.5.0:**
- [x] Theme customization system with WCAG validation
- [x] Conversation search across all sessions
- [x] Real-time audio visualizer

**Completed in v1.6.0:**
- [x] Custom character creator with personality builder
- [x] Advanced export system (PDF, CSV, batch export)
- [x] Conversation replay with timeline controls
- [x] Voice control integration with wake word detection

**Planned Future Enhancements (v2.0.0+):**
- [ ] Backend API proxy for production security
- [ ] Additional voice options (Pico, Kali, Aoede)
- [ ] Cloud session sync across devices
- [ ] Multi-language UI (i18n)
- [ ] Export custom themes as CSS files
- [ ] Advanced search filters (date range, sentiment)
- [ ] Voice command macros and customization

## Roadmap

- **v1.1.0** ✅ Multi-character, themes, audio controls, session management, export, shortcuts
- **v1.2.0** ✅ AudioWorklet migration, mobile gestures, voice input
- **v1.3.0** ✅ Authentic 1991 voice recreation, historical research
- **v1.4.0** ✅ WCAG 2.1 AA accessibility compliance
- **v1.4.1** ✅ Complete UI integration
- **v1.5.0** ✅ Theme customization, search & analytics, audio visualizer
- **v1.6.0** ✅ Custom character creator, advanced export, conversation replay, voice control (Current)
- **v2.0.0**: Backend API with authentication, cloud sync, real-time collaboration

## Credits

### Original Dr. Sbaitso

- **Developer**: Creative Labs (1991)
- **Platform**: MS-DOS, Sound Blaster sound cards
- **Speech Synthesis**: DECtalk-based technology

### Modern Recreation

- **AI**: Google Gemini 2.5 Flash (chat + TTS)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Creative Labs for the original Dr. Sbaitso (1991)
- Google for Gemini API access
- The retro computing community for preservation efforts
- React and Vite teams for excellent developer tools

## Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/DrSbaitso-Recreated/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/DrSbaitso-Recreated/discussions)

---

<div align="center">

**TELL ME ABOUT YOUR PROBLEMS.**

*Dr. Sbaitso is ready to help you.*

Made with retro vibes in 2025

</div>
