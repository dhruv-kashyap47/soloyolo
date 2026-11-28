import { describe, expect, it } from 'vitest';

import {
  validateProjectProfitForm,
  type ProjectProfitFormValues,
} from '@/lib/calculators/projectProfit.schema';

function form(overrides: Partial<ProjectProfitFormValues> = {}): ProjectProfitFormValues {
  return {
    revenue: '12000',
    labor: '5000',
    contractor: '1500',
    software: '300',
    other: '200',
    overhead: '1000',
    ...overrides,
  };
}

describe('validateProjectProfitForm', () => {
  it('accepts the default example and returns decimals', () => {
    const result = validateProjectProfitForm(form());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.revenue.toNumber()).toBe(12000);
      expect(result.input.labor.toNumber()).toBe(5000);
      expect(result.input.contractor.toNumber()).toBe(1500);
      expect(result.input.software.toNumber()).toBe(300);
      expect(result.input.other.toNumber()).toBe(200);
      expect(result.input.overhead.toNumber()).toBe(1000);
    }
  });

  it('accepts pasted currency formats', () => {
    const result = validateProjectProfitForm(form({ revenue: '$12,000', overhead: '£1,000.50' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.overhead.toFixed(2)).toBe('1000.50');
  });

  it('accepts zero for every field', () => {
    const result = validateProjectProfitForm(
      form({ revenue: '0', labor: '0', contractor: '0', software: '0', other: '0', overhead: '0' }),
    );
    expect(result.ok).toBe(true);
  });

  it('requires every field', () => {
    const result = validateProjectProfitForm(
      form({
        revenue: '',
        labor: ' ',
        contractor: '',
        software: '',
        other: '',
        overhead: '',
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.revenue).toBe('Enter your project revenue.');
      expect(result.errors.labor).toBe('Enter your labor cost.');
      expect(result.errors.contractor).toBe('Enter your contractor cost.');
      expect(result.errors.software).toBe('Enter your software cost.');
      expect(result.errors.other).toBe('Enter your other direct costs.');
      expect(result.errors.overhead).toBe('Enter your allocated overhead.');
    }
  });

  it('rejects text that is not a number', () => {
    const result = validateProjectProfitForm(form({ revenue: 'twelve thousand' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.revenue).toBe('Enter project revenue as a number, for example 12000.');
    }
  });

  it('rejects negative amounts', () => {
    const result = validateProjectProfitForm(form({ contractor: '-1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.contractor).toBe('Contractor cost cannot be negative.');
    }
  });

  it('rejects values above the supported maximum', () => {
    const result = validateProjectProfitForm(form({ labor: '1000000001' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.labor).toBe('Enter labor cost below 1,000,000,000.');
    }
  });

  it('reports each invalid field independently', () => {
    const result = validateProjectProfitForm(
      form({ revenue: 'abc', software: '-2', overhead: '' }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['overhead', 'revenue', 'software']);
    }
  });
});
