// Screenshot helper for the redesign checkpoints.
// Usage: node scripts/shoot.mjs <url> <out.png> [width] [height] [fullPage] [scrollY]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import process from 'node:process';
import path from 'node:path';

const [url, out, width = '1440', height = '900', full = 'true', scrollY = '0', reduced = 'false'] =
  process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node scripts/shoot.mjs <url> <out.png> [width] [height] [fullPage] [scrollY]');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(height) },
  deviceScaleFactor: 1,
  reducedMotion: reduced === 'true' ? 'reduce' : 'no-preference',
});
await page.goto(url, { waitUntil: 'networkidle' });

// The consent card is part of a first visit; the checkpoint shots show the
// page underneath after the visitor has chosen.
const essential = page.getByRole('button', { name: 'Essential only' });
if (await essential.isVisible().catch(() => false)) {
  await essential.click();
  await page.waitForTimeout(200);
}

await page.evaluate(() => document.fonts.ready);

if (full !== 'false') {
  // content-visibility keeps the first screen cheap; a capture has to turn it
  // off so a stitched full-page image is not made of skipped sections.
  await page.evaluate(() => {
    document.documentElement.dataset.cv = 'off';
  });
  await page.waitForTimeout(300);
}

if (Number(scrollY) > 0) {
  await page.evaluate((y) => window.scrollTo(0, y), Number(scrollY));
}
await page.waitForTimeout(1800);
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.screenshot({ path: out, fullPage: full !== 'false' });
console.log(`wrote ${out}`);
await browser.close();



