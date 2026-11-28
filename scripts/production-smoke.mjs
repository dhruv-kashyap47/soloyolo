/* eslint-disable no-undef */
/**
 * P7-10 — production browser smoke. Server-side probes prove the bytes; this
 * proves the real page in a real browser: hydration, canonical, CSP and the
 * no-third-party rule on the live origin.
 *
 * Usage:
 *   PRODUCTION_URL=https://soloyolotools.com pnpm smoke:production
 */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { chromium } from '@playwright/test';

const BASE = (process.env.PRODUCTION_URL ?? 'https://soloyolotools.com').replace(/\/+$/, '');
const WWW = BASE.includes('://www.') ? BASE : BASE.replace('://', '://www.');
const ROUTES = [
  '/',
  '/calculators/hourly-rate-calculator/',
  '/generators/invoice-generator/',
  '/contact/',
  '/privacy/',
];

const analytics = JSON.parse(await readFile('config/analytics.json', 'utf8'));

function isAnalyticsOrigin(origin) {
  const host = new URL(origin).hostname;
  return (
    host === 'www.googletagmanager.com' ||
    host === 'www.google-analytics.com' ||
    host.endsWith('.google-analytics.com')
  );
}

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

  const xRobots = response?.headers()['x-robots-tag'] ?? '';
  if (/noindex/i.test(xRobots)) failures.push(`${route}: X-Robots-Tag ${xRobots}`);

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  const expected = `${BASE}${route}`;
  if (canonical !== expected) failures.push(`${route}: canonical ${canonical} != ${expected}`);

  // A fresh browser context has no analytics consent, so the tag must not be
  // requested and must not have created a dataLayer. The hashed bootstrap and
  // the approved container id are still in the HTML.
  const gtmCount = await page.locator('script[src*="googletagmanager.com/gtm.js"]').count();
  if (gtmCount !== 0) failures.push(`${route}: Google tag requested before consent (${gtmCount})`);
  if (await page.evaluate(() => 'dataLayer' in window)) {
    failures.push(`${route}: dataLayer created before consent`);
  }
  if (!(await page.content()).includes(analytics.googleTagId)) {
    failures.push(`${route}: Google tag id ${analytics.googleTagId} missing`);
  }

  const foreign = [
    ...new Set(
      requests
        .map((url) => new URL(url))
        .filter((url) => url.origin !== BASE && !isAnalyticsOrigin(url.origin))
        .map((url) => url.origin),
    ),
  ];
  if (foreign.length > 0) failures.push(`${route}: unapproved third-party ${foreign.join(', ')}`);

  const csp = errors.filter((text) => /content security policy|refused to/i.test(text));
  if (csp.length > 0) failures.push(`${route}: CSP ${csp[0]}`);
  if (errors.length > 0) failures.push(`${route}: console ${errors[0]}`);

  console.log(
    `ok ${route} — ${requests.length} requests, ${foreign.length} unapproved third-party, canonical ${canonical}`,
  );
}

for (const path of ['/robots.txt', '/sitemap.xml']) {
  const response = await page.request.get(`${BASE}${path}`);
  if (response.status() !== 200) failures.push(`${path}: HTTP ${response.status()}`);
}

const wwwResponse = await fetch(`${WWW}/`, { redirect: 'manual' });
const wwwRobots = wwwResponse.headers.get('x-robots-tag') ?? '';
if (/noindex/i.test(wwwRobots)) failures.push(`www: X-Robots-Tag ${wwwRobots}`);

await browser.close();

if (failures.length > 0) {
  console.error(`\nProduction smoke failures:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nProduction smoke passed for ${BASE}`);
