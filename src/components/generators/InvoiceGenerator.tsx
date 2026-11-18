import { useMemo } from 'preact/hooks';

import DocumentGenerator from '@/components/generators/DocumentGenerator';
import { invoiceExample } from '@/data/generators/examples';

/**
 * The general invoice generator island.
 *
 * The example is built when the island renders. On the server that is build
 * time, so DocumentGenerator writes the live dates back into the date inputs
 * after hydration; the sheet and the form never disagree about the day.
 *
 * A saved client from the home desk arrives as `?client=<name>` and is
 * applied by DocumentGenerator after hydration.
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
