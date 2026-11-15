import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { percentOf, percentToFraction } from '@/lib/finance/percent';

describe('percentToFraction', () => {
  it('converts whole percentages', () => {
    expect(percentToFraction(40).toNumber()).toBe(0.4);
    expect(percentToFraction(100).toNumber()).toBe(1);
    expect(percentToFraction(0).toNumber()).toBe(0);
  });

  it('converts decimal percentages exactly', () => {
    expect(percentToFraction('12.5').toNumber()).toBe(0.125);
    expect(percentToFraction('37.5').toNumber()).toBe(0.375);
    expect(percentToFraction('0.1').toFixed(3)).toBe('0.001');
  });

  it('keeps the sign of negative percentages', () => {
    expect(percentToFraction(-20).toNumber()).toBe(-0.2);
  });

  it('accepts a Decimal without mutating it', () => {
    const percent = new Decimal(15);
    expect(percentToFraction(percent).toNumber()).toBe(0.15);
    expect(percent.toString()).toBe('15');
  });
});

describe('percentOf', () => {
  it('returns the amount a percentage represents', () => {
    expect(percentOf(105000, 10).toNumber()).toBe(10500);
    expect(percentOf(68000, 15).toNumber()).toBe(10200);
  });

  it('avoids binary floating point error', () => {
    // 0.1 + 0.2 arithmetic traps are the reason this project uses Decimal.
    expect(percentOf('0.3', '10').toFixed(2)).toBe('0.03');
    expect(percentOf('10.10', '7.5').toFixed(2)).toBe('0.76');
  });

  it('handles zero and negative percentages', () => {
    expect(percentOf(500, 0).toNumber()).toBe(0);
    expect(percentOf(500, -10).toNumber()).toBe(-50);
  });

  it('does not mutate its inputs', () => {
    const value = new Decimal('1234.56');
    const percent = new Decimal('8');
    percentOf(value, percent);
    expect(value.toString()).toBe('1234.56');
    expect(percent.toString()).toBe('8');
  });
});
