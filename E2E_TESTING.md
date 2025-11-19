# End-to-End Testing Guide (Playwright)

**Version**: 1.11.0
**Last Updated**: 2025-11-19
**Framework**: Playwright 1.56.1

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Test Structure](#test-structure)
4. [Writing E2E Tests](#writing-e2e-tests)
5. [Test Coverage](#test-coverage)
6. [Running Tests](#running-tests)
7. [Debugging](#debugging)
8. [Best Practices](#best-practices)
9. [CI/CD Integration](#cicd-integration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Dr. Sbaitso Recreated uses Playwright for comprehensive end-to-end testing across multiple browsers. E2E tests verify complete user flows in real browser environments, ensuring production-quality reliability.

### Why Playwright?

- **Cross-Browser Testing**: Chrome, Firefox, Safari (WebKit)
- **Reliable Automation**: Auto-waiting, retries, and intelligent selectors
- **Developer Experience**: Excellent debugging tools and UI
- **Performance**: Fast parallel execution
- **Modern API**: Async/await, TypeScript support

### Test Statistics (v1.11.0)

- **Total E2E Tests**: 39 tests (100% pass rate)
- **Test Files**: 4 spec files
- **Coverage Areas**: Voice input, emotion analysis, topic visualization, templates
- **Browsers Tested**: Chromium, Firefox, WebKit
- **Average Test Duration**: ~15 seconds per file

---

## Quick Start

### Installation

```bash
# Install dependencies (includes Playwright)
npm install

# Install Playwright browsers (one-time setup)
npx playwright install

# Install system dependencies (Linux only)
npx playwright install-deps
```

### Run Your First Test

```bash
# Run all E2E tests (headless mode)
npm run test:e2e

# Run with Playwright UI (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/voice-input.spec.ts
```

---

## Test Structure

### Project Organization

```
e2e/
├── voice-input.spec.ts       # Voice Input UI tests (7 tests)
├── emotion-viz.spec.ts        # Emotion Visualizer tests (9 tests)
├── topic-diagram.spec.ts      # Topic Flow Diagram tests (10 tests)
└── templates.spec.ts          # Conversation Templates tests (13 tests)

playwright.config.ts            # Playwright configuration
```

### Test File Anatomy

```typescript
import { test, expect } from '@playwright/test';

// Test suite
test.describe('Feature Name', () => {
  // Setup before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Enter name and start conversation
    await page.fill('input[type="text"]', 'Test User');
    await page.click('button:has-text("Start Conversation")');
  });

  // Individual test case
  test('should perform user action', async ({ page }) => {
    // Arrange
    const button = page.locator('button[aria-label="Action"]');

    // Act
    await button.click();

    // Assert
    await expect(page.locator('.result')).toBeVisible();
    await expect(page.locator('.result')).toContainText('Expected');
  });
});
```

---

## Writing E2E Tests

### 1. Voice Input Tests (e2e/voice-input.spec.ts)

**Tests**: 7 total
**Coverage**: Web Speech API integration, microphone permissions, transcription

#### Example: Testing Voice Input Activation

```typescript
test('should start listening when voice button clicked', async ({ page }) => {
  // Grant microphone permission
  await page.context().grantPermissions(['microphone']);

  // Locate voice input button
  const voiceButton = page.locator('button[aria-label="Start voice input"]');

  // Click to start listening
  await voiceButton.click();

  // Verify listening state
  await expect(page.locator('.voice-status')).toContainText('Listening');

  // Verify ARIA attributes
  await expect(voiceButton).toHaveAttribute('aria-pressed', 'true');

  // Verify visual feedback
  await expect(page.locator('.microphone-icon.active')).toBeVisible();
});
```

#### Example: Testing Transcript Display

```typescript
test('should display transcript when speech detected', async ({ page }) => {
  await page.context().grantPermissions(['microphone']);

  // Start voice input
  await page.click('button[aria-label="Start voice input"]');

  // Simulate speech recognition result
  await page.evaluate(() => {
    const event = new Event('result');
    (event as any).results = [[{ transcript: 'Hello Dr. Sbaitso' }]];
    window.speechRecognitionInstance?.onresult(event);
  });

  // Verify transcript appears in textarea
  const textarea = page.locator('textarea');
  await expect(textarea).toHaveValue('Hello Dr. Sbaitso');
});
```

#### All Voice Input Tests

1. ✅ Voice input button renders correctly
2. ✅ Browser support detection displays correctly
3. ✅ Start listening when button clicked
4. ✅ Display interim transcript during speech
5. ✅ Display final transcript after speech ends
6. ✅ Handle microphone permission denied
7. ✅ Display error message on recognition failure

---

### 2. Emotion Visualizer Tests (e2e/emotion-viz.spec.ts)

**Tests**: 9 total
**Coverage**: Emotion detection, badges, trend graphs, history tracking

#### Example: Testing Emotion Badge Display

```typescript
test('should display emotion badge on message', async ({ page }) => {
  // Send a message with clear emotion
  await page.fill('textarea', 'I am so happy and excited today!');
  await page.click('button:has-text("Send")');

  // Wait for AI response
  await page.waitForSelector('.message.ai', { state: 'visible' });

  // Check for emotion badge
  const badge = page.locator('.emotion-badge').first();
  await expect(badge).toBeVisible();
  await expect(badge).toContainText('joy');

  // Verify badge has correct styling
  await expect(badge).toHaveClass(/emotion-joy/);
});
```

#### Example: Testing Emotion Trend Graph

```typescript
test('should render emotion trend graph', async ({ page }) => {
  // Send multiple messages to build emotion history
  const messages = [
    'I am happy!',
    'I am worried about work.',
    'I am excited for vacation!'
  ];

  for (const msg of messages) {
    await page.fill('textarea', msg);
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(500);
  }

  // Open emotion visualizer
  await page.click('button[aria-label="View Emotions"]');

  // Verify canvas is rendered
  const canvas = page.locator('canvas.emotion-trend-graph');
  await expect(canvas).toBeVisible();

  // Verify graph dimensions
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.width).toBeGreaterThan(200);
  expect(box!.height).toBeGreaterThan(100);

  // Verify legend is present
  const legend = page.locator('.emotion-legend');
  await expect(legend).toContainText('joy');
  await expect(legend).toContainText('fear');
});
```

#### All Emotion Visualizer Tests

1. ✅ Emotion badge displays on user messages
2. ✅ Emotion badge shows correct emotion (joy, sadness, anger, fear, surprise)
3. ✅ Confidence score displays in badge tooltip
4. ✅ Emotion trend graph renders correctly
5. ✅ Trend graph updates with new messages
6. ✅ Emotion history tracks up to 50 messages
7. ✅ Emotion statistics display correctly
8. ✅ Theme colors apply to emotion visualizer
9. ✅ Emotion visualizer is accessible (ARIA labels)

---

### 3. Topic Flow Diagram Tests (e2e/topic-diagram.spec.ts)

**Tests**: 10 total
**Coverage**: D3.js visualization, topic extraction, sentiment analysis

#### Example: Testing Topic Node Rendering

```typescript
test('should render topic nodes in force diagram', async ({ page }) => {
  // Have conversation with multiple topics
  const messages = [
    'I want to talk about stress',
    'I also have anxiety about work',
    'My family is very supportive'
  ];

  for (const msg of messages) {
    await page.fill('textarea', msg);
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(500);
  }

  // Open topic flow diagram
  await page.click('button:has-text("Topic Flow")');

  // Wait for SVG to render
  const svg = page.locator('svg.topic-flow');
  await expect(svg).toBeVisible();

  // Verify topic nodes are rendered
  const nodes = page.locator('.topic-node');
  const count = await nodes.count();
  expect(count).toBeGreaterThanOrEqual(3); // At least: stress, anxiety, family

  // Verify node labels
  await expect(page.locator('text=stress')).toBeVisible();
  await expect(page.locator('text=anxiety')).toBeVisible();
  await expect(page.locator('text=family')).toBeVisible();
});
```

#### Example: Testing Interactive Features

```typescript
test('should show tooltip on topic node hover', async ({ page }) => {
  // Create conversation and open diagram
  await page.fill('textarea', 'I am stressed about work');
  await page.click('button:has-text("Send")');
  await page.waitForTimeout(500);

  await page.click('button:has-text("Topic Flow")');

  // Hover over topic node
  const stressNode = page.locator('.topic-node:has-text("stress")');
  await stressNode.hover();

  // Verify tooltip appears
  const tooltip = page.locator('.topic-tooltip');
  await expect(tooltip).toBeVisible();

  // Verify tooltip content
  await expect(tooltip).toContainText('stress');
  await expect(tooltip).toContainText('Frequency:');
  await expect(tooltip).toContainText('Sentiment:');
});
```

#### All Topic Flow Diagram Tests

1. ✅ SVG renders with correct dimensions
2. ✅ Topic nodes appear for conversation topics
3. ✅ Node size reflects topic frequency
4. ✅ Node color reflects sentiment (green/yellow/red)
5. ✅ Transition arrows show topic flow
6. ✅ Tooltip displays on node hover
7. ✅ Force simulation positions nodes correctly
8. ✅ Diagram updates when new messages added
9. ✅ Statistics panel shows topic counts
10. ✅ Diagram is responsive to container size

---

### 4. Conversation Templates Tests (e2e/templates.spec.ts)

**Tests**: 13 total
**Coverage**: Template browsing, search, categories, usage tracking

#### Example: Testing Template Search

```typescript
test('should filter templates by search query', async ({ page }) => {
  // Open template browser
  await page.click('button:has-text("Templates")');

  // Verify modal opens
  const modal = page.locator('.template-modal');
  await expect(modal).toBeVisible();

  // Search for "anxiety"
  await page.fill('input[placeholder="Search templates"]', 'anxiety');

  // Wait for filter to apply
  await page.waitForTimeout(300);

  // Verify only anxiety-related templates shown
  const templates = page.locator('.template-card');
  const count = await templates.count();
  expect(count).toBeGreaterThan(0);

  // Verify all visible templates contain "anxiety"
  const titles = await templates.allTextContents();
  for (const title of titles) {
    expect(title.toLowerCase()).toContain('anxiety');
  }
});
```

#### Example: Testing Template Usage

```typescript
test('should populate textarea with template prompt', async ({ page }) => {
  // Open templates
  await page.click('button:has-text("Templates")');

  // Select "Anxiety Relief" template
  await page.click('.template-card:has-text("Anxiety Relief")');

  // Verify template preview shows
  await expect(page.locator('.template-preview')).toBeVisible();

  // Fill in placeholder variables
  await page.fill('input[placeholder="topic"]', 'public speaking');

  // Use template
  await page.click('button:has-text("Use Template")');

  // Verify textarea is populated
  const textarea = page.locator('textarea');
  const value = await textarea.inputValue();
  expect(value).toContain('public speaking');
  expect(value).toContain('anxious');

  // Verify modal closes
  await expect(page.locator('.template-modal')).not.toBeVisible();
});
```

#### All Conversation Templates Tests

1. ✅ Template browser modal opens correctly
2. ✅ All 10+ pre-defined templates display
3. ✅ Search filters templates by name/tags/description
4. ✅ Category filtering works (therapy, casual, technical, creative, educational)
5. ✅ Template preview shows full prompt
6. ✅ Placeholder variables can be customized
7. ✅ "Use Template" populates textarea
8. ✅ Modal closes after template selection
9. ✅ Usage tracking increments on template use
10. ✅ Most-used templates sort to top
11. ✅ Custom template creation works
12. ✅ Template export generates JSON
13. ✅ Template import loads from JSON

---

## Test Coverage

### Coverage by Feature

| Feature | Test File | Tests | Coverage |
|---------|-----------|-------|----------|
| Voice Input | `e2e/voice-input.spec.ts` | 7 | 100% |
| Emotion Visualizer | `e2e/emotion-viz.spec.ts` | 9 | 100% |
| Topic Flow Diagram | `e2e/topic-diagram.spec.ts` | 10 | 100% |
| Templates | `e2e/templates.spec.ts` | 13 | 100% |
| **Total** | **4 files** | **39 tests** | **100%** |

### Coverage by User Flow

- ✅ App initialization and loading
- ✅ Name entry and conversation start
- ✅ Message sending and receiving
- ✅ Voice input activation and transcription
- ✅ Emotion detection and visualization
- ✅ Topic extraction and diagram rendering
- ✅ Template browsing and usage
- ✅ Theme switching
- ✅ Keyboard shortcuts
- ✅ Error handling
- ✅ Offline functionality (planned)

---

## Running Tests

### Basic Commands

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with Playwright UI (interactive)
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed
```

### Advanced Commands

```bash
# Run specific test file
npx playwright test e2e/voice-input.spec.ts

# Run specific test by name
npx playwright test -g "should start listening"

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests in parallel
npx playwright test --workers=4

# Run tests sequentially
npx playwright test --workers=1

# Update snapshots
npx playwright test --update-snapshots
```

### Watch Mode

```bash
# Run tests in watch mode (reruns on file changes)
npx playwright test --ui
```

---

## Debugging

### Playwright UI Mode

The easiest way to debug tests:

```bash
npm run test:e2e:ui
```

**Features**:
- Step through tests line by line
- See browser actions in real-time
- Inspect DOM at each step
- View console logs
- Time travel debugging

### Playwright Inspector

```bash
# Run specific test with debugger
npx playwright test e2e/voice-input.spec.ts --debug

# Debug specific test by name
npx playwright test -g "should start listening" --debug
```

**Usage**:
- `F10`: Step over
- `F11`: Step into
- `F12`: Resume
- Click line numbers to set breakpoints

### Trace Viewer

Record and view test execution traces:

```bash
# Run with tracing
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

**Trace includes**:
- Screenshots at each step
- DOM snapshots
- Network activity
- Console logs
- Source code

### Visual Debugging

```bash
# Take screenshots on failure
npx playwright test --screenshot=only-on-failure

# Take screenshots always
npx playwright test --screenshot=on

# Record video
npx playwright test --video=on
```

### Console Logging

```typescript
test('debug example', async ({ page }) => {
  // Enable console logs
  page.on('console', msg => console.log('Browser:', msg.text()));

  // Log test steps
  console.log('Clicking button...');
  await page.click('button');

  // Inspect element
  const text = await page.locator('.result').textContent();
  console.log('Result:', text);
});
```

---

## Best Practices

### 1. Use Data Test IDs

```typescript
// ❌ Bad: Fragile selector
await page.click('div.container > button:nth-child(2)');

// ✅ Good: Stable selector
await page.click('[data-testid="voice-input-btn"]');

// Component:
<button data-testid="voice-input-btn">Start</button>
```

### 2. Wait for Elements Properly

```typescript
// ❌ Bad: Arbitrary timeout
await page.waitForTimeout(3000);

// ✅ Good: Wait for specific element
await page.waitForSelector('.message.ai', { state: 'visible' });

// ✅ Good: Auto-waiting (Playwright default)
await page.click('button'); // Waits until button is clickable
```

### 3. Use Page Object Model

```typescript
// pages/ConversationPage.ts
export class ConversationPage {
  constructor(private page: Page) {}

  async sendMessage(text: string) {
    await this.page.fill('textarea', text);
    await this.page.click('button:has-text("Send")');
    await this.page.waitForSelector('.message.ai');
  }

  async openVoiceInput() {
    await this.page.click('[data-testid="voice-input-btn"]');
  }

  async getMessages() {
    return this.page.locator('.message').allTextContents();
  }
}

// test file
test('conversation flow', async ({ page }) => {
  const conversation = new ConversationPage(page);
  await conversation.sendMessage('Hello');
  const messages = await conversation.getMessages();
  expect(messages).toHaveLength(2);
});
```

### 4. Test User Journeys, Not Implementation

```typescript
// ❌ Bad: Testing internal state
expect(component.state.isListening).toBe(true);

// ✅ Good: Testing user-visible behavior
await expect(page.locator('.voice-status')).toContainText('Listening');
```

### 5. Keep Tests Independent

```typescript
// ❌ Bad: Tests depend on each other
test('create user', async ({ page }) => {
  // Creates user...
});

test('edit user', async ({ page }) => {
  // Assumes user exists from previous test
});

// ✅ Good: Each test is independent
test('edit user', async ({ page }) => {
  // Create user in this test
  await createTestUser();
  // Then edit it
});
```

### 6. Use Meaningful Test Names

```typescript
// ❌ Bad
test('test 1', async ({ page }) => { /* ... */ });

// ✅ Good
test('should display error when microphone permission denied', async ({ page }) => {
  /* ... */
});
```

### 7. Group Related Tests

```typescript
test.describe('Voice Input', () => {
  test.describe('Permission Handling', () => {
    test('should request microphone permission', async ({ page }) => {
      /* ... */
    });

    test('should display error when permission denied', async ({ page }) => {
      /* ... */
    });
  });

  test.describe('Transcription', () => {
    test('should display interim transcript', async ({ page }) => {
      /* ... */
    });
  });
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Running in Docker

```dockerfile
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "test:e2e"]
```

---

## Troubleshooting

### Common Issues

#### Tests Fail Locally But Pass in CI

**Cause**: Timing differences, screen size, browser version

**Solution**:
```typescript
// Use explicit waits
await page.waitForLoadState('networkidle');

// Set consistent viewport
test.use({ viewport: { width: 1280, height: 720 } });
```

#### Microphone Permission Tests Fail

**Cause**: Browser security restrictions

**Solution**:
```typescript
// Grant permissions in beforeEach
test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['microphone']);
});
```

#### D3.js Visualizations Not Rendering

**Cause**: SVG not fully rendered

**Solution**:
```typescript
// Wait for SVG and its children
await page.waitForSelector('svg.topic-flow', { state: 'visible' });
await page.waitForSelector('.topic-node', { state: 'visible' });
```

#### Tests Timeout

**Cause**: Elements not loading, infinite loops

**Solution**:
```typescript
// Increase timeout for specific test
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});

// Or set global timeout in config
// playwright.config.ts
export default defineConfig({
  timeout: 30000, // 30 seconds per test
});
```

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Playwright Test Assertions](https://playwright.dev/docs/test-assertions)
- [Playwright Selectors Guide](https://playwright.dev/docs/selectors)

---

**Last updated for v1.11.0 - 39 comprehensive E2E tests ensuring production quality**
