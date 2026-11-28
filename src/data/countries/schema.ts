import { z } from 'zod';

import type { CountryPageContent } from '@/data/countries/types';
import { COUNTRY_GUIDES } from '@/lib/countries/guides';
import { COUNTRIES } from '@/lib/countries';
import { assertCountryConfigs } from '@/lib/countries/schema';

/**
 * Build-time validation for the country invoice guides.
 *
 * Zod stays out of the browser. The page imports this module, the island does
 * not, so the long copy and the schema never reach the client bundle.
 */

const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

const changeSchema = z.object({
  label: z.string().min(3),
  value: z.string().min(2),
  note: z.string().min(20),
});

const rateSchema = z.object({
  label: z.string().min(2),
  rate: z.string().min(2),
  note: z.string().min(20),
});

const relatedSchema = z.object({
  label: z.string().min(3),
  href: z.string().startsWith('/'),
  note: z.string().min(20),
});

const pageSchema = z.object({
  guideId: z.string().min(3),
  meta: z.object({
    title: z.string().min(12),
    seoTitle: z.string().min(12).max(60).optional(),
    description: z.string().min(80),
    eyebrow: z.string().min(6),
    intro: z.string().min(100),
  }),
  breadcrumbLabel: z.string().min(2),
  documentName: z.string().min(6),
  requirements: z.object({
    title: z.string().min(10),
    intro: z.string().min(60),
    items: z.array(z.string().min(30)).min(5),
  }),
  changes: z.object({
    title: z.string().min(6),
    intro: z.string().min(40),
    items: z.array(changeSchema).min(5),
  }),
  rates: z.object({
    title: z.string().min(6),
    intro: z.string().min(40),
    items: z.array(rateSchema).min(1),
    note: z.string().min(30),
  }),
  scenario: z.object({
    title: z.string().min(6),
    body: z.string().min(60),
    points: z.array(z.string().min(20)).min(3),
  }),
  notes: z.array(z.string().min(40)).min(3),
  faqs: z.array(faqSchema).min(4),
  sourceIds: z.array(z.string().min(3)).min(2),
  related: z.array(relatedSchema).min(3),
});

const collectionSchema = z.array(pageSchema).min(15);

export interface ValidatedCountryPages {
  pages: readonly CountryPageContent[];
  byPath: ReadonlyMap<string, CountryPageContent>;
  byGuideId: ReadonlyMap<string, CountryPageContent>;
}

/** Throws when the country guides or the country configs do not match. */
export function validateCountryPages(pages: readonly CountryPageContent[]): ValidatedCountryPages {
  assertCountryConfigs(COUNTRIES);

  const result = collectionSchema.safeParse(pages);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid country page content: ${issues}`);
  }

  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const paths = new Set<string>();
  const guideIds = new Set<string>();

  const byPath = new Map<string, CountryPageContent>();
  const byGuideId = new Map<string, CountryPageContent>();

  for (const page of pages) {
    const guide = COUNTRY_GUIDES.find((entry) => entry.id === page.guideId);
    if (!guide) throw new Error(`Country page ${page.guideId} has no guide link.`);

    const country = COUNTRIES.find((entry) => entry.code === guide.country);
    if (!country) throw new Error(`Country page ${page.guideId} has no country config.`);

    if (paths.has(guide.href)) throw new Error(`Duplicate country path: ${guide.href}`);
    if (titles.has(page.meta.title)) throw new Error(`Duplicate country title: ${page.meta.title}`);
    if (descriptions.has(page.meta.description)) {
      throw new Error(`Duplicate country description: ${page.meta.description}`);
    }
    if (guideIds.has(page.guideId)) throw new Error(`Duplicate guide id: ${page.guideId}`);

    for (const sourceId of page.sourceIds) {
      if (!country.sources.some((source) => source.id === sourceId)) {
        throw new Error(`Country page ${page.guideId} cites an unknown source: ${sourceId}`);
      }
    }

    paths.add(guide.href);
    titles.add(page.meta.title);
    descriptions.add(page.meta.description);
    guideIds.add(page.guideId);
    byPath.set(guide.href, page);
    byGuideId.set(page.guideId, page);
  }

  if (pages.length !== COUNTRY_GUIDES.length) {
    throw new Error(`Expected ${COUNTRY_GUIDES.length} country pages, received ${pages.length}.`);
  }

  return { pages, byPath, byGuideId };
}
