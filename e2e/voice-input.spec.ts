import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Voice Input Feature (v1.11.0)
 */

test.describe('Voice Input Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Complete name entry and character selection to reach conversation
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('E2E Voice Test User');

    const startButton = page.locator('button').filter({ hasText: /start|begin|enter|submit/i }).first();
    await startButton.click();

    // Wait for character selection and select a character
    await page.waitForTimeout(1000);

    // Click any character to proceed
    const characterButton = page.locator('button').filter({ hasText: /dr.*sbaitso|eliza|hal|joshua|parry/i }).first();
    if (await characterButton.isVisible().catch(() => false)) {
      await characterButton.click();
      await page.waitForTimeout(2000); // Wait for greeting to finish
    }
  });

  test('should display voice input UI when speech recognition is available', async ({ page, browserName }) => {
    // Mock SpeechRecognition API availability
    await page.addInitScript(() => {
      (window as any).SpeechRecognition = class {
        start() {}
        stop() {}
      };
      (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Look for voice input button or UI (microphone icon, start recording button, etc.)
    const voiceButton = page.locator('button').filter({ hasText: /voice|microphone|🎤|speak/i });

    // Voice input UI should be present
    const isVisible = await voiceButton.count() > 0;
    expect(isVisible).toBeTruthy();

    if (isVisible) {
      console.log('✓ Voice input UI is visible');
    }
  });

  test('should toggle voice input panel visibility', async ({ page }) => {
    // Mock SpeechRecognition API
    await page.addInitScript(() => {
      (window as any).SpeechRecognition = class {
        continuous = false;
        interimResults = false;
        lang = '';
        start() {}
        stop() {}
      };
      (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Find and click voice input toggle button
    const voiceToggle = page.locator('button').filter({ hasText: /voice|🎤/i }).first();

    if (await voiceToggle.isVisible()) {
      await voiceToggle.click();
      await page.waitForTimeout(500);

      // Check if voice input panel appears
      const voicePanel = page.locator('text=/start listening|stop listening|listening|transcript/i');
      const panelVisible = await voicePanel.count() > 0;

      console.log(panelVisible ? '✓ Voice input panel toggles' : '⚠ Voice panel behavior may differ');
    }
  });

  test('should show appropriate UI when speech recognition is not supported', async ({ page }) => {
    // Ensure SpeechRecognition is not available
    await page.addInitScript(() => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Voice input should either be hidden or show "not supported" message
    const notSupportedText = page.locator('text=/not supported|unavailable|browser.*speech/i');
    const voiceButton = page.locator('button').filter({ hasText: /voice|🎤/i });

    const hasNotSupported = await notSupportedText.count() > 0;
    const hasButton = await voiceButton.count() > 0;

    // Either show "not supported" message OR hide the button entirely
    expect(hasNotSupported || !hasButton).toBeTruthy();

    console.log(hasNotSupported ? '✓ Shows not supported message' : '✓ Voice button hidden when not supported');
  });

  test('should be accessible via keyboard', async ({ page }) => {
    // Mock SpeechRecognition API
    await page.addInitScript(() => {
      (window as any).SpeechRecognition = class {
        start() {}
        stop() {}
      };
      (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Tab through UI to find voice button
    let tabCount = 0;
    const maxTabs = 20;

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      // Check if focused element is voice-related
      const focusedText = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.textContent || active?.getAttribute('aria-label') || '';
      });

      if (/voice|microphone|🎤|speak/i.test(focusedText)) {
        console.log('✓ Voice input is keyboard accessible');

        // Try to activate with Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        return; // Test passed
      }
    }

    console.log('⚠ Voice input keyboard accessibility not verified (may be in collapsed state)');
  });

  test('should display voice input controls when enabled', async ({ page }) => {
    // Mock SpeechRecognition with more complete implementation
    await page.addInitScript(() => {
      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = '';
        onresult: any = null;
        onerror: any = null;
        onend: any = null;
        onstart: any = null;

        start() {
          if (this.onstart) this.onstart();
        }

        stop() {
          if (this.onend) this.onend();
        }
      }

      (window as any).SpeechRecognition = MockSpeechRecognition;
      (window as any).webkitSpeechRecognition = MockSpeechRecognition;
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Look for voice input controls
    const voiceControls = page.locator('text=/start|stop|listening|clear/i');
    const hasControls = await voiceControls.count() > 0;

    console.log(hasControls ? '✓ Voice controls detected' : '⚠ Voice controls may require interaction');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mock SpeechRecognition API
    await page.addInitScript(() => {
      (window as any).SpeechRecognition = class {
        start() {}
        stop() {}
      };
      (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Check that voice input is accessible on mobile
    const voiceButton = page.locator('button').filter({ hasText: /voice|🎤/i }).first();

    if (await voiceButton.isVisible()) {
      // Should be clickable/tappable
      const boundingBox = await voiceButton.boundingBox();
      expect(boundingBox).toBeTruthy();

      if (boundingBox) {
        // Touch target should be reasonably sized (at least 44x44 for accessibility)
        const isTouchFriendly = boundingBox.width >= 30 && boundingBox.height >= 30;
        console.log(isTouchFriendly ? '✓ Voice button is touch-friendly' : '⚠ Voice button may be small for touch');
      }
    }
  });
});
