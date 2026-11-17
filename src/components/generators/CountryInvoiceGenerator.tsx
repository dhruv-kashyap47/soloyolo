import { useMemo } from 'preact/hooks';

import { hydrateCountryExample } from '@/data/countries/hydrate';
import type { CountryExamplePreset } from '@/data/countries/examples';
import DocumentGenerator from '@/components/generators/DocumentGenerator';
import type { CountryCode } from '@/lib/countries';

export interface CountryInvoiceGeneratorProps {
  country: CountryCode;
  /** Print the country's tax invoice title and require its tax fields. */
  taxInvoice: boolean;
  /** The example, rendered into the page by Astro rather than imported here. */
  preset: CountryExamplePreset;
}

/**
 * The invoice island for a country page.
 *
 * The country example is passed in as a preset from the page, so the full
 * examples are HTML, not a JavaScript chunk. The island only fills today's
 * dates, and the general invoice, quote and receipt pages keep their smaller
 * example bundles.
 */
export default function CountryInvoiceGenerator({
  country,
  taxInvoice,
  preset,
}: CountryInvoiceGeneratorProps) {
  const initialValues = useMemo(
    () => hydrateCountryExample(preset, country, taxInvoice),
    [preset, country, taxInvoice],
  );

  return (
    <DocumentGenerator
      kind="invoice"
      initialValues={initialValues}
      actionLabel="Print or save as PDF"
      countryLocked
      taxInvoiceLocked={taxInvoice}
    />
  );
}
