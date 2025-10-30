# Dr. Sbaitso Recreated

> A modern web-based recreation of the classic 1991 AI therapist program that ran on Sound Blaster cards

![Version](https://img.shields.io/badge/version-1.1.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)

## Overview

Dr. Sbaitso Recreated brings the iconic 1991 AI therapist back to life using modern web technologies. Version 1.1.0 introduces **5 AI personalities**, **5 retro themes**, **customizable audio quality**, and **comprehensive session management** while maintaining the authentic retro experience:

- **5 Character Personalities**: Dr. Sbaitso, ELIZA, HAL 9000, JOSHUA (WOPR), and PARRY
- **5 Retro Themes**: DOS Blue, Phosphor Green, Amber Monochrome, Paper White, Matrix Green
- **Configurable Audio**: 4 quality presets from extreme lo-fi to modern clarity
- **Session Management**: Auto-save, statistics tracking, and conversation history
- **Multi-Format Export**: Save conversations as Markdown, Text, JSON, or HTML
- **30+ Keyboard Shortcuts**: Power-user navigation with platform detection (Ctrl/Cmd)
- **Authentic 8-bit audio processing** with configurable bit-crusher effects
- **AI-powered conversations** using Google's Gemini 2.5 Flash
- **Period-accurate glitches** including "PARITY CHECKING" and "IRQ CONFLICT" messages

Experience therapy like it's 1991, customized for 2025.

## Features

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

### ⌨️ Keyboard Shortcuts (v1.1.0)

30+ shortcuts for power users:

**Core Actions:**
- `Enter` - Send message
- `Ctrl/Cmd + L` - Clear conversation
- `Ctrl/Cmd + E` - Export conversation
- `Ctrl/Cmd + ,` - Toggle settings
- `Ctrl/Cmd + S` - Toggle statistics

**Character Selection:**
- `Ctrl/Cmd + ]` / `[` - Cycle characters
- `Ctrl/Cmd + 1-5` - Direct character selection

**Theme Selection:**
- `Alt + ]` / `[` - Cycle themes
- `Alt + 1-5` - Direct theme selection

**Audio Controls:**
- `Ctrl/Cmd + M` - Toggle sound
- `Ctrl/Cmd + Shift + Q` - Cycle audio quality
- `Ctrl/Cmd + 0` - Stop audio

Platform-aware: automatically uses `Cmd` on macOS, `Ctrl` on Windows/Linux. See [docs/KEYBOARD_SHORTCUTS.md](docs/KEYBOARD_SHORTCUTS.md) for complete reference.

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
- **Web Audio API** for sophisticated audio processing pipeline
- **localStorage API** for client-side session persistence
- **Tailwind CSS** (via CDN) for retro styling

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
│   └── exportConversation.ts  # Multi-format export (NEW v1.1.0)
├── hooks/
│   └── useKeyboardShortcuts.ts  # Keyboard shortcut handler (NEW v1.1.0)
├── docs/
│   ├── FEATURES.md         # Complete feature documentation (NEW v1.1.0)
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

**New in v1.1.0:**
- `constants.ts` - 5 character personalities, 5 themes, 4 audio presets, keyboard shortcuts
- `utils/sessionManager.ts` - localStorage-based session management and statistics
- `utils/exportConversation.ts` - Export to Markdown, Text, JSON, HTML
- `hooks/useKeyboardShortcuts.ts` - 30+ keyboard shortcuts with platform detection
- `docs/FEATURES.md` - Comprehensive feature documentation (88KB)
- `docs/KEYBOARD_SHORTCUTS.md` - Complete shortcut reference (91KB)

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

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 88+     | ✅ Full support |
| Firefox | 85+     | ✅ Full support |
| Safari  | 14+     | ✅ Full support (webkit fallback) |
| Edge    | 88+     | ✅ Full support |

**Note**: Requires Web Audio API support and modern ES2022 features.

## Performance

- **Initial Load**: ~200KB (gzipped)
- **TTS Latency**: 500-1500ms (network dependent)
- **Audio Processing**: <1% CPU on modern hardware
- **Memory Usage**: ~56KB per active audio playback

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

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for comprehensive troubleshooting guide.

## Documentation

### User Documentation

- **[FEATURES.md](docs/FEATURES.md)** - Complete feature guide (NEW v1.1.0)
- **[KEYBOARD_SHORTCUTS.md](docs/KEYBOARD_SHORTCUTS.md)** - Shortcut reference (NEW v1.1.0)
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Technical Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and component design
- **[API.md](docs/API.md)** - Gemini API integration guide
- **[AUDIO_SYSTEM.md](docs/AUDIO_SYSTEM.md)** - Audio processing pipeline
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

**Planned Future Enhancements:**
- [ ] AudioWorklet migration (replace deprecated ScriptProcessorNode)
- [ ] Additional retro sound effects (startup beep, tape loading, disk drive)
- [ ] Mobile touch optimization and gesture controls
- [ ] Enhanced accessibility (WCAG 2.1 AA compliance)
- [ ] Backend API proxy for production security
- [ ] Additional voice options (Pico, Kali, Aoede)
- [ ] Cloud session sync across devices
- [ ] Custom character creation tools
- [ ] Voice input support

## Roadmap

- **v1.1.0** (Current): Multi-character, themes, audio controls, session management, export, shortcuts ✅
- **v1.2.0**: AudioWorklet migration, mobile gestures, enhanced accessibility
- **v1.3.0**: Cloud sync, additional voices, custom characters
- **v2.0.0**: Backend API with authentication, voice input, real-time collaboration

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
