import type { CountryConfig } from '@/lib/countries/types';

/**
 * The United Kingdom: VAT at 20% standard, 5% reduced and 0% zero rate. A
 * VAT invoice adds the VAT number, the customer address and the supply date,
 * and HMRC asks for the total VAT in sterling.
 *
 * Sources checked 2026-11-16.
 */
export const UK: CountryConfig = {
  code: 'UK',
  name: 'United Kingdom',
  shortName: 'UK',
  adjective: 'UK',
  currency: 'GBP',
  tax: {
    name: 'VAT',
    label: 'VAT',
    labels: ['VAT'],
    registrationLabel: 'VAT number',
    registrationLabels: ['VAT number'],
    registrationExample: 'GB 000 0000 00',
    registrationFormatNote:
      'Your VAT number is on your VAT registration certificate. Leave it blank if you are not VAT registered.',
    standardRatePercent: '20',
    rates: [
      { label: 'Standard rate', ratePercent: '20', note: 'Most goods and services.' },
      {
        label: 'Reduced rate',
        ratePercent: '5',
        note: 'Some goods and services, for example child car seats and domestic energy.',
      },
      {
        label: 'Zero rate',
        ratePercent: '0',
        note: 'Zero-rated goods and services, for example most food and children’s clothes.',
      },
    ],
    rateHint: 'The standard rate is 20%. Enter the rate that applies to each line: 20, 5 or 0.',
    supportsTaxInvoice: true,
    taxInvoiceLabel: 'Print this as a VAT invoice',
    taxInvoiceHint:
      'Prints VAT INVOICE and makes your VAT number, your business address and the customer address required.',
    taxInvoiceTitle: 'VAT INVOICE',
    registrationRequired: true,
    registrationRequiredOver: null,
    customerAddressRequired: true,
    supplierAddressRequired: true,
    supplyDateField: true,
    paymentTermsRequiredOver: null,
  },
  invoice: {
    dueDays: 14,
    paymentTerms: 'Due within 14 days',
    paymentDetails: 'Bank transfer\nAccount 12345678\nSort code 00-00-00',
    notes: 'Thank you for your business.',
    numberPrefix: 'INV',
    taxIdPlaceholder: 'GB 000 0000 00',
    businessAddressPlaceholder: 'Mill Lane\nBristol',
    customerAddressPlaceholder: 'Harbour Road\nBrighton',
    paymentDetailsPlaceholder: 'Bank transfer\nAccount 12345678\nSort code 00-00-00',
  },
  sources: [
    {
      id: 'uk-invoices',
      label: 'GOV.UK: Invoices, what they must include',
      url: 'https://www.gov.uk/invoicing-and-taking-payment-from-customers/invoices-what-they-must-include',
      note: 'The core details every UK invoice must carry, plus the extra details for sole traders and limited companies.',
    },
    {
      id: 'uk-vat-invoices',
      label: 'HMRC: Record keeping (VAT Notice 700/21)',
      url: 'https://www.gov.uk/guidance/record-keeping-for-vat-notice-70021',
      note: 'The full list of details a VAT invoice must show, the 30 day issue rule and the £250 simplified invoice rule.',
    },
    {
      id: 'uk-vat-rates',
      label: 'GOV.UK: VAT rates',
      url: 'https://www.gov.uk/vat-rates',
      note: 'Standard rate 20%, reduced rate 5% and zero rate 0%.',
    },
    {
      id: 'uk-vat-registration',
      label: 'GOV.UK: When to register for VAT',
      url: 'https://www.gov.uk/vat-registration/when-to-register',
      note: 'The £90,000 taxable turnover threshold and the 30 day registration window.',
    },
  ],
  verifiedOn: '2026-11-16',
};
