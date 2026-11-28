/**
 * P7-06 / D-20 — the launch build may not ship a measurement SDK or beacon.
 *
 * Measurement is Search Console plus AdSense reporting only. This scan runs
 * after every build so a future import of GA, Cloudflare Web Analytics, Vercel
 * Analytics, Segment, PostHog, Matomo, Umami or Clarity fails the build.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DIST = 'dist';

const FORBIDDEN = [
  ['Cloudflare Web Analytics', /cloudflareinsights\.com|static\.cloudflareinsights/i],
  ['Google Analytics / gtag.js', /googletagmanager\.com|google-analytics\.com|gtag\/js/i],
  ['Vercel Analytics', /vercel-insights|_vercel\/insights/i],
  ['Segment', /cdn\.segment\.com|api\.segment\.io/i],
  ['PostHog', /posthog\.com|posthog-js/i],
  ['Plausible', /plausible\.io/i],
  ['Matomo / Piwik', /matomo\.(js|cloud)|piwik\.pro/i],
  ['Umami', /umami\.is|umami\.js/i],
  ['Microsoft Clarity', /clarity\.ms/i],
  ['Hotjar', /static\.hotjar\.com/i],
];

const TEXT = /\.(html|js|mjs|css|json|xml|txt|webmanifest)$/i;

async function textFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await textFiles(path)));
    else if (TEXT.test(entry.name)) files.push(path);
  }
  return files;
}

export async function checkNoBeacon({ dist = DIST, log = console.log } = {}) {
  const problems = [];
  const files = await textFiles(dist);

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const [label, pattern] of FORBIDDEN) {
      if (pattern.test(content)) problems.push(`${label} referenced in ${file}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`measurement SDK found in the launch build:\n- ${problems.join('\n- ')}`);
  }

  log(`measurement: ${files.length} build files, 0 SDK/beacon references`);
  return files.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkNoBeacon();
}
