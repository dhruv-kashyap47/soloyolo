/* eslint-disable no-undef */
// Throttled mobile lab measurement: LCP, CLS and long-task/TBT proxy.
// Usage: node scripts/perf.mjs [baseUrl]
import { chromium } from '@playwright/test';
import process from 'node:process';

const base = process.argv[2] ?? 'http://localhost:4321';
const routes = [
  '/',
  '/calculators/hourly-rate-calculator/',
  '/generators/invoice-generator/',
  '/uk/vat-invoice-generator/',
  '/countries/',
];

const browser = await chromium.launch();
const results = [];

for (const route of routes) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.addInitScript(() => {
    window.__perf = { lcp: 0, cls: 0, tbt: 0, shifts: [] };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perf.lcp = Math.max(window.__perf.lcp, entry.startTime);
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__perf.cls += entry.value;
        window.__perf.shifts.push({ value: entry.value, start: entry.startTime });
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perf.tbt += Math.max(0, entry.duration - 50);
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(6000);

  const data = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      ...window.__perf,
      dcl: nav?.domContentLoadedEventEnd ?? 0,
      load: nav?.loadEventEnd ?? 0,
      transfer: performance.getEntriesByType('resource').reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
    };
  });

  results.push({
    route,
    lcp: Math.round(data.lcp),
    cls: Number(data.cls.toFixed(5)),
    tbt: Math.round(data.tbt),
    dcl: Math.round(data.dcl),
    load: Math.round(data.load),
    transferKB: Math.round(data.transfer / 1024),
    shifts: data.shifts.slice(0, 4),
  });

  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

