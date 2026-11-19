import { test, expect } from '@playwright/test';

test.describe('layout regressions', () => {
  test('prints the home tiles without hidden sections', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print' });

    const opacities = await page
      .locator('.tk-link')
      .evaluateAll((cards) => cards.map((card) => getComputedStyle(card).opacity));

    expect(opacities.length).toBe(12);
    expect(opacities.every((opacity) => opacity === '1')).toBe(true);

    // The toolkit skips offscreen rendering on screen; print must undo that so
    // every tool reaches the paper.
    const visibility = await page
      .locator('.toolkit-section')
      .evaluate((section) => getComputedStyle(section).contentVisibility);
    expect(visibility).toBe('visible');
  });

  test('pins the result panel below the fixed header, never under it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/calculators/hourly-rate-calculator/');
    await page.waitForSelector('html[data-calculator-ready]');

    const offsets = await page.evaluate(() => {
      const panel = document.querySelector('[aria-labelledby="result-heading"]')?.parentElement;
      const header = document.querySelector<HTMLElement>('header.nav');
      if (!panel || !header) throw new Error('panel or header missing');
      return {
        stickyTop: Number.parseFloat(getComputedStyle(panel).top),
        headerHeight: header.getBoundingClientRect().height,
        naturalTop: panel.getBoundingClientRect().top,
      };
    });

    expect(offsets.stickyTop).toBeGreaterThanOrEqual(offsets.headerHeight);

    // Scroll just past the moment the panel pins, then measure where it sits.
    await page.evaluate(
      (y) => window.scrollTo(0, y),
      Math.round(offsets.naturalTop - offsets.stickyTop + 20),
    );
    await page.waitForTimeout(150);

    const gap = await page.evaluate(() => {
      const panel = document.querySelector('[aria-labelledby="result-heading"]')?.parentElement;
      const header = document.querySelector<HTMLElement>('header.nav');
      if (!panel || !header) throw new Error('panel or header missing');
      return panel.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
    });

    expect(gap).toBeGreaterThanOrEqual(0);
  });

  test('closes the mobile menu when the viewport reaches the desktop nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.setViewportSize({ width: 1280, height: 800 });

    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(await page.evaluate(() => document.getElementById('mobile-menu')?.hidden)).toBe(true);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the homepage renders its cards and content', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Business tools for independent work',
    );
    await expect(page.getByRole('link', { name: /find your rate/i }).first()).toBeVisible();

    const opacities = await page
      .locator('.tk-link')
      .evaluateAll((cards) => cards.map((card) => getComputedStyle(card).opacity));
    expect(opacities.length).toBe(12);
    expect(opacities.every((opacity) => opacity === '1')).toBe(true);
  });

  test('the calculator shows its worked example result', async ({ page }) => {
    await page.goto('/calculators/hourly-rate-calculator/');

    await expect(page.getByText('$76.67', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Target annual income')).toHaveValue('80,000');
  });
});
