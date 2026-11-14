import { describe, expect, it } from 'vitest';

import {
  validateHourlyRateForm,
  type HourlyRateFormValues,
} from '@/lib/calculators/hourlyRate.schema';

function form(overrides: Partial<HourlyRateFormValues> = {}): HourlyRateFormValues {
  return {
    targetIncome: '80000',
    annualExpenses: '12000',
    workingWeeks: '48',
    billableHoursPerWeek: '25',
    ...overrides,
  };
}

describe('validateHourlyRateForm', () => {
  it('accepts the default example and returns decimals', () => {
    const result = validateHourlyRateForm(form());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.targetIncome.toNumber()).toBe(80000);
      expect(result.input.annualExpenses.toNumber()).toBe(12000);
      expect(result.input.workingWeeks.toNumber()).toBe(48);
      expect(result.input.billableHoursPerWeek.toNumber()).toBe(25);
    }
  });

  it('accepts pasted currency formats', () => {
    const result = validateHourlyRateForm(
      form({ targetIncome: '$80,000', annualExpenses: '£12,000.50' }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.annualExpenses.toFixed(2)).toBe('12000.50');
  });

  it('requires every field', () => {
    const result = validateHourlyRateForm(
      form({
        targetIncome: '',
        annualExpenses: '  ',
        workingWeeks: '',
        billableHoursPerWeek: '',
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.targetIncome).toBe('Enter your target annual income.');
      expect(result.errors.annualExpenses).toBe('Enter your annual business expenses.');
      expect(result.errors.workingWeeks).toBe('Enter your working weeks per year.');
      expect(result.errors.billableHoursPerWeek).toBe('Enter your billable hours per week.');
    }
  });

  it('rejects text that is not a number', () => {
    const result = validateHourlyRateForm(form({ targetIncome: 'eighty thousand' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.targetIncome).toBe(
        'Enter target annual income as a number, for example 80000.',
      );
    }
  });

  it('rejects negative amounts', () => {
    const result = validateHourlyRateForm(form({ annualExpenses: '-1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.annualExpenses).toBe('Annual business expenses cannot be negative.');
    }
  });

  it('enforces the working weeks range', () => {
    for (const weeks of ['0', '53']) {
      const result = validateHourlyRateForm(form({ workingWeeks: weeks }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.workingWeeks).toBe('Working weeks per year must be between 1 and 52.');
      }
    }
  });

  it('enforces the billable hours range', () => {
    for (const hours of ['0', '169']) {
      const result = validateHourlyRateForm(form({ billableHoursPerWeek: hours }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.billableHoursPerWeek).toBe(
          'Billable hours per week must be between 1 and 168.',
        );
      }
    }
  });

  it('rejects values above the supported maximum', () => {
    const result = validateHourlyRateForm(form({ targetIncome: '1000000001' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.targetIncome).toBe('Enter target annual income below 1,000,000,000.');
    }
  });

  it('reports each invalid field independently', () => {
    const result = validateHourlyRateForm(
      form({ targetIncome: 'abc', workingWeeks: '0', billableHoursPerWeek: '25' }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['targetIncome', 'workingWeeks']);
    }
  });

  it('accepts boundary values', () => {
    const result = validateHourlyRateForm(form({ workingWeeks: '1', billableHoursPerWeek: '168' }));
    expect(result.ok).toBe(true);

    const upper = validateHourlyRateForm(form({ workingWeeks: '52', billableHoursPerWeek: '1' }));
    expect(upper.ok).toBe(true);
  });
});
