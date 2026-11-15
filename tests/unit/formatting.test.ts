import { describe, expect, it } from 'vitest';

import { formatCurrency } from '@/lib/formatting/currency';
import { formatNumber, formatPercent, formatGroupedInput, digitsBefore, caretAfterDigits } from '@/lib/formatting/number';

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

describe('typed amount formatting', () => {
  it('groups thousands with the locale separator', () => {
    expect(formatGroupedInput('80000')).toBe('80,000');
    expect(formatGroupedInput('1234567')).toBe('1,234,567');
    expect(formatGroupedInput('80,000')).toBe('80,000');
    expect(formatGroupedInput('1200')).toBe('1,200');
  });

  it('keeps the decimal part as typed and allows a trailing separator', () => {
    expect(formatGroupedInput('1234.5', { decimals: true })).toBe('1,234.5');
    expect(formatGroupedInput('1234.', { decimals: true })).toBe('1,234.');
    expect(formatGroupedInput('0.25', { decimals: true })).toBe('0.25');
    expect(formatGroupedInput('1234.5')).toBe('1234.5');
  });

  it('leaves text that is not a number untouched, so validation can report it', () => {
    expect(formatGroupedInput('eighty thousand')).toBe('eighty thousand');
    expect(formatGroupedInput('')).toBe('');
    expect(formatGroupedInput('12 34')).toBe('12 34');
  });

  it('restores the caret after the same digit it was after', () => {
    expect(digitsBefore('80,000', 7)).toBe(5);
    expect(caretAfterDigits('80,000', 5)).toBe(6);
    expect(caretAfterDigits('1,234', 4)).toBe(5);
    expect(caretAfterDigits('80,000', 2)).toBe(2);
    expect(caretAfterDigits('80,000', 0)).toBe(0);
  });
});