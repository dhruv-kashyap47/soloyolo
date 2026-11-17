import type { CountryConfig } from '@/lib/countries/types';

/**
 * Canada: GST at 5%, HST at 13% in Ontario, 14% in Nova Scotia and 15% in the
 * remaining participating provinces. The place of supply decides the rate, and
 * the CRA sets the invoice detail by total: $100 for the registration number,
 * $500 for the buyer's name and the terms of payment.
 *
 * Sources checked 2026-11-16.
 */
export const CA: CountryConfig = {
  code: 'CA',
  name: 'Canada',
  shortName: 'Canada',
  adjective: 'Canadian',
  currency: 'CAD',
  tax: {
    name: 'GST/HST',
    label: 'GST',
    labels: ['GST', 'HST'],
    registrationLabel: 'Business number',
    registrationLabels: ['Business number', 'GST number', 'HST number'],
    registrationFormat: 'none',
    registrationExample: '00000 0000 RT0001',
    registrationFormatNote:
      'Your GST/HST number is your nine digit business number plus the RT program account. Add it when your customer needs an input tax credit.',
    standardRatePercent: '5',
    rates: [
      {
        label: 'GST',
        ratePercent: '5',
        note: 'Non-participating provinces: Alberta, British Columbia, Manitoba, Quebec, Saskatchewan and the territories.',
      },
      {
        label: 'HST, Ontario',
        ratePercent: '13',
        note: 'The combined federal and provincial rate.',
      },
      {
        label: 'HST, Nova Scotia',
        ratePercent: '14',
        note: 'The rate has been 14% since 1 April 2025.',
      },
      {
        label: 'HST, New Brunswick, Newfoundland and Labrador, Prince Edward Island',
        ratePercent: '15',
        note: 'The combined federal and provincial rate.',
      },
      {
        label: 'PST or QST',
        ratePercent: null,
        note: 'British Columbia 7% PST, Manitoba 7% RST, Saskatchewan 6% PST and Quebec 9.975% QST are separate from GST.',
      },
    ],
    rateHint:
      'GST is 5%. HST is 13% in Ontario, 14% in Nova Scotia and 15% in New Brunswick, Newfoundland and Labrador, and Prince Edward Island. Enter the rate for the place of supply.',
    supportsTaxInvoice: true,
    taxInvoiceLabel: 'Show the GST/HST details',
    taxInvoiceHint:
      'Makes the GST/HST number required once the total reaches $100, and the terms of payment required once it reaches $500.',
    taxInvoiceTitle: 'INVOICE',
    registrationRequired: false,
    registrationRequiredOver: 100,
    customerAddressRequired: false,
    supplierAddressRequired: false,
    supplyDateField: false,
    paymentTermsRequiredOver: 500,
  },
  invoice: {
    dueDays: 30,
    paymentTerms: 'Net 30',
    paymentDetails: 'Interac e-Transfer\npayments@example.ca',
    notes: 'Thank you for your business.',
    numberPrefix: 'INV',
    documentTitle: 'INVOICE',
    taxIdPlaceholder: '00000 0000 RT0001',
    businessAddressPlaceholder: '100 King St W\nToronto, ON M5X 1A9',
    customerAddressPlaceholder: '150 Elgin St\nOttawa, ON K2P 1L4',
    paymentDetailsPlaceholder: 'Interac e-Transfer\npayments@example.ca',
  },
  sources: [
    {
      id: 'ca-charge',
      label: 'CRA: Charge and collect the GST/HST',
      url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html',
      note: 'The provincial rate table, the place of supply rule, and the requirement to show the total HST rate rather than its parts.',
    },
    {
      id: 'ca-itc',
      label: 'CRA: Input tax credits, records you need',
      url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/input-tax-credit.html',
      note: 'The invoice detail chart by total: under $100, $100 to $499.99, and $500 or more.',
    },
    {
      id: 'ca-register',
      label: 'CRA: When to register for and start charging the GST/HST',
      url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/when-register-charge.html',
      note: 'The $30,000 small supplier threshold and voluntary registration.',
    },
  ],
  verifiedOn: '2026-11-16',
};
