/**
 * Site-wide identity and defaults.
 *
 * The official domain is `soloyolotools.com`; the brand name is `soloyolo`
 * (lowercase, matching the wordmark). Change the domain here and in `.env`
 * (`PUBLIC_SITE_URL`) and every canonical URL, sitemap entry and structured
 * data block follows.
 */
export const SITE = {
  name: 'soloyolo',
  legalName: 'SoloYolo Tools',
  operator: 'SoloYolo Tools, sole operator',
  contactEmail: 'foundersoffice@proton.me',
  /** Used only when `Astro.site` is unavailable (local tooling and previews). */
  url: 'https://soloyolotools.com',
  tagline: 'Business tools for independent professionals',
  description:
    'Free, privacy-first calculators and document generators for freelancers, consultants and small service businesses. Work out your rate, check your margins, and send professional invoices.',
  locale: 'en',
  defaultCurrency: 'USD',
} as const;

export type SiteConfig = typeof SITE;
