/* eslint-disable no-undef */
/**
 * P6-07 / D-24 — the no-ad Lighthouse baseline.
 *
 * Runs the production build through Lighthouse on the representative routes.
 * Mobile is the median of three runs; desktop is one confirmatory run. Reports
 * and a summary stay in `.lighthouse/`.
 *
 * Usage: pnpm perf:lighthouse
 */
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import process from 'node:process';

const require = createRequire(import.meta.url);
const lighthouseCli = require.resolve('lighthouse/cli/index.js');
const astroCli = join(dirname(require.resolve('astro/package.json')), 'bin/astro.mjs');

const REMOTE = process.env.LIGHTHOUSE_URL ?? '';
const BASE = (REMOTE || 'http://localhost:4321').replace(/\/+$/, '');
const ROUTES = (
  process.env.LIGHTHOUSE_ROUTES?.split(',').map((route) => route.trim()) ?? [
    '/',
    '/tools/',
    '/calculators/hourly-rate-calculator/',
    '/generators/invoice-generator/',
    '/countries/',
  ]
).filter(Boolean);
// P7-18 measures the ad-enabled build on throttled mobile as the median of at
// least five runs. The no-ad baseline keeps three.
const MOBILE_RUNS = Number(process.env.LIGHTHOUSE_MOBILE_RUNS ?? 3);
const MIN_PERF = process.env.LIGHTHOUSE_MIN_PERF
  ? Number(process.env.LIGHTHOUSE_MIN_PERF)
  : null;
const PRESETS = [
  { name: 'mobile', runs: MOBILE_RUNS, args: [] },
  { name: 'desktop', runs: 1, args: ['--preset=desktop'] },
];

const slug = (route) => (route === '/' ? 'home' : route.replaceAll('/', '-').replace(/^-|-$/g, ''));

async function waitForServer(timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(BASE, { redirect: 'follow' });
      if (response.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  throw new Error(`preview server did not start on ${BASE}`);
}

function runLighthouse(url, outputPath, extraArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        lighthouseCli,
        url,
        '--quiet',
        '--output=json',
        `--output-path=${outputPath}`,
        '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
        '--only-categories=performance,accessibility,best-practices,seo',
        ...extraArgs,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`lighthouse exited ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function pick(report) {
  return {
    performance: Math.round((report.categories.performance.score ?? 0) * 100),
    accessibility: Math.round((report.categories.accessibility.score ?? 0) * 100),
    bestPractices: Math.round((report.categories['best-practices'].score ?? 0) * 100),
    seo: Math.round((report.categories.seo.score ?? 0) * 100),
    lcp: report.audits['largest-contentful-paint'].numericValue ?? 0,
    tbt: report.audits['total-blocking-time'].numericValue ?? 0,
    cls: report.audits['cumulative-layout-shift'].numericValue ?? 0,
    transfer: report.audits['total-byte-weight']?.numericValue ?? 0,
  };
}

async function main() {
  await mkdir('.lighthouse', { recursive: true });

  // A remote URL is measured as-is (P7-18 production). A local run builds and
  // serves the preview exactly like the Phase 6 baseline.
  const preview = REMOTE
    ? null
    : spawn(process.execPath, [astroCli, 'preview', '--port', '4321'], {
        stdio: 'ignore',
      });

  const results = [];
  try {
    await waitForServer();

    for (const preset of PRESETS) {
      for (const route of ROUTES) {
        const runs = [];
        for (let run = 1; run <= preset.runs; run += 1) {
          const outputPath = `.lighthouse/${preset.name}-${slug(route)}-run${run}.json`;
          process.stdout.write(`${preset.name} ${route} run ${run}/${preset.runs}…\n`);
          await runLighthouse(`${BASE}${route}`, outputPath, preset.args);
          const report = JSON.parse(await readFile(outputPath, 'utf8'));
          runs.push(pick(report));
        }

        results.push({
          preset: preset.name,
          route,
          runs,
          median: {
            performance: median(runs.map((run) => run.performance)),
            accessibility: median(runs.map((run) => run.accessibility)),
            bestPractices: median(runs.map((run) => run.bestPractices)),
            seo: median(runs.map((run) => run.seo)),
            lcp: median(runs.map((run) => run.lcp)),
            tbt: median(runs.map((run) => run.tbt)),
            cls: median(runs.map((run) => run.cls)),
            transfer: median(runs.map((run) => run.transfer)),
          },
        });
      }
    }
  } finally {
    preview?.kill();
  }

  const summaryPath = `.lighthouse/summary-${new Date().toISOString().replaceAll(':', '-')}.json`;
  await writeFile(summaryPath, JSON.stringify(results, null, 2));

  const rows = results.map((entry) => ({
    route: entry.route,
    preset: entry.preset,
    perf: entry.median.performance,
    a11y: entry.median.accessibility,
    bp: entry.median.bestPractices,
    seo: entry.median.seo,
    lcp: Math.round(entry.median.lcp),
    tbt: Math.round(entry.median.tbt),
    cls: Number(entry.median.cls.toFixed(4)),
    transferKB: Math.round(entry.median.transfer / 1024),
  }));

  console.table(rows);
  process.stdout.write(`\nsummary: ${summaryPath}\n`);

  if (MIN_PERF !== null) {
    const below = rows.filter((row) => row.perf < MIN_PERF);
    if (below.length > 0) {
      console.error(
        `\nP7-18 threshold ${MIN_PERF} missed:\n` +
          below.map((row) => `- ${row.preset} ${row.route}: ${row.perf}`).join('\n'),
      );
      process.exitCode = 1;
    } else {
      process.stdout.write(`P7-18 threshold ${MIN_PERF} met on every route and preset\n`);
    }
  }
}

await main();
