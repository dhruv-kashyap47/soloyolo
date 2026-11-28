import type { CurrencyCode } from '@/lib/formatting/currency';
import type { TaxIdLabel, TaxLabel } from '@/lib/generators/document';
import type { TaxSplitDefinition, TaxSplitMode } from '@/lib/generators/taxSplit';

/**
 * Country support, kept out of the components.
 *
 * One config per market drives the currency, the tax words, the registration
 * number, the printed title and the extra fields a tax invoice needs. The
 * official sources and the date they were checked travel with each config, so
 * a rate or a rule can be verified without reading the component code.
 */

export type CountryCode = 'US' | 'UK' | 'CA' | 'AU' | 'DE' | 'CH' | 'IN' | 'AE';

/**
 * A local format check for a registration number. The check is deliberately
 * lenient: it catches a typo or the wrong number pasted into the wrong field,
 * but it never claims to verify that the number is registered.
 */
export type TaxIdFormat = 'none' | 'gstin' | 'trn' | 'de-vat' | 'ch-mwst';

export interface CountryCustomerTaxId {
  label: TaxIdLabel;
  /** Required on a tax invoice where the customer is registered. */
  required: boolean;
  hint: string;
  placeholder: string;
  format: TaxIdFormat;
}

export interface CountryPlaceOfSupply {
  label: string;
  required: boolean;
  hint: string;
  options: readonly { value: string; label: string }[];
}

export interface CountryTaxSplit {
  label: string;
  hint: string;
  modes: readonly TaxSplitDefinition[];
  default: TaxSplitMode;
}

export interface CountrySignatureLine {
  label: string;
  note: string;
}

export interface CountryHsnCode {
  label: string;
  /** Required on a GST tax invoice, optional on a normal invoice. */
  requiredOnTaxInvoice: boolean;
  hint: string;
  placeholder: string;
}

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

export interface CountryTaxRuntime {
  /** The default document tax label. */
  label: TaxLabel;
  /** The tax labels this country's documents can use. */
  labels: readonly TaxLabel[];
  /** The default words for the registration number. */
  registrationLabel: TaxIdLabel;
  /** The registration labels this country's documents can use. */
  registrationLabels: readonly TaxIdLabel[];
  /** The local format check applied to a filled-in registration number. */
  registrationFormat: TaxIdFormat;
  registrationFormatNote: string;
  /** The usual rate as a decimal string. "0" means no default rate. */
  standardRatePercent: string;
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
  /** Required on a normal invoice too, not only a tax invoice. */
  registrationRequiredOnAllInvoices: boolean;
  /** Required once the document total reaches this amount. */
  registrationRequiredOver: number | null;
  customerAddressRequired: boolean;
  supplierAddressRequired: boolean;
  /** True when the country's rules use a separate supply date. */
  supplyDateField: boolean;
  /** Required once the document total reaches this amount. */
  paymentTermsRequiredOver: number | null;
}

/** The tax facts that stay in the build: prose, examples and the rate table. */
export interface CountryTaxConfig extends CountryTaxRuntime {
  /** The tax name in prose, for example "VAT". */
  name: string;
  registrationExample: string;
  rates: readonly CountryTaxRate[];
}

/**
 * A cross-border treatment the generator can print.
 *
 * The option does not decide the tax treatment. It records the one the
 * freelancer has already decided on, prints the wording that market expects,
 * and removes tax from the lines when the supply is not taxed at home. Every
 * option carries the sentence it prints, so a wording change is a data change
 * and never a component change.
 */
export interface CountryCrossBorderOption {
  /** Stable id stored in the draft. */
  value: string;
  /** The select label. */
  label: string;
  /** One line under the select, explaining when it applies. */
  hint: string;
  /** The sentence printed on the document. */
  endorsement: string;
  /** True when the treatment removes tax from every line. */
  zeroRated: boolean;
  /** True when the customer's tax number is needed for this treatment. */
  customerTaxIdRequired?: boolean;
  customerTaxIdLabel?: string;
  customerTaxIdHint?: string;
  customerTaxIdPlaceholder?: string;
  /** The words printed in front of the customer's tax number. */
  customerTaxIdPrintedLabel?: string;
  /** True when the place-of-supply control does not apply. */
  hidesPlaceOfSupply?: boolean;
  /** The label the supplier's own number must use for this treatment. */
  supplierTaxIdLabel?: TaxIdLabel;
}

export interface CountryInvoiceRuntime {
  dueDays: number;
  paymentTerms: string;
  paymentDetails: string;
  /**
   * The sentence a market prints when the supplier charges no VAT, where it
   * has one (Germany's § 19 UStG note). The generator swaps it out when tax
   * invoice mode is switched on, so a registered invoice never carries a
   * Kleinunternehmer claim.
   */
  noVatNote?: string;
  /** The title printed on a normal invoice. */
  documentTitle: string;
  /** The longest invoice number this market allows, when it sets one. */
  numberMaxLength?: number;
  /** The customer registration field, where the market asks for one. */
  customerTaxId?: CountryCustomerTaxId;
  /** The cross-border treatments this market's documents can print. */
  crossBorder?: readonly CountryCrossBorderOption[];
  /** The select label for the cross-border control. */
  crossBorderLabel?: string;
  /** The place of supply field, where the market asks for one. */
  placeOfSupply?: CountryPlaceOfSupply;
  /** The GST display split, where the market asks for one. */
  taxSplit?: CountryTaxSplit;
  /** A signature line printed on the sheet, where the market asks for one. */
  signatureLine?: CountrySignatureLine;
  /** The per-line HSN/SAC field, where the market asks for one. */
  hsnCode?: CountryHsnCode;
  taxIdPlaceholder: string;
  businessAddressPlaceholder: string;
  customerAddressPlaceholder: string;
  paymentDetailsPlaceholder: string;
}

/** The invoice defaults that stay in the build. */
export interface CountryInvoiceDefaults extends CountryInvoiceRuntime {
  notes: string;
  numberPrefix: string;
}

/**
 * The shape the generator island actually reads.
 *
 * It carries the currency, the tax words, the labels, the rates that become a
 * default, and the fields the form and the sheet render. The prose, the rate
 * table, the official sources and the verification date live on the full
 * config below and never reach the browser.
 */
export interface CountryRuntimeConfig {
  code: CountryCode;
  name: string;
  currency: CurrencyCode;
  tax: CountryTaxRuntime;
  invoice: CountryInvoiceRuntime;
}

/** The full config used by the build, the country pages and the tests. */
export interface CountryConfig
  extends Omit<CountryRuntimeConfig, 'tax' | 'invoice'> {
  shortName: string;
  adjective: string;
  tax: CountryTaxConfig;
  invoice: CountryInvoiceDefaults;
  sources: readonly CountrySource[];
  /** The day every claim in this config was checked against the sources. */
  verifiedOn: string;
}
