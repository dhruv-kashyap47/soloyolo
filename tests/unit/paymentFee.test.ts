import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { calculatePaymentFee, type PaymentFeeInput } from '@/lib/calculators/paymentFee';

function input(overrides: Partial<Record<keyof PaymentFeeInput, string>> = {}): PaymentFeeInput {
  const values = {
    amount: '1000',
    percentFee: '2.9',
    fixedFee: '0.30',
    ...overrides,
  };

  return {
    amount: new Decimal(values.amount),
    percentFee: new Decimal(values.percentFee),
    fixedFee: new Decimal(values.fixedFee),
  };
}

function expectOk(outcome: ReturnType<typeof calculatePaymentFee>) {
  if (!outcome.ok) throw new Error(`Expected success, got ${outcome.code}: ${outcome.message}`);
  return outcome.value;
}

describe('calculatePaymentFee', () => {
  it('matches the documented worked example', () => {
    const result = expectOk(calculatePaymentFee(input()));

    expect(result.percentFeeAmount.toNumber()).toBe(29);
    expect(result.totalFee.toNumber()).toBe(29.3);
    expect(result.totalFeeRounded.toFixed(2)).toBe('29.30');
    expect(result.netAmount.toNumber()).toBe(970.7);
    expect(result.netRounded.toFixed(2)).toBe('970.70');
    expect(result.effectivePercent?.toFixed(4)).toBe('0.0293');
  });

  it('handles a zero percentage fee', () => {
    const result = expectOk(calculatePaymentFee(input({ percentFee: '0' })));
    expect(result.totalFee.toNumber()).toBe(0.3);
    expect(result.effectivePercent?.toFixed(4)).toBe('0.0003');
  });

  it('handles a zero fixed fee', () => {
    const result = expectOk(calculatePaymentFee(input({ fixedFee: '0' })));
    expect(result.totalFee.toNumber()).toBe(29);
    expect(result.netAmount.toNumber()).toBe(971);
  });

  it('shows the effective rate on a small payment', () => {
    const result = expectOk(calculatePaymentFee(input({ amount: '45', percentFee: '1.75' })));
    expect(result.totalFee.toFixed(4)).toBe('1.0875');
    expect(result.netAmount.toFixed(4)).toBe('43.9125');
    expect(result.effectivePercent?.toFixed(6)).toBe('0.024167');
  });

  it('allows a fee larger than the payment and reports a negative net', () => {
    const result = expectOk(
      calculatePaymentFee(input({ amount: '1', percentFee: '10', fixedFee: '5' })),
    );
    expect(result.totalFee.toNumber()).toBe(5.1);
    expect(result.netAmount.toNumber()).toBe(-4.1);
    expect(result.netAmount.isNegative()).toBe(true);
  });

  it('adds decimal fees without binary floating point error', () => {
    const result = expectOk(
      calculatePaymentFee(input({ amount: '0.1', percentFee: '10', fixedFee: '0.01' })),
    );
    expect(result.percentFeeAmount.toFixed(2)).toBe('0.01');
    expect(result.totalFee.toFixed(2)).toBe('0.02');
    expect(result.netAmount.toFixed(2)).toBe('0.08');
  });

  it('rounds the net at the half-cent boundary', () => {
    const result = expectOk(
      calculatePaymentFee(input({ amount: '10.005', percentFee: '0', fixedFee: '0' })),
    );
    expect(result.netAmount.toFixed(4)).toBe('10.0050');
    expect(result.netRounded.toFixed(2)).toBe('10.01');
  });

  it('accepts a 100% percentage fee', () => {
    const result = expectOk(calculatePaymentFee(input({ percentFee: '100', fixedFee: '0' })));
    expect(result.totalFee.toNumber()).toBe(1000);
    expect(result.netAmount.toNumber()).toBe(0);
  });

  it('rejects a zero amount', () => {
    const outcome = calculatePaymentFee(input({ amount: '0' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('zero_amount');
  });

  it('keeps the displayed fee and net adding up to the amount', () => {
    const result = expectOk(
      calculatePaymentFee(input({ amount: '0.02', percentFee: '0', fixedFee: '0.005' })),
    );
    expect(result.totalFeeRounded.toFixed(2)).toBe('0.01');
    expect(result.netRounded.toFixed(2)).toBe('0.01');
    expect(result.netRounded.plus(result.totalFeeRounded).toFixed(2)).toBe(
      result.amountRounded.toFixed(2),
    );
  });

  it('keeps the displayed parts reconciled across amounts and rates', () => {
    for (const amount of ['0.01', '0.02', '0.03', '45', '1000.55']) {
      for (const percentFee of ['0', '1.75', '2.9', '10']) {
        for (const fixedFee of ['0', '0.005', '0.30']) {
          const value = expectOk(calculatePaymentFee(input({ amount, percentFee, fixedFee })));
          expect(
            value.netRounded.plus(value.totalFeeRounded).toFixed(2),
            `${amount} @ ${percentFee}% + ${fixedFee}`,
          ).toBe(value.amountRounded.toFixed(2));
        }
      }
    }
  });

  it('rejects negative inputs', () => {
    for (const field of ['amount', 'percentFee', 'fixedFee'] as const) {
      const outcome = calculatePaymentFee(input({ [field]: '-1' }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('negative_input');
    }
  });

  it('rejects a percentage fee above 100', () => {
    const outcome = calculatePaymentFee(input({ percentFee: '101' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('percent_out_of_range');
  });

  it('rejects non-finite values instead of returning Infinity or NaN', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const outcome = calculatePaymentFee(input({ amount: String(bad) }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
    }
  });

  it('rejects money values above the supported maximum', () => {
    const outcome = calculatePaymentFee(input({ amount: '1000000001' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('too_large');
  });

  it('does not mutate its inputs', () => {
    const values = input();
    calculatePaymentFee(values);
    expect(values.amount.toString()).toBe('1000');
  });
});
