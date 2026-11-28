import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { calculateProjectProfit, type ProjectProfitInput } from '@/lib/calculators/projectProfit';

function input(
  overrides: Partial<Record<keyof ProjectProfitInput, string>> = {},
): ProjectProfitInput {
  const values = {
    revenue: '12000',
    labor: '5000',
    contractor: '1500',
    software: '300',
    other: '200',
    overhead: '1000',
    ...overrides,
  };

  return {
    revenue: new Decimal(values.revenue),
    labor: new Decimal(values.labor),
    contractor: new Decimal(values.contractor),
    software: new Decimal(values.software),
    other: new Decimal(values.other),
    overhead: new Decimal(values.overhead),
  };
}

function expectOk(outcome: ReturnType<typeof calculateProjectProfit>) {
  if (!outcome.ok) throw new Error(`Expected success, got ${outcome.code}: ${outcome.message}`);
  return outcome.value;
}

describe('calculateProjectProfit', () => {
  it('matches the documented worked example', () => {
    const result = expectOk(calculateProjectProfit(input()));

    expect(result.directCosts.toNumber()).toBe(7000);
    expect(result.totalCosts.toNumber()).toBe(8000);
    expect(result.grossProfit.toNumber()).toBe(5000);
    expect(result.profit.toNumber()).toBe(4000);
    expect(result.profitRounded.toFixed(2)).toBe('4000.00');
    expect(result.margin?.toFixed(4)).toBe('0.3333');
    expect(result.markup?.toFixed(4)).toBe('0.5000');
  });

  it('calculates the UK and Canadian examples', () => {
    const uk = expectOk(
      calculateProjectProfit(
        input({
          revenue: '4500',
          labor: '2200',
          contractor: '600',
          software: '150',
          other: '100',
          overhead: '450',
        }),
      ),
    );
    expect(uk.directCosts.toNumber()).toBe(3050);
    expect(uk.totalCosts.toNumber()).toBe(3500);
    expect(uk.profit.toNumber()).toBe(1000);
    expect(uk.margin?.toFixed(4)).toBe('0.2222');
    expect(uk.markup?.toFixed(4)).toBe('0.2857');

    const ca = expectOk(
      calculateProjectProfit(
        input({
          revenue: '9000',
          labor: '6500',
          contractor: '2000',
          software: '400',
          other: '150',
          overhead: '1200',
        }),
      ),
    );
    expect(ca.totalCosts.toNumber()).toBe(10250);
    expect(ca.profit.toNumber()).toBe(-1250);
    expect(ca.profitRounded.toFixed(2)).toBe('-1250.00');
    expect(ca.margin?.toFixed(4)).toBe('-0.1389');
    expect(ca.markup?.toFixed(4)).toBe('-0.1220');
  });

  it('reports a loss without hiding it', () => {
    const result = expectOk(calculateProjectProfit(input({ revenue: '5000' })));
    expect(result.profit.toNumber()).toBe(-3000);
    expect(result.profit.isNegative()).toBe(true);
    expect(result.margin?.isNegative()).toBe(true);
    expect(result.markup?.isNegative()).toBe(true);
  });

  it('returns a null margin when revenue is zero', () => {
    const result = expectOk(
      calculateProjectProfit(
        input({
          revenue: '0',
          labor: '500',
          contractor: '0',
          software: '0',
          other: '0',
          overhead: '0',
        }),
      ),
    );
    expect(result.profit.toNumber()).toBe(-500);
    expect(result.margin).toBeNull();
    expect(result.markup?.toNumber()).toBe(-1);
  });

  it('returns a null markup when every cost is zero', () => {
    const result = expectOk(
      calculateProjectProfit(
        input({
          revenue: '500',
          labor: '0',
          contractor: '0',
          software: '0',
          other: '0',
          overhead: '0',
        }),
      ),
    );
    expect(result.profit.toNumber()).toBe(500);
    expect(result.margin?.toNumber()).toBe(1);
    expect(result.markup).toBeNull();
  });

  it('handles an all-zero project', () => {
    const result = expectOk(
      calculateProjectProfit(
        input({
          revenue: '0',
          labor: '0',
          contractor: '0',
          software: '0',
          other: '0',
          overhead: '0',
        }),
      ),
    );
    expect(result.profit.toNumber()).toBe(0);
    expect(result.margin).toBeNull();
    expect(result.markup).toBeNull();
  });

  it('adds decimal costs without binary floating point error', () => {
    const result = expectOk(
      calculateProjectProfit(
        input({
          revenue: '100.10',
          labor: '0.10',
          contractor: '0.20',
          software: '0',
          other: '0',
          overhead: '0',
        }),
      ),
    );
    expect(result.directCosts.toFixed(2)).toBe('0.30');
    expect(result.profit.toFixed(2)).toBe('99.80');
    expect(result.margin?.toFixed(4)).toBe('0.9970');
  });

  it('rounds profit at the half-cent boundary', () => {
    const result = expectOk(
      calculateProjectProfit(
        input({
          revenue: '10.005',
          labor: '0',
          contractor: '0',
          software: '0',
          other: '0',
          overhead: '0',
        }),
      ),
    );
    expect(result.profit.toFixed(4)).toBe('10.0050');
    expect(result.profitRounded.toFixed(2)).toBe('10.01');
  });

  it('rejects negative inputs instead of treating them as costs or credits', () => {
    for (const field of [
      'revenue',
      'labor',
      'contractor',
      'software',
      'other',
      'overhead',
    ] as const) {
      const outcome = calculateProjectProfit(input({ [field]: '-1' }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('negative_input');
    }
  });

  it('accepts the supported maximum for every money field', () => {
    const result = expectOk(
      calculateProjectProfit(
        input({
          revenue: '1000000000',
          labor: '0',
          contractor: '0',
          software: '0',
          other: '0',
          overhead: '0',
        }),
      ),
    );
    expect(result.profit.toNumber()).toBe(1_000_000_000);
  });

  it('rejects money values above the supported maximum', () => {
    const outcome = calculateProjectProfit(input({ revenue: '1000000001' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('too_large');
  });

  it('rejects non-finite values instead of returning Infinity or NaN', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const outcome = calculateProjectProfit(input({ labor: String(bad) }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
    }
  });

  it('does not mutate its inputs', () => {
    const values = input();
    const before = values.revenue.toString();
    calculateProjectProfit(values);
    expect(values.revenue.toString()).toBe(before);
  });
});
