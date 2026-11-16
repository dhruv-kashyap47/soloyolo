import type { CurrencyCode } from '@/lib/formatting/currency';
import type { TaxIdLabel, TaxLabel } from '@/lib/generators/document';

/**
 * Country support, kept out of the components.
 *
 * One config per market drives the currency, the tax words, the registration
 * number, the printed title and the extra fields a tax invoice needs. The
 * official sources and the date they were checked travel with each config, so
 * a rate or a rule can be verified without reading the component code.
 */

export type CountryCode = 'US' | 'UK' | 'CA' | 'AU';

export interface CountrySource {
  /** A stable id the country pages use to cite a subset of the sources. */
  id: string;
  label: string;
  url: string;
  /** What this source supports. */
  note: string;
}

export interface CountryTaxRate {
  label: string;
  /** The rate as a decimal string, or null when no single rate applies. */
  ratePercent: string | null;
  note: string;
}

export interface CountryTaxConfig {
  /** The tax name in prose, for example "VAT". */
  name: string;
  /** The default document tax label. */
  label: TaxLabel;
  /** The tax labels this country's documents can use. */
  labels: readonly TaxLabel[];
  /** The default words for the registration number. */
  registrationLabel: TaxIdLabel;
  /** The registration labels this country's documents can use. */
  registrationLabels: readonly TaxIdLabel[];
  registrationExample: string;
  registrationFormatNote: string;
  /** The usual rate as a decimal string. "0" means no default rate. */
  standardRatePercent: string;
  rates: readonly CountryTaxRate[];
  /** One line under the tax controls in the generator. */
  rateHint: string;
  /** True when the country has a meaningful tax invoice variant. */
  supportsTaxInvoice: boolean;
  /** The checkbox label in the generator. */
  taxInvoiceLabel: string;
  /** What turning the tax invoice mode on does. */
  taxInvoiceHint: string;
  /** The title printed when the tax invoice mode is on. */
  taxInvoiceTitle: string;
  /** Required on a tax invoice whatever the total. */
  registrationRequired: boolean;
  /** Required once the document total reaches this amount. */
  registrationRequiredOver: number | null;
  customerAddressRequired: boolean;
  supplierAddressRequired: boolean;
  /** True when the country's rules use a separate supply date. */
  supplyDateField: boolean;
  /** Required once the document total reaches this amount. */
  paymentTermsRequiredOver: number | null;
}

export interface CountryInvoiceDefaults {
  dueDays: number;
  paymentTerms: string;
  paymentDetails: string;
  notes: string;
  numberPrefix: string;
  taxIdPlaceholder: string;
  businessAddressPlaceholder: string;
  customerAddressPlaceholder: string;
  paymentDetailsPlaceholder: string;
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  shortName: string;
  adjective: string;
  currency: CurrencyCode;
  tax: CountryTaxConfig;
  invoice: CountryInvoiceDefaults;
  sources: readonly CountrySource[];
  /** The day every claim in this config was checked against the sources. */
  verifiedOn: string;
}
