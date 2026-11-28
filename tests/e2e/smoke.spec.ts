import { expect, test, type Page } from '@playwright/test';
import { isAnalyticsOrigin } from '../../src/config/analytics';

/**
 * P6-12 — a small cross-browser smoke flow.
 *
 * Runs in real Chrome and Edge, plus Playwright's Firefox and WebKit engines.
 * It is deliberately short: one page from each surface (home, a calculator, a
 * generator), the core interaction on each, a layout check and the
 * third-party-request rule that gates Gate 6.
 */

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(150);
}

function collectErrors(page: Page): { console: string[]; page: string[] } {
  const errors = { console: [] as string[], page: [] as string[] };
  page.on('console', (message) => {
    if (message.type() === 'error') errors.console.push(message.text());
  });
  page.on('pageerror', (error) => errors.page.push(error.message));
  return errors;
}

test('the home page loads and links to the tools', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/', { waitUntil: 'load' });
  await settle(page);

  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Business tools for independent work',
  );
  await expect(page.getByRole('link', { name: /find your rate/i }).first()).toBeVisible();
  expect(errors.console).toEqual([]);
  expect(errors.page).toEqual([]);
});

test('a calculator accepts input and produces the expected result', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/calculators/hourly-rate-calculator/', { waitUntil: 'load' });
  await page.waitForSelector('html[data-calculator-ready]');
  await settle(page);

  await expect(page.getByText('$76.67', { exact: true })).toBeVisible();

  await page.getByLabel('Target annual income').fill('100000');
  await expect(page.getByText('$93.33', { exact: true })).toBeVisible();

  await page.getByLabel('Currency').selectOption('GBP');
  await expect(page.getByText('£93.33', { exact: true })).toBeVisible();

  expect(errors.console).toEqual([]);
  expect(errors.page).toEqual([]);
});

test('the invoice generator renders a preview with the expected totals', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/generators/invoice-generator/', { waitUntil: 'load' });
  await page.waitForSelector('html[data-generator-ready]');
  await settle(page);

  await expect(page.locator('.sheet')).toContainText('INVOICE');
  await expect(page.locator('.sheet')).toContainText('£2,299.50');

  await page.getByLabel('Unit price').first().fill('2000');
  await expect(page.locator('.sheet')).toContainText('£3,259.50');

  expect(errors.console).toEqual([]);
  expect(errors.page).toEqual([]);
});

test('the current viewport has no horizontal overflow', async ({ page }) => {
  for (const route of [
    '/',
    '/calculators/hourly-rate-calculator/',
    '/generators/invoice-generator/',
  ]) {
    await page.goto(route, { waitUntil: 'load' });
    await settle(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
  }
});

test('the home page makes no unapproved third-party request', async ({ page }) => {
  const baseURL = test.info().project.use.baseURL ?? 'http://localhost:4321';
  const siteOrigin = new URL(baseURL).origin;
  const requests: string[] = [];

  page.on('request', (request) => {
    const url = request.url();
    if (/^https?:/i.test(url)) requests.push(url);
  });

  await page.goto('/', { waitUntil: 'load' });
  await settle(page);

  expect(requests.length).toBeGreaterThan(0);

  const foreignOrigins = [
    ...new Set(
      requests
        .map((url) => new URL(url))
        .filter((url) => url.origin !== siteOrigin && !isAnalyticsOrigin(url.origin))
        .map((url) => url.origin),
    ),
  ];

  expect(foreignOrigins).toEqual([]);
});
