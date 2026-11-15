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

test('calculator index lists the live calculator', async ({ page }) => {
  await page.goto('/calculators/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Business calculators');
  await expect(page.getByRole('link', { name: /hourly rate calculator/i }).first()).toBeVisible();
});
