import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/calculators/', '/calculators/hourly-rate-calculator/', '/calculators/freelance-rate-calculator/', '/calculators/project-profit-calculator/', '/calculators/markup-vs-margin-calculator/', '/calculators/payment-processing-fee-calculator/', '/calculators/vat-gst-sales-tax-calculator/', '/calculators/retainer-pricing-calculator/', '/calculators/break-even-calculator/', '/about/', '/contact/', '/privacy/', '/terms/'];

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
