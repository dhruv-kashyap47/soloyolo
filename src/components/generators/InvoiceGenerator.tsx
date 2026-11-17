import { useMemo } from 'preact/hooks';

import DocumentGenerator from '@/components/generators/DocumentGenerator';
import { invoiceExample } from '@/data/generators/examples';

/**
 * The general invoice generator island.
 *
 * The example is built when the island loads, so the dates on it are always
 * today's dates rather than the day the site was built. Country pages use
 * `CountryInvoiceGenerator`, which carries the market-specific example and
 * keeps those country examples out of this bundle.
 */
export default function InvoiceGenerator() {
  const initialValues = useMemo(() => invoiceExample(), []);

  return (
    <DocumentGenerator
      kind="invoice"
      initialValues={initialValues}
      actionLabel="Print or save as PDF"
    />
  );
}
