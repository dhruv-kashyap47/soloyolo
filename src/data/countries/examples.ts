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
): LineItemDraft {
  return { id, description, quantity, unitPrice, discountPercent: '', taxPercent };
}

/**
 * The worked example behind a country page, without its dates.
 *
 * The country page renders this object into the island's props, so the four
 * examples travel as HTML rather than as JavaScript. `hydrateCountryExample`
 * fills the dates in the browser, which keeps an example from going stale.
 *
 * The US example leaves sales tax at zero on purpose: whether a sale is
 * taxable depends on the seller's registration and the place of supply, and
 * the tool does not guess either.
 */
export function countryInvoicePreset(
  country: CountryCode,
  taxInvoice: boolean,
): CountryExamplePreset {
  const base = { ...ukInvoiceExample(), issueDate: '', dueDate: '', supplyDate: '' };

  if (country === 'UK') {
    return { ...base, taxInvoice };
  }

  if (country === 'US') {
    return {
      ...base,
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

  return {
    ...base,
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

/** The full example, with today's dates. Used by the tests. */
export function countryInvoiceExample(country: CountryCode, taxInvoice: boolean): DocumentDraft {
  return hydrateCountryExample(countryInvoicePreset(country, taxInvoice), country, taxInvoice);
}
