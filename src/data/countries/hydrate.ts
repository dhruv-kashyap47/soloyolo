import { getCountryConfig, type CountryCode } from '@/lib/countries';
import { addDays, todayIso } from '@/lib/formatting/date';
import type { DocumentDraft } from '@/lib/generators/document';

import type { CountryExamplePreset } from '@/data/countries/examples';

/**
 * Turns a country example preset into today's document.
 *
 * The preset is rendered into the page by Astro, not imported by the island,
 * so the four full examples stay out of the JavaScript bundle. The island only
 * carries this small function: it fills the issue date, the due date for the
 * market and, for a UK VAT invoice, the supply date.
 */
export function hydrateCountryExample(
  preset: CountryExamplePreset,
  country: CountryCode,
  taxInvoice: boolean,
): DocumentDraft {
  const today = todayIso();
  const config = getCountryConfig(country);

  return {
    ...preset,
    country,
    taxInvoice,
    issueDate: today,
    dueDate: addDays(today, config.invoice.dueDays),
    supplyDate: country === 'UK' ? today : '',
  };
}
