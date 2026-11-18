import { toDisplayNumber, type DecimalInput } from '@/lib/finance/money';

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
  const number = toDisplayNumber(value);
  // A value that rounds to zero must not keep a minus sign ("-$0.00").
  const normalized = Math.abs(number) < 0.5 * 10 ** -decimals ? 0 : number;
  return new Intl.NumberFormat(currencyLocale(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(normalized);
}
