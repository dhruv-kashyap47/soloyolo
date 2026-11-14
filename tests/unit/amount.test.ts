import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';

import { parseAmountInput } from '@/lib/validation/amount';

function value(raw: string): string | null {
  const parsed = parseAmountInput(raw);
  return parsed ? parsed.toFixed(4) : null;
}

describe('parseAmountInput', () => {
  it('parses plain integers and decimals', () => {
    expect(value('80000')).toBe('80000.0000');
    expect(value('0')).toBe('0.0000');
    expect(value('76.5')).toBe('76.5000');
    expect(value('.5')).toBe('0.5000');
    expect(value('5.')).toBe('5.0000');
  });

  it('parses thousand separators and currency symbols', () => {
    expect(value('$1,250.50')).toBe('1250.5000');
    expect(value('£45,000')).toBe('45000.0000');
    expect(value('C$1,000')).toBe('1000.0000');
    expect(value('A$2,500.75')).toBe('2500.7500');
    expect(value('1,000,000')).toBe('1000000.0000');
    expect(value('1 234 567')).toBe('1234567.0000');
  });

  it('treats a single comma with two decimals as a decimal comma', () => {
    expect(value('12,50')).toBe('12.5000');
    expect(value('1 200,50')).toBe('1200.5000');
  });

  it('parses accounting negatives and signed values', () => {
    expect(value('(250)')).toBe('-250.0000');
    expect(value('(1,250.50)')).toBe('-1250.5000');
    expect(value('-500')).toBe('-500.0000');
    expect(value('−500')).toBe('-500.0000');
    expect(value('-$500')).toBe('-500.0000');
    expect(value('$-500')).toBe('-500.0000');
    expect(value('+250')).toBe('250.0000');
  });

  it('rejects empty and malformed input instead of coercing to zero', () => {
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('   ')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
    expect(parseAmountInput('12abc')).toBeNull();
    expect(parseAmountInput('1.2.3')).toBeNull();
    expect(parseAmountInput('1,23,456')).toBeNull();
    expect(parseAmountInput('1,2345')).toBeNull();
    expect(parseAmountInput('$')).toBeNull();
    expect(parseAmountInput('-')).toBeNull();
    expect(parseAmountInput('50%')).toBeNull();
    expect(parseAmountInput('1e5')).toBeNull();
    expect(parseAmountInput('Infinity')).toBeNull();
    expect(parseAmountInput('NaN')).toBeNull();
  });

  it('keeps full precision for long decimals', () => {
    const parsed = parseAmountInput('123456789.123456789');
    expect(parsed).toBeInstanceOf(Decimal);
    expect(parsed?.toFixed(9)).toBe('123456789.123456789');
  });
});
