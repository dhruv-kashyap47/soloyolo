import { roundMoney, type DecimalInput } from '@/lib/finance/money';

export const CURRENCIES = [
  { code: 'USD', locale: 'en-US', label: 'USD (US dollar)' },
  { code: 'GBP', locale: 'en-GB', label: 'GBP (British pound)' },
  { code: 'CAD', locale: 'en-CA', label: 'CAD (Canadian dollar)' },
  { code: 'AUD', locale: 'en-AU', label: 'AUD (Australian dollar)' },
  { code: 'EUR', locale: 'en-IE', label: 'EUR (euro)' },
  { code: 'CHF', locale: 'en-CH', label: 'CHF (Swiss franc)' },
  { code: 'INR', locale: 'en-IN', label: 'INR (Indian rupee)' },
  { code: 'AED', locale: 'en-AE', label: 'AED (UAE dirham)' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  EUR: '€',
  CHF: 'CHF',
  INR: '₹',
  AED: 'AED',
};

/** The symbol drawn inside an amount field for a currency code. */
export function currencySymbol(code: CurrencyCode): string {
  return SYMBOLS[code];
}

const CURRENCY_BY_CODE = new Map<string, (typeof CURRENCIES)[number]>(
  CURRENCIES.map((currency) => [currency.code, currency]),
);

/** See the note in `number.ts`: exact numeric strings are supported at runtime. */
function formatExact(formatter: Intl.NumberFormat, value: string): string {
  return (formatter.format as unknown as (input: string) => string)(value);
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_BY_CODE.has(value);
}

/** The locale a currency is written in, so dates read the same way as money. */
export function currencyLocale(code: CurrencyCode): string {
  return CURRENCY_BY_CODE.get(code)?.locale ?? 'en-US';
}

export function formatCurrency(
  value: DecimalInput,
  currency: CurrencyCode,
  options: { decimals?: number } = {},
): string {
  const decimals = options.decimals ?? 2;
  // Round in Decimal, then hand Intl the exact fixed-point string. The value
  // never passes through a JS Number, so cents stay exact for every amount the
  // document limits allow. roundMoney normalises -0 to 0.
  const rounded = roundMoney(value, decimals);
  return formatExact(
    new Intl.NumberFormat(currencyLocale(currency), {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
    rounded.toFixed(decimals),
  );
}
