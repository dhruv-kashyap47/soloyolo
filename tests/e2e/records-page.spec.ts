import { test, expect } from '@playwright/test';

test.describe('the e-invoicing and records page', () => {
  test('lists every market and cites its sources', async ({ page }) => {
    await page.goto('/resources/e-invoicing-and-record-keeping/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(15);
    await expect(page.locator('tbody').getByText('1 April 2029', { exact: true })).toBeVisible();

    const external = page.locator('#sources a[href^="https://"]');
    await expect(external.first()).toBeVisible();
    const rel = await external.first().getAttribute('rel');
    expect(rel).toBe('noopener');
  });

  test('states the omissions instead of inventing a figure', async ({ page }) => {
    await page.goto('/resources/e-invoicing-and-record-keeping/');
    await expect(page.getByText(/India is not in this table/)).toBeVisible();
  });

  test('does not overflow at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/resources/e-invoicing-and-record-keeping/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
