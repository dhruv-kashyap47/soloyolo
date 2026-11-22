import { test, expect } from '@playwright/test';

test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);

  const body = await response.text();
  expect(body).toContain('User-agent: *');
  expect(body).toContain('Sitemap: https://');
  expect(body).toContain('/sitemap-index.xml');
});

test('sitemap index and child sitemap are reachable', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  expect(await index.text()).toContain('/sitemap-0.xml');

  const child = await request.get('/sitemap-0.xml');
  expect(child.status()).toBe(200);

  const body = await child.text();
  expect(body).toContain('/calculators/hourly-rate-calculator/');
  expect(body).toContain('/calculators/freelance-rate-calculator/');
  expect(body).toContain('/calculators/project-profit-calculator/');
  expect(body).toContain('/calculators/markup-vs-margin-calculator/');
  expect(body).toContain('/calculators/payment-processing-fee-calculator/');
  expect(body).toContain('/calculators/vat-gst-sales-tax-calculator/');
  expect(body).toContain('/calculators/retainer-pricing-calculator/');
  expect(body).toContain('/calculators/break-even-calculator/');
  expect(body).toContain('/calculators/');
  expect(body).toContain('/countries/');
  expect(body).toContain('/uk/vat-invoice-generator/');
  expect(body).toContain('/au/tax-invoice-generator/');
  expect(body).toContain('/de/vat-invoice-generator/');
  expect(body).toContain('/ch/vat-invoice-generator/');
  expect(body).toContain('/in/gst-invoice-generator/');
  expect(body).toContain('/ae/vat-invoice-generator/');
  expect(body).toContain('/tools/');
  expect(body).toContain('/resources/');
  expect(body).toContain('/disclaimer/');
});

test('calculator page exposes canonical, OG and structured data', async ({ page }) => {
  await page.goto('/calculators/hourly-rate-calculator/');

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toMatch(/\/calculators\/hourly-rate-calculator\/$/);

  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Hourly Rate/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);

  const types = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) =>
      scripts.map((script) => JSON.parse(script.textContent ?? '{}')['@type']),
    );

  expect(types).toContain('WebApplication');
  expect(types).toContain('FAQPage');
  expect(types).toContain('BreadcrumbList');
});

test('404 page is excluded from indexing', async ({ page }) => {
  await page.goto('/does-not-exist/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('pages use trailing-slash URLs consistently', async ({ page, request }) => {
  const response = await request.get('/calculators', { maxRedirects: 0 });
  if (response.status() === 301 || response.status() === 308) {
    await page.goto('/calculators');
    expect(new URL(page.url()).pathname).toBe('/calculators/');
  }
});
