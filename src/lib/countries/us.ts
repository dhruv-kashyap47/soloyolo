import type { CountryConfig } from '@/lib/countries/types';

/**
 * The United States has no federal sales tax. The config therefore carries no
 * default rate and no tax invoice mode: the rate is entered for the sale, and
 * the invoice is a commercial invoice rather than a tax invoice.
 *
 * Sources checked 2026-11-16.
 */
export const US: CountryConfig = {
  code: 'US',
  name: 'United States',
  shortName: 'US',
  adjective: 'US',
  currency: 'USD',
  tax: {
    name: 'Sales tax',
    label: 'Sales tax',
    labels: ['Sales tax'],
    registrationLabel: 'EIN',
    registrationLabels: ['EIN', 'Tax ID'],
    registrationFormat: 'none',
    registrationExample: '00-0000000',
    registrationFormatNote:
      'An EIN or other tax ID is optional on an invoice. Add it when your customer asks for one.',
    standardRatePercent: '0',
    rates: [
      {
        label: 'State and local sales tax',
        ratePercent: null,
        note: 'No federal rate. State and local governments set the rate and the tax base.',
      },
      {
        label: 'Federal sales tax',
        ratePercent: null,
        note: 'The United States has no national sales tax.',
      },
    ],
    rateHint:
      'There is no national rate. Enter the combined state and local rate for the sale, or leave the line rate empty when the sale is not taxable.',
    supportsTaxInvoice: false,
    taxInvoiceLabel: '',
    taxInvoiceHint: '',
    taxInvoiceTitle: 'INVOICE',
    registrationRequired: false,
    registrationRequiredOver: null,
    customerAddressRequired: false,
    supplierAddressRequired: false,
    supplyDateField: false,
    paymentTermsRequiredOver: null,
  },
  invoice: {
    dueDays: 30,
    paymentTerms: 'Net 30',
    paymentDetails: 'Bank transfer\nRouting 000000000\nAccount 0000000000',
    notes: 'Thank you for your business.',
    numberPrefix: 'INV',
    documentTitle: 'INVOICE',
    taxIdPlaceholder: '00-0000000',
    businessAddressPlaceholder: '100 Congress Ave\nAustin, TX 78701',
    customerAddressPlaceholder: '1200 Broadway\nDenver, CO 80203',
    paymentDetailsPlaceholder: 'Bank transfer\nRouting 000000000\nAccount 0000000000',
  },
  sources: [
    {
      id: 'us-irs-business-taxes',
      label: 'IRS: Business taxes',
      url: 'https://www.irs.gov/businesses/business-taxes',
      note: 'The five federal business taxes the IRS lists: income, estimated, self-employment, employment and excise tax. Sales tax is not a federal tax.',
    },
    {
      id: 'us-state-websites',
      label: 'IRS: State government websites',
      url: 'https://www.irs.gov/businesses/small-businesses-self-employed/state-government-websites',
      note: 'The directory that leads to each state tax authority, where sales tax registration and rates live.',
    },
    {
      id: 'us-sba-pay-taxes',
      label: 'SBA: Pay taxes',
      url: 'https://www.sba.gov/business-guide/manage-your-business/pay-taxes',
      note: 'State and local tax obligations vary by location and business structure. The SBA links each state department of revenue.',
    },
    {
      id: 'us-ein',
      label: 'IRS: Get an employer identification number',
      url: 'https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number',
      note: 'An EIN is free from the IRS and is used on business tax filings. It is not a sales tax registration.',
    },
  ],
  verifiedOn: '2026-11-16',
};
