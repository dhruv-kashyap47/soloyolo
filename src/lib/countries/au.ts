import type { CountryConfig } from '@/lib/countries/types';

/**
 * Australia: GST at 10%, which is one eleventh of a GST-inclusive price. A tax
 * invoice must show the seller's ABN, and a sale of $1,000 or more must also
 * show the buyer's identity or ABN.
 *
 * Sources checked 2026-11-16.
 */
export const AU: CountryConfig = {
  code: 'AU',
  name: 'Australia',
  shortName: 'Australia',
  adjective: 'Australian',
  currency: 'AUD',
  tax: {
    name: 'GST',
    label: 'GST',
    labels: ['GST'],
    registrationLabel: 'ABN',
    registrationLabels: ['ABN'],
    registrationExample: '00 000 000 000',
    registrationFormatNote:
      'Your ABN is 11 digits. A tax invoice must show the seller’s ABN, so the field is required in tax invoice mode.',
    standardRatePercent: '10',
    rates: [
      {
        label: 'GST',
        ratePercent: '10',
        note: 'Most goods and services sold in Australia. GST is one eleventh of a GST-inclusive price.',
      },
      {
        label: 'GST-free',
        ratePercent: '0',
        note: 'Some food, health, education and exports. No GST is charged, but the sale is still reported.',
      },
      {
        label: 'Input-taxed',
        ratePercent: null,
        note: 'Examples include financial supplies and residential rent. No GST is charged and no GST credit is available.',
      },
    ],
    rateHint:
      'GST is 10%. Enter 10 on taxable lines, 0 on GST-free lines, and leave input-taxed lines out of the GST total.',
    supportsTaxInvoice: true,
    taxInvoiceLabel: 'Print this as a tax invoice',
    taxInvoiceHint:
      'Prints TAX INVOICE and makes your ABN required. The customer name is already required for every document.',
    taxInvoiceTitle: 'TAX INVOICE',
    registrationRequired: true,
    registrationRequiredOver: null,
    customerAddressRequired: false,
    supplierAddressRequired: false,
    supplyDateField: false,
    paymentTermsRequiredOver: null,
  },
  invoice: {
    dueDays: 14,
    paymentTerms: 'Due within 14 days',
    paymentDetails: 'Bank transfer\nBSB 000-000\nAccount 00000000',
    notes: 'Thank you for your business.',
    numberPrefix: 'INV',
    taxIdPlaceholder: '00 000 000 000',
    businessAddressPlaceholder: 'Level 2, 100 Collins St\nMelbourne VIC 3000',
    customerAddressPlaceholder: 'Level 5, 200 George St\nSydney NSW 2000',
    paymentDetailsPlaceholder: 'Bank transfer\nBSB 000-000\nAccount 00000000',
  },
  sources: [
    {
      id: 'au-tax-invoices',
      label: 'ATO: Tax invoices',
      url: 'https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/tax-invoices',
      note: 'The seven details a tax invoice must show, the $1,000 buyer identity rule, and the 28 day request rule.',
    },
    {
      id: 'au-register-gst',
      label: 'business.gov.au: Register for GST',
      url: 'https://business.gov.au/registrations/register-for-taxes/register-for-goods-and-services-tax-gst',
      note: 'The 10% rate, the $75,000 GST turnover threshold and the 21 day registration rule.',
    },
    {
      id: 'au-how-to-invoice',
      label: 'business.gov.au: How to invoice',
      url: 'https://business.gov.au/finance/payments-and-invoicing/how-to-invoice',
      note: 'The practical tax invoice checklist, including the buyer identity or ABN for sales over $1,000.',
    },
  ],
  verifiedOn: '2026-11-16',
};
