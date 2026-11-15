import { describe, expect, it } from 'vitest';

import { validateTaxForm, type TaxFormValues } from '@/lib/calculators/tax.schema';

function form(overrides: Partial<TaxFormValues> = {}): TaxFormValues {
  return { amount: '1200', ratePercent: '8.25', ...overrides };
}

describe('validateTaxForm', () => {
  it('accepts the default example in both directions', () => {
    for (const mode of ['add', 'remove'] as const) {
      const result = validateTaxForm(mode, form());
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.input.mode).toBe(mode);
        expect(result.input.amount.toNumber()).toBe(1200);
        expect(result.input.ratePercent.toNumber()).toBe(8.25);
      }
    }
  });

  it('accepts pasted currency formats', () => {
    const result = validateTaxForm('add', form({ amount: '£1,200.50' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.amount.toFixed(2)).toBe('1200.50');
  });

  it('accepts a zero amount and a zero rate', () => {
    const result = validateTaxForm('add', form({ amount: '0', ratePercent: '0' }));
    expect(result.ok).toBe(true);
  });

  it('requires every field', () => {
    const result = validateTaxForm('add', form({ amount: '', ratePercent: ' ' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.amount).toBe('Enter your amount.');
      expect(result.errors.ratePercent).toBe('Enter your tax rate.');
    }
  });

  it('rejects text that is not a number', () => {
    const result = validateTaxForm('add', form({ ratePercent: 'twenty' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.ratePercent).toBe('Enter tax rate as a number, for example 20.');
    }
  });

  it('rejects negative values', () => {
    const result = validateTaxForm('add', form({ amount: '-1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.amount).toBe('Amount cannot be negative.');
  });

  it('enforces the rate range', () => {
    for (const rate of ['-1', '101']) {
      const result = validateTaxForm('add', form({ ratePercent: rate }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.ratePercent).toBe('Tax rate must be between 0 and 100.');
      }
    }
  });

  it('rejects values above the supported maximum', () => {
    const result = validateTaxForm('add', form({ amount: '1000000001' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.amount).toBe('Enter amount below 1,000,000,000.');
    }
  });

  it('reports each invalid field independently', () => {
    const result = validateTaxForm('add', form({ amount: 'abc', ratePercent: '101' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['amount', 'ratePercent']);
  });

  it('accepts the rate boundaries', () => {
    expect(validateTaxForm('add', form({ ratePercent: '0' })).ok).toBe(true);
    expect(validateTaxForm('add', form({ ratePercent: '100' })).ok).toBe(true);
  });
});
