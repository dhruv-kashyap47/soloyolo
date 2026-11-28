import { describe, expect, it } from 'vitest';

import { numberFieldClasses } from '@/components/forms/fieldClasses';
import { currencySymbol, formatCurrency, type CurrencyCode } from '@/lib/formatting/currency';
import { formatNumber, formatPercent, formatGroupedInput, digitsBefore, caretAfterDigits } from '@/lib/formatting/number';

describe('currency formatting', () => {
  it('formats each supported currency with two decimals', () => {
    expect(formatCurrency('76.6667', 'USD')).toBe('$76.67');
    expect(formatCurrency('55.4347', 'GBP')).toBe('£55.43');
    expect(formatCurrency('113.3333', 'AUD')).toBe('$113.33');
    expect(formatCurrency('1234.5', 'CAD')).toBe('$1,234.50');
    expect(formatCurrency('1234.5', 'EUR')).toBe('€1,234.50');
  });

  it('writes the rupee with Indian lakh and crore grouping', () => {
    expect(formatCurrency('1234567.89', 'INR')).toContain('₹');
    expect(formatCurrency('1234567.89', 'INR')).toContain('12,34,567.89');
    expect(formatCurrency('100000', 'INR')).toContain('1,00,000.00');
  });

  it('prints the CHF and AED codes as the prefix', () => {
    const chf = formatCurrency('1234.5', 'CHF').replace(/\s/g, ' ');
    const aed = formatCurrency('1234.5', 'AED').replace(/\s/g, ' ');

    expect(chf).toMatch(/^CHF\s?1/);
    expect(aed).toMatch(/^AED\s?1/);
  });

  it('keeps the symbol the form field draws', () => {
    const symbols: Record<CurrencyCode, string> = {
      USD: '$',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
      EUR: '€',
      CHF: 'CHF',
      INR: '₹',
      AED: 'AED',
    };

    for (const [code, symbol] of Object.entries(symbols)) {
      expect(currencySymbol(code as CurrencyCode)).toBe(symbol);
    }
  });

  it('widens the amount field for a three character currency mark', () => {
    const narrow = numberFieldClasses({ hasPrefix: true, hasSuffix: false, prefix: '€' });
    const wide = numberFieldClasses({ hasPrefix: true, hasSuffix: false, prefix: 'CHF' });

    expect(narrow).toContain('field-input--prefix');
    expect(narrow).not.toContain('field-input--prefix-wide');
    expect(wide).toContain('field-input--prefix-wide');
    expect(wide).not.toContain('undefined');
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

  it('groups typed amounts in the currency locale', () => {
    expect(formatGroupedInput('100300', { decimals: true, locale: 'en-IN' })).toBe('1,00,300');
    expect(formatGroupedInput('1,00,300', { decimals: true, locale: 'en-IN' })).toBe('1,00,300');

    const chfGrouped = formatGroupedInput('1234.5', { decimals: true, locale: 'en-CH' });
    expect(chfGrouped).toBe(new Intl.NumberFormat('en-CH').format(1234.5));

    const chfWhole = formatGroupedInput('12345', { decimals: true, locale: 'en-CH' });
    expect(formatGroupedInput(`${chfWhole}6`, { decimals: true, locale: 'en-CH' })).toBe(
      new Intl.NumberFormat('en-CH').format(123456),
    );
  });

  it('keeps the decimal part as typed and allows a trailing separator', () => {
    expect(formatGroupedInput('1234.5', { decimals: true })).toBe('1,234.5');
    expect(formatGroupedInput('1234.', { decimals: true })).toBe('1,234.');
    expect(formatGroupedInput('0.25', { decimals: true })).toBe('0.25');
    expect(formatGroupedInput('1234.5')).toBe('1234.5');
  });

  it('keeps a short comma tail as a decimal comma instead of regrouping it', () => {
    expect(formatGroupedInput('7,', { decimals: true })).toBe('7,');
    expect(formatGroupedInput('7,5', { decimals: true })).toBe('7,5');
    expect(formatGroupedInput('12,50', { decimals: true })).toBe('12,50');
    // Three digits after the comma is still thousands grouping.
    expect(formatGroupedInput('1,200', { decimals: true })).toBe('1,200');
  });

  it('leaves text that is not a number untouched, so validation can report it', () => {
    expect(formatGroupedInput('eighty thousand')).toBe('eighty thousand');
    expect(formatGroupedInput('')).toBe('');
    expect(formatGroupedInput('12 34')).toBe('1,234');
  });

  it('does not rewrite a malformed comma layout into a different number', () => {
    // Regression: 1.234,56 used to lose its comma and become 1.23456 (a
    // thousand times too small) before validation ever saw it.
    expect(formatGroupedInput('1.234,56', { decimals: true })).toBe('1.234,56');
    expect(formatGroupedInput('5,,0', { decimals: true })).toBe('5,,0');
    expect(formatGroupedInput('1,2,3', { decimals: true })).toBe('1,2,3');
    // Whole-number fields must not drop a comma either: 4,6 is not 46.
    expect(formatGroupedInput('4,6')).toBe('4,6');
    expect(formatGroupedInput('1,2,3')).toBe('1,2,3');
    // A real grouped amount still regroups normally.
    expect(formatGroupedInput('1,234.56', { decimals: true })).toBe('1,234.56');
  });

  it('restores the caret after the same digit it was after', () => {
    expect(digitsBefore('80,000', 7)).toBe(5);
    expect(caretAfterDigits('80,000', 5)).toBe(6);
    expect(caretAfterDigits('1,234', 4)).toBe(5);
    expect(caretAfterDigits('80,000', 2)).toBe(2);
    expect(caretAfterDigits('80,000', 0)).toBe(0);
  });
});