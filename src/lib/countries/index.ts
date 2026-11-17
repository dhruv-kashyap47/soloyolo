import type { CurrencyCode } from '@/lib/formatting/currency';
import type { TaxIdLabel, TaxLabel } from '@/lib/generators/document';
import type { TaxSplitDefinition, TaxSplitMode } from '@/lib/generators/taxSplit';

import { AE } from '@/lib/countries/ae';
import { AU } from '@/lib/countries/au';
import { CA } from '@/lib/countries/ca';
import { CH } from '@/lib/countries/ch';
import { DE } from '@/lib/countries/de';
import { IN } from '@/lib/countries/in';
import { UK } from '@/lib/countries/uk';
import { US } from '@/lib/countries/us';
import type { CountryCode, CountryConfig } from '@/lib/countries/types';

/** Every supported market, in the order the site presents them. */
export const COUNTRIES: readonly CountryConfig[] = [US, UK, CA, AU, DE, CH, IN, AE] as const;

const BY_CODE = new Map<CountryCode, CountryConfig>(
  COUNTRIES.map((country) => [country.code, country]),
);

const CODE_BY_CURRENCY: Record<CurrencyCode, CountryCode> = {
  USD: 'US',
  GBP: 'UK',
  CAD: 'CA',
  AUD: 'AU',
  EUR: 'DE',
  CHF: 'CH',
  INR: 'IN',
  AED: 'AE',
};

export function isCountryCode(value: string): value is CountryCode {
  return BY_CODE.has(value as CountryCode);
}

export function getCountryConfig(code: CountryCode): CountryConfig {
  const country = BY_CODE.get(code);
  if (!country) throw new Error(`Unknown country: ${code}`);
  return country;
}

/** The market a currency belongs to. Used when a saved profile is restored. */
export function countryForCurrency(currency: CurrencyCode): CountryCode {
  return CODE_BY_CURRENCY[currency];
}

/** The line rate a country starts a document with. An empty input means none. */
export function defaultLineTax(config: CountryConfig): string {
  return config.tax.standardRatePercent === '0' ? '' : config.tax.standardRatePercent;
}

/**
 * The usual line rate for a tax name. Canada is the only market where the name
 * changes the rate on this page: GST is 5%, and the example HST rate is 13%
 * (Ontario). A Nova Scotia invoice changes 13 to 14 by hand.
 */
export function lineTaxForLabel(config: CountryConfig, label: TaxLabel): string {
  if (config.code === 'CA' && label === 'GST') return '5';
  if (config.code === 'CA' && label === 'HST') return '13';
  return defaultLineTax(config);
}

/**
 * The registration label for a tax name. Canada is the only market where the
 * tax name changes the number: a GST invoice shows a GST number, an HST
 * invoice shows an HST number.
 */
export function taxIdLabelFor(config: CountryConfig, label: TaxLabel): TaxIdLabel {
  if (config.code === 'CA' && label === 'GST') return 'GST number';
  if (config.code === 'CA' && label === 'HST') return 'HST number';
  return config.tax.registrationLabel;
}

/**
 * The split definition a document is using, or null where the market does not
 * split its tax. The preview and the copied text read this from the country,
 * so the printed rows and the model can never disagree.
 */
export function taxSplitFor(
  config: CountryConfig,
  mode: TaxSplitMode | '',
): TaxSplitDefinition | null {
  return config.invoice.taxSplit?.modes.find((entry) => entry.id === mode) ?? null;
}

export type { CountryCode, CountryConfig };
