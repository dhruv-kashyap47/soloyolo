/**
 * P7-03 — generate `dist/_headers` from the real inline scripts and the P7-14
 * third-party allowlist.
 *
 * Cloudflare Pages serves this file as response headers. Hashing the inline
 * scripts at build time lets the CSP stay strict: no `'unsafe-inline'` in
 * `script-src`, and the only cross-origin hosts are the captured CMP/ad
 * origins (empty until P7-14).
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { buildCsp, inlineScriptHashes, renderHeaders } from './lib/csp.mjs';

const DIST = 'dist';
const ALLOWLIST = 'config/third-party.json';

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

export async function buildHeaders({
  dist = DIST,
  allowlistPath = ALLOWLIST,
  log = console.log,
} = {}) {
  const allowlist = JSON.parse(await readFile(allowlistPath, 'utf8'));
  const origins = [...(allowlist.cmp ?? []), ...(allowlist.adStack ?? [])];

  const files = await htmlFiles(dist);
  if (files.length === 0) throw new Error(`no HTML files in ${dist}: run astro build first`);

  const hashes = new Set();
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    for (const hash of inlineScriptHashes(html)) hashes.add(hash);
  }

  const csp = buildCsp({ scriptHashes: [...hashes], origins });
  const headers = renderHeaders({ csp });
  await writeFile(join(dist, '_headers'), headers, 'utf8');

  log(
    `headers: ${files.length} pages, ${hashes.size} inline-script hashes, ` +
      `${origins.length} captured third-party origins -> ${join(dist, '_headers')}`,
  );
  return { csp, hashes: [...hashes], origins };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildHeaders();
}
