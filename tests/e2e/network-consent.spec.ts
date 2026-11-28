import { expect, test, type Page } from '@playwright/test';
import { clickConsent } from '../../scripts/lib/consent.mjs';
import { isAnalyticsOrigin } from '../../src/config/analytics';
import {
  AD_STACK_ORIGINS,
  CMP_ORIGINS,
  HAS_THIRD_PARTY_CAPTURE,
} from '../../src/config/third-party';

/**
 * P6-11b–f — the consent-state network contract.
 *
 * This runs only against a staging build that has `PUBLIC_ADSENSE_CLIENT` set
 * and the Google-certified CMP configured account-side, and only after P7-14
 * has filled `config/third-party.json` from a real capture. Locally it skips,
 * because inventing an allowlist would test a fiction.
 *
 *   STAGING_URL=https://staging.example.com ADS_CONSENT_E2E=1 pnpm test:e2e
 *
 * The CMP geolocates server-side, so the documented debug parameters force a
 * message when the runner's region would not show one. Origins are collected
 * with `page.on('request')`; `networkidle` is deliberately not used because
 * AdSense polling makes it flaky.
 */
const STAGING = (process.env.STAGING_URL ?? '').replace(/\/+$/, '');
const ROUTE = process.env.CAPTURE_ROUTE ?? '/calculators/hourly-rate-calculator/';
const QUERY = process.env.CAPTURE_QUERY ?? 'fc=alwaysshow&fctype=gdpr';
const RUN = process.env.ADS_CONSENT_E2E === '1';
const SETTLE_MS = Number(process.env.CAPTURE_SETTLE_MS ?? '6000');

const siteOrigin = STAGING ? new URL(STAGING).origin : '';

function url() {
  const target = `${STAGING}${ROUTE}`;
  if (!QUERY) return target;
  return `${target}${target.includes('?') ? '&' : '?'}${QUERY}`;
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(SETTLE_MS);
}

function collect(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    const requestUrl = request.url();
    if (/^https?:/i.test(requestUrl)) urls.push(requestUrl);
  });
  return urls;
}

function origins(urls: string[]): string[] {
  return [...new Set(urls.map((entry) => new URL(entry).origin))];
}

function disallowed(urls: string[], allowed: readonly string[]): string[] {
  return origins(urls).filter(
    (origin) => origin !== siteOrigin && !allowed.includes(origin) && !isAnalyticsOrigin(origin),
  );
}

function onlyAllowed(urls: string[], allowed: readonly string[]): string[] {
  return origins(urls).filter((origin) => allowed.includes(origin));
}

test.describe('P6-11b–f consent-state network contract', () => {
  test.skip(
    !RUN || !STAGING || !HAS_THIRD_PARTY_CAPTURE,
    'needs STAGING_URL, ADS_CONSENT_E2E=1 and the P7-14 capture in config/third-party.json',
  );

  test('P6-11b cold load requests only the site and the CMP allowlist', async ({ page }) => {
    const requests = collect(page);
    await page.goto(url(), { waitUntil: 'load' });
    await settle(page);

    expect(requests.length, 'no requests observed').toBeGreaterThan(0);
    expect(disallowed(requests, CMP_ORIGINS), 'origins outside the CMP allowlist').toEqual([]);
  });

  test('P6-11c reject / Essential only loads no ad origin', async ({ page }) => {
    const requests = collect(page);
    await page.goto(url(), { waitUntil: 'load' });
    await settle(page);

    const choice = await clickConsent(page, 'reject');
    expect(choice.clicked, 'CMP reject button was found and clicked').toBe(true);
    await settle(page);

    expect(disallowed(requests, CMP_ORIGINS)).toEqual([]);
    expect(onlyAllowed(requests, AD_STACK_ORIGINS), 'ad origins after reject').toEqual([]);
  });

  test('P6-11d accept all loads only the CMP plus ad-stack allowlist', async ({ page }) => {
    const requests = collect(page);
    await page.goto(url(), { waitUntil: 'load' });
    await settle(page);

    const choice = await clickConsent(page, 'accept');
    expect(choice.clicked, 'CMP accept button was found and clicked').toBe(true);
    await settle(page);

    expect(disallowed(requests, [...CMP_ORIGINS, ...AD_STACK_ORIGINS])).toEqual([]);
  });

  test('P6-11e a blocked CMP loads no ad origin', async ({ page }) => {
    await page.route(
      (target) => CMP_ORIGINS.includes(target.origin),
      (route) => route.abort(),
    );

    const requests = collect(page);
    await page.goto(url(), { waitUntil: 'load' });
    await settle(page);

    expect(onlyAllowed(requests, AD_STACK_ORIGINS), 'ad origins with the CMP blocked').toEqual([]);
  });

  test('P6-11f no Cloudflare beacon in any consent state', async ({ page }) => {
    const requests = collect(page);
    await page.goto(url(), { waitUntil: 'load' });
    await settle(page);

    const beacon = requests.filter((entry) =>
      /cloudflareinsights\.com|static\.cloudflareinsights/i.test(entry),
    );
    expect(beacon, 'Cloudflare Web Analytics beacon request').toEqual([]);

    const choice = await clickConsent(page, 'accept');
    if (choice.clicked) await settle(page);

    const after = requests.filter((entry) =>
      /cloudflareinsights\.com|static\.cloudflareinsights/i.test(entry),
    );
    expect(after, 'Cloudflare Web Analytics beacon request after consent').toEqual([]);
  });
});
