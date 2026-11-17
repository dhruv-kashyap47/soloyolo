import type { CountryConfig } from '@/lib/countries/types';

/**
 * Switzerland: MWST / TVA / IVA at 8.1% standard, 2.6% reduced and 3.8% for
 * accommodation. A registered business prints its MWST number as
 * CHE-123.456.789 MWST, and Art. 26 MWSTG sets the invoice contents.
 *
 * The English word "VAT" is the default tax label on this English site. The
 * number itself must carry the MWST, TVA or IVA suffix; the ESTV does not
 * accept the English abbreviation there.
 *
 * Sources checked 2026-11-17. The 29 November 2026 ballot is a watch item:
 * the current rates stay in force until any change takes effect.
 */
export const CH: CountryConfig = {
  code: 'CH',
  name: 'Switzerland',
  shortName: 'Switzerland',
  adjective: 'Swiss',
  currency: 'CHF',
  tax: {
    name: 'MWST',
    label: 'VAT',
    labels: ['VAT', 'MWST', 'TVA', 'IVA'],
    registrationLabel: 'MWST number',
    registrationLabels: ['MWST number'],
    registrationFormat: 'ch-mwst',
    registrationExample: 'CHE-123.456.789 MWST',
    registrationFormatNote:
      'Your MWST number is your UID with the suffix MWST, TVA or IVA, for example CHE-123.456.789 MWST. The English suffix VAT is not accepted.',
    standardRatePercent: '8.1',
    rates: [
      {
        label: 'Standard rate',
        ratePercent: '8.1',
        note: 'Most goods and services. The normal MWST rate.',
      },
      {
        label: 'Reduced rate',
        ratePercent: '2.6',
        note: 'Specific goods and services such as most food, medicines, books and newspapers.',
      },
      {
        label: 'Accommodation rate',
        ratePercent: '3.8',
        note: 'Accommodation services, including overnight stays with breakfast.',
      },
    ],
    rateHint:
      'The normal rate is 8.1%. The reduced rate is 2.6% and the accommodation rate is 3.8%. The current rates stay in force until a change takes effect.',
    supportsTaxInvoice: true,
    taxInvoiceLabel: 'Print this as a VAT invoice',
    taxInvoiceHint:
      'Prints INVOICE with the Art. 26 MWSTG details and makes your MWST number, both addresses and the tax breakdown required.',
    taxInvoiceTitle: 'INVOICE',
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
    paymentDetails: 'Bank transfer\nIBAN CH00 0000 0000 0000 0000 0\nBIC 00000000',
    notes: 'Thank you for your business.',
    numberPrefix: 'INV',
    documentTitle: 'INVOICE',
    taxIdPlaceholder: 'CHE-123.456.789 MWST',
    businessAddressPlaceholder: 'Example Street 8\n8001 Zürich',
    customerAddressPlaceholder: 'Example Road 2\n1201 Genève',
    paymentDetailsPlaceholder: 'Bank transfer\nIBAN CH00 0000 0000 0000 0000 0\nBIC 00000000',
  },
  sources: [
    {
      id: 'ch-estv-rates',
      label: 'ESTV: Swiss VAT rates',
      url: 'https://www.estv.admin.ch/en/vat-rates-switzerland',
      note: 'The current normal rate of 8.1%, the reduced rate of 2.6% and the accommodation rate of 3.8%.',
    },
    {
      id: 'ch-mwstg',
      label: 'MWSTG (SR 641.20): Federal Act on Value Added Tax',
      url: 'https://www.fedlex.admin.ch/eli/cc/2009/615/en',
      note: 'The VAT Act, including Art. 26 on the details an invoice must contain and Art. 10 on liability to register.',
    },
    {
      id: 'ch-registration',
      label: 'ESTV: VAT liability and the CHF 100,000 threshold',
      url: 'https://www.estv.admin.ch/en/vat-liability-foreign-companies',
      note: 'A business is liable to VAT once its worldwide turnover from taxable or zero-rated supplies reaches CHF 100,000 a year.',
    },
    {
      id: 'ch-uid',
      label: 'ESTV: UID and the MWST number format',
      url: 'https://www.estv.admin.ch/de/unternehmensidentifikationsnummer-uid',
      note: 'The MWST number is the UID in the form CHE-123.456.789 MWST. TVA and IVA are accepted; the English suffix VAT is not.',
    },
    {
      id: 'ch-ballot',
      label: 'Federal Council: AHV additional financing ballot',
      url: 'https://www.admin.ch/ahv-zusatzfinanzierung',
      note: 'The ballot on 29 November 2026 could change the standard and accommodation rates from 2028; the reduced 2.6% rate is unchanged.',
    },
  ],
  verifiedOn: '2026-11-17',
};
