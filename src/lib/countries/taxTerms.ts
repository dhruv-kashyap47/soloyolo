import type { CountryCode } from '@/lib/countries/types';

/**
 * The tax name each supported market uses, kept small enough for the tax
 * calculator island. The country configs carry the rates, sources and page
 * copy; the calculator only needs the words.
 *
 * A unit test compares this list with `COUNTRIES`, so a new market cannot be
 * added to one without the other.
 */
export interface CountryTaxTerm {
  code: CountryCode;
  label: string;
  term: string;
  /** The body that sets or explains the tax. */
  setBy: string;
}

export const COUNTRY_TAX_TERMS: readonly CountryTaxTerm[] = [
  {
    code: 'US',
    label: 'United States',
    term: 'Sales tax',
    setBy: 'State and local governments',
  },
  {
    code: 'UK',
    label: 'United Kingdom',
    term: 'VAT',
    setBy: 'National rate',
  },
  {
    code: 'CA',
    label: 'Canada',
    term: 'GST / HST',
    setBy: 'Federal GST and provincial HST',
  },
  {
    code: 'AU',
    label: 'Australia',
    term: 'GST',
    setBy: 'National rate',
  },
  {
    code: 'DE',
    label: 'Germany',
    term: 'Umsatzsteuer',
    setBy: 'Federal rate, with a reduced rate for listed supplies',
  },
  {
    code: 'CH',
    label: 'Switzerland',
    term: 'MWST / TVA / IVA',
    setBy: 'Federal rate, named in the language of the invoice',
  },
  {
    code: 'IN',
    label: 'India',
    term: 'GST',
    setBy: 'GST Council, split into CGST + SGST or IGST',
  },
  {
    code: 'AE',
    label: 'United Arab Emirates',
    term: 'VAT',
    setBy: 'Federal Tax Authority',
  },
] as const;
