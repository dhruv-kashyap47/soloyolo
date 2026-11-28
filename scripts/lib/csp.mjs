/**
 * Pure CSP/header helpers shared by the post-build generator and its unit
 * tests. No filesystem access here.
 */
import { createHash } from 'node:crypto';

/** Script types that the browser does not execute. */
const NON_EXECUTABLE_SCRIPT_TYPES = new Set([
  'application/json',
  'application/ld+json',
  'application/manifest+json',
  'text/template',
  'text/x-template',
]);

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const STYLE_TAG = /<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi;
const TYPE_ATTR = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

function scriptType(attrs) {
  const match = TYPE_ATTR.exec(attrs);
  if (!match) return '';
  return (match[1] ?? match[2] ?? match[3] ?? '').trim().toLowerCase();
}

/**
 * The `sha256-…` hashes of every executable inline script in one HTML file,
 * excluding external scripts and JSON-LD blocks. CSP hashes cover the script's
 * text content after the HTML parser has decoded it.
 *
 * @param {string} html
 * @returns {string[]}
 */
export function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const match of html.matchAll(SCRIPT_TAG)) {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    if (/\bsrc\s*=/i.test(attrs)) continue;
    if (NON_EXECUTABLE_SCRIPT_TYPES.has(scriptType(attrs))) continue;
    const digest = createHash('sha256').update(body, 'utf8').digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }
  return [...hashes].sort();
}

/**
 * The hashes of every inline `<style>` block in one HTML file.
 *
 * Astro emits its island reset as an inline style element. `style-src` hashes
 * cover style elements, so the strict policy can keep `unsafe-inline` off.
 * Style *attributes* are a different directive (`style-src-attr`) and hashes do
 * not cover them; the templates therefore carry no static `style=` attributes.
 *
 * @param {string} html
 * @returns {string[]}
 */
export function inlineStyleHashes(html) {
  const hashes = new Set();
  for (const match of html.matchAll(STYLE_TAG)) {
    const body = match[2] ?? '';
    const digest = createHash('sha256').update(body, 'utf8').digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }
  return [...hashes].sort();
}

/**
 * De-duplicate and validate the origin strings from the P7-14 capture.
 *
 * @param {string[]} origins
 * @returns {string[]}
 */
export function normalizeOrigins(origins) {
  const seen = new Set();
  for (const raw of origins) {
    if (typeof raw !== 'string') throw new TypeError('allowlist origin must be a string');
    // eslint-disable-next-line no-undef
    const url = new URL(raw);
    if (url.protocol !== 'https:') {
      throw new Error(`allowlist origin must be https: ${raw}`);
    }
    if (url.pathname !== '/' || url.search || url.hash) {
      throw new Error(`allowlist entry must be a bare origin: ${raw}`);
    }
    seen.add(url.origin);
  }
  return [...seen].sort();
}

/**
 * Validate the optional CSP report collector.
 *
 * The value is deliberately absent in the repository: local, preview and forks
 * must not report to a vendor nobody chose. When set, it must be an absolute
 * http(s) URL without embedded credentials.
 *
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function normalizeReportUrl(raw) {
  if (!raw || raw.trim() === '') return null;
  // eslint-disable-next-line no-undef
  const url = new URL(raw.trim());
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`CSP report URL must be http(s): ${raw}`);
  }
  if (url.username || url.password) {
    throw new Error('CSP report URL must not contain credentials');
  }
  return url.href;
}

/**
 * Build the Content-Security-Policy value.
 *
 * Ad/CMP origins are appended to every network directive as one exact-origin
 * allowlist: the P7-14 capture records origins, not directives, and Google does
 * not publish a stable per-directive map. The lists are empty until that
 * capture, so script execution fails closed.
 *
 * The approved Google tag is different: its container script is allowed in
 * `script-src`, and its GA4 collect endpoints in `connect-src`/`img-src`, but
 * it is not added to every directive.
 *
 * @param {{
 *   scriptHashes?: string[],
 *   styleHashes?: string[],
 *   origins?: string[],
 *   analytics?: {
 *     script?: string[],
 *     connect?: string[],
 *     img?: string[],
 *     frame?: string[],
 *   } | null,
 *   reportUrl?: string | null,
 * }} [options]
 * @returns {string}
 */
export function buildCsp({
  scriptHashes = [],
  styleHashes = [],
  origins = [],
  analytics = null,
  reportUrl = null,
} = {}) {
  const hashes = [...new Set(scriptHashes)].sort();
  const styleHashesSorted = [...new Set(styleHashes)].sort();
  const allow = normalizeOrigins(origins);
  const analyticsScript = normalizeOrigins(analytics?.script ?? []);
  const analyticsConnect = normalizeOrigins(analytics?.connect ?? []);
  const analyticsImg = normalizeOrigins(analytics?.img ?? []);
  const analyticsFrame = normalizeOrigins(analytics?.frame ?? []);

  const scriptAllow = [...new Set([...allow, ...analyticsScript])];
  const connectAllow = [...new Set([...allow, ...analyticsConnect])];
  const imgAllow = [...new Set([...allow, ...analyticsImg])];
  const frameAllow = [...new Set([...allow, ...analyticsFrame])];

  const suffix = (list) => (list.length > 0 ? ` ${list.join(' ')}` : '');
  const script = [`'self'`, ...hashes, ...scriptAllow].join(' ');
  const style = [`'self'`, ...styleHashesSorted].join(' ') + suffix(allow);
  const report = normalizeReportUrl(reportUrl);
  const reporting = report ? [`report-uri ${report}`, 'report-to csp'] : [];

  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `script-src ${script}`,
    // Style attributes were removed from the rendered markup. Preact and the
    // small demo scripts update the CSSOM (style.cssText / setProperty), which
    // CSP does not block. Astro's inline island reset is covered by a hash.
    `style-src ${style}`,
    `img-src 'self' data:${suffix(imgAllow)}`,
    `font-src 'self'`,
    `connect-src 'self'${suffix(connectAllow)}`,
    `frame-src ${frameAllow.length > 0 ? frameAllow.join(' ') : `'none'`}`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `manifest-src 'self'`,
    `media-src 'none'`,
    `worker-src 'none'`,
    `upgrade-insecure-requests`,
    ...reporting,
  ].join('; ');
}

/** Static security headers that do not depend on the build. */
export const SECURITY_HEADERS = [
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  [
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  ],
  ['Cross-Origin-Opener-Policy', 'same-origin-allow-popups'],
  ['X-Frame-Options', 'DENY'],
];

/**
 * The production host patterns that must stay indexable. A broad
 * `X-Robots-Tag: noindex` (for example a copied `*.pages.dev` rule) must never
 * leak onto the public custom domain, so the generated file detaches any
 * earlier value on both the apex and the `www` alias and sets an explicit
 * indexable directive. Preview deployments keep their own host-scoped rules.
 *
 * @param {string | null | undefined} siteUrl
 * @returns {string[]}
 */
function indexableHostPatterns(siteUrl) {
  if (!siteUrl) return [];
  // eslint-disable-next-line no-undef
  const host = new URL(siteUrl).hostname.replace(/^www\./, '');
  const patterns = [`https://${host}/*`];
  // A bare registrable domain gets the conventional www alias too.
  if (host.split('.').length === 2) patterns.push(`https://www.${host}/*`);
  return patterns;
}

/**
 * Render the complete Cloudflare Pages `_headers` file. Hashed build assets are
 * immutable; HTML is revalidated so a deploy is visible immediately.
 *
 * `value === null` renders a detach line (`! Header-Name`), which Cloudflare
 * applies after the earlier rule that set it.
 *
 * @param {{ csp: string, extraHeaders?: string[][], siteUrl?: string | null, reportUrl?: string | null }} options
 * @returns {string}
 */
export function renderHeaders({ csp, extraHeaders = [], siteUrl = null, reportUrl = null }) {
  const report = normalizeReportUrl(reportUrl);
  const rules = [
    {
      path: '/*',
      headers: [
        ['Content-Security-Policy', csp],
        ...(report ? [['Reporting-Endpoints', `csp="${report}"`]] : []),
        ...SECURITY_HEADERS,
        ...extraHeaders,
      ],
    },
    ...indexableHostPatterns(siteUrl).map((path) => ({
      path,
      headers: [
        ['! X-Robots-Tag', null],
        ['X-Robots-Tag', 'index, follow'],
      ],
    })),
    {
      path: '/_astro/*',
      headers: [['Cache-Control', 'public, max-age=31536000, immutable']],
    },
    {
      path: '/fonts/*',
      headers: [['Cache-Control', 'public, max-age=31536000, immutable']],
    },
    {
      path: '/*.png',
      headers: [['Cache-Control', 'public, max-age=604800']],
    },
    {
      path: '/*.jpg',
      headers: [['Cache-Control', 'public, max-age=604800']],
    },
    {
      path: '/*.webp',
      headers: [['Cache-Control', 'public, max-age=604800']],
    },
  ];

  const blocks = rules.map((rule) =>
    [
      rule.path,
      ...rule.headers.map(([name, value]) =>
        value === null ? `  ${name}` : `  ${name}: ${value}`,
      ),
    ].join('\n'),
  );

  return [
    '# Generated by scripts/build-headers.mjs — do not edit by hand.',
    '# Source: scripts/lib/csp.mjs + config/third-party.json + config/analytics.json.',
    '',
    ...blocks,
    '',
  ].join('\n');
}
