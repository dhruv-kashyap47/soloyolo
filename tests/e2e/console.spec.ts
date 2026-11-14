import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/calculators/', '/calculators/hourly-rate-calculator/'];

for (const route of ROUTES) {
  test(`${route} loads without console or page errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(route, { waitUntil: 'networkidle' });

    expect(consoleErrors, `console errors on ${route}`).toEqual([]);
    expect(pageErrors, `page errors on ${route}`).toEqual([]);
  });
}
