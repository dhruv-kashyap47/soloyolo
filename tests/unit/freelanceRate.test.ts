import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  calculateFreelanceRate,
  type FreelanceRateInput,
} from '@/lib/calculators/freelanceRate';

function input(overrides: Partial<Record<keyof FreelanceRateInput, string>> = {}): FreelanceRateInput {
  const values = {
    desiredIncome: '90000',
    annualExpenses: '15000',
    workingWeeks: '46',
    workingHoursPerWeek: '40',
    nonBillablePercent: '40',
    profitBufferPercent: '10',
    ...overrides,
  };

  return {
    desiredIncome: new Decimal(values.desiredIncome),
    annualExpenses: new Decimal(values.annualExpenses),
    workingWeeks: new Decimal(values.workingWeeks),
    workingHoursPerWeek: new Decimal(values.workingHoursPerWeek),
    nonBillablePercent: new Decimal(values.nonBillablePercent),
    profitBufferPercent: new Decimal(values.profitBufferPercent),
  };
}

function expectOk(outcome: ReturnType<typeof calculateFreelanceRate>) {
  if (!outcome.ok) throw new Error(`Expected success, got ${outcome.code}: ${outcome.message}`);
  return outcome.value;
}

describe('calculateFreelanceRate', () => {
  it('matches the documented worked example', () => {
    const result = expectOk(calculateFreelanceRate(input()));

    expect(result.workingHoursPerYear.toNumber()).toBe(1840);
    expect(result.billableHoursPerWeek.toNumber()).toBe(24);
    expect(result.billableHoursPerYear.toNumber()).toBe(1104);
    expect(result.billableShare.toNumber()).toBe(0.6);
    expect(result.baseRevenue.toNumber()).toBe(105000);
    expect(result.bufferAmount.toNumber()).toBe(10500);
    expect(result.requiredAnnualRevenue.toNumber()).toBe(115500);
    expect(result.hourlyRate.toFixed(4)).toBe('104.6196');
    expect(result.hourlyRateRounded.toFixed(2)).toBe('104.62');
    expect(result.baseHourlyRate.toFixed(4)).toBe('95.1087');
    expect(result.requiredWeeklyRevenue.toFixed(2)).toBe('2510.87');
    expect(result.requiredMonthlyRevenue.toFixed(2)).toBe('9625.00');
  });

  it('calculates the UK and Australian examples', () => {
    const uk = expectOk(
      calculateFreelanceRate(
        input({
          desiredIncome: '60000',
          annualExpenses: '8000',
          workingWeeks: '44',
          workingHoursPerWeek: '37.5',
          nonBillablePercent: '45',
          profitBufferPercent: '15',
        }),
      ),
    );
    expect(uk.billableHoursPerWeek.toFixed(3)).toBe('20.625');
    expect(uk.billableHoursPerYear.toFixed(1)).toBe('907.5');
    expect(uk.requiredAnnualRevenue.toNumber()).toBe(78200);
    expect(uk.hourlyRateRounded.toFixed(2)).toBe('86.17');

    const au = expectOk(
      calculateFreelanceRate(
        input({
          desiredIncome: '70000',
          annualExpenses: '9500',
          workingWeeks: '40',
          workingHoursPerWeek: '30',
          nonBillablePercent: '35',
          profitBufferPercent: '8',
        }),
      ),
    );
    expect(au.billableHoursPerYear.toNumber()).toBe(780);
    expect(au.requiredAnnualRevenue.toNumber()).toBe(85860);
    expect(au.hourlyRateRounded.toFixed(2)).toBe('110.08');
  });

  it('leaves revenue untouched when the buffer is zero', () => {
    const result = expectOk(calculateFreelanceRate(input({ profitBufferPercent: '0' })));
    expect(result.bufferAmount.toNumber()).toBe(0);
    expect(result.requiredAnnualRevenue.toNumber()).toBe(105000);
    expect(result.hourlyRate.toFixed(2)).toBe(result.baseHourlyRate.toFixed(2));
  });

  it('treats zero non-billable time as a fully billable week', () => {
    const result = expectOk(calculateFreelanceRate(input({ nonBillablePercent: '0' })));
    expect(result.billableHoursPerWeek.toNumber()).toBe(40);
    expect(result.billableHoursPerYear.toNumber()).toBe(1840);
    expect(result.billableShare.toNumber()).toBe(1);
  });

  it('still produces a rate with 99% non-billable time', () => {
    const result = expectOk(
      calculateFreelanceRate(
        input({
          desiredIncome: '100',
          annualExpenses: '0',
          workingWeeks: '1',
          workingHoursPerWeek: '100',
          nonBillablePercent: '99',
          profitBufferPercent: '0',
        }),
      ),
    );
    expect(result.billableHoursPerYear.toNumber()).toBe(1);
    expect(result.hourlyRateRounded.toFixed(2)).toBe('100.00');
  });

  it('handles decimal percentages', () => {
    const result = expectOk(
      calculateFreelanceRate(input({ nonBillablePercent: '37.5', profitBufferPercent: '12.5' })),
    );
    expect(result.billableShare.toNumber()).toBe(0.625);
    expect(result.bufferAmount.toNumber()).toBe(13125);
    expect(result.requiredAnnualRevenue.toNumber()).toBe(118125);
  });

  it('handles zero income and zero expenses', () => {
    const result = expectOk(
      calculateFreelanceRate(input({ desiredIncome: '0', annualExpenses: '0' })),
    );
    expect(result.hourlyRate.toNumber()).toBe(0);
    expect(result.hourlyRateRounded.toNumber()).toBe(0);
  });

  it('handles expenses without income', () => {
    const result = expectOk(
      calculateFreelanceRate(
        input({ desiredIncome: '0', annualExpenses: '1104', profitBufferPercent: '0' }),
      ),
    );
    expect(result.hourlyRateRounded.toFixed(2)).toBe('1.00');
  });

  it('handles very large values without losing precision', () => {
    const result = expectOk(
      calculateFreelanceRate(
        input({
          desiredIncome: '1000000000',
          annualExpenses: '1000000000',
          profitBufferPercent: '100',
        }),
      ),
    );
    expect(result.requiredAnnualRevenue.toNumber()).toBe(4_000_000_000);
    expect(result.hourlyRateRounded.toFixed(2)).toBe('3623188.41');
  });

  it('rounds exactly at the half-cent boundary', () => {
    const result = expectOk(
      calculateFreelanceRate(
        input({
          desiredIncome: '100.005',
          annualExpenses: '0',
          workingWeeks: '1',
          workingHoursPerWeek: '1',
          nonBillablePercent: '0',
          profitBufferPercent: '0',
        }),
      ),
    );
    expect(result.hourlyRate.toFixed(4)).toBe('100.0050');
    expect(result.hourlyRateRounded.toFixed(2)).toBe('100.01');
  });

  it('rejects negative inputs', () => {
    for (const field of [
      'desiredIncome',
      'annualExpenses',
      'workingWeeks',
      'workingHoursPerWeek',
      'nonBillablePercent',
      'profitBufferPercent',
    ] as const) {
      const outcome = calculateFreelanceRate(input({ [field]: '-1' }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('negative_input');
    }
  });

  it('rejects working weeks outside 1–52', () => {
    for (const weeks of ['0', '0.5', '53', '100']) {
      const outcome = calculateFreelanceRate(input({ workingWeeks: weeks }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('working_weeks_out_of_range');
    }
  });

  it('rejects working hours outside 1–168', () => {
    for (const hours of ['0', '0.5', '169', '200']) {
      const outcome = calculateFreelanceRate(input({ workingHoursPerWeek: hours }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('hours_out_of_range');
    }
  });

  it('rejects 100% non-billable time instead of dividing by zero', () => {
    for (const percent of ['100', '100.5', '150']) {
      const outcome = calculateFreelanceRate(input({ nonBillablePercent: percent }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('non_billable_out_of_range');
    }
  });

  it('rejects a profit buffer above 100%', () => {
    const outcome = calculateFreelanceRate(input({ profitBufferPercent: '101' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('buffer_out_of_range');
  });

  it('accepts the boundary values', () => {
    const result = expectOk(
      calculateFreelanceRate(
        input({
          workingWeeks: '52',
          workingHoursPerWeek: '168',
          nonBillablePercent: '0',
          profitBufferPercent: '100',
        }),
      ),
    );
    expect(result.workingHoursPerYear.toNumber()).toBe(8736);
  });

  it('rejects non-finite values instead of returning Infinity or NaN', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const outcome = calculateFreelanceRate(input({ desiredIncome: String(bad) }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
    }
  });

  it('rejects money values above the supported maximum', () => {
    const outcome = calculateFreelanceRate(input({ annualExpenses: '1000000001' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
  });

  it('does not mutate its inputs', () => {
    const values = input();
    const before = values.desiredIncome.toString();
    calculateFreelanceRate(values);
    expect(values.desiredIncome.toString()).toBe(before);
  });
});
