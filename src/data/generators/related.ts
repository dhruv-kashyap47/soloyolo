/**
 * The related-tool matrix for the document generators.
 *
 * Kept in one place so the matrix test can check every list: 3 to 5 live tools,
 * no self-links, and at least one calculator on every generator page. The
 * calculator side of the matrix lives beside each calculator's page content.
 */
export const GENERATOR_RELATED_TOOLS: Record<string, readonly string[]> = {
  'invoice-generator': [
    'quote-generator',
    'receipt-generator',
    'payment-reminder-generator',
    'vat-gst-sales-tax-calculator',
  ],
  'quote-generator': [
    'invoice-generator',
    'receipt-generator',
    'payment-reminder-generator',
    'project-profit-calculator',
  ],
  'receipt-generator': [
    'invoice-generator',
    'quote-generator',
    'payment-reminder-generator',
    'payment-processing-fee-calculator',
  ],
  'payment-reminder-generator': [
    'invoice-generator',
    'quote-generator',
    'receipt-generator',
    'vat-gst-sales-tax-calculator',
  ],
} as const;
