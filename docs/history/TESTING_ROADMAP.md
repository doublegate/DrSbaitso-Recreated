# Testing Roadmap for Dr. Sbaitso Recreated v1.7.0

## Current Status
- **Total Tests**: 85 passing (100% pass rate)
- **Coverage**: ~79.6% statements, 55.5% branches
- **Target**: 85%+ coverage across all metrics

## Completed ✅

### Service Tests
- ✅ `test/services/geminiService.test.ts` (23 tests)
  - Multi-character AI response handling
  - TTS synthesis with phonetic overrides
  - Chat instance management
  - Error handling & recovery
  - Reset functionality

## Remaining Work

### Phase 1: Utility Tests (High ROI)

#### 1. `test/utils/exportConversation.test.ts` (8 tests)
```typescript
import { describe, it, expect } from 'vitest';
import { ConversationExporter } from '@/utils/exportConversation';
import { ConversationSession } from '@/types';

const mockSession: ConversationSession = {
  id: 'test-session',
  name: 'Test Session',
  characterId: 'sbaitso',
  messages: [
    { author: 'user', text: 'Hello', timestamp: Date.now() },
    { author: 'ai', text: 'HELLO. I AM DR. SBAITSO.', timestamp: Date.now() }
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messageCount: 2,
  glitchCount: 0,
  themeId: 'dos-blue'
};

describe('ConversationExporter', () => {
  describe('exportSession', () => {
    it('should export to markdown format', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'markdown',
        includeMetadata: true,
        includeTimestamps: false
      });

      expect(result).toContain('# Test Session');
      expect(result).toContain('**Character:** Dr. Sbaitso');
      expect(result).toContain('**You:**');
      expect(result).toContain('> Hello');
    });

    it('should export to text format', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'text',
        includeMetadata: true,
        includeTimestamps: false
      });

      expect(result).toContain('Test Session');
      expect(result).toContain('Character: Dr. Sbaitso');
      expect(result).toContain('YOU:');
      expect(result).toContain('Hello');
    });

    it('should export to JSON with metadata', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'json',
        includeMetadata: true,
        includeTimestamps: false
      });

      const parsed = JSON.parse(result);
      expect(parsed.id).toBe('test-session');
      expect(parsed.name).toBe('Test Session');
      expect(parsed.messages).toHaveLength(2);
    });

    it('should export to JSON without metadata', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'json',
        includeMetadata: false,
        includeTimestamps: false
      });

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('should export to HTML format', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'html',
        includeMetadata: true,
        includeTimestamps: false
      });

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<title>Test Session</title>');
      expect(result).toContain('Hello');
      expect(result).toContain('HELLO. I AM DR. SBAITSO.');
    });

    it('should include timestamps when requested', () => {
      const result = ConversationExporter.exportSession(mockSession, {
        format: 'markdown',
        includeMetadata: false,
        includeTimestamps: true
      });

      expect(result).toMatch(/\(\d{1,2}:\d{2}:\d{2}.*\)/); // Matches time format
    });
  });

  describe('download', () => {
    it('should create downloadable blob', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      ConversationExporter.download('test content', 'test.txt', 'text/plain');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });
});
```

#### 2. `test/utils/themeValidator.test.ts` (7 tests)
```typescript
import { describe, it, expect } from 'vitest';
import { calculateContrastRatio, validateTheme, generateShareCode } from '@/utils/themeValidator';

describe('Theme Validator', () => {
  describe('calculateContrastRatio', () => {
    it('should calculate contrast ratio between white and black', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBe(21); // Maximum contrast ratio
    });

    it('should calculate contrast ratio for similar colors', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#FEFEFE');
      expect(ratio).toBeLessThan(1.1); // Very low contrast
    });

    it('should meet WCAG AA standard for normal text', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#767676');
      expect(ratio).toBeGreaterThanOrEqual(4.5); // WCAG AA requirement
    });

    it('should meet WCAG AAA standard for large text', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#949494');
      expect(ratio).toBeGreaterThanOrEqual(3); // WCAG AAA for large text
    });
  });

  describe('validateTheme', () => {
    it('should validate a compliant theme', () => {
      const theme = {
        id: 'test',
        name: 'Test Theme',
        background: '#000000',
        text: '#FFFFFF',
        primary: '#00FF00',
        secondary: '#0000FF',
        border: '#888888'
      };

      const result = validateTheme(theme);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for low contrast', () => {
      const theme = {
        id: 'bad',
        name: 'Bad Theme',
        background: '#FFFFFF',
        text: '#FEFEFE', // Too similar
        primary: '#00FF00',
        secondary: '#0000FF',
        border: '#888888'
      };

      const result = validateTheme(theme);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('generateShareCode', () => {
    it('should generate and decode share code', () => {
      const theme = {
        id: 'custom',
        name: 'Custom Theme',
        background: '#1A1A1A',
        text: '#00FF00',
        primary: '#00AA00',
        secondary: '#008800',
        border: '#004400'
      };

      const shareCode = generateShareCode(theme);
      expect(shareCode).toBeTruthy();
      expect(shareCode.length).toBeGreaterThan(0);

      const decoded = decodeShareCode(shareCode);
      expect(decoded.background).toBe(theme.background);
      expect(decoded.text).toBe(theme.text);
    });
  });
});
```

### Phase 2: Component Tests (Critical)

#### 3. `test/components/App.test.tsx` (15-20 tests)
```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '@/App';

// Mock geminiService
vi.mock('@/services/geminiService', () => ({
  getAIResponse: vi.fn().mockResolvedValue('HELLO. I AM DR. SBAITSO.'),
  synthesizeSpeech: vi.fn().mockResolvedValue('base64audiodata'),
  resetAllChats: vi.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render name entry screen on first load', () => {
      render(<App />);
      expect(screen.getByLabelText(/enter your name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    it('should focus name input on mount', async () => {
      render(<App />);
      const input = screen.getByLabelText(/enter your name/i);
      await waitFor(() => expect(input).toHaveFocus(), { timeout: 100 });
    });

    it('should disable submit when name is empty', () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /start/i });
      expect(button).toBeDisabled();
    });

    it('should enable submit when name is entered', async () => {
      render(<App />);
      const input = screen.getByLabelText(/enter your name/i);
      const button = screen.getByRole('button', { name: /start/i });

      await userEvent.type(input, 'John Doe');
      expect(button).toBeEnabled();
    });
  });

  describe('Character Selection', () => {
    it('should show character selection after name entry', async () => {
      render(<App />);
      const input = screen.getByLabelText(/enter your name/i);
      const button = screen.getByRole('button', { name: /start/i });

      await userEvent.type(input, 'John Doe');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/select.*character/i)).toBeInTheDocument();
      });
    });

    it('should display all 5 characters', async () => {
      render(<App />);
      // Navigate to character selection
      await userEvent.type(screen.getByLabelText(/enter your name/i), 'Test');
      await userEvent.click(screen.getByRole('button', { name: /start/i }));

      await waitFor(() => {
        expect(screen.getByText(/dr.*sbaitso/i)).toBeInTheDocument();
        expect(screen.getByText(/eliza/i)).toBeInTheDocument();
        expect(screen.getByText(/hal.*9000/i)).toBeInTheDocument();
        expect(screen.getByText(/joshua/i)).toBeInTheDocument();
        expect(screen.getByText(/parry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Flow', () => {
    it('should send message and receive AI response', async () => {
      // Setup: Navigate to conversation
      render(<App />);
      await userEvent.type(screen.getByLabelText(/enter your name/i), 'Test');
      await userEvent.click(screen.getByRole('button', { name: /start/i }));

      // Select character (assuming first character button)
      await waitFor(() => screen.getByText(/dr.*sbaitso/i));
      const characterButton = screen.getByRole('button', { name: /dr.*sbaitso/i });
      await userEvent.click(characterButton);

      // Wait for greeting to complete
      await waitFor(() => screen.getByPlaceholderText(/type.*message/i), { timeout: 5000 });

      // Send message
      const input = screen.getByPlaceholderText(/type.*message/i);
      await userEvent.type(input, 'Hello Doctor');
      await userEvent.keyboard('{Enter}');

      // Verify response appears
      await waitFor(() => {
        expect(screen.getByText(/HELLO. I AM DR. SBAITSO/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should clear conversation on Ctrl+L', async () => {
      render(<App />);
      // Navigate to conversation...
      // Send a message...
      // Press Ctrl+L
      await userEvent.keyboard('{Control>}l{/Control}');

      // Verify conversation cleared
      expect(screen.queryByText(/HELLO/i)).not.toBeInTheDocument();
    });
  });

  // Add more tests for:
  // - Theme switching
  // - Audio playback
  // - Settings panel
  // - Statistics dashboard
  // - Session save/load
});
```

### Phase 3: E2E Tests (Playwright)

#### Setup Playwright
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

#### 4. Create `playwright.config.ts`
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
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

#### 5. Create `e2e/basic-flow.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Basic User Flow', () => {
  test('should complete full conversation cycle', async ({ page }) => {
    await page.goto('/');

    // Enter name
    await page.fill('input[type="text"]', 'E2E Test User');
    await page.click('button:has-text("Start")');

    // Select character
    await expect(page.locator('text=Dr. Sbaitso')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Dr. Sbaitso")');

    // Wait for greeting to complete
    await page.waitForTimeout(3000);

    // Send message
    const input = page.locator('textarea, input[placeholder*="type"]');
    await input.fill('Hello Doctor');
    await input.press('Enter');

    // Wait for AI response
    await expect(page.locator('text=/HELLO/i')).toBeVisible({ timeout: 10000 });
  });

  test('should persist session on reload', async ({ page }) => {
    await page.goto('/');

    // Create session
    await page.fill('input[type="text"]', 'Test User');
    await page.click('button:has-text("Start")');
    await page.click('button:has-text("Dr. Sbaitso")');
    await page.waitForTimeout(2000);

    // Send message
    const input = page.locator('textarea, input[placeholder*="type"]');
    await input.fill('Test message for persistence');
    await input.press('Enter');

    // Wait for auto-save
    await page.waitForTimeout(3000);

    // Reload page
    await page.reload();

    // Verify session restored
    await expect(page.locator('text=Test message for persistence')).toBeVisible();
  });

  test('should switch themes successfully', async ({ page }) => {
    await page.goto('/');

    // Navigate to conversation
    await page.fill('input[type="text"]', 'Test User');
    await page.click('button:has-text("Start")');
    await page.click('button:has-text("Dr. Sbaitso")');

    // Open settings (assuming Ctrl+,)
    await page.keyboard.press('Control+Comma');

    // Select different theme
    await page.click('button:has-text("CRT Green")');

    // Verify theme applied (check CSS variable or background color)
    const backgroundColor = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    expect(backgroundColor).not.toBe('rgb(0, 0, 170)'); // Not DOS blue
  });
});
```

### Phase 4: Update Coverage Thresholds

#### 6. Update `vitest.config.ts`
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    lines: 85,      // Increased from 70
    functions: 85,  // Increased from 70
    branches: 80,   // Increased from 70
    statements: 85, // Increased from 70
  },
  exclude: [
    'node_modules/',
    'test/',
    'e2e/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/dist/',
    '**/build/',
    '**/.{idea,git,cache,output,temp}/',
  ],
}
```

### Phase 5: Add Test Scripts

#### 7. Update `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test:run && npm run test:e2e",
    "test:ci": "npm run test:coverage && npm run test:e2e"
  }
}
```

## Execution Plan

### Week 1: Core Tests
1. ✅ **Day 1**: Service tests (geminiService.ts) - **COMPLETED**
2. **Day 2**: Utility tests (exportConversation.ts, themeValidator.ts)
3. **Day 3**: Hook tests (useKeyboardShortcuts.ts, useVoiceControl.ts)
4. **Day 4**: App.tsx component tests (critical path)
5. **Day 5**: Component tests (ThemeCustomizer, AudioVisualizer)

### Week 2: E2E & Polish
6. **Day 6**: Playwright setup and basic flow tests
7. **Day 7**: Advanced E2E tests (features, mobile)
8. **Day 8**: Run full coverage report, identify gaps
9. **Day 9**: Fill remaining coverage gaps
10. **Day 10**: Final verification, CI/CD integration

## Success Metrics

### Coverage Targets
- ✅ Lines: ≥85%
- ✅ Functions: ≥85%
- ✅ Branches: ≥80%
- ✅ Statements: ≥85%

### Test Quality
- ✅ 100% pass rate
- ✅ No flaky tests
- ✅ E2E tests passing on Chromium
- ✅ Tests run in <5 seconds (unit/integration)
- ✅ E2E tests run in <30 seconds

### Documentation
- ✅ Test README with examples
- ✅ Coverage report published
- ✅ CI/CD pipeline configured

## Quick Commands

```bash
# Run all tests
npm run test:all

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Open coverage report
xdg-open coverage/index.html  # Linux
open coverage/index.html       # macOS

# Run specific test file
npm run test:run -- test/services/geminiService.test.ts

# Run tests in watch mode
npm run test

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

## Notes

- **Priority order**: Utilities → Hooks → Components → E2E
- **Coverage ROI**: Utilities give quickest coverage boost
- **Critical path**: App.tsx is highest priority component
- **E2E validation**: Ensures real-world user flows work
- **Accessibility**: Include a11y checks in component tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
