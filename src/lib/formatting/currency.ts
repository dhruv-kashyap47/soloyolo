import { toDisplayNumber, type DecimalInput } from '@/lib/finance/money';

export const CURRENCIES = [
  { code: 'USD', locale: 'en-US', label: 'USD (US dollar)' },
  { code: 'GBP', locale: 'en-GB', label: 'GBP (British pound)' },
  { code: 'CAD', locale: 'en-CA', label: 'CAD (Canadian dollar)' },
  { code: 'AUD', locale: 'en-AU', label: 'AUD (Australian dollar)' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
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
  return new Intl.NumberFormat(currencyLocale(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toDisplayNumber(value));
}
