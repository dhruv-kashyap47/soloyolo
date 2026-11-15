/**
 * Site-wide identity and defaults.
 *
 * The product name and domain are working placeholders: change them here and in
 * `.env` (PUBLIC_SITE_URL) and every canonical URL, sitemap entry and structured
 * data block follows.
 */
export const SITE = {
  name: 'SoloYolo',
  legalName: 'SoloYolo Tools',
  tagline: 'Business tools for independent professionals',
  description:
    'Free, privacy-first calculators and document generators for freelancers, consultants and small service businesses. Work out your rate, check your margins, and send professional invoices.',
  locale: 'en',
  defaultCurrency: 'USD',
} as const;

export type SiteConfig = typeof SITE;
