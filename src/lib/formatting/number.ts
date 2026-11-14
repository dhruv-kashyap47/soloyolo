import { toDisplayNumber, type DecimalInput } from '@/lib/finance/money';

export function formatNumber(
  value: DecimalInput,
  options: { decimals?: number; locale?: string } = {},
): string {
  const decimals = options.decimals ?? 0;
  return new Intl.NumberFormat(options.locale ?? 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toDisplayNumber(value));
}

export function formatPercent(value: DecimalInput, decimals = 1, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toDisplayNumber(value));
}
