import { describe, expect, it } from 'vitest';

import { roundMoney, safeDivide, sumDecimals, toDecimal } from '@/lib/finance/money';

describe('decimal money helpers', () => {
  it('rounds half-up at the cent boundary', () => {
    expect(roundMoney('1.005').toFixed(2)).toBe('1.01');
    expect(roundMoney('2.675').toFixed(2)).toBe('2.68');
    expect(roundMoney('1.004').toFixed(2)).toBe('1.00');
    expect(roundMoney('0.005').toFixed(2)).toBe('0.01');
    expect(roundMoney('-1.005').toFixed(2)).toBe('-1.01');
  });

  it('avoids binary floating point artefacts', () => {
    expect(sumDecimals(['0.1', '0.2']).toFixed(20)).toBe('0.30000000000000000000');
    expect(toDecimal('0.1').plus('0.2').equals('0.3')).toBe(true);
    expect(toDecimal('0.1').plus('0.2').toNumber()).not.toBe(0.30000000000000004);
  });

  it('sums empty and mixed lists', () => {
    expect(sumDecimals([]).toNumber()).toBe(0);
    expect(sumDecimals(['10', '20.5', '-0.5']).toNumber()).toBe(30);
  });

  it('returns null instead of dividing by zero', () => {
    expect(safeDivide(100, 0)).toBeNull();
    expect(safeDivide(0, 100)?.toNumber()).toBe(0);
    expect(safeDivide(92_000, 1_200)?.toFixed(4)).toBe('76.6667');
  });

  it('keeps enough precision for repeated division', () => {
    const rate = toDecimal('92000').dividedBy('1200');
    const back = rate.times('1200');
    expect(back.toFixed(10)).toBe('92000.0000000000');
  });
});
