import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { calculateBreakEven, type BreakEvenInput } from '@/lib/calculators/breakEven';

function project(overrides: Record<string, string> = {}): BreakEvenInput {
  const values = {
    fixedCosts: '4000',
    pricePerUnit: '1500',
    variableCostPerUnit: '500',
    hoursPerUnit: '20',
    ...overrides,
  };
  return {
    mode: 'project',
    fixedCosts: new Decimal(values.fixedCosts),
    pricePerUnit: new Decimal(values.pricePerUnit),
    variableCostPerUnit: new Decimal(values.variableCostPerUnit),
    hoursPerUnit: new Decimal(values.hoursPerUnit),
  };
}

function hourly(overrides: Record<string, string> = {}): BreakEvenInput {
  const values = {
    fixedCosts: '2000',
    pricePerUnit: '75',
    variableCostPerUnit: '15',
    ...overrides,
  };
  return {
    mode: 'hour',
    fixedCosts: new Decimal(values.fixedCosts),
    pricePerUnit: new Decimal(values.pricePerUnit),
    variableCostPerUnit: new Decimal(values.variableCostPerUnit),
  };
}

function expectOk(outcome: ReturnType<typeof calculateBreakEven>) {
  if (!outcome.ok) throw new Error(`Expected success, got ${outcome.code}: ${outcome.message}`);
  return outcome.value;
}

describe('calculateBreakEven', () => {
  it('matches the documented project example', () => {
    const result = expectOk(calculateBreakEven(project()));

    expect(result.contributionPerUnit.toNumber()).toBe(1000);
    expect(result.breakEvenUnits.toNumber()).toBe(4);
    expect(result.unitsRoundedUp.toNumber()).toBe(4);
    expect(result.breakEvenRevenue.toNumber()).toBe(6000);
    expect(result.breakEvenHours?.toNumber()).toBe(80);
  });

  it('rounds fractional projects up but keeps the revenue exact', () => {
    const result = expectOk(
      calculateBreakEven(
        project({
          fixedCosts: '3500',
          pricePerUnit: '900',
          variableCostPerUnit: '350',
          hoursPerUnit: '12',
        }),
      ),
    );

    expect(result.breakEvenUnits.toFixed(4)).toBe('6.3636');
    expect(result.unitsRoundedUp.toNumber()).toBe(7);
    expect(result.breakEvenRevenue.toFixed(2)).toBe('5727.27');
    expect(result.breakEvenHours?.toFixed(2)).toBe('76.36');
  });

  it('works per hour without an hours-per-unit step', () => {
    const result = expectOk(calculateBreakEven(hourly()));

    expect(result.contributionPerUnit.toNumber()).toBe(60);
    expect(result.breakEvenUnits.toFixed(4)).toBe('33.3333');
    expect(result.unitsRoundedUp.toNumber()).toBe(34);
    expect(result.breakEvenRevenue.toNumber()).toBe(2500);
    expect(result.breakEvenHours?.toFixed(4)).toBe('33.3333');
  });

  it('treats zero fixed costs as already broken even', () => {
    const result = expectOk(calculateBreakEven(project({ fixedCosts: '0' })));
    expect(result.breakEvenUnits.toNumber()).toBe(0);
    expect(result.unitsRoundedUp.toNumber()).toBe(0);
    expect(result.breakEvenRevenue.toNumber()).toBe(0);
    expect(result.breakEvenHours?.toNumber()).toBe(0);
  });

  it('treats zero hours per project as zero hours', () => {
    const result = expectOk(calculateBreakEven(project({ hoursPerUnit: '0' })));
    expect(result.breakEvenHours?.toNumber()).toBe(0);
  });

  it('rounds revenue at the half-cent boundary', () => {
    const result = expectOk(
      calculateBreakEven(
        project({
          fixedCosts: '10.005',
          pricePerUnit: '1',
          variableCostPerUnit: '0',
          hoursPerUnit: '1',
        }),
      ),
    );
    expect(result.breakEvenRevenue.toFixed(4)).toBe('10.0050');
    expect(result.revenueRounded.toFixed(2)).toBe('10.01');
  });

  it('refuses a price at variable cost', () => {
    const outcome = calculateBreakEven(project({ pricePerUnit: '500' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('no_break_even');
  });

  it('refuses a price below variable cost', () => {
    const outcome = calculateBreakEven(project({ pricePerUnit: '400' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('no_break_even');
  });

  it('is already at break-even at zero units when there are no fixed costs', () => {
    const result = expectOk(calculateBreakEven(project({ fixedCosts: '0', pricePerUnit: '500' })));

    expect(result.breakEvenUnits.toNumber()).toBe(0);
    expect(result.unitsRoundedUp.toNumber()).toBe(0);
    expect(result.breakEvenRevenue.toNumber()).toBe(0);
    expect(result.revenueRounded.toFixed(2)).toBe('0.00');
  });

  it('rejects negative inputs', () => {
    for (const field of ['fixedCosts', 'pricePerUnit', 'variableCostPerUnit', 'hoursPerUnit']) {
      const outcome = calculateBreakEven(project({ [field]: '-1' }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('negative_input');
    }
  });

  it('rejects more than 10,000 hours per project', () => {
    const outcome = calculateBreakEven(project({ hoursPerUnit: '10001' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('hours_out_of_range');
  });

  it('rejects non-finite values instead of returning Infinity or NaN', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const outcome = calculateBreakEven(project({ fixedCosts: String(bad) }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
    }
  });

  it('rejects money values above the supported maximum', () => {
    const outcome = calculateBreakEven(project({ fixedCosts: '1000000001' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('too_large');
  });

  it('does not mutate its inputs', () => {
    const values = project();
    calculateBreakEven(values);
    expect(values.fixedCosts.toString()).toBe('4000');
  });
});
