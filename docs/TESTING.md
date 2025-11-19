# Testing Guide

Comprehensive testing documentation for Dr. Sbaitso Recreated using Vitest and Playwright.

**Version**: 1.11.0
**Last Updated**: 2025-11-19

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Commands](#test-commands)
3. [Test Statistics](#test-statistics)
4. [Writing Tests](#writing-tests)
5. [E2E Testing with Playwright](#e2e-testing-with-playwright)
6. [Test Coverage](#test-coverage)
7. [Mocking](#mocking)
8. [Best Practices](#best-practices)
9. [CI/CD Integration](#cicd-integration)

---

## Quick Start

### Installation

Dependencies are pre-installed. If needed:

```bash
npm install
```

### Run Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## Test Commands

### Unit & Component Tests (Vitest)

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in watch mode (interactive) |
| `npm run test:run` | Run all tests once (CI mode) |
| `npm run test:ui` | Open Vitest UI in browser |
| `npm run test:coverage` | Generate coverage report |
| `npm run typecheck` | TypeScript type checking only |

### E2E Tests (Playwright)

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests (headless) |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI |
| `npm run test:e2e:headed` | Run E2E tests in headed mode (visible browser) |
| `npm run test:all` | Run unit tests + E2E tests |
| `npm run test:ci` | Run tests with coverage + E2E (CI mode) |

### Watch Mode Features

- **Auto-rerun**: Tests rerun on file changes
- **Filter**: Press `p` to filter by filename pattern
- **Focus**: Press `t` to filter by test name
- **Coverage**: Press `c` to toggle coverage
- **Clear**: Press `r` to clear console

---

## Test Statistics

### v1.11.0 Testing Summary

**Total Tests**: 491 tests (100% pass rate)

#### Component Tests (Vitest)
- **VoiceInput.test.tsx**: 29 tests
  - Browser support detection (2 tests)
  - Start/stop functionality (4 tests)
  - Transcript handling (5 tests)
  - Error handling (4 tests)
  - Accessibility (3 tests)
  - Speech recognition lifecycle (11 tests)

- **EmotionVisualizer.test.tsx**: 21 tests
  - Component rendering (3 tests)
  - Emotion detection (5 tests)
  - Canvas rendering (4 tests)
  - History tracking (3 tests)
  - Trend graph display (6 tests)

- **TopicFlowDiagram.test.tsx**: Tests for D3.js force-directed graph
- **ConversationTemplates.test.tsx**: Tests for template management UI
- **ErrorBoundary.test.tsx**: Tests for React error boundaries
- **Plus all existing tests**: Audio processing, session management, PWA features, etc.

#### E2E Tests (Playwright)
- **e2e/voice-input.spec.ts**: 7 tests
  - UI rendering, microphone permissions, transcript display, error states

- **e2e/emotion-viz.spec.ts**: 9 tests
  - Emotion badges, trend graphs, history tracking, theme integration

- **e2e/topic-diagram.spec.ts**: 10 tests
  - Topic extraction, node rendering, transitions, sentiment analysis

- **e2e/templates.spec.ts**: 13 tests
  - Template browsing, search, categories, usage tracking, customization

#### Test Infrastructure
- **Testing Framework**: Vitest 4.0.10 with React Testing Library 15.0.7
- **E2E Framework**: Playwright 1.56.1
- **Test Environment**: happy-dom 20.0.10
- **Coverage Tool**: @vitest/coverage-v8 4.0.5
- **Build Time**: 5.96s
- **Bundle Size**: 260.95 KB (main), additional chunks for lazy-loaded components

---

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = someFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });

  it('should update value', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.increment();
    });

    expect(result.current.value).toBe(1);
  });
});
```

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await fetchData();
  expect(result).toEqual({ data: 'test' });
});

it('should handle errors', async () => {
  await expect(fetchData()).rejects.toThrow('Error message');
});
```

---

## E2E Testing with Playwright

### Getting Started with E2E Tests

End-to-end tests verify complete user flows in a real browser environment using Playwright.

#### Prerequisites

```bash
# Install Playwright browsers (one-time setup)
npx playwright install
```

#### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with Playwright UI (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see the browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/voice-input.spec.ts

# Debug mode
npx playwright test --debug
```

### Writing E2E Tests

#### Basic E2E Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app before each test
    await page.goto('http://localhost:3000');

    // Enter name and start conversation
    await page.fill('input[type="text"]', 'Test User');
    await page.click('button:has-text("Start Conversation")');
  });

  test('should display feature correctly', async ({ page }) => {
    // Interact with the page
    await page.click('button#voice-input');

    // Assert expected behavior
    await expect(page.locator('.voice-status')).toBeVisible();
    await expect(page.locator('.voice-status')).toContainText('Listening');
  });
});
```

#### Testing Voice Input (Example)

```typescript
test('should start voice input when button clicked', async ({ page }) => {
  // Grant microphone permissions
  await page.context().grantPermissions(['microphone']);

  // Click voice input button
  await page.click('button[aria-label="Start voice input"]');

  // Verify listening state
  await expect(page.locator('.voice-status')).toContainText('Listening');

  // Verify accessibility
  const button = page.locator('button[aria-label="Start voice input"]');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
});
```

#### Testing Emotion Visualizer (Example)

```typescript
test('should display emotion badges for messages', async ({ page }) => {
  // Send a happy message
  await page.fill('textarea', 'I am so happy today!');
  await page.click('button:has-text("Send")');

  // Wait for AI response
  await page.waitForSelector('.message.ai');

  // Check for emotion badge
  const badge = page.locator('.emotion-badge').first();
  await expect(badge).toBeVisible();
  await expect(badge).toContainText('joy');
});
```

#### Testing Topic Flow Diagram (Example)

```typescript
test('should render topic nodes in force diagram', async ({ page }) => {
  // Have a conversation with multiple topics
  const messages = [
    'I want to talk about stress',
    'I also have anxiety',
    'My work is overwhelming'
  ];

  for (const msg of messages) {
    await page.fill('textarea', msg);
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(500); // Wait for AI response
  }

  // Open topic flow diagram
  await page.click('button:has-text("Topic Flow")');

  // Verify SVG and nodes are rendered
  await expect(page.locator('svg.topic-flow')).toBeVisible();
  const nodes = page.locator('.topic-node');
  await expect(nodes).toHaveCount(3); // stress, anxiety, work
});
```

#### Testing Conversation Templates (Example)

```typescript
test('should load template and populate fields', async ({ page }) => {
  // Open templates modal
  await page.click('button:has-text("Templates")');

  // Search for template
  await page.fill('input[placeholder="Search templates"]', 'anxiety');

  // Select template
  await page.click('.template-card:has-text("Anxiety Relief")');

  // Verify template details are shown
  await expect(page.locator('.template-preview')).toBeVisible();

  // Use template
  await page.click('button:has-text("Use Template")');

  // Verify textarea is populated
  const textarea = page.locator('textarea');
  await expect(textarea).not.toBeEmpty();
});
```

### E2E Test Configuration

Configuration in `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Testing Best Practices

1. **Test User Flows, Not Implementation**
   - Test complete user journeys
   - Focus on what users see and do
   - Don't test internal state

2. **Use Data Test IDs for Stability**
   ```typescript
   // Add data-testid attributes to components
   <button data-testid="voice-start-btn">Start</button>

   // Select in tests
   await page.click('[data-testid="voice-start-btn"]');
   ```

3. **Wait for Elements Properly**
   ```typescript
   // ✅ Good: Wait for element to be visible
   await page.waitForSelector('.message.ai', { state: 'visible' });

   // ❌ Bad: Arbitrary timeout
   await page.waitForTimeout(3000);
   ```

4. **Test Across Browsers**
   ```bash
   # Run on all configured browsers
   npm run test:e2e

   # Run on specific browser
   npx playwright test --project=firefox
   ```

5. **Use Page Object Model for Complex Flows**
   ```typescript
   class ConversationPage {
     constructor(private page: Page) {}

     async sendMessage(text: string) {
       await this.page.fill('textarea', text);
       await this.page.click('button:has-text("Send")');
       await this.page.waitForSelector('.message.ai');
     }

     async openVoiceInput() {
       await this.page.click('[data-testid="voice-input-btn"]');
     }
   }

   test('conversation flow', async ({ page }) => {
     const conversation = new ConversationPage(page);
     await conversation.sendMessage('Hello');
     await conversation.openVoiceInput();
   });
   ```

### Debugging E2E Tests

```bash
# Run with Playwright Inspector
npx playwright test --debug

# Run specific test with trace viewer
npx playwright test e2e/voice-input.spec.ts --trace on

# View last test trace
npx playwright show-trace trace.zip

# Generate test code from browser actions
npx playwright codegen http://localhost:3000
```

### E2E Test Coverage

Current E2E test coverage (v1.11.0):
- ✅ Voice Input UI and Web Speech API integration
- ✅ Emotion Visualizer with sentiment analysis
- ✅ Topic Flow Diagram with D3.js rendering
- ✅ Conversation Templates system
- ✅ Error boundary functionality
- ✅ Service worker offline support
- ✅ Theme switching and customization
- ✅ Keyboard shortcuts
- ✅ Session management
- ✅ Multi-format export

---

## Test Coverage

### Coverage Thresholds

Current thresholds (in `vitest.config.ts`):

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

### View Coverage

```bash
npm run test:coverage
```

Coverage reports generated in:
- **Terminal**: Summary table
- **HTML**: `coverage/index.html` (open in browser)
- **LCOV**: `coverage/lcov.info` (for CI tools)

### Coverage by File

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|----------
All files             |   74.32 |    68.21 |   72.45 |   74.89
 utils/               |   82.14 |    75.00 |   80.00 |   83.12
  audio.ts            |   85.71 |    78.26 |   83.33 |   86.21
  sessionManager.ts   |   78.94 |    71.42 |   76.19 |   79.31
 hooks/               |   68.42 |    62.50 |   66.67 |   69.23
  usePWA.ts           |   70.00 |    64.28 |   68.42 |   71.15
```

### Increase Coverage

Focus on untested:
1. Check coverage report: `open coverage/index.html`
2. Find red/yellow lines (untested code)
3. Write tests for those paths
4. Re-run coverage

---

## Mocking

### Mock Functions

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue(Promise.resolve(42));
mockFn.mockRejectedValue(new Error('fail'));

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mock Modules

```typescript
vi.mock('@/utils/audio', () => ({
  playAudio: vi.fn(),
  decode: vi.fn(() => new Uint8Array()),
}));
```

### Mock Timers

```typescript
vi.useFakeTimers();

// Fast-forward time
vi.advanceTimersByTime(1000);

// Run all timers
vi.runAllTimers();

// Restore real timers
vi.useRealTimers();
```

### Pre-Configured Mocks

Already mocked in `test/setup.ts`:
- **AudioContext**: Mock audio processing for TTS playback
- **Web Speech API**: Mock SpeechRecognition for voice input
- **localStorage**: Mock browser storage for session persistence
- **Service Worker**: Mock SW registration and lifecycle
- **matchMedia**: Mock CSS media queries
- **IntersectionObserver**: Mock viewport intersection detection
- **Canvas API**: Mock canvas rendering for emotion visualizer
- **Gemini API**: Mock AI responses and TTS generation
- **D3.js** (v1.11.0): Mock D3 selections and force simulation for topic flow diagram
- **HTMLCanvasElement.getContext** (v1.11.0): Mock 2D rendering context
- **ResizeObserver** (v1.11.0): Mock element resize detection

---

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**:
```typescript
it('should set state', () => {
  component.setState({ value: 5 });
  expect(component.state.value).toBe(5);
});
```

✅ **Good**:
```typescript
it('should display new value when button clicked', () => {
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('5')).toBeInTheDocument();
});
```

### 2. Use Descriptive Test Names

❌ **Bad**:
```typescript
it('works', () => { /* ... */ });
it('test 1', () => { /* ... */ });
```

✅ **Good**:
```typescript
it('should return error when input is empty', () => { /* ... */ });
it('should save session to localStorage after 60 seconds', () => { /* ... */ });
```

### 3. One Assertion Per Test (When Possible)

❌ **Bad**:
```typescript
it('should handle all operations', () => {
  expect(fn1()).toBe(1);
  expect(fn2()).toBe(2);
  expect(fn3()).toBe(3);
});
```

✅ **Good**:
```typescript
it('should add numbers', () => expect(add(1, 2)).toBe(3));
it('should subtract numbers', () => expect(sub(5, 2)).toBe(3));
it('should multiply numbers', () => expect(mul(2, 3)).toBe(6));
```

### 4. Test Edge Cases

```typescript
describe('divide', () => {
  it('should divide positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });

  it('should handle decimal results', () => {
    expect(divide(5, 2)).toBe(2.5);
  });
});
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  cleanup(); // React Testing Library
});
```

---

## CI/CD Integration

### GitHub Actions

Example workflow (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - run: npm ci

      # Install Playwright browsers
      - run: npx playwright install --with-deps

      # Run E2E tests
      - run: npm run test:e2e

      # Upload Playwright report on failure
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm run test:run
npm run typecheck
```

---

## Test Organization

### File Structure

```
test/
├── setup.ts                      # Global test configuration
├── utils/
│   ├── audio.test.ts
│   ├── sessionManager.test.ts
│   ├── emotionDetection.test.ts  # NEW v1.11.0
│   ├── topicAnalysis.test.ts     # NEW v1.11.0
│   └── performanceProfiler.test.ts  # NEW v1.11.0
├── hooks/
│   └── usePWA.test.ts
├── components/
│   ├── PWAPrompts.test.tsx
│   ├── VoiceInput.test.tsx       # NEW v1.11.0 (29 tests)
│   ├── EmotionVisualizer.test.tsx  # NEW v1.11.0 (21 tests)
│   ├── TopicFlowDiagram.test.tsx   # NEW v1.11.0
│   ├── ConversationTemplates.test.tsx  # NEW v1.11.0
│   └── ErrorBoundary.test.tsx      # NEW v1.11.0
e2e/
├── voice-input.spec.ts           # NEW v1.11.0 (7 E2E tests)
├── emotion-viz.spec.ts           # NEW v1.11.0 (9 E2E tests)
├── topic-diagram.spec.ts         # NEW v1.11.0 (10 E2E tests)
└── templates.spec.ts             # NEW v1.11.0 (13 E2E tests)
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Setup file: `setup.ts`
- Describe blocks: Component/function name
- It blocks: "should do something"

---

## Troubleshooting

### Tests Not Running

1. Check Node.js version: `node --version` (18+)
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Clear Vitest cache: `npx vitest --clearCache`

### Mock Not Working

1. Ensure mock is defined before imports
2. Use `vi.mock()` at top of file
3. Check mock path matches exactly
4. Verify module is actually being imported

### Coverage Not Accurate

1. Exclude test files in config
2. Ensure all files are imported
3. Run with `--coverage` flag
4. Check coverage thresholds

---

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/) - Fast unit test framework
- [React Testing Library](https://testing-library.com/react) - React component testing utilities
- [Playwright Documentation](https://playwright.dev/) - E2E testing framework (NEW v1.11.0)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) - Common testing mistakes to avoid

### Playwright Resources (v1.11.0)
- [Playwright Test](https://playwright.dev/docs/api/class-test) - Test API reference
- [Playwright Assertions](https://playwright.dev/docs/test-assertions) - Assertion library
- [Playwright Selectors](https://playwright.dev/docs/selectors) - Element selection strategies
- [Playwright Debugging](https://playwright.dev/docs/debug) - Debugging tools and techniques
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) - Official best practices guide

### Tools
- [Vitest UI](https://vitest.dev/guide/ui.html) - Visual test runner interface
- [Playwright Inspector](https://playwright.dev/docs/debug#playwright-inspector) - Step-by-step debugging
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer) - Test execution timeline viewer
- [Playwright Codegen](https://playwright.dev/docs/codegen) - Generate tests from browser actions

---

**Happy Testing! 🧪**

*Last updated for v1.11.0 - Now with comprehensive E2E testing support*
