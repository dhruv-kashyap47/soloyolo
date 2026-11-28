import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { calculateRetainer, type RetainerInput } from '@/lib/calculators/retainer';

function input(overrides: Partial<Record<keyof RetainerInput, string>> = {}): RetainerInput {
  const values = {
    monthlyHours: '20',
    hourlyRate: '90',
    monthlyExpenses: '600',
    desiredMarginPercent: '30',
    discountPercent: '0',
    ...overrides,
  };

  return {
    monthlyHours: new Decimal(values.monthlyHours),
    hourlyRate: new Decimal(values.hourlyRate),
    monthlyExpenses: new Decimal(values.monthlyExpenses),
    desiredMarginPercent: new Decimal(values.desiredMarginPercent),
    discountPercent: new Decimal(values.discountPercent),
  };
}

function expectOk(outcome: ReturnType<typeof calculateRetainer>) {
  if (!outcome.ok) throw new Error(`Expected success, got ${outcome.code}: ${outcome.message}`);
  return outcome.value;
}

describe('calculateRetainer', () => {
  it('matches the documented worked example', () => {
    const result = expectOk(calculateRetainer(input()));

    expect(result.baseCost.toNumber()).toBe(2400);
    expect(result.quote.toFixed(4)).toBe('3428.5714');
    expect(result.discountAmount.toNumber()).toBe(0);
    expect(result.retainerRounded.toFixed(2)).toBe('3428.57');
    expect(result.profitRounded.toFixed(2)).toBe('1028.57');
    expect(result.effectiveHourlyRounded.toFixed(2)).toBe('171.43');
    expect(result.annualRounded.toFixed(2)).toBe('41142.86');
    expect(result.achievedMargin?.toFixed(4)).toBe('0.3000');
  });

  it('applies a discount and reports the margin actually achieved', () => {
    const result = expectOk(
      calculateRetainer(
        input({
          monthlyHours: '15',
          hourlyRate: '70',
          monthlyExpenses: '400',
          desiredMarginPercent: '25',
          discountPercent: '10',
        }),
      ),
    );

    expect(result.baseCost.toNumber()).toBe(1450);
    expect(result.quote.toFixed(4)).toBe('1933.3333');
    expect(result.discountAmount.toFixed(4)).toBe('193.3333');
    expect(result.retainerRounded.toFixed(2)).toBe('1740.00');
    expect(result.profitRounded.toFixed(2)).toBe('290.00');
    expect(result.achievedMargin?.toFixed(4)).toBe('0.1667');
  });

  it('shows how a deep discount erodes the margin', () => {
    const result = expectOk(
      calculateRetainer(
        input({
          monthlyHours: '10',
          hourlyRate: '120',
          monthlyExpenses: '250',
          desiredMarginPercent: '20',
          discountPercent: '15',
        }),
      ),
    );

    expect(result.retainerRounded.toFixed(2)).toBe('1540.63');
    expect(result.effectiveHourlyRounded.toFixed(2)).toBe('154.06');
    expect(result.profitRounded.toFixed(2)).toBe('90.63');
    expect(result.achievedMargin?.toFixed(4)).toBe('0.0588');
  });

  it('treats a zero margin as cost recovery', () => {
    const result = expectOk(calculateRetainer(input({ desiredMarginPercent: '0' })));
    expect(result.quote.toNumber()).toBe(2400);
    expect(result.monthlyProfit.toNumber()).toBe(0);
    expect(result.achievedMargin?.toNumber()).toBe(0);
  });

  it('handles a 100% discount as a deliberate loss', () => {
    const result = expectOk(calculateRetainer(input({ discountPercent: '100' })));
    expect(result.retainer.toNumber()).toBe(0);
    expect(result.monthlyProfit.toNumber()).toBe(-2400);
    expect(result.achievedMargin).toBeNull();
    expect(result.effectiveHourly.toNumber()).toBe(0);
  });

  it('rounds the retainer at the half-cent boundary', () => {
    const result = expectOk(
      calculateRetainer(
        input({
          monthlyHours: '1',
          hourlyRate: '0.005',
          monthlyExpenses: '0',
          desiredMarginPercent: '0',
          discountPercent: '0',
        }),
      ),
    );
    expect(result.retainer.toFixed(4)).toBe('0.0050');
    expect(result.retainerRounded.toFixed(2)).toBe('0.01');
  });

  it('keeps the displayed quote, discount and profit rows consistent', () => {
    const cases = [
      { monthlyHours: '1', hourlyRate: '1.005', monthlyExpenses: '0', desiredMarginPercent: '0', discountPercent: '50' },
      { monthlyHours: '10', hourlyRate: '120', monthlyExpenses: '250', desiredMarginPercent: '20', discountPercent: '15' },
      { monthlyHours: '20', hourlyRate: '90', monthlyExpenses: '600', desiredMarginPercent: '30', discountPercent: '0' },
    ];

    for (const overrides of cases) {
      const result = expectOk(calculateRetainer(input(overrides)));
      expect(result.quoteRounded.minus(result.discountRounded).toFixed(2)).toBe(
        result.retainerRounded.toFixed(2),
      );
      expect(result.retainerRounded.minus(result.baseRounded).toFixed(2)).toBe(
        result.profitRounded.toFixed(2),
      );
    }
  });

  it('rejects negative inputs', () => {
    for (const field of [
      'monthlyHours',
      'hourlyRate',
      'monthlyExpenses',
      'desiredMarginPercent',
      'discountPercent',
    ] as const) {
      const outcome = calculateRetainer(input({ [field]: '-1' }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('negative_input');
    }
  });

  it('rejects monthly hours outside 1–744', () => {
    for (const hours of ['0', '0.5', '745']) {
      const outcome = calculateRetainer(input({ monthlyHours: hours }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('hours_out_of_range');
    }
  });

  it('rejects a margin of 100% or more', () => {
    const outcome = calculateRetainer(input({ desiredMarginPercent: '100' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('margin_out_of_range');
  });

  it('rejects a discount above 100%', () => {
    const outcome = calculateRetainer(input({ discountPercent: '101' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('discount_out_of_range');
  });

  it('rejects non-finite values instead of returning Infinity or NaN', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const outcome = calculateRetainer(input({ hourlyRate: String(bad) }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
    }
  });

  it('rejects money values above the supported maximum', () => {
    const outcome = calculateRetainer(input({ hourlyRate: '1000000001' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('too_large');
  });

  it('does not mutate its inputs', () => {
    const values = input();
    calculateRetainer(values);
    expect(values.monthlyHours.toString()).toBe('20');
  });
});
