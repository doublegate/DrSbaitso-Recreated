/** The default classic 80x25 screen, checked against the DOSBox-verified original. */
import { test, expect, type Page } from '@playwright/test';
import { mockApi, openApp, expectNoPageScroll } from './fixtures';

const screenText = (page: Page) => page.locator('main, body').first();

// The hidden screen-reader transcript holds the whole greeting at once, so
// readiness is the screen's own phase, not the presence of text. (<main> has
// no box of its own, so check the attribute rather than visibility.)
const phase = (page: Page) => page.locator('main[aria-label="Doctor Sbaitso"]');
const atPrompt = (page: Page) => expect(phase(page)).toHaveAttribute('data-phase', 'chat', { timeout: 30_000 });

async function startClassic(page: Page, name = 'ALICE') {
  await openApp(page, 'classic');
  await expect(screenText(page)).toContainText('Please enter your name', { timeout: 15_000 });
  await page.keyboard.type(name);
  await page.keyboard.press('Enter');
  await expect(screenText(page)).toContainText('SO, TELL ME ABOUT YOUR PROBLEMS.', { timeout: 30_000 });
  await atPrompt(page);
}

async function say(page: Page, text: string, expected: string | RegExp) {
  await atPrompt(page);
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  await expect(screenText(page)).toContainText(expected, { timeout: 30_000 });
}

test.describe('classic screen', () => {
  test('shows the v2.20 banner and greets by name', async ({ page }) => {
    await mockApi(page);
    await startClassic(page);
    await expect(screenText(page)).toContainText('version 2.20');
    await expect(screenText(page)).toContainText('HELLO ALICE,  MY NAME IS DOCTOR SBAITSO.');
    await expectNoPageScroll(page);
  });

  test('sends open conversation to the model and prints the reply', async ({ page }) => {
    const calls = await mockApi(page, 'WHY DO YOU FEEL SAD?');
    await startClassic(page);
    await say(page, 'I feel sad', 'WHY DO YOU FEEL SAD?');
    expect(calls.chat.at(-1)?.message).toContain('I feel sad');
  });

  test('answers CALC locally in the original format', async ({ page }) => {
    const calls = await mockApi(page);
    await startClassic(page);
    const before = calls.chat.length;
    await say(page, 'CALC 2+3', ' =  5');
    expect(calls.chat.length).toBe(before);
  });

  test('SAY PARITY floods PARITY ERR lines and recovers', async ({ page }) => {
    await mockApi(page);
    await startClassic(page);
    await say(page, 'SAY PARITY', 'PARITY ERR ... RECOVERED');
    await expect(screenText(page)).toContainText('???');
    // The banner stays pinned through the flood.
    await expect(screenText(page)).toContainText('version 2.20');
  });

  test('BYE shows the exit menu and C continues', async ({ page }) => {
    await mockApi(page);
    await startClassic(page);
    await say(page, 'BYE', '<C>ontinue');
    await expect(phase(page)).toHaveAttribute('data-phase', 'menu');
    await page.keyboard.press('c');
    await say(page, 'CALC 1+1', ' =  2');
  });
});
