/** Enhanced mode: layout, menus, panels, personas and their local engines. */
import { test, expect } from '@playwright/test';
import { mockApi, startEnhanced, send, expectNoPageScroll, conversationLog } from './fixtures';

test.describe('enhanced mode', () => {
  test('reaches the chat after name entry, with a styled, non-scrolling layout', async ({ page }) => {
    const calls = await mockApi(page);
    await startEnhanced(page);
    await expect(conversationLog(page)).toContainText('HELLO ALICE,  MY NAME IS DOCTOR SBAITSO.');
    expect(calls.tts).toBeGreaterThan(0);
    await expectNoPageScroll(page);
    // Guards the Tailwind @source regression: utility classes must be generated,
    // or the header collapses into an unstyled column.
    const nav = page.getByRole('navigation', { name: 'Tools' });
    await expect(nav).toHaveCSS('display', 'flex');
    const box = await page.getByRole('button', { name: 'CONVERSATION', exact: true }).boundingBox();
    expect(box?.height).toBeGreaterThan(30);
  });

  test('sends a message and types the reply once', async ({ page }) => {
    const calls = await mockApi(page, 'WHY DO YOU FEEL SAD?');
    await startEnhanced(page);
    await send(page, 'I feel sad');
    const log = conversationLog(page);
    await expect(log).toContainText('WHY DO YOU FEEL SAD?');
    // Typed exactly once: no doubled characters, no repeated reply.
    const text = (await log.innerText()).replaceAll('\n', ' ');
    expect(text.split('WHY DO YOU FEEL SAD?').length - 1).toBe(1);
    expect(text).not.toContain('WWHHYY');
    expect(calls.chat.at(-1)).toMatchObject({ characterId: 'sbaitso', message: 'I feel sad' });
  });

  test('menus open, list shortcuts, and close on Escape', async ({ page }) => {
    await mockApi(page);
    await startEnhanced(page);
    const trigger = page.getByRole('button', { name: 'SOUND', exact: true });
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: /Music player/ })).toContainText('Alt+Shift+M');
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('opens the panels from the menus', async ({ page }) => {
    await mockApi(page);
    await startEnhanced(page);
    await send(page, 'I am happy today');

    await page.getByRole('button', { name: 'VISUALS', exact: true }).click();
    await page.getByRole('button', { name: /Emotion visualizer/ }).click();
    await expect(page.getByText('Emotion Analysis')).toBeVisible();

    await page.getByRole('button', { name: 'VISUALS', exact: true }).click();
    await page.getByRole('button', { name: /Topic diagram/ }).click();
    await expect(page.getByText('Topic Flow Diagram')).toBeVisible();

    await page.getByRole('button', { name: 'CONVERSATION', exact: true }).click();
    await page.getByRole('button', { name: /Export/ }).click();
    await expect(page.getByText('ADVANCED EXPORT')).toBeVisible();
  });

  test('templates go through the normal send pipeline', async ({ page }) => {
    const calls = await mockApi(page, 'TELL ME MORE.');
    await startEnhanced(page);
    await page.getByRole('button', { name: 'CONVERSATION', exact: true }).click();
    await page.getByRole('button', { name: /Templates/ }).click();
    await expect(page.getByText('Conversation Templates')).toBeVisible();
    const before = calls.chat.length;
    // Template cards are role=button with aria-pressed (selected or not).
    await page.locator('[role="button"][aria-pressed="false"]').first().click();
    await page.getByRole('button', { name: /Apply Template/ }).click();
    await expect.poll(() => calls.chat.length, { timeout: 30_000 }).toBeGreaterThan(before);
    await expect(conversationLog(page)).toContainText('TELL ME MORE.', { timeout: 30_000 });
  });

  test('ELIZA answers locally from the 1965 script', async ({ page }) => {
    const calls = await mockApi(page);
    await startEnhanced(page);
    await page.getByLabel('PERSONA:').selectOption('eliza');
    await expect(conversationLog(page)).toContainText(/HOW DO YOU DO\. I AM THE DOCTOR/);
    const before = calls.chat.length;
    await send(page, 'My mother hates me.');
    expect(calls.chat.length).toBe(before);
  });

  test('JOSHUA logs on and plays tic-tac-toe without the model', async ({ page }) => {
    const calls = await mockApi(page);
    await startEnhanced(page);
    await page.getByLabel('PERSONA:').selectOption('joshua');
    await expect(conversationLog(page)).toContainText('LOGON:');
    const before = calls.chat.length;
    await send(page, 'JOSHUA');
    await expect(conversationLog(page)).toContainText('GREETINGS, PROFESSOR FALKEN.');
    await send(page, 'TIC-TAC-TOE');
    await send(page, '1');
    await send(page, '5');
    await expect(conversationLog(page)).toContainText(/JOSHUA TAKES SQUARE \d/);
    expect(calls.chat.length).toBe(before);
  });

  test('text shared to the app lands on the input line, unsent', async ({ page }) => {
    const calls = await mockApi(page);
    await page.addInitScript(() => {
      localStorage.setItem('sbaitso_onboarding_completed', 'true');
      localStorage.setItem('sbaitso_ui_mode', 'enhanced');
    });
    await page.goto('/share?title=&text=I%20feel%20sad%20today');
    await page.getByPlaceholder('TYPE NAME AND PRESS ENTER').fill('ALICE');
    await page.keyboard.press('Enter');
    await expect(page.locator('#chat-input')).toHaveValue('I feel sad today', { timeout: 30_000 });
    expect(new URL(page.url()).pathname).toBe('/');
    expect(calls.chat).toHaveLength(0);
  });

  test('switches to the classic screen', async ({ page }) => {
    await mockApi(page);
    await startEnhanced(page);
    await page.getByRole('button', { name: 'CLASSIC' }).click();
    await expect(page.getByText('version 2.20')).toBeVisible();
  });
});
