/* eslint-disable no-undef */
/**
 * P7-14 — capture the real third-party origins from the configured ad + CMP
 * build. This is the only permitted source for `config/third-party.json`.
 *
 * Usage (against a staging build with PUBLIC_ADSENSE_CLIENT and the Google CMP
 * configured in the AdSense account):
 *
 *   CAPTURE_BASE_URL=https://staging.example.com pnpm capture:third-parties
 *   CAPTURE_BASE_URL=https://staging.example.com CAPTURE_CONSENT=accept \
 *     pnpm capture:third-parties
 *
 * The CMP geolocates server-side, so the runner cannot choose a region. The
 * documented debug parameters force the message when the runner would not see
 * one. The result is written to `.tmp-audit/`; it is evidence, not a config
 * file. Classify the origins and paste them into `config/third-party.json`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { clickConsent } from './lib/consent.mjs';

const BASE = (process.env.CAPTURE_BASE_URL ?? '').replace(/\/+$/, '');
const ROUTE = process.env.CAPTURE_ROUTE ?? '/calculators/hourly-rate-calculator/';
const QUERY = process.env.CAPTURE_QUERY ?? 'fc=alwaysshow&fctype=gdpr';
const CONSENT = process.env.CAPTURE_CONSENT ?? '';
const SETTLE_MS = Number(process.env.CAPTURE_SETTLE_MS ?? '6000');

function withQuery(route) {
  if (!QUERY) return route;
  return `${route}${route.includes('?') ? '&' : '?'}${QUERY}`;
}

async function frameInventory(page) {
  const frames = [];
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    let buttons = [];
    try {
      buttons = await frame.locator('button, [role="button"]').allTextContents();
    } catch {
      /* frame detached or blocked */
    }
    frames.push({
      url: frame.url(),
      buttons: buttons
        .map((text) => text.trim())
        .filter(Boolean)
        .slice(0, 20),
    });
  }
  return frames;
}

function summarize(requests, siteOrigin) {
  const origins = [...new Set(requests.map((url) => new URL(url).origin))].sort();
  const thirdParty = origins.filter((origin) => origin !== siteOrigin);
  return {
    siteOrigin,
    origins,
    thirdParty,
    requestCount: requests.length,
  };
}

async function main() {
  if (!BASE) {
    console.error('CAPTURE_BASE_URL is required, for example https://staging.example.com');
    process.exit(2);
  }

  const url = `${BASE}${withQuery(ROUTE)}`;
  const siteOrigin = new URL(BASE).origin;
  const requests = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'en-GB' });
  const page = await context.newPage();

  page.on('request', (request) => {
    const requestUrl = request.url();
    if (/^https?:/i.test(requestUrl)) requests.push(requestUrl);
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(SETTLE_MS);

  const cold = summarize(requests, siteOrigin);
  const coldFrames = await frameInventory(page);

  let choice = { clicked: false, label: null, frame: null };
  let after = null;
  let afterFrames = [];

  if (CONSENT === 'accept' || CONSENT === 'reject') {
    const before = requests.length;
    choice = await clickConsent(page, CONSENT);
    await page.waitForTimeout(SETTLE_MS);
    after = summarize(requests.slice(before), siteOrigin);
    afterFrames = await frameInventory(page);
  }

  await browser.close();

  const capturedAt = new Date().toISOString();
  const report = {
    capturedAt,
    url,
    consentChoice: CONSENT || null,
    cold,
    coldFrames,
    choice,
    after,
    afterFrames,
  };

  await mkdir('.tmp-audit', { recursive: true });
  const file = `.tmp-audit/third-party-capture-${capturedAt.replaceAll(':', '-')}.json`;
  await writeFile(file, JSON.stringify(report, null, 2));

  console.log(`\nCaptured ${url}`);
  console.log(`cold third-party origins (${cold.thirdParty.length}):`);
  for (const origin of cold.thirdParty) console.log(`  ${origin}`);
  if (after) {
    console.log(`\nafter ${CONSENT} third-party origins (${after.thirdParty.length}):`);
    for (const origin of after.thirdParty) console.log(`  ${origin}`);
    console.log(
      `consent click: ${choice.clicked ? `"${choice.label}" in ${choice.frame}` : 'not found'}`,
    );
  }
  console.log(`\nreport: ${file}`);
  console.log(
    'Next: classify cold origins into `cmp` (loads before a choice, including the ' +
      'AdSense/Publisher CMP loader) and post-consent origins into `adStack` in ' +
      'config/third-party.json, with capturedOn set to the date above. Run P6-11b–f ' +
      'with ADS_CONSENT_E2E=1 afterwards.',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
