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
  kind: 'invoice' | 'vat-invoice' | 'gst-hst-invoice' | 'gst-invoice' | 'tax-invoice';
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
  {
    id: 'de-invoice',
    country: 'DE',
    taxInvoice: false,
    href: '/de/invoice-generator/',
    name: 'German Invoice Generator',
    navLabel: 'Germany invoices',
    summary: 'EUR, Rechnung wording and a Kleinunternehmer invoice with no VAT.',
    kind: 'invoice',
  },
  {
    id: 'de-vat-invoice',
    country: 'DE',
    taxInvoice: true,
    href: '/de/vat-invoice-generator/',
    name: 'German VAT Invoice Generator',
    navLabel: 'Germany VAT invoices',
    summary: 'A Rechnung with USt-IdNr., 19% Umsatzsteuer and the supply date.',
    kind: 'vat-invoice',
  },
  {
    id: 'ch-invoice',
    country: 'CH',
    taxInvoice: false,
    href: '/ch/invoice-generator/',
    name: 'Swiss Invoice Generator',
    navLabel: 'Switzerland invoices',
    summary: 'CHF, INVOICE in English and a non-registered business with no VAT.',
    kind: 'invoice',
  },
  {
    id: 'ch-vat-invoice',
    country: 'CH',
    taxInvoice: true,
    href: '/ch/vat-invoice-generator/',
    name: 'Swiss VAT Invoice Generator',
    navLabel: 'Switzerland VAT invoices',
    summary: 'An 8.1% MWST invoice with the CHE number and the Art. 26 details.',
    kind: 'vat-invoice',
  },
  {
    id: 'in-invoice',
    country: 'IN',
    taxInvoice: false,
    href: '/in/invoice-generator/',
    name: 'India Invoice Generator',
    navLabel: 'India invoices',
    summary: 'INR, GST terms and an Indian invoice for a non-registered business.',
    kind: 'invoice',
  },
  {
    id: 'in-gst-invoice',
    country: 'IN',
    taxInvoice: true,
    href: '/in/gst-invoice-generator/',
    name: 'GST Invoice Generator',
    navLabel: 'India GST invoices',
    summary: 'A GST tax invoice with GSTIN, place of supply and CGST + SGST or IGST.',
    kind: 'gst-invoice',
  },
  {
    id: 'ae-invoice',
    country: 'AE',
    taxInvoice: false,
    href: '/ae/invoice-generator/',
    name: 'UAE Invoice Generator',
    navLabel: 'UAE invoices',
    summary: 'AED, VAT terms and an invoice for a business that is not VAT registered.',
    kind: 'invoice',
  },
  {
    id: 'ae-vat-invoice',
    country: 'AE',
    taxInvoice: true,
    href: '/ae/vat-invoice-generator/',
    name: 'UAE VAT Invoice Generator',
    navLabel: 'UAE VAT invoices',
    summary: 'A tax invoice with the supplier TRN, a customer TRN and 5% VAT.',
    kind: 'vat-invoice',
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
