# Dr. Sbaitso Recreated - Development Guide

**Version**: 1.9.0
**Last Updated**: November 2025
**Maintainer**: Development Team

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

- **Node.js**: v18.0.0 or higher (LTS recommended)
- **npm**: v9.0.0 or higher
- **Git**: v2.30.0 or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Required Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here_from_google_ai_studio
```

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

# Install dependencies
npm install

# Verify installation
npm run typecheck

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### IDE Recommendations

**Visual Studio Code** (recommended):
- Install ESLint extension
- Install Prettier extension
- Install TypeScript Vue Plugin
- Use workspace settings (`.vscode/settings.json`)

**WebStorm**:
- Enable TypeScript support
- Configure ESLint
- Enable React JSX support

---

## Project Structure

```
DrSbaitso-Recreated/
├── components/          # React components (lazy-loaded)
│   ├── AccessibilityPanel.tsx
│   ├── AdvancedExporter.tsx
│   ├── AudioVisualizer.tsx
│   ├── CharacterCreator.tsx
│   ├── ConversationInsights.tsx
│   ├── ConversationReplay.tsx
│   ├── ConversationSearch.tsx
│   ├── OnboardingTutorial.tsx
│   ├── SoundSettingsPanel.tsx  # v1.9.0
│   ├── SkipNav.tsx
│   └── ThemeCustomizer.tsx
├── hooks/               # Custom React hooks
│   ├── useAccessibility.ts
│   ├── useFocusTrap.ts
│   ├── useKeyboardShortcuts.ts
│   ├── useMediaQuery.ts
│   ├── usePWA.ts
│   ├── useScreenReader.ts
│   ├── useSoundEffects.ts      # v1.9.0
│   ├── useTouchGestures.ts
│   └── useVoiceControl.ts
├── services/            # External API integrations
│   ├── geminiService.ts        # Google Gemini AI (chat + TTS)
│   └── cloudSync.ts            # Firebase cloud synchronization
├── utils/               # Utility functions
│   ├── accessibilityManager.ts
│   ├── advancedExport.ts
│   ├── audio.ts
│   ├── audioWorklet.ts
│   ├── chartUtils.ts
│   ├── cloudSync.ts
│   ├── exportConversation.ts
│   ├── insightEngine.ts        # v1.9.0 - Pattern detection
│   ├── sentimentAnalysis.ts
│   ├── sessionManager.ts
│   ├── soundEffects.ts         # v1.9.0 - Audio system
│   ├── speechRecognition.ts
│   ├── themeValidator.ts
│   ├── vintageAudioProcessing.ts
│   └── voiceCommands.ts
├── test/                # Vitest unit tests
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── public/              # Static assets
│   ├── icons/           # PWA icons
│   ├── audio-processor.worklet.js
│   └── manifest.json
├── docs/                # Documentation
├── App.tsx              # Main application component
├── constants.ts         # Configuration constants
├── types.ts             # TypeScript type definitions
├── index.tsx            # Application entry point
├── vite.config.ts       # Vite build configuration
└── vitest.config.ts     # Vitest test configuration
```

### Key Architectural Decisions

**Component Lazy Loading**: All non-critical components use `React.lazy()` to reduce initial bundle size.

**State Management**: Local state with React hooks (no Redux/Zustand) - localStorage for persistence.

**API Integration**: Single service file per external API (Gemini, Firebase).

**Type Safety**: Strict TypeScript with explicit typing for all public APIs.

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
- TypeScript type checking
- Port: 3000 (configurable)

### Production Build

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

**Build Optimization:**
- Code splitting per component
- Tree shaking unused code
- Minification (Terser)
- CSS optimization
- Asset compression

### Type Checking

```bash
# Run TypeScript compiler (no emit)
npm run typecheck
```

Runs `tsc --noEmit` to verify type correctness without generating files.

---

## Testing Strategy

### Test Framework Stack

- **Vitest**: Fast unit test runner (Vite-native)
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment simulation
- **@vitest/coverage-v8**: Code coverage reporting

### Running Tests

```bash
# Run all tests
npm test

# Run tests in UI mode (recommended)
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage
```

### Coverage Goals

- **Overall**: 80%+ coverage
- **New Features**: 90%+ coverage (v1.9.0 requirement)
- **Critical Paths**: 100% coverage (user input, AI response, audio playback)

### Test Organization

```
test/
├── components/          # Component integration tests
│   ├── App.test.tsx
│   ├── SoundSettingsPanel.test.tsx  # v1.9.0
│   └── OnboardingTutorial.test.tsx
├── hooks/               # Custom hook tests
│   ├── useSoundEffects.test.ts      # v1.9.0
│   └── useVoiceControl.test.ts
├── services/            # API service tests
│   └── geminiService.test.ts
└── utils/               # Utility function tests
    ├── insightEngine.test.ts        # v1.9.0
    ├── soundEffects.test.ts         # v1.9.0
    └── sentimentAnalysis.test.ts
```

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
// Mock Gemini API
vi.mock('../services/geminiService', () => ({
  getDrSbaitsoResponse: vi.fn().mockResolvedValue('HELLO USER'),
  synthesizeSpeech: vi.fn().mockResolvedValue('base64_audio_data'),
}));

// Mock Web Audio API
global.AudioContext = vi.fn().mockImplementation(() => ({
  createBuffer: vi.fn(),
  createBufferSource: vi.fn(),
  destination: {},
}));
```

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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-blue-900 border-4 border-gray-400 p-6 max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-white mb-4">MY FEATURE</h2>
        {/* Feature content */}
        <button onClick={onClose}>CLOSE</button>
      </div>
    </div>
  );
}
```

**Step 3: Lazy Load in App.tsx**

```typescript
// App.tsx
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

```typescript
// App.tsx - in keyboard handler useEffect
if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
  e.preventDefault();
  setShowMyFeature(true);
}
```

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

Characters are defined in `constants.ts`:

```typescript
export const CHARACTERS: CharacterPersonality[] = [
  {
    id: 'mycharacter',
    name: 'My Character',
    description: 'Brief description (1-2 sentences)',
    systemInstruction: `You are My Character, a [description].
    ALWAYS RESPOND IN ALL CAPS. // Or specify other constraints
    Your personality traits: [list traits]
    Knowledge cutoff: [year]
    Glitch messages: [if applicable]`,
    voicePrompt: 'Say in a [describe voice style]'
  }
];
```

### System Instruction Best Practices

1. **Define Constraints Clearly**:
   - Response format (ALL CAPS, mixed case, etc.)
   - Knowledge cutoff date
   - Personality traits
   - Conversation style

2. **Include Glitch Behavior** (optional):
   ```typescript
   systemInstruction: `...
   Occasionally, you experience 'glitches'. When this happens, insert:
   SYSTEM DIAGNOSTIC: [message]
   After the glitch, return to normal conversation.`
   ```

3. **Voice Prompt Engineering**:
   - Specify tone (monotone, energetic, calm)
   - Reference era/technology (1960s computer, 1991 8-bit)
   - Include unique characteristics

### Testing New Characters

```bash
npm run dev
# Navigate to character selector
# Test conversation with new character
# Verify:
# - Responses match personality
# - Voice synthesis works
# - Glitches appear (if configured)
```

---

## Adding New Themes

### Theme Structure

Themes are defined in `constants.ts`:

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

Themes apply via CSS variables dynamically:

```typescript
// In component or hook:
useEffect(() => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-background', theme.colors.background);
  // ... other colors
}, [theme]);
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
```typescript
// Fix: Resume on user interaction
audioContext.resume().then(() => {
  console.log('AudioContext resumed');
});
```

**2. TypeScript Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run typecheck
```

**3. Build Failures**
```bash
# Check bundle size
npm run build
# Analyze with visualizer
```

---

## Common Pitfalls

### 1. Forgetting to Lazy Load Large Components

**❌ Wrong:**
```typescript
import HeavyComponent from './components/HeavyComponent';
```

**✅ Correct:**
```typescript
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
```

### 2. Missing Dependency Arrays in useEffect

**❌ Wrong:**
```typescript
useEffect(() => {
  fetchData(userId); // userId not in deps
});
```

**✅ Correct:**
```typescript
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### 3. Not Handling Async Errors

**❌ Wrong:**
```typescript
const response = await geminiService.getResponse(text);
```

**✅ Correct:**
```typescript
try {
  const response = await geminiService.getResponse(text);
} catch (error) {
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
   - Write tests (90%+ coverage for new code)
   - Update documentation

3. **Verify Quality**:
   ```bash
   npm run typecheck  # No errors
   npm test           # All tests pass
   npm run build      # Build succeeds
   ```

4. **Commit Conventions**:
   ```
   feat: Add conversation pattern detection engine (v1.9.0)
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
- [ ] Code coverage ≥90% for new code
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

**End of Development Guide** - v1.9.0
*For additional help, see docs/TROUBLESHOOTING.md or open an issue on GitHub*
