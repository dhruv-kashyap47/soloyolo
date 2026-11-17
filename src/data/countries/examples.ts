import type { CountryCode } from '@/lib/countries';
import type { DocumentDraft, LineItemDraft } from '@/lib/generators/document';

import { hydrateCountryExample } from '@/data/countries/hydrate';
import { ukInvoiceExample } from '@/data/generators/ukInvoice';

/** A country example with no dates, ready to be rendered into the page. */
export type CountryExamplePreset = DocumentDraft;

/** One line item, with the fields a country example does not vary. */
function line(
  id: string,
  description: string,
  quantity: string,
  unitPrice: string,
  taxPercent: string,
  hsnCode = '',
): LineItemDraft {
  return { id, description, quantity, unitPrice, discountPercent: '', taxPercent, hsnCode };
}

/** The fields that are not part of a market's own example. */
const EMPTY_COUNTRY_FIELDS = {
  customerTaxId: '',
  customerTaxIdLabel: 'Tax ID',
  placeOfSupply: '',
  taxSplitMode: '',
} as const;

/**
 * The worked example behind a country page, without its dates.
 *
 * The country page renders this object into the island's props, so the full
 * examples travel as HTML rather than as JavaScript. `hydrateCountryExample`
 * fills the dates in the browser, which keeps an example from going stale.
 *
 * The US example leaves sales tax at zero on purpose: whether a sale is
 * taxable depends on the seller's registration and the place of supply, and
 * the tool does not guess either. Germany, Switzerland, India and the UAE use
 * a non-registered example on the normal page and a registered one on the tax
 * page, so the difference is visible rather than described.
 */
export function countryInvoicePreset(
  country: CountryCode,
  taxInvoice: boolean,
  options: { interState?: boolean } = {},
): CountryExamplePreset {
  const base = { ...ukInvoiceExample(), issueDate: '', dueDate: '', supplyDate: '' };

  if (country === 'UK') {
    return { ...base, taxInvoice };
  }

  if (country === 'US') {
    return {
      ...base,
      ...EMPTY_COUNTRY_FIELDS,
      country: 'US',
      taxInvoice: false,

      businessName: 'Ridgeway Studio',
      businessAddress: '100 Congress Ave\nAustin, TX 78701',
      businessEmail: 'hello@ridgeway.studio',
      businessPhone: '(512) 555-0142',
      businessWebsite: 'ridgeway.studio',
      businessTaxId: '00-0000000',
      businessTaxIdLabel: 'EIN',

      customerName: 'Jordan Ellis',
      customerCompany: 'Halcyon Fitness',
      customerAddress: '1200 Broadway\nDenver, CO 80203',
      customerEmail: 'jordan@halcyonfitness.test',

      number: 'INV-1042',
      currency: 'USD',
      taxLabel: 'Sales tax',
      paymentTerms: 'Net 30',
      paymentDetails: 'Bank transfer\nRouting 000000000\nAccount 0000000000',

      items: [
        line('item-1', 'Brand identity', '1', '2400', ''),
        line('item-2', 'Landing page, design and build', '1', '1600', ''),
        line('item-3', 'Strategy workshop, per hour', '3', '250', ''),
      ],
    };
  }

  if (country === 'CA') {
    const hst = taxInvoice;

    return {
      ...base,
      ...EMPTY_COUNTRY_FIELDS,
      country: 'CA',
      taxInvoice,

      businessName: 'Maple Ledger Design',
      businessAddress: '100 King St W\nToronto, ON M5X 1A9',
      businessEmail: 'hello@mapleledger.ca',
      businessPhone: '(416) 555-0188',
      businessWebsite: 'mapleledger.ca',
      businessTaxId: '00000 0000 RT0001',
      businessTaxIdLabel: hst ? 'HST number' : 'Business number',

      customerName: hst ? 'Owen Clarke' : 'Priya Shah',
      customerCompany: hst ? 'ByWard Bakery' : 'Northline Analytics',
      customerAddress: hst
        ? '150 Elgin St\nOttawa, ON K2P 1L4'
        : '888 3 St SW\nCalgary, AB T2P 5C5',
      customerEmail: hst ? 'owen@bywardbakery.test' : 'priya@northline.test',

      number: 'INV-2081',
      currency: 'CAD',
      taxLabel: hst ? 'HST' : 'GST',
      paymentTerms: 'Net 30',
      paymentDetails: 'Interac e-Transfer\npayments@mapleledger.ca',

      items: hst
        ? [
            line('item-1', 'Brand strategy and identity', '1', '2600', '13'),
            line('item-2', 'Packaging design, per hour', '14', '135', '13'),
          ]
        : [
            line('item-1', 'Brand strategy', '1', '2200', '5'),
            line('item-2', 'Website design, per hour', '12', '120', '5'),
          ],
    };
  }

  if (country === 'AU') {
    return {
      ...base,
      ...EMPTY_COUNTRY_FIELDS,
      country: 'AU',
      taxInvoice,

      businessName: 'Coastline Creative',
      businessAddress: 'Level 2, 100 Collins St\nMelbourne VIC 3000',
      businessEmail: 'hello@coastlinecreative.com.au',
      businessPhone: '(03) 5550 0188',
      businessWebsite: 'coastlinecreative.com.au',
      businessTaxId: '00 000 000 000',
      businessTaxIdLabel: 'ABN',

      customerName: 'Harper Lee',
      customerCompany: 'Southern Cross Retail',
      customerAddress: 'Level 5, 200 George St\nSydney NSW 2000',
      customerEmail: 'harper@southerncross.test',

      number: 'INV-3120',
      currency: 'AUD',
      taxLabel: 'GST',
      paymentTerms: 'Due within 14 days',
      paymentDetails: 'Bank transfer\nBSB 000-000\nAccount 00000000',

      items: taxInvoice
        ? [
            line('item-1', 'Brand identity and campaign', '1', '3200', '10'),
            line('item-2', 'Art direction, per hour', '15', '160', '10'),
          ]
        : [
            line('item-1', 'Brand identity', '1', '2800', '10'),
            line('item-2', 'Campaign design, per hour', '10', '140', '10'),
          ],
    };
  }

  if (country === 'DE') {
    if (!taxInvoice) {
      return {
        ...base,
        ...EMPTY_COUNTRY_FIELDS,
        country: 'DE',
        taxInvoice: false,

        businessName: 'Spree Studio',
        businessAddress: 'Example Street 12\n10115 Berlin',
        businessEmail: 'hello@spree-studio.example',
        businessPhone: '030 000 0000',
        businessWebsite: 'spree-studio.example',
        businessTaxId: '00/000/00000',
        businessTaxIdLabel: 'Tax number',

        customerName: 'Lena Fischer',
        customerCompany: 'Kranich Café',
        customerAddress: 'Example Road 4\n80331 München',
        customerEmail: 'lena@kranich.example',

        number: 'RE-2026-014',
        currency: 'EUR',
        taxLabel: 'MwSt',
        paymentTerms: 'Due within 14 days',
        paymentDetails: 'Bank transfer\nIBAN DE00 0000 0000 0000 0000 00\nBIC 00000000',
        notes: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',

        items: [
          line('item-1', 'Brand identity', '1', '2400', ''),
          line('item-2', 'Packaging design, per hour', '12', '95', ''),
        ],
      };
    }

    return {
      ...base,
      ...EMPTY_COUNTRY_FIELDS,
      country: 'DE',
      taxInvoice: true,

      businessName: 'Spree Studio',
      businessAddress: 'Example Street 12\n10115 Berlin',
      businessEmail: 'hello@spree-studio.example',
      businessPhone: '030 000 0000',
      businessWebsite: 'spree-studio.example',
      businessTaxId: 'DE000000000',
      businessTaxIdLabel: 'VAT ID',

      customerName: 'Lena Fischer',
      customerCompany: 'Kranich Café',
      customerAddress: 'Example Road 4\n80331 München',
      customerEmail: 'lena@kranich.example',

      number: 'RE-2026-021',
      currency: 'EUR',
      taxLabel: 'MwSt',
      paymentTerms: 'Due within 14 days',
      paymentDetails: 'Bank transfer\nIBAN DE00 0000 0000 0000 0000 00\nBIC 00000000',

      items: [
        line('item-1', 'Brand identity', '1', '2800', '19'),
        line('item-2', 'Campaign design, per hour', '14', '110', '19'),
      ],
    };
  }

  if (country === 'CH') {
    if (!taxInvoice) {
      return {
        ...base,
        ...EMPTY_COUNTRY_FIELDS,
        country: 'CH',
        taxInvoice: false,

        businessName: 'Limmat Design',
        businessAddress: 'Example Street 8\n8001 Zürich',
        businessEmail: 'hello@limmatdesign.example',
        businessPhone: '044 000 00 00',
        businessWebsite: 'limmatdesign.example',
        businessTaxId: '',
        businessTaxIdLabel: 'MWST number',

        customerName: 'Nina Keller',
        customerCompany: 'Berg Café',
        customerAddress: 'Example Road 2\n8004 Zürich',
        customerEmail: 'nina@bergcafe.example',

        number: 'INV-2026-031',
        currency: 'CHF',
        taxLabel: 'MWST',
        paymentTerms: 'Net 30',
        paymentDetails: 'Bank transfer\nIBAN CH00 0000 0000 0000 0000 0\nBIC 00000000',

        items: [
          line('item-1', 'Brand identity', '1', '2200', ''),
          line('item-2', 'Design system, per hour', '10', '120', ''),
        ],
      };
    }

    return {
      ...base,
      ...EMPTY_COUNTRY_FIELDS,
      country: 'CH',
      taxInvoice: true,

      businessName: 'Léman Studio',
      businessAddress: 'Example Quai 5\n1201 Genève',
      businessEmail: 'bonjour@lemanstudio.example',
      businessPhone: '022 000 00 00',
      businessWebsite: 'lemanstudio.example',
      businessTaxId: 'CHE-000.000.000 MWST',
      businessTaxIdLabel: 'MWST number',

      customerName: 'Nina Keller',
      customerCompany: 'Berg Café',
      customerAddress: 'Example Road 2\n8004 Zürich',
      customerEmail: 'nina@bergcafe.example',

      number: 'INV-2026-044',
      currency: 'CHF',
      taxLabel: 'TVA',
      paymentTerms: 'Net 30',
      paymentDetails: 'Bank transfer\nIBAN CH00 0000 0000 0000 0000 0\nBIC 00000000',

      items: [
        line('item-1', 'Brand identity', '1', '2600', '8.1'),
        line('item-2', 'Digital campaign, per hour', '12', '130', '8.1'),
      ],
    };
  }

  if (country === 'IN') {
    if (!taxInvoice) {
      return {
        ...base,
        ...EMPTY_COUNTRY_FIELDS,
        country: 'IN',
        taxInvoice: false,
        customerTaxIdLabel: 'GSTIN',
        placeOfSupply: '27',
        taxSplitMode: 'cgst-sgst',

        businessName: 'Harbour Lane Studio',
        businessAddress: 'Example House, 4th Floor\nBandra West, Mumbai 400050',
        businessEmail: 'hello@harbourlane.example',
        businessPhone: '+91 22 0000 0000',
        businessWebsite: 'harbourlane.example',
        businessTaxId: '',
        businessTaxIdLabel: 'GSTIN',

        customerName: 'Rohan Mehta',
        customerCompany: '',
        customerAddress: 'Example Road\nPune 411001',
        customerEmail: 'rohan.mehta@example.com',

        number: 'INV-2026-052',
        currency: 'INR',
        taxLabel: 'GST',
        paymentTerms: 'Due within 15 days',
        paymentDetails:
          'Bank transfer\nAccount name: Harbour Lane Studio\nAccount number: 000000000000\nIFSC: XXXX0000000',

        items: [
          line('item-1', 'Website design', '1', '45000', ''),
          line('item-2', 'Consulting, per hour', '8', '2500', ''),
        ],
      };
    }

    const interState = options.interState === true;

    return {
      ...base,
      country: 'IN',
      taxInvoice: true,
      customerTaxId: interState ? '27AAACB1234C1Z6' : '29AAACB1234C1Z8',
      customerTaxIdLabel: 'GSTIN',
      placeOfSupply: interState ? '27' : '29',
      taxSplitMode: interState ? 'igst' : 'cgst-sgst',

      businessName: 'Indigo Ledger',
      businessAddress: 'Example Tech Park, 3rd Floor\nWhitefield, Bengaluru 560066',
      businessEmail: 'hello@indigoledger.example',
      businessPhone: '+91 80 0000 0000',
      businessWebsite: 'indigoledger.example',
      businessTaxId: '29ABCDE1234F1Z5',
      businessTaxIdLabel: 'GSTIN',

      customerName: 'Ananya Rao',
      customerCompany: 'Cauvery Analytics',
      customerAddress: interState
        ? 'Example Towers, FC Road\nPune 411004'
        : 'Example Towers\nMG Road, Bengaluru 560001',
      customerEmail: 'ananya@cauvery.example',

      number: 'INV-2026-061',
      currency: 'INR',
      taxLabel: 'GST',
      paymentTerms: 'Due within 15 days',
      paymentDetails:
        'Bank transfer\nAccount name: Indigo Ledger\nAccount number: 000000000000\nIFSC: XXXX0000000',

      items: [
        line('item-1', 'GST advisory and filing support', '1', '60000', '18', '998221'),
        line('item-2', 'Accounting support, per hour', '10', '2500', '18', '998221'),
      ],
    };
  }

  if (!taxInvoice) {
    return {
      ...base,
      country: 'AE',
      taxInvoice: false,
      customerTaxId: '',
      customerTaxIdLabel: 'TRN',
      placeOfSupply: '',
      taxSplitMode: '',

      businessName: 'Dune & Palm Studio',
      businessAddress: 'Example Tower, Office 1204\nBusiness Bay, Dubai',
      businessEmail: 'hello@dunepalm.example',
      businessPhone: '+971 4 000 0000',
      businessWebsite: 'dunepalm.example',
      businessTaxId: '',
      businessTaxIdLabel: 'TRN',

      customerName: 'Mariam Al Mansoori',
      customerCompany: 'Oasis Retail',
      customerAddress: 'Example Mall\nAl Barsha, Dubai',
      customerEmail: 'mariam@oasisretail.example',

      number: 'INV-2026-073',
      currency: 'AED',
      taxLabel: 'VAT',
      paymentTerms: 'Net 30',
      paymentDetails: 'Bank transfer\nIBAN AE00 0000 0000 0000 0000 000\nSWIFT 00000000',

      items: [
        line('item-1', 'Brand identity', '1', '12000', ''),
        line('item-2', 'Campaign design, per hour', '6', '1800', ''),
      ],
    };
  }

  return {
    ...base,
    country: 'AE',
    taxInvoice: true,
    customerTaxId: '000000000000000',
    customerTaxIdLabel: 'TRN',
    placeOfSupply: '',
    taxSplitMode: '',

    businessName: 'Dune & Palm Studio',
    businessAddress: 'Example Tower, Office 1204\nBusiness Bay, Dubai',
    businessEmail: 'hello@dunepalm.example',
    businessPhone: '+971 4 000 0000',
    businessWebsite: 'dunepalm.example',
    businessTaxId: '000000000000000',
    businessTaxIdLabel: 'TRN',

    customerName: 'Mariam Al Mansoori',
    customerCompany: 'Oasis Retail',
    customerAddress: 'Example Mall\nAl Barsha, Dubai',
    customerEmail: 'mariam@oasisretail.example',

    number: 'INV-2026-081',
    currency: 'AED',
    taxLabel: 'VAT',
    paymentTerms: 'Net 30',
    paymentDetails: 'Bank transfer\nIBAN AE00 0000 0000 0000 0000 000\nSWIFT 00000000',

    items: [
      line('item-1', 'Brand identity', '1', '18000', '5'),
      line('item-2', 'Campaign design, per hour', '8', '2000', '5'),
    ],
  };
}

/** The full example, with today's dates. Used by the tests. */
export function countryInvoiceExample(
  country: CountryCode,
  taxInvoice: boolean,
  options: { interState?: boolean } = {},
): DocumentDraft {
  return hydrateCountryExample(
    countryInvoicePreset(country, taxInvoice, options),
    country,
    taxInvoice,
  );
}
