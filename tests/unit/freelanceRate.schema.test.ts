import { describe, expect, it } from 'vitest';

import {
  validateFreelanceRateForm,
  type FreelanceRateFormValues,
} from '@/lib/calculators/freelanceRate.schema';

function form(overrides: Partial<FreelanceRateFormValues> = {}): FreelanceRateFormValues {
  return {
    desiredIncome: '90000',
    annualExpenses: '15000',
    workingWeeks: '46',
    workingHoursPerWeek: '40',
    nonBillablePercent: '40',
    profitBufferPercent: '10',
    ...overrides,
  };
}

describe('validateFreelanceRateForm', () => {
  it('accepts the default example and returns decimals', () => {
    const result = validateFreelanceRateForm(form());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.desiredIncome.toNumber()).toBe(90000);
      expect(result.input.annualExpenses.toNumber()).toBe(15000);
      expect(result.input.workingWeeks.toNumber()).toBe(46);
      expect(result.input.workingHoursPerWeek.toNumber()).toBe(40);
      expect(result.input.nonBillablePercent.toNumber()).toBe(40);
      expect(result.input.profitBufferPercent.toNumber()).toBe(10);
    }
  });

  it('accepts pasted currency formats and decimal percentages', () => {
    const result = validateFreelanceRateForm(
      form({ desiredIncome: '$90,000', annualExpenses: '£15,000.50', nonBillablePercent: '42.5' }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.annualExpenses.toFixed(2)).toBe('15000.50');
      expect(result.input.nonBillablePercent.toFixed(1)).toBe('42.5');
    }
  });

  it('requires every field', () => {
    const result = validateFreelanceRateForm(
      form({
        desiredIncome: '',
        annualExpenses: '  ',
        workingWeeks: '',
        workingHoursPerWeek: '',
        nonBillablePercent: '',
        profitBufferPercent: '',
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.desiredIncome).toBe('Enter your target annual income.');
      expect(result.errors.annualExpenses).toBe('Enter your annual business expenses.');
      expect(result.errors.workingWeeks).toBe('Enter your working weeks per year.');
      expect(result.errors.workingHoursPerWeek).toBe('Enter your working hours per week.');
      expect(result.errors.nonBillablePercent).toBe('Enter your non-billable time.');
      expect(result.errors.profitBufferPercent).toBe('Enter your profit buffer.');
    }
  });

  it('rejects text that is not a number', () => {
    const result = validateFreelanceRateForm(form({ desiredIncome: 'ninety thousand' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.desiredIncome).toBe(
        'Enter target annual income as a number, for example 90000.',
      );
    }
  });

  it('rejects negative amounts', () => {
    const result = validateFreelanceRateForm(form({ annualExpenses: '-1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.annualExpenses).toBe('Annual business expenses cannot be negative.');
    }
  });

  it('enforces the working weeks range', () => {
    for (const weeks of ['0', '53']) {
      const result = validateFreelanceRateForm(form({ workingWeeks: weeks }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.workingWeeks).toBe('Working weeks per year must be between 1 and 52.');
      }
    }
  });

  it('enforces the working hours range', () => {
    for (const hours of ['0', '169']) {
      const result = validateFreelanceRateForm(form({ workingHoursPerWeek: hours }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.workingHoursPerWeek).toBe(
          'Working hours per week must be between 1 and 168.',
        );
      }
    }
  });

  it('rejects 100% non-billable time', () => {
    for (const percent of ['100', '120']) {
      const result = validateFreelanceRateForm(form({ nonBillablePercent: percent }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.nonBillablePercent).toBe(
          'Non-billable time must be between 0 and 99.',
        );
      }
    }
  });

  it('enforces the profit buffer range', () => {
    const result = validateFreelanceRateForm(form({ profitBufferPercent: '101' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.profitBufferPercent).toBe('Profit buffer must be between 0 and 100.');
    }
  });

  it('rejects values above the supported maximum', () => {
    const result = validateFreelanceRateForm(form({ desiredIncome: '1000000001' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.desiredIncome).toBe('Enter target annual income below 1,000,000,000.');
    }
  });

  it('reports each invalid field independently', () => {
    const result = validateFreelanceRateForm(
      form({ desiredIncome: 'abc', workingWeeks: '0', nonBillablePercent: '100' }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        'desiredIncome',
        'nonBillablePercent',
        'workingWeeks',
      ]);
    }
  });

  it('accepts boundary values', () => {
    const lower = validateFreelanceRateForm(
      form({
        workingWeeks: '1',
        workingHoursPerWeek: '168',
        nonBillablePercent: '0',
        profitBufferPercent: '0',
      }),
    );
    expect(lower.ok).toBe(true);

    const upper = validateFreelanceRateForm(
      form({
        workingWeeks: '52',
        workingHoursPerWeek: '1',
        nonBillablePercent: '99',
        profitBufferPercent: '100',
      }),
    );
    expect(upper.ok).toBe(true);
  });
});
