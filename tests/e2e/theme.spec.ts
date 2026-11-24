import { test, expect, type Page } from '@playwright/test';

/**
 * The colour theme (D-1, shipped with the light "paper" theme).
 *
 * Dark stays the default; Auto follows the OS; an explicit choice is remembered
 * in localStorage and resolved in the head before first paint.
 */

async function clearConsent(page: Page) {
  const essential = page.locator('[data-consent="essential"]');
  if (await essential.isVisible().catch(() => false)) {
    await essential.click();
  }
}

test.describe('the colour theme', () => {
  test('auto follows the system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'auto');
    await expect(page.locator('.theme-switch [data-theme-choice="auto"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('a chosen theme survives a reload', async ({ page }) => {
    await page.goto('/about/');
    await clearConsent(page);

    await page.locator('.theme-switch [data-theme-choice="light"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('.theme-switch [data-theme-choice="light"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('.theme-switch [data-theme-choice="dark"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('the header toggle switches the theme and syncs the footer', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('soloyolo-theme', 'dark'));
    await page.reload();
    await clearConsent(page);

    const width = page.viewportSize()?.width ?? 1280;
    if (width < 768) {
      await page.locator('#menu-toggle').click();
      await page.locator('.theme-cycle-row').click();
    } else {
      await page.locator('.theme-cycle:not(.theme-cycle-row)').click();
    }

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('.theme-switch [data-theme-choice="light"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('an explicit dark choice ignores a light system preference', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('soloyolo-theme', 'dark'));
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/about/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Deep ink, not pure black: the night canvas still has card edges.
    expect(background).toBe('rgb(11, 12, 18)');
  });
});
