import { describe, expect, it } from 'vitest';

import { validateRetainerForm, type RetainerFormValues } from '@/lib/calculators/retainer.schema';

function form(overrides: Partial<RetainerFormValues> = {}): RetainerFormValues {
  return {
    monthlyHours: '20',
    hourlyRate: '90',
    monthlyExpenses: '600',
    desiredMarginPercent: '30',
    discountPercent: '10',
    ...overrides,
  };
}

describe('validateRetainerForm', () => {
  it('accepts the default example', () => {
    const result = validateRetainerForm(form());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.monthlyHours.toNumber()).toBe(20);
      expect(result.input.hourlyRate.toNumber()).toBe(90);
      expect(result.input.monthlyExpenses.toNumber()).toBe(600);
      expect(result.input.desiredMarginPercent.toNumber()).toBe(30);
      expect(result.input.discountPercent.toNumber()).toBe(10);
    }
  });

  it('accepts pasted currency formats', () => {
    const result = validateRetainerForm(form({ hourlyRate: '$90', monthlyExpenses: '£600.50' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.monthlyExpenses.toFixed(2)).toBe('600.50');
  });

  it('requires every field', () => {
    const result = validateRetainerForm(
      form({
        monthlyHours: '',
        hourlyRate: '',
        monthlyExpenses: ' ',
        desiredMarginPercent: '',
        discountPercent: '',
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.monthlyHours).toBe('Enter your monthly hours.');
      expect(result.errors.hourlyRate).toBe('Enter your hourly rate.');
      expect(result.errors.monthlyExpenses).toBe('Enter your monthly expenses.');
      expect(result.errors.desiredMarginPercent).toBe('Enter your desired margin.');
      expect(result.errors.discountPercent).toBe('Enter your discount.');
    }
  });

  it('rejects text that is not a number', () => {
    const result = validateRetainerForm(form({ hourlyRate: 'ninety' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.hourlyRate).toBe('Enter hourly rate as a number, for example 90.');
    }
  });

  it('rejects negative values', () => {
    const result = validateRetainerForm(form({ monthlyExpenses: '-10' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.monthlyExpenses).toBe('Monthly expenses cannot be negative.');
    }
  });

  it('enforces the hours range', () => {
    for (const hours of ['0', '745']) {
      const result = validateRetainerForm(form({ monthlyHours: hours }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.monthlyHours).toBe('Monthly hours must be between 1 and 744.');
      }
    }
  });

  it('enforces the margin and discount ranges', () => {
    const margin = validateRetainerForm(form({ desiredMarginPercent: '100' }));
    expect(margin.ok).toBe(false);
    if (!margin.ok) {
      expect(margin.errors.desiredMarginPercent).toBe('Desired margin must be between 0 and 99.');
    }

    const discount = validateRetainerForm(form({ discountPercent: '101' }));
    expect(discount.ok).toBe(false);
    if (!discount.ok) {
      expect(discount.errors.discountPercent).toBe('Discount must be between 0 and 100.');
    }
  });

  it('rejects values above the supported maximum', () => {
    const result = validateRetainerForm(form({ hourlyRate: '1000000001' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.hourlyRate).toBe('Enter hourly rate below 1,000,000,000.');
    }
  });

  it('reports each invalid field independently', () => {
    const result = validateRetainerForm(
      form({ hourlyRate: 'abc', desiredMarginPercent: '100', monthlyExpenses: '0' }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['desiredMarginPercent', 'hourlyRate']);
    }
  });

  it('accepts boundary values', () => {
    expect(validateRetainerForm(form({ monthlyHours: '1' })).ok).toBe(true);
    expect(validateRetainerForm(form({ monthlyHours: '744' })).ok).toBe(true);
    expect(validateRetainerForm(form({ discountPercent: '0' })).ok).toBe(true);
    expect(validateRetainerForm(form({ discountPercent: '100' })).ok).toBe(true);
    expect(validateRetainerForm(form({ desiredMarginPercent: '99' })).ok).toBe(true);
  });
});
