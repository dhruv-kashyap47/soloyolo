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
import { readFile, readdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';
import { staticFileCandidates } from './lib/static-file.mjs';

const DIST = join(process.cwd(), 'dist');
const PORT = Number(process.env.CSP_PORT ?? 4331);
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
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

/** Every built HTML page, mapped to the URL the preview server serves. */
async function htmlRoutes(dir, prefix = '/') {
  const entries = await readdir(dir, { withFileTypes: true });
  const routes = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...(await htmlRoutes(path, `${prefix}${entry.name}/`)));
    } else if (entry.name === 'index.html') {
      routes.push(prefix);
    } else if (entry.name.endsWith('.html')) {
      routes.push(`${prefix}${entry.name}`);
    }
  }
  return routes;
}

async function resolveFile(pathname) {
  for (const candidate of staticFileCandidates(DIST, pathname)) {
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

  // Loopback only: this is a local verification server, not something the
  // rest of the network should be able to reach.
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  const routes = (await htmlRoutes(DIST)).sort();
  const browser = await chromium.launch({ headless: true });
  const violations = [];
  let current = '';
  let page;

  const checkRoute = async (route, label) => {
    current = `${label} ${route}`;
    const response = await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'load',
    });
    const expected = route === '/404.html' ? 404 : 200;
    if (response?.status() !== expected) {
      violations.push(`${current}: HTTP ${response?.status()} (expected ${expected})`);
    }
    await page.waitForTimeout(120);

    // Attach the report listener after parse so interactions are covered; the
    // initial parse is covered by the console listener below.
    await page.evaluate(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        window.__cspViolations.push(
          `${event.violatedDirective} ${event.blockedURI} ${event.sourceFile}:${event.lineNumber}`,
        );
      });
    });

    // Decline the consent card first: it is a real interactive state, and it
    // stops the fixed card covering the controls exercised next.
    const decline = page.locator('[data-consent-decline]');
    if (await decline.isVisible().catch(() => false)) {
      await decline.click();
      await page.waitForTimeout(80);
    }

    // Command palette: real dialog, focus trap and scroll lock.
    const paletteTrigger = page.locator('[data-open-palette]').first();
    if (await paletteTrigger.isVisible().catch(() => false)) {
      await paletteTrigger.click();
      await page.waitForTimeout(120);
      await page.keyboard.press('Escape');
    }

    // Mobile navigation sheet.
    const menuToggle = page.locator('#menu-toggle');
    if (await menuToggle.isVisible().catch(() => false)) {
      await menuToggle.click();
      await page.waitForTimeout(100);
      await page.keyboard.press('Escape');
    }

    // Generator preview tab, where the second panel exists.
    for (const name of ['Preview', 'Message']) {
      const tab = page.getByRole('button', { name, exact: true }).first();
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(100);
      }
    }

    // Print preview: the same sheet under print media.
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(60);
    await page.emulateMedia({ media: 'screen' });

    const runtime = await page.evaluate(() => window.__cspViolations ?? []);
    for (const entry of runtime) violations.push(`${current}: ${entry}`);
    console.log(`ok ${label} ${route}`);
  };

  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      page = await context.newPage();
      page.on('console', (message) => {
        if (
          message.type() === 'error' &&
          /content security policy|refused to/i.test(message.text())
        ) {
          violations.push(`${current}: console ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => violations.push(`${current}: pageerror ${error.message}`));

      for (const route of routes) await checkRoute(route, viewport.name);
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (violations.length > 0) {
    console.error(`\nCSP violations:\n- ${violations.join('\n- ')}`);
    process.exit(1);
  }
  console.log(
    `\nCSP passed on ${routes.length} routes at ${VIEWPORTS.length} viewports ` +
      `with no violations`,
  );
}

await main();
