# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- AudioWorklet migration to replace deprecated ScriptProcessorNode
- Conversation history persistence with localStorage
- Export conversation feature (text/markdown)
- Adjustable audio quality settings (4-bit, 6-bit, 8-bit)
- Mobile touch optimization and responsive design improvements
- Accessibility enhancements (ARIA labels, keyboard navigation)
- Backend API proxy for production security
- Additional retro voice options
- Customizable terminal themes (amber, green, white)

## [1.0.0] - 2025-10-25

### Added
- Initial release of Dr. Sbaitso Recreated web application
- React 19.2 + TypeScript + Vite 6.2 project structure
- Google Gemini 2.5 Flash chat integration with persistent conversation history
- Google Gemini 2.5 Flash TTS integration with 'Charon' voice
- Three-phase application flow (name entry → greeting → conversation)
- Pre-generated greeting sequence with 7 audio messages
- Concurrent typewriter effect (40ms/char) and TTS generation
- Web Audio API-based 8-bit audio processing pipeline
- Custom bit-crusher effect (6-bit quantization, 64 levels)
- ScriptProcessorNode-based audio effects chain
- 1.1x playback rate for deeper/faster voice
- White noise glitch sound effect for "PARITY CHECKING" and "IRQ CONFLICT" messages
- Square wave error beep (300Hz, 300ms) for API failures
- Retro DOS-style UI with blue background and monospace font
- Tailwind CSS styling via CDN
- Auto-focus management for name and chat inputs
- Auto-scroll to latest message functionality
- React StrictMode guards to prevent double audio playback
- AudioContext singleton pattern (24kHz sample rate)
- ALL CAPS response enforcement via system instruction
- 1991 knowledge cutoff for period-accurate responses
- Random retro error messages for API failures
- Phonetic override for "SBAITSO" pronunciation (SUH-BAIT-SO)
- Environment variable configuration for Gemini API key
- Vite build configuration with API key injection
- Development server on port 3000
- Production build optimization

### Documentation
- Comprehensive README.md with badges, quick start, and examples
- CLAUDE.md for Claude Code development guidance
- ARCHITECTURE.md documenting system design and data flow
- API.md with complete Gemini integration guide
- AUDIO_SYSTEM.md detailing audio processing pipeline
- DEPLOYMENT.md covering Vercel, Netlify, Cloudflare, Docker, AWS
- TROUBLESHOOTING.md for common issues and solutions
- TypeScript type definitions in types.ts
- Inline code comments for complex logic

### Security
- Environment variable isolation for API keys
- `.env.local` gitignore configuration
- Client-side API key embedding warning in documentation
- Security best practices in deployment guide

### Performance
- Parallel greeting audio generation (7 requests concurrently)
- Concurrent typewriter and TTS processing
- Audio buffer cleanup and garbage collection
- Optimized bundle size (~200KB gzipped)
- Vite HMR for instant development updates

### Browser Compatibility
- Chrome 88+ support
- Firefox 85+ support
- Safari 14+ support with webkit AudioContext fallback
- Edge 88+ (Chromium) support
- Web Audio API requirement
- ES2022 feature usage

### Known Issues
- ScriptProcessorNode deprecated (migration to AudioWorklet planned)
- API key visible in client-side code (backend proxy recommended for production)
- Mobile Safari may have stricter autoplay restrictions
- Long sessions may accumulate memory (page refresh recommended after 20-30 messages)

## [0.2.0] - 2025-10-25

### Added
- Sound effects system implementation
- `playGlitchSound()` function for 200ms white noise with fade-out
- `playErrorBeep()` function for 300Hz square wave error beep
- Glitch phrase detection ("PARITY CHECKING", "IRQ CONFLICT")
- Audio feedback for API errors with error beep sound
- Enhanced retro feel with authentic PC speaker-style sounds

### Changed
- Updated audio.ts with new sound effect functions
- Enhanced error handling in handleUserInput with audio feedback
- Improved user experience during API failures

## [0.1.0] - 2025-10-25

### Added
- Project initialization with Vite + React + TypeScript template
- Basic file structure (App.tsx, index.tsx, types.ts)
- Gemini API service setup (geminiService.ts)
- Audio utilities module (audio.ts)
- Three-phase UI implementation (name entry, greeting, conversation)
- Dr. Sbaitso personality system instruction
- TTS voice synthesis with Charon voice
- Bit-crusher audio processing algorithm
- Message state management
- Loading states and UI controls
- Input focus management
- Typewriter effect implementation
- Package.json with React 19, Vite 6, TypeScript 5.8
- Vite configuration with environment variable injection
- TypeScript configuration
- Git repository initialization
- .gitignore configuration

### Technical Details
- AudioContext implementation with 24kHz sample rate
- ScriptProcessorNode bit-crusher (2048 buffer size)
- Base64 audio decode and PCM conversion
- Int16 to Float32 sample conversion
- React hooks (useState, useEffect, useRef, useCallback)
- Controlled input components
- Message scrolling with refs
- API error handling with retro messages

---

## Version History Summary

- **v1.0.0** (2025-10-25): Initial release with full feature set
- **v0.2.0** (2025-10-25): Sound effects implementation
- **v0.1.0** (2025-10-25): Project initialization and core features

---

## Notes

### Breaking Changes
None yet (initial release)

### Deprecation Warnings
- ScriptProcessorNode is deprecated by Web Audio API specification
- Migration to AudioWorklet planned for v1.1.0
- Current implementation remains functional in all major browsers

### Upgrade Guide
Not applicable (initial release)

---

## Links

- [GitHub Repository](https://github.com/yourusername/DrSbaitso-Recreated)
- [Issue Tracker](https://github.com/yourusername/DrSbaitso-Recreated/issues)
- [Documentation](docs/)
- [Gemini API](https://ai.google.dev/docs)

---

**[Unreleased]**: https://github.com/yourusername/DrSbaitso-Recreated/compare/v1.0.0...HEAD
**[1.0.0]**: https://github.com/yourusername/DrSbaitso-Recreated/releases/tag/v1.0.0
