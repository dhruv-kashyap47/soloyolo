import { expect, test, type Page } from '@playwright/test';
import { isAnalyticsOrigin } from '../../src/config/analytics';
import { ROUTES } from './routes';

/**
 * Every request must stay on the site origin except the approved Google tag
 * hosts from `config/analytics.json`. No AdSense or CMP is loaded unless the
 * ad build is configured.
 *
 * P6-11b–f need a second build with `PUBLIC_ADSENSE_CLIENT` set and a
 * configured CMP account, so they are not here yet (task.md).
 */
for (const route of ROUTES) {
  test(`${route} makes no unapproved third-party request`, async ({ page }) => {
    const baseURL = test.info().project.use.baseURL ?? 'http://localhost:4321';
    const siteOrigin = new URL(baseURL).origin;
    const requests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (/^https?:/i.test(url)) requests.push(url);
    });

    // `load` plus a real settle. `networkidle` is avoided deliberately: it is
    // flaky once the ad stack polls, and P6-11b–f will reuse this pattern.
    await page.goto(route, { waitUntil: 'load' });
    await settle(page);

    // Guard against a vacuous pass if the listener ever stops firing.
    expect(requests.length, `no requests observed on ${route}`).toBeGreaterThan(0);

    const foreignOrigins = [
      ...new Set(
        requests
          .map((url) => new URL(url))
          .filter((url) => url.origin !== siteOrigin && !isAnalyticsOrigin(url.origin))
          .map((url) => url.origin),
      ),
    ];

    expect(foreignOrigins, `third-party origins requested by ${route}`).toEqual([]);
  });
}

/** Wait until fonts are done and the page has had a beat to fire late requests. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(150);
}
