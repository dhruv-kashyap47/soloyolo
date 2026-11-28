import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Publish a stable `/sitemap.xml` beside the `@astrojs/sitemap` output.
 *
 * The integration writes `sitemap-index.xml` plus one `sitemap-N.xml` chunk.
 * Search Console and most crawlers accept the index, but a plain
 * `/sitemap.xml` is the address people and tools expect. When the build has
 * exactly one chunk, copy that URL set; if the site ever grows past one chunk,
 * copy the index instead so `/sitemap.xml` remains valid.
 */
export async function writeSitemapAlias({ dist = 'dist', log = console.log } = {}) {
  const indexPath = join(dist, 'sitemap-index.xml');
  const index = await readFile(indexPath, 'utf8');
  const childUrls = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  if (childUrls.length === 0) {
    throw new Error(`${indexPath} has no child sitemap URLs`);
  }

  let body = index;
  let kind = 'sitemapindex';

  if (childUrls.length === 1) {
    // eslint-disable-next-line no-undef
    const childUrl = new URL(childUrls[0]);
    const childPath = join(dist, decodeURIComponent(childUrl.pathname).replace(/^\/+/, ''));
    body = await readFile(childPath, 'utf8');
    kind = 'urlset';
  }

  const outputPath = join(dist, 'sitemap.xml');
  await writeFile(outputPath, body, 'utf8');
  const urlCount = [...body.matchAll(/<loc>/g)].length;
  log(`sitemap: ${outputPath} (${kind}, ${urlCount} loc entries)`);

  return { path: outputPath, kind, urlCount };
}
