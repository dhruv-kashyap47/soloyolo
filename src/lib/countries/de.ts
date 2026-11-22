import type { CountryConfig } from '@/lib/countries/types';

/**
 * Germany: Umsatzsteuer at 19% standard, 7% reduced and 0% for specific
 * supplies. A Rechnung under §14(4) UStG shows both parties' names and
 * addresses, the tax number or USt-IdNr., the issue date, a unique number,
 * the supply date and the tax broken down by rate.
 *
 * Kleinunternehmer under §19 UStG do not charge VAT and print the statutory
 * note instead. The normal page covers that case; the VAT page covers a
 * registered business.
 *
 * Sources checked 2026-11-17.
 */
export const DE: CountryConfig = {
  code: 'DE',
  name: 'Germany',
  shortName: 'Germany',
  adjective: 'German',
  currency: 'EUR',
  tax: {
    name: 'Umsatzsteuer',
    label: 'MwSt',
    labels: ['MwSt', 'VAT'],
    registrationLabel: 'VAT ID',
    registrationLabels: ['VAT ID', 'Tax number'],
    registrationFormat: 'de-vat',
    registrationExample: 'DE123456789',
    registrationFormatNote:
      'A USt-IdNr. is DE followed by nine digits and is issued by the Federal Central Tax Office; a Steuernummer is issued by your local tax office. §14(4) accepts either.',
    standardRatePercent: '19',
    rates: [
      {
        label: 'Standard rate',
        ratePercent: '19',
        note: 'Most goods and services. The standard rate of Umsatzsteuer.',
      },
      {
        label: 'Reduced rate',
        ratePercent: '7',
        note: 'Specific goods and services listed in Anlage 2 to the UStG, such as most food and printed books.',
      },
      {
        label: 'Zero rate',
        ratePercent: '0',
        note: 'Specific supplies such as solar modules and their installation under §12(3) UStG.',
      },
    ],
    rateHint:
      'The standard rate is 19%. Use 7 only for the supplies listed in Anlage 2, and 0 only where §12(3) applies.',
    supportsTaxInvoice: true,
    taxInvoiceLabel: 'Print this as a VAT invoice',
    taxInvoiceHint:
      'Prints RECHNUNG with the §14(4) fields: both addresses, your USt-IdNr. or Steuernummer, and the supply date.',
    taxInvoiceTitle: 'RECHNUNG',
    registrationRequired: true,
    registrationRequiredOnAllInvoices: true,
    registrationRequiredOver: null,
    customerAddressRequired: true,
    supplierAddressRequired: true,
    supplyDateField: true,
    paymentTermsRequiredOver: null,
  },
  invoice: {
    dueDays: 14,
    paymentTerms: 'Due within 14 days',
    paymentDetails: 'Bank transfer\nIBAN DE00 0000 0000 0000 0000 00\nBIC 00000000',
    notes: 'Thank you for your business.',
    noVatNote: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
    numberPrefix: 'RE',
    documentTitle: 'RECHNUNG',
    crossBorderLabel: 'Cross-border treatment',
    crossBorder: [
      {
        value: 'eu-reverse-charge',
        label: 'EU business customer (reverse charge)',
        hint: 'For a business customer in another EU country. The place of supply is the customer country, so no German VAT is charged and the customer accounts for VAT there. Both USt-IdNr. must appear on the invoice.',
        endorsement:
          'Nicht steuerbar nach § 3a Abs. 2 UStG. Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge).',
        zeroRated: true,
        customerTaxIdRequired: true,
        customerTaxIdLabel: 'Customer USt-IdNr.',
        customerTaxIdHint:
          'The customer business VAT ID in the country where it is established. § 14a(1) UStG expects both VAT IDs on this invoice.',
        customerTaxIdPlaceholder: 'DE123456789',
        customerTaxIdPrintedLabel: 'USt-IdNr.',
      },
    ],
    taxIdPlaceholder: 'DE123456789',
    businessAddressPlaceholder: 'Example Street 12\n10115 Berlin',
    customerAddressPlaceholder: 'Example Road 4\n80331 München',
    paymentDetailsPlaceholder: 'Bank transfer\nIBAN DE00 0000 0000 0000 0000 00\nBIC 00000000',
  },
  sources: [
    {
      id: 'de-ustg-rates',
      label: 'UStG §12: Tax rates',
      url: 'https://www.gesetze-im-internet.de/ustg_1980/__12.html',
      note: 'The 19% standard rate, the 7% reduced rate for the supplies in Anlage 2, and the 0% rate for specific supplies such as solar modules.',
    },
    {
      id: 'de-ustg-invoice',
      label: 'UStG §14: Issuing invoices',
      url: 'https://www.gesetze-im-internet.de/ustg_1980/__14.html',
      note: 'The §14(4) invoice contents: both names and addresses, the tax number or USt-IdNr., the issue date, a unique number, the supply date and the tax breakdown.',
    },
    {
      id: 'de-ustg-small',
      label: 'UStG §19: Kleinunternehmer',
      url: 'https://www.gesetze-im-internet.de/ustg_1980/__19.html',
      note: 'The Kleinunternehmer thresholds: €25,000 total turnover in the previous calendar year and €100,000 in the current year.',
    },
    {
      id: 'de-ustg-place',
      label: 'UStG §3a: Place of the supply',
      url: 'https://www.gesetze-im-internet.de/ustg_1980/__3a.html',
      note: 'A service to a business customer is supplied where the customer runs its business, which is why an EU business customer takes the VAT in its own country.',
    },
    {
      id: 'de-ustg-both-ids',
      label: 'UStG §14a: Both VAT IDs on a cross-border invoice',
      url: 'https://www.gesetze-im-internet.de/ustg_1980/__14a.html',
      note: 'A supply taxed in another country needs the supplier USt-IdNr. and the customer USt-IdNr. on the invoice, so the customer can account for the tax.',
    },
    {
      id: 'de-bmf-einvoice',
      label: 'BMF: E-invoicing FAQ',
      url: 'https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html',
      note: 'The B2B e-invoicing timetable: receiving since 1 January 2025, issuing from 2027 above €800,000 turnover and from 2028 for all, with the Kleinunternehmer exemption.',
    },
    {
      id: 'de-einvoice-formats',
      label: 'E-Rechnung-Bund: XRechnung and ZUGFeRD',
      url: 'https://www.e-rechnung-bund.de/',
      note: 'The federal e-invoicing portal explains the structured XRechnung and ZUGFeRD formats that a PDF alone does not satisfy.',
    },
    {
      id: 'de-retention',
      label: 'UStG §14b: Retaining invoices',
      url: 'https://www.gesetze-im-internet.de/ustg_1980/__14b.html',
      note: 'Invoices must be kept for eight years from the end of the calendar year of issue, a period reduced from ten years by the Fourth Bureaucracy Relief Act from 1 January 2025.',
    },
  ],
  verifiedOn: '2026-11-22',
};
