/* eslint-disable no-undef */
/**
 * P7-09 — server-side uptime probe. No browser SDK, no client monitoring.
 *
 * Usage:
 *   PRODUCTION_URL=https://soloyolotools.com pnpm uptime
 *
 * Checks the five representative pages plus the crawler and policy files, and
 * asserts the security headers that Cloudflare Pages should serve. Exits 1 on
 * the first failing check after one retry, so a scheduled workflow can alert.
 */
import process from 'node:process';

const BASE = (process.env.PRODUCTION_URL ?? '').replace(/\/+$/, '');

if (!BASE) {
  console.error('PRODUCTION_URL is required, for example https://soloyolotools.com');
  process.exit(2);
}

const CHECKS = [
  {
    path: '/',
    type: 'text/html',
    markers: ['<title>', 'soloyolo', 'GTM-NJMCB9BQ', 'rel="canonical"'],
  },
  { path: '/tools/', type: 'text/html', markers: ['<title>', 'soloyolo'] },
  {
    path: '/calculators/hourly-rate-calculator/',
    type: 'text/html',
    markers: ['<title>', 'Hourly'],
  },
  {
    path: '/generators/invoice-generator/',
    type: 'text/html',
    markers: ['<title>', 'Invoice'],
  },
  { path: '/countries/', type: 'text/html', markers: ['<title>', 'soloyolo'] },
  { path: '/privacy/', type: 'text/html', markers: ['Privacy policy'] },
  { path: '/robots.txt', type: 'text/plain', markers: ['Sitemap:', '/sitemap.xml'] },
  { path: '/sitemap.xml', type: 'xml', markers: ['<urlset'] },
  { path: '/sitemap-index.xml', type: 'xml', markers: ['<sitemapindex'] },
  { path: '/ads.txt', type: 'text/plain', markers: ['google.com,'] },
];

const SECURITY_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOnce(path) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
    headers: { 'user-agent': 'soloyolo-uptime-probe/1.0' },
  });
  const body = await response.text();
  return { response, body };
}

async function check(check) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const { response, body } = await fetchOnce(check.path);
      if (response.status !== 200) {
        throw new Error(`${check.path}: HTTP ${response.status}`);
      }
      const type = response.headers.get('content-type') ?? '';
      if (!type.toLowerCase().includes(check.type)) {
        throw new Error(`${check.path}: content-type ${type || '(missing)'} != ${check.type}`);
      }
      for (const marker of check.markers) {
        if (!body.includes(marker)) throw new Error(`${check.path}: missing marker ${marker}`);
      }
      if (check.path === '/') {
        for (const header of SECURITY_HEADERS) {
          if (!response.headers.get(header)) {
            throw new Error(`/: missing security header ${header}`);
          }
        }
        const csp = response.headers.get('content-security-policy') ?? '';
        if (!csp.includes("'self'")) throw new Error('/: CSP does not include self');
        const xRobots = response.headers.get('x-robots-tag') ?? '';
        if (/noindex/i.test(xRobots)) {
          throw new Error(`/: X-Robots-Tag blocks indexing (${xRobots})`);
        }
      }
      return { ...check, status: response.status };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(2000);
    }
  }
  throw lastError;
}

const results = [];
let failed = false;

for (const checkItem of CHECKS) {
  try {
    const result = await check(checkItem);
    results.push({ path: result.path, result: `ok ${result.status}` });
  } catch (error) {
    failed = true;
    results.push({ path: checkItem.path, result: `FAIL ${error.message}` });
  }
}

for (const row of results) console.log(`${row.result.padEnd(14)} ${row.path}`);

if (failed) {
  console.error(`\nuptime probe failed for ${BASE}`);
  process.exit(1);
}

console.log(`\nuptime probe passed for ${BASE}`);
