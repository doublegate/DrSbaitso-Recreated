/**
 * The production Content-Security-Policy (vercel.json) must not break the app.
 * The preview server sends no headers, so the policy is attached to the
 * document here and every violation the browser reports fails the test.
 */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { mockApi, send, startEnhanced } from './fixtures';

const vercel = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../vercel.json'), 'utf8')) as {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};
const CSP = vercel.headers
  .find((h) => h.source === '/(.*)')!
  .headers.find((h) => h.key === 'Content-Security-Policy')!.value;

async function enforceCsp(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeFunction('reportCspViolation', (v: string) => violations.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { reportCspViolation: (v: string) => void }).reportCspViolation(
        `${e.violatedDirective} blocked ${e.blockedURI || '(inline)'}`,
      );
    });
  });
  // `upgrade-insecure-requests` would rewrite the http://localhost preview to https.
  const policy = CSP.replace(/;\s*upgrade-insecure-requests/, '');
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const response = await route.fetch();
    return route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': policy } });
  });
  return violations;
}

test('the production CSP reports no violations across both screens', async ({ page }) => {
  const violations = await enforceCsp(page);
  await mockApi(page, 'WHY DO YOU FEEL THAT WAY?');

  await startEnhanced(page);
  await send(page, 'I feel sad');
  await page.getByRole('button', { name: 'VISUALS', exact: true }).click();
  await page.getByRole('button', { name: /Topic diagram/ }).click();
  await expect(page.getByText('Topic Flow Diagram')).toBeVisible();
  await page.getByRole('button', { name: 'CLASSIC', exact: true }).click();
  await expect(page.getByText('version 2.20')).toBeVisible();

  expect(violations).toEqual([]);
});
