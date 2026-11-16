import { useMemo } from 'preact/hooks';

import DocumentGenerator from '@/components/generators/DocumentGenerator';
import { quoteExample } from '@/data/generators/examples';

/** The quote generator island. */
export default function QuoteGenerator() {
  const initialValues = useMemo(() => quoteExample(), []);

  return (
    <DocumentGenerator
      kind="quote"
      initialValues={initialValues}
      actionLabel="Print or save as PDF"
    />
  );
}
