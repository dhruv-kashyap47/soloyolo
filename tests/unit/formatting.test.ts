import { describe, expect, it } from 'vitest';

import { formatCurrency } from '@/lib/formatting/currency';
import { formatNumber, formatPercent } from '@/lib/formatting/number';

describe('currency formatting', () => {
  it('formats each supported currency with two decimals', () => {
    expect(formatCurrency('76.6667', 'USD')).toBe('$76.67');
    expect(formatCurrency('55.4347', 'GBP')).toBe('£55.43');
    expect(formatCurrency('113.3333', 'AUD')).toBe('$113.33');
    expect(formatCurrency('1234.5', 'CAD')).toBe('$1,234.50');
  });

  it('supports a custom number of decimals for the exact-rate note', () => {
    expect(formatCurrency('76.666666', 'USD', { decimals: 4 })).toBe('$76.6667');
  });

  it('formats zero and large values', () => {
    expect(formatCurrency('0', 'USD')).toBe('$0.00');
    expect(formatCurrency('2000000000', 'USD')).toBe('$2,000,000,000.00');
  });
});

describe('number formatting', () => {
  it('groups thousands and respects decimals', () => {
    expect(formatNumber('1200')).toBe('1,200');
    expect(formatNumber('1091.25', { decimals: 2 })).toBe('1,091.25');
    expect(formatNumber('0')).toBe('0');
  });

  it('formats percentages in the Intl style', () => {
    expect(formatPercent('0.2', 1)).toBe('20.0%');
    expect(formatPercent('0.075')).toBe('7.5%');
  });
});
