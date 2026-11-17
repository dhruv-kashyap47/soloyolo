import type { CountryConfig } from '@/lib/countries/types';

/**
 * The United Arab Emirates: VAT at 5%. A tax invoice shows the supplier TRN
 * and, where the customer is registered, the customer TRN. An invoice may be
 * issued in Arabic or English; this English site prints English.
 *
 * Print or PDF is not a UAE e-invoice under Ministerial Decision 244/2025.
 *
 * Sources checked 2026-11-17.
 */
export const AE: CountryConfig = {
  code: 'AE',
  name: 'United Arab Emirates',
  shortName: 'UAE',
  adjective: 'UAE',
  currency: 'AED',
  tax: {
    name: 'VAT',
    label: 'VAT',
    labels: ['VAT'],
    registrationLabel: 'TRN',
    registrationLabels: ['TRN'],
    registrationFormat: 'trn',
    registrationExample: '000000000000000',
    registrationFormatNote:
      'A TRN is 15 digits. It is issued by the Federal Tax Authority when the business registers for VAT.',
    standardRatePercent: '5',
    rates: [
      {
        label: 'Standard rate',
        ratePercent: '5',
        note: 'The standard VAT rate on most goods and services supplied in the UAE.',
      },
      {
        label: 'Zero rate',
        ratePercent: '0',
        note: 'Zero-rated supplies such as exports and certain international services. Zero rated is not the same as exempt.',
      },
    ],
    rateHint:
      'The standard rate is 5%. Use 0 for a zero-rated supply, and leave the rate empty where the supply is outside the scope of VAT.',
    supportsTaxInvoice: true,
    taxInvoiceLabel: 'Print this as a VAT tax invoice',
    taxInvoiceHint:
      'Prints TAX INVOICE and makes your TRN required. The customer TRN is optional, but a registered customer needs it on the invoice.',
    taxInvoiceTitle: 'TAX INVOICE',
    registrationRequired: true,
    registrationRequiredOnAllInvoices: false,
    registrationRequiredOver: null,
    customerAddressRequired: true,
    supplierAddressRequired: true,
    supplyDateField: false,
    paymentTermsRequiredOver: null,
  },
  invoice: {
    dueDays: 30,
    paymentTerms: 'Net 30',
    paymentDetails: 'Bank transfer\nIBAN AE00 0000 0000 0000 0000 000\nSWIFT 00000000',
    notes: 'Thank you for your business.',
    numberPrefix: 'INV',
    documentTitle: 'INVOICE',
    customerTaxId: {
      label: 'TRN',
      required: false,
      hint: 'The customer TRN where the customer is registered for VAT. Leave it blank for a consumer sale.',
      placeholder: '000000000000000',
      format: 'trn',
    },
    taxIdPlaceholder: '000000000000000',
    businessAddressPlaceholder: 'Example Tower, Office 1204\nBusiness Bay, Dubai',
    customerAddressPlaceholder: 'Example Mall\nAl Barsha, Dubai',
    paymentDetailsPlaceholder:
      'Bank transfer\nIBAN AE00 0000 0000 0000 0000 000\nSWIFT 00000000',
  },
  sources: [
    {
      id: 'ae-vat',
      label: 'FTA: Value Added Tax',
      url: 'https://tax.gov.ae/en/taxes/vat.aspx',
      note: 'The Federal Tax Authority explains VAT, the 5% calculator and the VAT topics that apply to a business.',
    },
    {
      id: 'ae-registration',
      label: 'FTA: Registration for VAT',
      url: 'https://tax.gov.ae/en/taxes/Vat/vat.topics/registration.for.vat.aspx',
      note: 'The mandatory registration threshold of AED 375,000 and the voluntary registration threshold of AED 187,500.',
    },
    {
      id: 'ae-einvoice',
      label: 'FTA: UAE e-Invoicing',
      url: 'https://tax.gov.ae/en/content/uae.einvoicing.aspx',
      note: 'Ministerial Decision 244/2025, the structured e-invoice requirement, and the FTA statement that PDF, Word, images and scans are not e-invoices.',
    },
    {
      id: 'ae-legislation',
      label: 'FTA: UAE tax legislation',
      url: 'https://tax.gov.ae/en/legislation.aspx',
      note: 'The VAT Law and its executive regulations, which set the tax invoice contents and the record keeping rules.',
    },
    {
      id: 'ae-corporate',
      label: 'FTA: Corporate tax',
      url: 'https://tax.gov.ae/en/taxes/corporate.tax.aspx',
      note: 'Corporate tax is a separate direct tax on business profits. It is not VAT and does not replace the 5% VAT on a supply.',
    },
  ],
  verifiedOn: '2026-11-17',
};
