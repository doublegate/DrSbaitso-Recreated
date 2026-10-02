/**
 * Captures the web app manifest screenshots (install dialogs show them).
 *
 *   npm run build && node scripts/generate-screenshots.mjs
 *
 * Serves dist/ with `vite preview`, mocks /api so no key is needed, and writes
 * public/screenshots/{classic,enhanced}-{wide,narrow}.png. The manifest lists
 * these files; regenerate them whenever either screen changes visibly.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'public/screenshots');
const PORT = 4174;
const BASE = `http://localhost:${PORT}`;

const SIZES = {
  wide: { width: 1280, height: 720 },
  narrow: { width: 412, height: 915 },
};

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
});
const stop = () => server.kill();
process.on('exit', stop);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`preview server did not start on ${BASE}`);
}

async function newPage(browser, size, mode) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  await page.addInitScript((m) => {
    localStorage.setItem('sbaitso_onboarding_completed', 'true');
    localStorage.setItem('sbaitso_ui_mode', m);
  }, mode);
  await page.route('**/api/tts', (r) => r.fulfill({ json: { audio: 'AAAAAA==' } }));
  await page.route('**/api/chat', (r) =>
    r.fulfill({ json: { text: 'WHY DO YOU FEEL THAT YOUR WORK IS GETTING YOU DOWN?' } }),
  );
  await page.goto(`${BASE}/?mode=${mode}`);
  return page;
}

async function classic(browser, size) {
  const page = await newPage(browser, size, 'classic');
  await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'name');
  await page.keyboard.type('ALICE');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'chat', null, { timeout: 30000 });
  await page.keyboard.type('MY WORK IS GETTING ME DOWN');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'chat', null, { timeout: 30000 });
  return page;
}

async function enhanced(browser, size) {
  const page = await newPage(browser, size, 'enhanced');
  await page.getByPlaceholder('TYPE NAME AND PRESS ENTER').fill('ALICE');
  await page.keyboard.press('Enter');
  const input = page.locator('#chat-input');
  await input.waitFor();
  await page.waitForFunction(() => !document.querySelector('#chat-input')?.disabled, null, { timeout: 30000 });
  await input.fill('My work is getting me down');
  await input.press('Enter');
  await page.waitForTimeout(500);
  await page.waitForFunction(() => !document.querySelector('#chat-input')?.disabled, null, { timeout: 30000 });
  return page;
}

await waitForServer();
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [form, size] of Object.entries(SIZES)) {
    for (const [name, open] of Object.entries({ classic, enhanced })) {
      const page = await open(browser, size);
      await page.screenshot({ path: path.join(outDir, `${name}-${form}.png`) });
      await page.close();
    }
  }
} finally {
  await browser.close();
  stop();
}
console.log('screenshots written to public/screenshots/');
