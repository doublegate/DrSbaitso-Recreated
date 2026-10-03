/**
 * Shared end-to-end helpers. The preview server has no /api, so every test
 * mocks it: deterministic, free, and no key needed. Calls are recorded so a
 * test can assert what reached the "model".
 */
import { expect, type Page } from '@playwright/test';

/** 4 bytes = 2 silent PCM16 samples. */
const SILENT_AUDIO = 'AAAAAA==';

export interface ApiCalls {
  chat: Array<{ characterId?: string; message: string }>;
  tts: number;
}

export async function mockApi(page: Page, reply = 'WHY DO YOU FEEL THAT WAY?'): Promise<ApiCalls> {
  const calls: ApiCalls = { chat: [], tts: 0 };
  await page.route('**/api/tts', (route) => {
    calls.tts++;
    return route.fulfill({ json: { audio: SILENT_AUDIO, sampleRate: 24000, mimeType: 'audio/L16;rate=24000' } });
  });
  await page.route('**/api/chat', (route) => {
    calls.chat.push(route.request().postDataJSON());
    return route.fulfill({ json: { text: reply } });
  });
  return calls;
}

/** Opens the app in the given mode with the first-run tutorial already seen. */
export async function openApp(page: Page, mode: 'classic' | 'enhanced'): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sbaitso_onboarding_completed', 'true');
    } catch {
      // Storage unavailable: the tutorial simply shows.
    }
  });
  await page.goto(`/?mode=${mode}`);
}

/** Enhanced mode: enter a name and wait until the chat input is usable. */
export async function startEnhanced(page: Page, name = 'ALICE'): Promise<void> {
  await openApp(page, 'enhanced');
  await page.getByPlaceholder('TYPE NAME AND PRESS ENTER').fill(name);
  await page.keyboard.press('Enter');
  await expect(page.locator('#chat-input')).toBeEnabled({ timeout: 30_000 });
}

/** Enhanced mode: send one line and wait for the turn to finish. */
export async function send(page: Page, text: string): Promise<void> {
  const input = page.locator('#chat-input');
  await input.fill(text);
  await input.press('Enter');
  await expect(input).toBeEnabled({ timeout: 30_000 });
}

/** The page itself must never scroll: the app is a fixed-height shell. */
export async function expectNoPageScroll(page: Page): Promise<void> {
  const { scrollHeight, innerHeight } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }));
  expect(scrollHeight).toBeLessThanOrEqual(innerHeight);
}

/** Enhanced mode: the conversation log (messages carry a hidden speaker label). */
export const conversationLog = (page: Page) => page.getByRole('log', { name: 'Conversation messages' });
