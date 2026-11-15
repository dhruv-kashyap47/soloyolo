import { describe, expect, it } from 'vitest';

import {
  validatePaymentFeeForm,
  type PaymentFeeFormValues,
} from '@/lib/calculators/paymentFee.schema';

function form(overrides: Partial<PaymentFeeFormValues> = {}): PaymentFeeFormValues {
  return { amount: '1000', percentFee: '2.9', fixedFee: '0.30', ...overrides };
}

describe('validatePaymentFeeForm', () => {
  it('accepts the default example', () => {
    const result = validatePaymentFeeForm(form());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.amount.toNumber()).toBe(1000);
      expect(result.input.percentFee.toNumber()).toBe(2.9);
      expect(result.input.fixedFee.toNumber()).toBe(0.3);
    }
  });

  it('accepts pasted currency formats', () => {
    const result = validatePaymentFeeForm(form({ amount: '$1,000', fixedFee: '£0.30' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.amount.toNumber()).toBe(1000);
  });

  it('requires every field', () => {
    const result = validatePaymentFeeForm(form({ amount: '', percentFee: ' ', fixedFee: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.amount).toBe('Enter your amount.');
      expect(result.errors.percentFee).toBe('Enter your percentage fee.');
      expect(result.errors.fixedFee).toBe('Enter your fixed fee.');
    }
  });

  it('rejects text that is not a number', () => {
    const result = validatePaymentFeeForm(form({ amount: 'a thousand' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.amount).toBe('Enter amount as a number, for example 1000.');
    }
  });

  it('rejects a zero amount', () => {
    const result = validatePaymentFeeForm(form({ amount: '0' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.amount).toBe('Amount must be above zero.');
  });

  it('rejects negative values', () => {
    const result = validatePaymentFeeForm(form({ fixedFee: '-0.10' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.fixedFee).toBe('Fixed fee cannot be negative.');
  });

  it('enforces the percentage range', () => {
    for (const percent of ['-1', '101']) {
      const result = validatePaymentFeeForm(form({ percentFee: percent }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.percentFee).toBe('Percentage fee must be between 0 and 100.');
      }
    }
  });

  it('rejects values above the supported maximum', () => {
    const result = validatePaymentFeeForm(form({ amount: '1000000001' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.amount).toBe('Enter amount below 1,000,000,000.');
    }
  });

  it('reports each invalid field independently', () => {
    const result = validatePaymentFeeForm(
      form({ amount: 'abc', percentFee: '101', fixedFee: '0' }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['amount', 'percentFee']);
  });

  it('accepts boundary values', () => {
    const lower = validatePaymentFeeForm(form({ percentFee: '0', fixedFee: '0' }));
    expect(lower.ok).toBe(true);

    const upper = validatePaymentFeeForm(form({ percentFee: '100' }));
    expect(upper.ok).toBe(true);
  });
});
