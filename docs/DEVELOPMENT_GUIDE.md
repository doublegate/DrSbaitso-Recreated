# Dr. Sbaitso Recreated - Development Guide

See also [API.md](API.md) (server API and module reference) and [TESTING.md](TESTING.md).

---

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Running Locally](#running-locally)
4. [Testing Strategy](#testing-strategy)
5. [Code Style Guide](#code-style-guide)
6. [Component Creation Guidelines](#component-creation-guidelines)
7. [Adding New AI Characters](#adding-new-ai-characters)
8. [Adding New Themes](#adding-new-themes)
9. [Debugging Techniques](#debugging-techniques)
10. [Common Pitfalls](#common-pitfalls)
11. [Contributing Guidelines](#contributing-guidelines)

---

## Development Environment Setup

### Prerequisites

- **Node.js**: 22.12 or higher (`engines` in `package.json`); 24 recommended, and CI uses 24
- **npm**: the version bundled with Node
- **Git**: v2.30.0 or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Required Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here_from_google_ai_studio
```

The key is read only on the server side. On Vercel the Functions in `api/` read it; locally the
dev server's `/api` middleware reads it. It never reaches the browser bundle, and
`npm run check:secrets` fails the build check if `dist/` contains anything shaped like one. Optional
model overrides (`GEMINI_CHAT_MODEL`, `GEMINI_TTS_MODEL`, `GEMINI_CHAT_FALLBACK_MODELS`,
`GEMINI_TTS_FALLBACK_MODELS`) are described in [API.md](API.md#22-environment-variables).

**Obtaining a Gemini API Key:**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key to `.env.local`
4. **Never commit `.env.local` to version control**

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/doublegate/DrSbaitso-Recreated.git
cd DrSbaitso-Recreated

# Install dependencies (exactly as locked)
npm ci

# Verify installation
npm run typecheck
npm run lint

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### IDE Recommendations

The linter is **oxlint** (`.oxlintrc.json`), not ESLint. TypeScript 7 has no JS API, so
typescript-eslint cannot run. There is no formatter configuration in the repository; match the
surrounding code.

**Visual Studio Code** (recommended):
- Install the oxc extension (oxlint diagnostics)
- Use the workspace TypeScript version

**WebStorm**:
- Enable TypeScript support
- Enable React JSX support

---

## Project Structure

```
DrSbaitso-Recreated/
├── api/                    # Vercel Functions: the only code that holds the Gemini key
│   ├── chat.ts             # POST /api/chat
│   ├── tts.ts              # POST /api/tts
│   └── _lib/               # gemini.ts (validation, fallback, TTS), http.ts (serve, rate limit)
├── src/
│   ├── index.tsx           # Entry point
│   ├── App.tsx             # Chooses the classic screen or the enhanced UI (Alt+Shift+X)
│   ├── EnhancedApp.tsx     # Enhanced UI (lazy-loaded)
│   ├── constants.ts        # CHARACTERS, VOICE_PROFILES, THEMES, AUDIO_MODES
│   ├── types.ts
│   ├── sw.ts               # Service worker, served as /sw.js (docs/PWA.md)
│   ├── components/         # Panels and dialogs; classic/ (ClassicApp, DosScreen), enhanced/
│   ├── engine/             # Local persona engines: sbaitso, eliza, parry, hal, joshua, personaTurn.ts
│   ├── hooks/              # useSpeechPlayer, useSessionHistory, useVoiceControl, ...
│   ├── services/           # geminiService.ts: browser client for /api
│   └── utils/              # audio, sharedAudio, voiceRoutes, personaVoices, sessionManager,
│                           # soundPackStore, cloudSync, shortcuts, ...
├── test/                   # Vitest (docs/TESTING.md)
├── e2e/                    # Playwright, /api mocked
├── public/                 # Icons, fonts, manifest, audio worklet, legacy service-worker.js kill switch
├── ref-docs/               # Sourced research on the original program
├── docs/
├── vite.config.ts          # Build, PWA plugin, dev /api middleware (port 3000)
├── vitest.config.ts
├── playwright.config.ts
└── vercel.json             # Function limits, SPA rewrite, security headers (CSP)
```

### Key Architectural Decisions

**Server proxy for Gemini**: the browser calls `/api/chat` and `/api/tts`. Personas are resolved
server-side by id, inputs are validated and capped, and the key never ships to the client. See
[API.md](API.md).

**Hybrid personas**: each persona's scripted behaviour runs in a deterministic local engine
(`src/engine/`). The model only handles open conversation.

**Component Lazy Loading**: the enhanced UI and non-critical panels use `React.lazy()` to reduce
the initial bundle size.

**State Management**: local state with React hooks (no Redux/Zustand). Settings use
`localStorage`, session history is opt-in, and sound packs live in IndexedDB.

**Type Safety**: strict TypeScript with explicit typing for all public APIs.

---

## Running Locally

### Development Server

```bash
# Start dev server with hot reload
npm run dev
```

**Features:**
- Hot Module Replacement (HMR)
- Fast Refresh for React
- Source maps enabled
- `/api/chat` and `/api/tts` served by the same modules as on Vercel, reading `.env.local`
- Port: 3000

Type errors are not reported by the dev server; run `npm run typecheck`.

### Production Build

```bash
# Build optimized production bundle (Vite 8 / Rolldown)
npm run build

# Preview production build locally (port 4173; there is no /api in preview)
npm run preview

# Bundle report into reports/ (gitignored)
npm run analyze
```

**Build Optimization:**
- Code splitting per lazy component, plus a `react-vendor` chunk
- Tree shaking unused code
- Minification (Vite defaults)
- Chunk size warning limit: 300 KB

### Type Checking and Lint

```bash
npm run typecheck   # tsc --noEmit on tsconfig.json, tsconfig.node.json, tsconfig.test.json, tsconfig.sw.json
npm run lint        # oxlint; React hooks rules are errors
```

---

## Testing Strategy

The full guide is [TESTING.md](TESTING.md): configuration, layout, mocks, gotchas, the e2e suite
and CI.

### Test Framework Stack

- **Vitest**: Fast unit test runner (Vite-native)
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment simulation
- **@vitest/coverage-v8**: Code coverage reporting
- **Playwright**: end-to-end tests (Chromium) against the production build, with `/api` mocked

### Running Tests

```bash
npm test                 # watch mode
npm run test:ui          # Vitest UI
npm run test:run         # once; also enforces the performance budgets
npm run test:coverage    # once with coverage thresholds
npm run test:e2e         # Playwright
npx vitest run test/api/gemini.test.ts -t "fallback"   # a single file or test
```

### Coverage

Thresholds in `vitest.config.ts` are a ratchet set just below measured coverage (currently lines
67, statements 66, functions 57, branches 60). Raise them as coverage grows and never lower them.
New code should come with tests; a bug fix should come with a test that reproduces the bug.

### Test Organization

Tests live in `test/`, mirroring `src/` and `api/` (`test/api`, `test/engine`, `test/hooks`,
`test/components`, `test/utils`, `test/services`, `test/integration`). End-to-end specs are in
`e2e/`.

### Writing Tests

**Component Test Template:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const onClickMock = vi.fn();
    render(<MyComponent onClick={onClickMock} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
```

**Utility Test Template:**

```typescript
import { describe, it, expect } from 'vitest';
import { myUtilityFunction } from '../utils/myUtility';

describe('myUtilityFunction', () => {
  it('should handle valid input', () => {
    const result = myUtilityFunction('test');
    expect(result).toEqual({ success: true, data: 'test' });
  });

  it('should handle edge cases', () => {
    expect(myUtilityFunction('')).toEqual({ success: false });
    expect(myUtilityFunction(null as any)).toThrow();
  });
});
```

### Mocking External APIs

```typescript
// Mock the browser client (components, hooks)
vi.mock('../services/geminiService', () => ({
  getAIResponse: vi.fn().mockResolvedValue('HELLO USER'),
  synthesizeSpeech: vi.fn().mockResolvedValue(''),
  resetChat: vi.fn(),
}));

// Or stub fetch to exercise the client itself (call resetAllChats() between tests)
vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: 'HELLO' }))));
```

Server code takes an injected client: call `handleChat` / `handleTts` with a fake
`{ models: { generateContent } }`, or `serve(request, handler, { env, createClient })`.
`test/setup.ts` already stubs Web Audio, Speech Recognition, `matchMedia`, the observers and
storage.

---

## Code Style Guide

### TypeScript Conventions

**Naming:**
- **Components**: PascalCase (`MyComponent.tsx`)
- **Hooks**: camelCase with `use` prefix (`useMyHook.ts`)
- **Utilities**: camelCase (`myUtility.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase with descriptive names (`UserSettings`)
- **Types**: PascalCase (`MessageAuthor`)

**Type Annotations:**
```typescript
// Always annotate function parameters and return types
function processMessage(text: string, author: 'user' | 'dr'): Message {
  return { author, text, timestamp: Date.now() };
}

// Use interfaces for object shapes
interface ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  data?: string; // Optional properties last
}

// Use type unions for enums
type AudioMode = 'modern' | 'subtle' | 'authentic' | 'ultra';
```

### React Patterns

**Function Components:**
```typescript
export default function MyComponent({ prop1, prop2 }: MyComponentProps) {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // Effects with clear dependencies
  }, [prop1]);

  const handleClick = useCallback(() => {
    // Memoized callbacks
  }, [prop2]);

  return <div>...</div>;
}
```

**Lazy Loading:**
```typescript
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

// In render:
<Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</Suspense>
```

### Accessibility Best Practices

- Always include `aria-label` for interactive elements
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Ensure keyboard navigation works (`Tab`, `Enter`, `Escape`)
- Test with screen readers (NVDA, JAWS, VoiceOver)

```tsx
<button
  onClick={handleClick}
  aria-label="Close dialog"
  aria-describedby="dialog-description"
>
  ✕
</button>
```

---

## Component Creation Guidelines

### Creating a New Feature Component

**Step 1: Define Types**

```typescript
// types.ts
export interface MyFeatureData {
  id: string;
  value: number;
  metadata: Record<string, any>;
}

export interface MyFeatureProps {
  isOpen: boolean;
  onClose: () => void;
  data: MyFeatureData[];
}
```

**Step 2: Create Component File**

```typescript
// components/MyFeature.tsx
import React, { useState, useEffect } from 'react';
import { MyFeatureProps } from '../types';

export default function MyFeature({ isOpen, onClose, data }: MyFeatureProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-blue-900 border-4 border-gray-400 p-6 max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-white mb-4">MY FEATURE</h2>
        {/* Feature content */}
        <button onClick={onClose}>CLOSE</button>
      </div>
    </div>
  );
}
```

**Step 3: Lazy Load Where the Panel Is Opened**

```typescript
// In the UI that opens the panel (the enhanced UI for most panels)
const MyFeature = lazy(() => import('./components/MyFeature'));

// In component:
const [showMyFeature, setShowMyFeature] = useState(false);

// In render:
{showMyFeature && (
  <Suspense fallback={<div>Loading...</div>}>
    <MyFeature
      isOpen={showMyFeature}
      onClose={() => setShowMyFeature(false)}
      data={myData}
    />
  </Suspense>
)}
```

**Step 4: Add Keyboard Shortcut (Optional)**

Global shortcuts are defined once in `src/utils/shortcuts.ts`, which is the single source for the
key handler, button labels and help text. Every shortcut is Alt+Shift+<key>, matched on the
physical key (`code`), because Ctrl/Cmd combinations collide with browser shortcuts.

```typescript
// src/utils/shortcuts.ts: add an id to ShortcutId and an entry to APP_SHORTCUTS
{ id: 'myFeature', code: 'KeyF', description: 'My feature' },

// In the key handler
if (matchShortcut(e) === 'myFeature') {
  e.preventDefault();
  setShowMyFeature(true);
}
```

Show the binding in the UI with `shortcutLabel('myFeature')`.

**Step 5: Write Tests**

```typescript
// test/components/MyFeature.test.tsx
describe('MyFeature', () => {
  it('should render when open', () => {
    render(<MyFeature isOpen={true} onClose={vi.fn()} data={[]} />);
    expect(screen.getByText('MY FEATURE')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(<MyFeature isOpen={false} onClose={vi.fn()} data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

---

## Adding New AI Characters

### Character Configuration

Characters are defined in `src/constants.ts`. The server imports the same list and resolves a
persona's prompt and voice by `id`, so a new entry works for both `/api/chat` and `/api/tts`
without other server changes.

```typescript
export const CHARACTERS: CharacterPersonality[] = [
  {
    id: 'mycharacter',
    name: 'My Character',
    description: 'Brief description (1-2 sentences)',
    systemInstruction: `You are My Character, a [description]. ...`,
    voiceName: 'Kore',            // a Gemini prebuilt voice
    voiceStyle: 'a calm, even voice ...',   // delivery direction, sent as speechMetadata.style
    voicePrompt: 'Say in a calm, even voice ...',   // deprecated; keep equal to `Say in ${voiceStyle}`
    ttsCase: 'sentence',          // 'upper' sends text verbatim; 'sentence' de-capitalises ALL CAPS for TTS
    processing: 'clean',          // browser audio route: 'sbaitso' | 'clean' | 'hal' | 'wopr'
  }
];
```

### System Instruction Best Practices

1. **Define Constraints Clearly**:
   - Response format (ALL CAPS, mixed case, etc.)
   - Knowledge cutoff date
   - Personality traits
   - Conversation style

2. **Keep scripted behaviour local**: glitches, commands and canned sequences belong in a local
   engine under `src/engine/`, not in the prompt. For example, Dr. Sbaitso's parity error is
   scripted in `src/engine/sbaitso`, and the model never emits it. If an engine prepends a
   `[SESSION: ...]` line, the prompt must read those exact field names, and a test should pin the
   two together.

3. **Voice style**:
   - Describe qualities only (tone, pace, pitch, pauses)
   - Never name a film character or actor; that asks the model to imitate a real performance
   - Pronunciation fixes go in `applyPronunciation` in `api/_lib/gemini.ts`

### Testing New Characters

```bash
npx vitest run test/constants.test.ts test/api   # persona invariants and server resolution
npm run dev
# Choose the persona in the enhanced UI (PERSONA: selector) and verify:
# - Responses match the personality
# - Voice synthesis works with the chosen voice and processing route
```

---

## Adding New Themes

### Theme Structure

Themes are defined in `src/constants.ts`:

```typescript
export const THEMES: Theme[] = [
  {
    id: 'mytheme',
    name: 'My Theme Name',
    description: 'Brief description of theme aesthetic',
    colors: {
      primary: '#hex_color',    // Main UI elements
      background: '#hex_color',  // Background
      text: '#hex_color',        // Primary text
      border: '#hex_color',      // Borders and separators
      accent: '#hex_color'       // Highlights and interactive elements
    }
  }
];
```

### Color Guidelines

**Contrast Ratios** (WCAG 2.1 AA):
- Text on background: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Retro Aesthetic Suggestions**:
- **Monochrome**: Single color with varying intensities
- **CRT Phosphor**: Green (#00ff00), Amber (#ffb000), White (#ffffff)
- **DOS Era**: Blues, grays, yellows
- **Terminal**: High contrast (black/green, black/amber)

### Theme Application

Themes apply via CSS custom properties. `applyThemeVariables(colors, target?)` in
`src/utils/themeVariables.ts` publishes each colour as `--color-<name>` on
`document.documentElement`, so styles that use `var(--color-text)` and similar follow the active
theme.

```typescript
useEffect(() => applyThemeVariables(theme.colors), [theme]);
```

---

## Debugging Techniques

### Browser DevTools

**React DevTools Extension:**
- Inspect component tree
- View props and state
- Track component re-renders

**Performance Profiling:**
```javascript
// Measure component render time
console.time('MyComponent Render');
// ... render logic
console.timeEnd('MyComponent Render');
```

### Common Issues

**1. Audio Context Suspended**

All audio shares one `AudioContext` (`src/utils/sharedAudio.ts`). Browsers start it suspended
until a user gesture. `ensureAudioReady()` resumes it and loads the bit-crusher worklet; call it
from a gesture handler, or before playback.

**2. `/api` Errors in Development**

`503 NOT_CONFIGURED` means `.env.local` has no `GEMINI_API_KEY`. `429` and `503` from Gemini are
common on the default model; the server falls back to the next model automatically (see
[API.md](API.md#23-model-fallback-and-time-budget)). To probe the key or list models, run
`node --env-file=.env.local` with a small script.

**3. TypeScript Errors**
```bash
# Reinstall exactly what the lockfile pins
rm -rf node_modules
npm ci
npm run typecheck
```

**4. Build Failures or Bundle Size**
```bash
npm run build
npm run analyze   # report in reports/bundle-stats.html
```

---

## Common Pitfalls

### 1. Forgetting to Lazy Load Large Components

**Wrong:**
```typescript
import HeavyComponent from './components/HeavyComponent';
```

**Correct:**
```typescript
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
```

### 2. Missing Dependency Arrays in useEffect

**Wrong:**
```typescript
useEffect(() => {
  fetchData(userId); // userId not in deps
});
```

**Correct:**
```typescript
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### 3. Not Handling Async Errors

**Wrong:**
```typescript
const response = await getAIResponse(text, characterId);
```

**Correct:**
```typescript
try {
  const response = await getAIResponse(text, characterId);
} catch (error) {
  // GeminiServiceError: error.code is RATE_LIMITED, UNAVAILABLE, NETWORK_ERROR, ...
  console.error('Failed to get response:', error);
  // Graceful fallback
}
```

---

## Contributing Guidelines

### Pull Request Process

1. **Fork and Branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make Changes**:
   - Follow code style guide
   - Write tests with the change; coverage must not fall below the thresholds
   - Update documentation

3. **Verify Quality**:
   ```bash
   npm run lint       # oxlint, no errors
   npm run typecheck  # No errors
   npm run test:run   # All tests pass
   npm run build      # Build succeeds
   ```

4. **Commit Conventions**:
   ```
   feat: Add conversation pattern detection engine
   fix: Resolve audio playback issue on Safari
   docs: Update development guide with testing section
   test: Add tests for sound effects manager
   ```

5. **Submit PR**:
   - Clear title and description
   - Reference related issues
   - Include screenshots (if UI changes)

### Code Review Checklist

- [ ] TypeScript compiles without errors
- [ ] All tests pass (existing + new)
- [ ] Coverage thresholds still met (`npm run test:coverage`)
- [ ] Bundle size impact <50 KB
- [ ] Accessibility: keyboard navigation works
- [ ] Documentation updated
- [ ] No console errors or warnings

---

## Additional Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **Vite Documentation**: https://vitejs.dev/
- **Vitest Documentation**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

**End of Development Guide**
*For additional help, see docs/TROUBLESHOOTING.md or open an issue on GitHub*
