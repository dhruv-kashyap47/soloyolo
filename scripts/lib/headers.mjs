/**
 * Pure assertions for the generated Cloudflare Pages `_headers` file. No
 * filesystem access here: the production and preview artifact checks share
 * these rules.
 */
import { PAGES_DEV_NOINDEX_PATTERNS } from './csp.mjs';

/**
 * The headers of one `_headers` rule block, keyed by lowercase header name.
 * A blank line, a comment or the next path line ends the block. Detach lines
 * (`! Header-Name`) are recorded as `detached` instead of a value.
 *
 * @param {string} file
 * @param {string} path exact path or host pattern line
 * @returns {{ headers: Record<string, string>, detached: Set<string> } | null}
 */
export function headerBlock(file, path) {
  const lines = file.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === path);
  if (start === -1) return null;

  const headers = {};
  const detached = new Set();
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '' || line.trim().startsWith('#') || !/^\s/.test(line)) break;
    const detach = /^\s+!\s*([A-Za-z0-9-]+)\s*$/.exec(line);
    if (detach) {
      detached.add(detach[1].toLowerCase());
      continue;
    }
    const entry = /^\s+([A-Za-z0-9-]+):\s*(.+)$/.exec(line);
    if (entry) headers[entry[1].toLowerCase()] = entry[2];
  }
  return { headers, detached };
}

/** @param {string} host @returns {boolean} */
function isPagesDevHost(host) {
  return host === 'pages.dev' || host.endsWith('.pages.dev');
}

/**
 * Prove the generated file indexes the canonical host and blocks every
 * `*.pages.dev` alias, in either build environment:
 *
 * - production (`PUBLIC_SITE_URL` on the custom domain): the apex and `www`
 *   blocks must keep `index, follow` and must not be shadowed by a noindex;
 * - preview (`PUBLIC_SITE_URL` on the pages.dev host): nothing may assert
 *   `index, follow`, because that is the host the noindex rules cover.
 *
 * @param {{ headers: string, siteUrl: string }} options
 * @returns {string[]} human-readable problems; empty when the file is correct
 */
export function checkHeaders({ headers, siteUrl }) {
  // eslint-disable-next-line no-undef
  const host = new URL(siteUrl).hostname.replace(/^www\./, '');
  const problems = [];
  const indexable = /X-Robots-Tag:\s*index,\s*follow/i.test(headers);

  if (isPagesDevHost(host)) {
    if (indexable) {
      problems.push(`_headers: a preview build for ${host} must not assert index, follow`);
    }
  } else {
    const hostPatterns = [`https://${host}/*`];
    // A bare registrable domain gets the conventional www alias too.
    if (host.split('.').length === 2) hostPatterns.push(`https://www.${host}/*`);
    for (const pattern of hostPatterns) {
      const block = headerBlock(headers, pattern);
      if (!block) {
        problems.push(`_headers: missing indexable host rule ${pattern}`);
      } else if (!/^index,\s*follow$/i.test(block.headers['x-robots-tag'] ?? '')) {
        problems.push(`_headers: ${pattern} is not X-Robots-Tag: index, follow`);
      }
    }
    if (!indexable) {
      problems.push('_headers: missing X-Robots-Tag: index, follow');
    }
  }

  for (const pattern of PAGES_DEV_NOINDEX_PATTERNS) {
    const block = headerBlock(headers, pattern);
    if (!block) {
      problems.push(`_headers: missing the *.pages.dev noindex rule ${pattern}`);
      continue;
    }
    if (!/^noindex$/i.test(block.headers['x-robots-tag'] ?? '')) {
      problems.push(`_headers: ${pattern} is not X-Robots-Tag: noindex`);
    }
  }

  return problems;
}
