import { AU_INVOICE_PAGE, AU_TAX_INVOICE_PAGE } from '@/data/countries/au';
import { CA_GST_HST_INVOICE_PAGE, CA_INVOICE_PAGE } from '@/data/countries/ca';
import { validateCountryPages } from '@/data/countries/schema';
import type { CountryPageContent } from '@/data/countries/types';
import { UK_INVOICE_PAGE, UK_VAT_INVOICE_PAGE } from '@/data/countries/uk';
import { US_INVOICE_PAGE } from '@/data/countries/us';

/**
 * The seven country invoice guides, in the order the hub presents them.
 *
 * The module validates itself when it loads, so a duplicate title, a missing
 * source or a page without a guide link fails the build rather than shipping.
 */
const PAGES: readonly CountryPageContent[] = [
  US_INVOICE_PAGE,
  UK_INVOICE_PAGE,
  UK_VAT_INVOICE_PAGE,
  CA_INVOICE_PAGE,
  CA_GST_HST_INVOICE_PAGE,
  AU_INVOICE_PAGE,
  AU_TAX_INVOICE_PAGE,
];

const validated = validateCountryPages(PAGES);

export const COUNTRY_PAGES = validated.pages;

export function getCountryPageByPath(path: string): CountryPageContent {
  const page = validated.byPath.get(path);
  if (!page) throw new Error(`No country page for ${path}`);
  return page;
}

export function getCountryPageByGuide(guideId: string): CountryPageContent {
  const page = validated.byGuideId.get(guideId);
  if (!page) throw new Error(`No country page for ${guideId}`);
  return page;
}
