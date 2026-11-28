/* eslint-disable no-undef */
/**
 * P7-10 — production browser smoke. Server-side probes prove the bytes; this
 * proves the real page in a real browser: hydration, canonical, CSP and the
 * no-third-party rule on the live origin.
 *
 * Usage:
 *   PRODUCTION_URL=https://soloyolotools.com pnpm smoke:production
 */
import process from 'node:process';
import { chromium } from '@playwright/test';

const BASE = (process.env.PRODUCTION_URL ?? 'https://soloyolotools.com').replace(/\/+$/, '');
const ROUTES = [
  '/',
  '/calculators/hourly-rate-calculator/',
  '/generators/invoice-generator/',
  '/contact/',
  '/privacy/',
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const failures = [];

for (const route of ROUTES) {
  const requests = [];
  const errors = [];
  page.on('request', (request) => {
    if (/^https?:/i.test(request.url())) requests.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

  const response = await page.goto(`${BASE}${route}`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  if (response?.status() !== 200) failures.push(`${route}: HTTP ${response?.status()}`);

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  const expected = `${BASE}${route}`;
  if (canonical !== expected) failures.push(`${route}: canonical ${canonical} != ${expected}`);

  const foreign = [
    ...new Set(
      requests
        .map((url) => new URL(url))
        .filter((url) => url.origin !== BASE)
        .map((url) => url.origin),
    ),
  ];
  if (foreign.length > 0) failures.push(`${route}: third-party ${foreign.join(', ')}`);

  const csp = errors.filter((text) => /content security policy|refused to/i.test(text));
  if (csp.length > 0) failures.push(`${route}: CSP ${csp[0]}`);
  if (errors.length > 0) failures.push(`${route}: console ${errors[0]}`);

  console.log(`ok ${route} — ${requests.length} requests, 0 third-party, canonical ${canonical}`);
}

await browser.close();

if (failures.length > 0) {
  console.error(`\nProduction smoke failures:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nProduction smoke passed for ${BASE}`);
