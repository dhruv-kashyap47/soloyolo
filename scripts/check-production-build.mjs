/**
 * P7-02 / P7-03 / P7-04 — production-build assertions.
 *
 * Run with `PUBLIC_SITE_URL` set (the deploy workflow does). It proves the
 * artifact in `dist/` is the production shape before it is uploaded: every
 * sitemap and canonical URL uses the production origin, robots points at the
 * sitemap, the Pages control files exist, and `ads.txt` matches the configured
 * publisher id (or is explicitly still the placeholder).
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DIST = 'dist';

function normalizeSite(value) {
  return value.replace(/\/+$/, '');
}

async function exists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function xmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await xmlFiles(path)));
    else if (entry.name.endsWith('.xml')) files.push(path);
  }
  return files;
}

export async function checkProductionBuild({
  dist = DIST,
  siteUrl = process.env.PUBLIC_SITE_URL,
  adsenseClient = process.env.PUBLIC_ADSENSE_CLIENT ?? '',
  log = console.log,
} = {}) {
  if (!siteUrl) {
    throw new Error('PUBLIC_SITE_URL is required for the production check');
  }

  const site = normalizeSite(siteUrl);
  const problems = [];
  const warnings = [];

  for (const file of await xmlFiles(dist)) {
    const xml = await readFile(file, 'utf8');
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const loc = match[1];
      if (!loc.startsWith(`${site}/`)) problems.push(`${file}: loc outside the site URL: ${loc}`);
    }
  }

  const home = await readFile(join(dist, 'index.html'), 'utf8');
  if (!home.includes(`rel="canonical" href="${site}/"`)) {
    problems.push(`dist/index.html: canonical is not ${site}/`);
  }
  if (/https?:\/\/(localhost|127\.0\.0\.1)/i.test(home)) {
    problems.push('dist/index.html: localhost URL in the production HTML');
  }

  const robots = await readFile(join(dist, 'robots.txt'), 'utf8');
  if (!robots.includes(`Sitemap: ${site}/sitemap-index.xml`)) {
    problems.push(`robots.txt: missing Sitemap: ${site}/sitemap-index.xml`);
  }

  if (!(await exists(join(dist, '_headers')))) problems.push('dist/_headers is missing');
  if (!(await exists(join(dist, '_redirects')))) problems.push('dist/_redirects is missing');

  const ads = await readFile(join(dist, 'ads.txt'), 'utf8');
  const publisher = /google\.com,\s*(pub-\d{16}),\s*DIRECT/i.exec(ads);
  if (!publisher) {
    problems.push('ads.txt: no google.com publisher line');
  } else if (adsenseClient) {
    const expected = /pub-\d{16}/i.exec(adsenseClient)?.[0];
    if (!expected) problems.push('PUBLIC_ADSENSE_CLIENT does not contain a pub-… id');
    else if (publisher[1].toLowerCase() !== expected.toLowerCase()) {
      problems.push(`ads.txt ${publisher[1]} does not match ${expected}`);
    }
  } else if (publisher[1] === 'pub-0000000000000000') {
    warnings.push('ads.txt still has the placeholder publisher id (ads are off)');
  }

  if (problems.length > 0) {
    throw new Error(`production build is not shippable:\n- ${problems.join('\n- ')}`);
  }

  for (const warning of warnings) log(`warning: ${warning}`);
  log(`production: ${site} — sitemap, canonical, robots, headers, redirects and ads.txt agree`);
  return { site, warnings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkProductionBuild();
}
