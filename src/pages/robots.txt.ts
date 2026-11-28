import type { APIRoute } from 'astro';

/**
 * Search engines and AI answer engines are welcome on every public page.
 *
 * A single `User-agent: *` group already allows them all; the named groups are
 * kept explicit so a future crawler-specific rule has an obvious place to live
 * and so the intent is visible in the file itself. Nothing here is blocked:
 * the site has no admin, private or duplicate paths that need a Disallow.
 */
const CRAWLERS = [
  'Googlebot',
  'Googlebot-Image',
  'Google-Extended',
  'Bingbot',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'DuckDuckBot',
  'YandexBot',
  'Baiduspider',
  'Slurp',
  'facebookexternalhit',
  'LinkedInBot',
  'Twitterbot',
  'Pinterestbot',
] as const;

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://soloyolotools.com');
  const sitemap = new URL('/sitemap.xml', base).href;
  const sitemapIndex = new URL('/sitemap-index.xml', base).href;

  const body = [
    '# Search engines, AI crawlers and answer engines may index the public site.',
    'User-agent: *',
    'Allow: /',
    '',
    ...CRAWLERS.flatMap((crawler) => [`User-agent: ${crawler}`, 'Allow: /', '']),
    `Sitemap: ${sitemap}`,
    `Sitemap: ${sitemapIndex}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
