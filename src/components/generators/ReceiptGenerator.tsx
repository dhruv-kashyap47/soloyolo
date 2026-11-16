import { useMemo } from 'preact/hooks';

import DocumentGenerator from '@/components/generators/DocumentGenerator';
import { receiptExample } from '@/data/generators/examples';

/** The receipt generator island. */
export default function ReceiptGenerator() {
  const initialValues = useMemo(() => receiptExample(), []);

  return (
    <DocumentGenerator
      kind="receipt"
      initialValues={initialValues}
      actionLabel="Print or save as PDF"
    />
  );
}
