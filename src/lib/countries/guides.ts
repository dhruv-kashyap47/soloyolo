import type { CountryCode } from '@/lib/countries/types';

/**
 * The country invoice guides, kept as a small runtime registry.
 *
 * Pages, the footer and the invoice generator read the same list, so a new
 * market page is wired up once. The long copy stays in `data/countries/pages.ts`
 * and never reaches the browser bundle.
 */
export interface CountryGuideLink {
  id: string;
  country: CountryCode;
  taxInvoice: boolean;
  href: string;
  name: string;
  /** The short name used in the footer and the hub. */
  navLabel: string;
  summary: string;
  kind: 'invoice' | 'vat-invoice' | 'gst-hst-invoice' | 'tax-invoice';
}

export const COUNTRY_GUIDES: readonly CountryGuideLink[] = [
  {
    id: 'us-invoice',
    country: 'US',
    taxInvoice: false,
    href: '/us/invoice-generator/',
    name: 'US Invoice Generator',
    navLabel: 'US invoices',
    summary: 'USD, sales tax you enter yourself, and an optional EIN.',
    kind: 'invoice',
  },
  {
    id: 'uk-invoice',
    country: 'UK',
    taxInvoice: false,
    href: '/uk/invoice-generator/',
    name: 'UK Invoice Generator',
    navLabel: 'UK invoices',
    summary: 'GBP, VAT fields and a 14 day default for a normal UK invoice.',
    kind: 'invoice',
  },
  {
    id: 'uk-vat-invoice',
    country: 'UK',
    taxInvoice: true,
    href: '/uk/vat-invoice-generator/',
    name: 'VAT Invoice Generator',
    navLabel: 'UK VAT invoices',
    summary: 'A full VAT invoice with the VAT number, customer address and supply date.',
    kind: 'vat-invoice',
  },
  {
    id: 'ca-invoice',
    country: 'CA',
    taxInvoice: false,
    href: '/ca/invoice-generator/',
    name: 'Canada Invoice Generator',
    navLabel: 'Canada invoices',
    summary: 'CAD, GST or HST, and a business number when the total needs one.',
    kind: 'invoice',
  },
  {
    id: 'ca-gst-hst-invoice',
    country: 'CA',
    taxInvoice: true,
    href: '/ca/gst-hst-invoice-generator/',
    name: 'GST/HST Invoice Generator',
    navLabel: 'Canada GST/HST invoices',
    summary: 'A GST/HST invoice with the rate and registration details for an input tax credit.',
    kind: 'gst-hst-invoice',
  },
  {
    id: 'au-invoice',
    country: 'AU',
    taxInvoice: false,
    href: '/au/invoice-generator/',
    name: 'Australia Invoice Generator',
    navLabel: 'Australia invoices',
    summary: 'AUD, GST and an ABN, with tax invoice mode when you need it.',
    kind: 'invoice',
  },
  {
    id: 'au-tax-invoice',
    country: 'AU',
    taxInvoice: true,
    href: '/au/tax-invoice-generator/',
    name: 'Tax Invoice Generator',
    navLabel: 'Australia tax invoices',
    summary: 'A tax invoice with the ABN and the buyer details required over $1,000.',
    kind: 'tax-invoice',
  },
] as const;

const BY_ID = new Map(COUNTRY_GUIDES.map((guide) => [guide.id, guide]));

export function findCountryGuide(id: string): CountryGuideLink {
  const guide = BY_ID.get(id);
  if (!guide) throw new Error(`Unknown country guide: ${id}`);
  return guide;
}

export function guidesForCountry(code: CountryCode): CountryGuideLink[] {
  return COUNTRY_GUIDES.filter((guide) => guide.country === code);
}
