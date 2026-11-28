/**
 * P7-03 — preview artifact check.
 *
 * Previews are built with `PUBLIC_SITE_URL` pointing at the `*.pages.dev` host
 * itself, which is the one artifact the production check never sees: the same
 * URL drives both the canonical origin and the indexable host rules. This
 * asserts that such a build keeps the pages.dev aliases out of search results
 * and never asserts `index, follow` on them.
 *
 * Run after `pnpm build` with the preview `PUBLIC_SITE_URL`:
 *   PUBLIC_SITE_URL=https://soloyolo.pages.dev pnpm check:preview-headers
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { checkHeaders } from './lib/headers.mjs';

const siteUrl = process.env.PUBLIC_SITE_URL;
if (!siteUrl) {
  throw new Error('PUBLIC_SITE_URL is required for the preview headers check');
}

let headers;
try {
  headers = await readFile(join('dist', '_headers'), 'utf8');
} catch {
  throw new Error('dist/_headers is missing: run `pnpm build` with the preview PUBLIC_SITE_URL');
}

const problems = checkHeaders({ headers, siteUrl });
if (problems.length > 0) {
  throw new Error(`preview headers are not shippable:\n- ${problems.join('\n- ')}`);
}

console.log(`preview headers: ${siteUrl} stays noindex on every *.pages.dev alias`);
