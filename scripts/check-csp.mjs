/* eslint-disable no-undef */
/**
 * P7-03 — serve `dist/` with the generated `_headers` and prove the CSP does
 * not block the real pages.
 *
 * `astro preview` ignores `_headers`, so this small static server applies the
 * `/*` block itself. The production header includes
 * `upgrade-insecure-requests`; it is stripped for this HTTP-only local check
 * (it would try to upgrade localhost assets to HTTPS), and every other CSP
 * directive is exercised exactly as generated.
 *
 * Usage: pnpm build && pnpm check:csp
 */
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const DIST = join(process.cwd(), 'dist');
const PORT = Number(process.env.CSP_PORT ?? 4331);
const ROUTES = [
  '/',
  '/tools/',
  '/calculators/hourly-rate-calculator/',
  '/generators/invoice-generator/',
  '/countries/',
  '/privacy/',
  '/404.html',
];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function blockForAll(headersFile) {
  const lines = headersFile.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === '/*');
  if (start === -1) throw new Error('dist/_headers has no /* block');
  const headers = {};
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) break;
    const match = /^\s+([A-Za-z0-9-]+):\s*(.+)$/.exec(line);
    if (match) headers[match[1]] = match[2];
  }
  return headers;
}

async function resolveFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = [];
  if (clean.endsWith('/')) candidates.push(join(DIST, clean, 'index.html'));
  else candidates.push(join(DIST, clean), join(DIST, clean, 'index.html'));

  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      /* next candidate */
    }
  }
  return join(DIST, '404.html');
}

async function main() {
  const rawHeaders = await readFile(join(DIST, '_headers'), 'utf8');
  const headers = blockForAll(rawHeaders);
  if (headers['Content-Security-Policy']) {
    headers['Content-Security-Policy'] = headers['Content-Security-Policy']
      .replace(/;\s*upgrade-insecure-requests/gi, '')
      .replace(/upgrade-insecure-requests;\s*/gi, '');
  }
  if (!headers['Content-Security-Policy']) throw new Error('no CSP in dist/_headers');

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://localhost:${PORT}`);
      const file = await resolveFile(url.pathname);
      const status = file.endsWith('404.html') ? 404 : 200;
      response.writeHead(status, {
        ...headers,
        'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      });
      createReadStream(file).pipe(response);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end(String(error));
    }
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const violations = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /content security policy|refused to/i.test(message.text())) {
      violations.push(message.text());
    }
  });
  page.on('pageerror', (error) => violations.push(`pageerror: ${error.message}`));

  try {
    for (const route of ROUTES) {
      const response = await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: 'load',
      });
      const expected = route === '/404.html' ? 404 : 200;
      if (response?.status() !== expected) {
        violations.push(`${route}: HTTP ${response?.status()} (expected ${expected})`);
      }
      await page.waitForTimeout(300);
      console.log(`ok ${route}`);
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (violations.length > 0) {
    console.error(`\nCSP violations:\n- ${violations.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`\nCSP passed on ${ROUTES.length} routes with no violations`);
}

await main();
