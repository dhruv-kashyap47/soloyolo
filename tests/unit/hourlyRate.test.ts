import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { calculateHourlyRate, type HourlyRateInput } from '@/lib/calculators/hourlyRate';

function input(overrides: Partial<Record<keyof HourlyRateInput, string>> = {}): HourlyRateInput {
  const values = {
    targetIncome: '80000',
    annualExpenses: '12000',
    workingWeeks: '48',
    billableHoursPerWeek: '25',
    ...overrides,
  };

  return {
    targetIncome: new Decimal(values.targetIncome),
    annualExpenses: new Decimal(values.annualExpenses),
    workingWeeks: new Decimal(values.workingWeeks),
    billableHoursPerWeek: new Decimal(values.billableHoursPerWeek),
  };
}

function expectOk(outcome: ReturnType<typeof calculateHourlyRate>) {
  if (!outcome.ok) throw new Error(`Expected success, got ${outcome.code}: ${outcome.message}`);
  return outcome.value;
}

describe('calculateHourlyRate', () => {
  it('matches the documented worked example', () => {
    const result = expectOk(calculateHourlyRate(input()));

    expect(result.hourlyRateRounded.toFixed(2)).toBe('76.67');
    expect(result.hourlyRate.toFixed(4)).toBe('76.6667');
    expect(result.billableHoursPerYear.toNumber()).toBe(1200);
    expect(result.requiredAnnualRevenue.toNumber()).toBe(92000);
    expect(result.requiredWeeklyRevenue.toFixed(2)).toBe('1916.67');
    expect(result.requiredMonthlyRevenue.toFixed(2)).toBe('7666.67');
  });

  it('calculates the UK and Australian examples', () => {
    const uk = expectOk(
      calculateHourlyRate(
        input({
          targetIncome: '45000',
          annualExpenses: '6000',
          workingWeeks: '46',
          billableHoursPerWeek: '20',
        }),
      ),
    );
    expect(uk.hourlyRateRounded.toFixed(2)).toBe('55.43');
    expect(uk.billableHoursPerYear.toNumber()).toBe(920);

    const au = expectOk(
      calculateHourlyRate(
        input({
          targetIncome: '60000',
          annualExpenses: '8000',
          workingWeeks: '40',
          billableHoursPerWeek: '15',
        }),
      ),
    );
    expect(au.hourlyRateRounded.toFixed(2)).toBe('113.33');
    expect(au.billableHoursPerYear.toNumber()).toBe(600);
  });

  it('handles zero income and zero expenses', () => {
    const result = expectOk(calculateHourlyRate(input({ targetIncome: '0', annualExpenses: '0' })));
    expect(result.hourlyRate.toNumber()).toBe(0);
    expect(result.requiredAnnualRevenue.toNumber()).toBe(0);
  });

  it('handles expenses without income', () => {
    const result = expectOk(
      calculateHourlyRate(input({ targetIncome: '0', annualExpenses: '12000' })),
    );
    expect(result.hourlyRateRounded.toFixed(2)).toBe('10.00');
  });

  it('handles decimal weeks, hours and amounts', () => {
    const result = expectOk(
      calculateHourlyRate(
        input({
          workingWeeks: '48.5',
          billableHoursPerWeek: '22.5',
          targetIncome: '80000.55',
          annualExpenses: '12000.45',
        }),
      ),
    );

    expect(result.billableHoursPerYear.toFixed(2)).toBe('1091.25');
    expect(result.requiredAnnualRevenue.toFixed(2)).toBe('92001.00');
    expect(result.hourlyRate.toFixed(4)).toBe('84.3079');
  });

  it('handles very large values without losing precision', () => {
    const result = expectOk(
      calculateHourlyRate(input({ targetIncome: '1000000000', annualExpenses: '1000000000' })),
    );

    expect(result.requiredAnnualRevenue.toNumber()).toBe(2_000_000_000);
    expect(result.hourlyRateRounded.toFixed(2)).toBe('1666666.67');
  });

  it('rounds exactly at the half-cent boundary', () => {
    const result = expectOk(
      calculateHourlyRate(
        input({
          targetIncome: '100',
          annualExpenses: '0',
          workingWeeks: '1',
          billableHoursPerWeek: '3',
        }),
      ),
    );
    expect(result.hourlyRate.toFixed(4)).toBe('33.3333');
    expect(result.hourlyRateRounded.toFixed(2)).toBe('33.33');
  });

  it('keeps one hour of capacity exact', () => {
    const result = expectOk(
      calculateHourlyRate(
        input({
          workingWeeks: '1',
          billableHoursPerWeek: '1',
          targetIncome: '250',
          annualExpenses: '50',
        }),
      ),
    );
    expect(result.hourlyRate.toFixed(2)).toBe('300.00');
  });

  it('rejects negative inputs', () => {
    for (const field of ['targetIncome', 'annualExpenses'] as const) {
      const outcome = calculateHourlyRate(input({ [field]: '-1' }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('negative_input');
    }

    const negativeWeeks = calculateHourlyRate(input({ workingWeeks: '-1' }));
    expect(negativeWeeks.ok).toBe(false);
  });

  it('rejects working weeks outside 1–52', () => {
    for (const weeks of ['0', '0.5', '53', '100']) {
      const outcome = calculateHourlyRate(input({ workingWeeks: weeks }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('working_weeks_out_of_range');
    }
  });

  it('rejects billable hours outside 1–168', () => {
    for (const hours of ['0', '0.5', '169', '200']) {
      const outcome = calculateHourlyRate(input({ billableHoursPerWeek: hours }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('hours_out_of_range');
    }
  });

  it('rejects non-finite values instead of returning Infinity or NaN', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const outcome = calculateHourlyRate(input({ targetIncome: String(bad) }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
    }
  });

  it('rejects money values above the supported maximum', () => {
    const outcome = calculateHourlyRate(input({ targetIncome: '1000000001' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
  });

  it('does not mutate its inputs', () => {
    const values = input();
    const before = values.targetIncome.toString();
    calculateHourlyRate(values);
    expect(values.targetIncome.toString()).toBe(before);
  });
});
