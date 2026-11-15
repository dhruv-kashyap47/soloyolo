import { test, expect } from '@playwright/test';

test('homepage loads with the primary call to action', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Free business tools');
  await expect(
    page.getByRole('link', { name: /calculate your hourly rate/i }).first(),
  ).toBeVisible();

  await page
    .getByRole('link', { name: /calculate your hourly rate/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/calculators\/hourly-rate-calculator\/$/);
});

test('homepage links only to pages that exist', async ({ page }) => {
  await page.goto('/');

  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

  const unique = [...new Set(hrefs)];
  for (const href of unique) {
    const response = await page.request.get(href);
    expect(response.status(), `expected ${href} to resolve`).toBeLessThan(400);
  }
});

test('calculator index lists the live calculators', async ({ page }) => {
  await page.goto('/calculators/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Business calculators');
  await expect(page.getByRole('link', { name: /hourly rate calculator/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /freelance rate calculator/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /project profit calculator/i }).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: /markup vs margin calculator/i }).first(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /payment fee calculator/i }).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: /vat \/ gst \/ sales tax calculator/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /retainer pricing calculator/i }).first(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /break-even calculator/i }).first()).toBeVisible();
});
