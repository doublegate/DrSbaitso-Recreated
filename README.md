# Dr. Sbaitso Recreated

> A modern web-based recreation of the classic 1991 AI therapist program that ran on Sound Blaster cards

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)

## Overview

Dr. Sbaitso Recreated brings the iconic 1991 AI therapist back to life using modern web technologies. This project faithfully recreates the retro experience complete with:

- **Authentic 8-bit audio processing** with bit-crusher effects
- **AI-powered conversations** using Google's Gemini 2.5 Flash
- **Vintage text-to-speech** synthesized with the deep, monotone 'Charon' voice
- **Period-accurate glitches** including "PARITY CHECKING" and "IRQ CONFLICT" messages
- **Retro DOS-style UI** with blue screen, monospace font, and typewriter effects

Experience therapy like it's 1991, powered by 2025 AI technology.

## Features

### Authentic Retro Experience

- **8-bit Sound Processing**: Custom bit-crusher algorithm quantizes audio to 6-bit (64 levels) for that classic Sound Blaster character
- **Typewriter Effect**: 40ms per character typing animation
- **Retro Error Messages**: Authentic diagnostic messages from the original era
- **Period-Accurate Responses**: ALL CAPS text limited to 1991 knowledge
- **Sound Effects**: White noise glitches and square wave error beeps

### Modern Technology Stack

- **React 19.2** with TypeScript for type-safe development
- **Vite 6.2** for lightning-fast development and optimized builds
- **Google Gemini AI** for intelligent, context-aware conversations
- **Web Audio API** for sophisticated audio processing pipeline
- **Tailwind CSS** (via CDN) for retro styling

### Audio Processing Pipeline

```
Gemini TTS (24kHz PCM)
    ↓
Base64 Decode
    ↓
AudioBuffer Creation
    ↓
Bit-Crusher (6-bit quantization)
    ↓
Playback Rate (1.1x speed)
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

1. **Enter Your Name**: Type your name and press Enter
2. **Wait for Greeting**: Dr. Sbaitso will greet you with pre-generated audio
3. **Start Conversation**: Share your problems in the chat interface
4. **Experience Glitches**: Watch for random 8-bit diagnostic messages
5. **Enjoy Retro Audio**: Listen to the authentic bit-crushed voice synthesis

## Project Structure

```
DrSbaitso-Recreated/
├── App.tsx                 # Main application component (267 lines)
├── index.tsx               # React entry point
├── types.ts                # TypeScript type definitions
├── services/
│   └── geminiService.ts    # Gemini API integration (chat + TTS)
├── utils/
│   └── audio.ts            # Audio processing and effects
├── docs/
│   ├── ARCHITECTURE.md     # System architecture and design
│   ├── API.md              # Gemini API documentation
│   ├── AUDIO_SYSTEM.md     # Audio processing deep dive
│   ├── DEPLOYMENT.md       # Deployment guide for various platforms
│   └── TROUBLESHOOTING.md  # Common issues and solutions
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── CLAUDE.md               # Developer guidance for Claude Code
```

## Architecture Highlights

### Three-Phase Application Flow

1. **Name Entry Phase**: Collects user name and pre-generates greeting audio
2. **Greeting Sequence**: Plays 7 pre-generated messages sequentially
3. **Conversation Phase**: Interactive chat with typewriter effects and audio

### Key Technical Features

- **Singleton AudioContext**: 24kHz sample rate shared across all audio operations
- **Concurrent Processing**: Typewriter effect runs while TTS generates audio
- **React StrictMode Guards**: Prevents double audio playback during development
- **Bit-Crusher Effect**: ScriptProcessorNode quantizes audio to 64 levels
- **Error Recovery**: Displays retro error messages with sound effects on API failures

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system design.

## API Integration

### Gemini Chat API

- **Model**: `gemini-2.5-flash`
- **Features**: Persistent conversation history, character-accurate responses
- **System Instruction**: Enforces ALL CAPS, 1991 knowledge cutoff, robotic personality

### Gemini TTS API

- **Model**: `gemini-2.5-flash-preview-tts`
- **Voice**: 'Charon' (deep, monotone)
- **Output**: 24kHz mono PCM audio, base64-encoded
- **Phonetic Override**: "SBAITSO" → "SUH-BAIT-SO"

See [docs/API.md](docs/API.md) for complete API documentation.

## Audio System

### Bit-Crusher Algorithm

Quantizes audio samples from Float32 to 6-bit precision:

```typescript
const numLevels = 64;  // 2^6 = 64 levels
const step = 2.0 / (numLevels - 1);  // 0.031746
output[i] = Math.round(input[i] / step) * step;
```

### Sound Effects

- **Glitch Sound**: 200ms white noise with exponential fade-out
- **Error Beep**: 300ms square wave at 300Hz (authentic PC speaker sound)
- **Voice Effects**: 1.1x playback rate + 6-bit quantization

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

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and component design
- **[API.md](docs/API.md)** - Gemini API integration guide
- **[AUDIO_SYSTEM.md](docs/AUDIO_SYSTEM.md)** - Audio processing pipeline
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Platform deployment guides
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[CLAUDE.md](CLAUDE.md)** - Developer guidance for Claude Code

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

- [ ] AudioWorklet migration (replace deprecated ScriptProcessorNode)
- [ ] Conversation history persistence (localStorage)
- [ ] Additional retro sound effects
- [ ] Adjustable audio quality settings
- [ ] Mobile touch optimization
- [ ] Accessibility improvements (ARIA labels, keyboard nav)
- [ ] Backend API proxy for production use
- [ ] Additional voice options

## Roadmap

- **v1.1.0**: AudioWorklet migration for better audio performance
- **v1.2.0**: Conversation export/history features
- **v1.3.0**: Customizable retro themes (amber, green, white terminals)
- **v2.0.0**: Backend API with user authentication

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
