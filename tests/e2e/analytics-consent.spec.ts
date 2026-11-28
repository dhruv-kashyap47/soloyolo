import { expect, test, type Page } from '@playwright/test';

const GTM_URL = /googletagmanager\.com\/gtm\.js/;
const ANALYTICS_URL = /googletagmanager\.com|google-analytics\.com/;

function track(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (ANALYTICS_URL.test(request.url())) urls.push(request.url());
  });
  return urls;
}

/**
 * GTM is fetched only after explicit analytics consent. The request is
 * fulfilled locally so the test proves the network call without depending on
 * Google being reachable.
 */
async function fakeGtm(page: Page): Promise<void> {
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '/* test container */',
    }),
  );
}

test.describe('analytics consent', () => {
  test('loads nothing before a choice, then loads GTM after accept', async ({ page }) => {
    await fakeGtm(page);
    const requests = track(page);

    await page.goto('/');
    await expect(page.locator('#consent-banner')).toBeVisible();
    await page.waitForTimeout(300);

    expect(requests.filter((url) => GTM_URL.test(url))).toEqual([]);
    await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(0);
    expect(await page.evaluate(() => 'dataLayer' in window)).toBe(false);

    const loaded = page.waitForRequest((request) => GTM_URL.test(request.url()));
    await page.getByRole('button', { name: 'Accept analytics' }).click();
    await loaded;

    await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(1);
    expect(
      await page.evaluate(() => Array.isArray((window as { dataLayer?: unknown }).dataLayer)),
    ).toBe(true);
  });

  test('keeps the accepted choice across a reload', async ({ page }) => {
    await fakeGtm(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Accept analytics' }).click();
    await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(1);

    const reloaded = page.waitForRequest((request) => GTM_URL.test(request.url()));
    await page.reload();
    await reloaded;

    await expect(page.locator('#consent-banner')).toBeHidden();
    await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(1);
  });

  test('never loads GTM after decline, including across a reload', async ({ page }) => {
    await fakeGtm(page);
    const requests = track(page);

    await page.goto('/');
    await page.getByRole('button', { name: 'Decline' }).click();
    await page.waitForTimeout(400);

    expect(requests.filter((url) => GTM_URL.test(url))).toEqual([]);
    await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(0);

    await page.reload();
    await expect(page.locator('#consent-banner')).toBeHidden();
    await page.waitForTimeout(400);

    expect(requests.filter((url) => GTM_URL.test(url))).toEqual([]);
    await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(0);
  });

  test('the footer settings control can change the choice', async ({ page }) => {
    await fakeGtm(page);
    const requests = track(page);

    await page.goto('/');
    await page.getByRole('button', { name: 'Accept analytics' }).click();
    await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(1);

    await page.getByRole('button', { name: 'Cookie settings' }).click();
    await expect(page.locator('#consent-banner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept analytics' })).toBeFocused();

    await page.getByRole('button', { name: 'Decline' }).click();
    await expect(page.locator('#consent-banner')).toBeHidden();

    await page.reload();
    await page.waitForTimeout(400);
    await expect(page.locator('#consent-banner')).toBeHidden();
    await expect(page.locator('script[src*="googletagmanager.com/gtm.js"]')).toHaveCount(0);
    expect(requests.filter((url) => GTM_URL.test(url))).toHaveLength(1);
  });
});
