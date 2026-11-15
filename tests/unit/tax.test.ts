import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { calculateTax, type TaxInput } from '@/lib/calculators/tax';

function input(overrides: Partial<Record<keyof TaxInput, string>> = {}): TaxInput {
  const values = { mode: 'add', amount: '1200', ratePercent: '8.25', ...overrides };
  return {
    mode: values.mode as TaxInput['mode'],
    amount: new Decimal(values.amount),
    ratePercent: new Decimal(values.ratePercent),
  };
}

function expectOk(outcome: ReturnType<typeof calculateTax>) {
  if (!outcome.ok) throw new Error(`Expected success, got ${outcome.code}: ${outcome.message}`);
  return outcome.value;
}

describe('calculateTax', () => {
  it('adds tax to a net amount', () => {
    const result = expectOk(calculateTax(input()));
    expect(result.net.toNumber()).toBe(1200);
    expect(result.tax.toNumber()).toBe(99);
    expect(result.gross.toNumber()).toBe(1299);
  });

  it('removes tax from a gross amount by dividing', () => {
    const result = expectOk(
      calculateTax(input({ mode: 'remove', amount: '600', ratePercent: '20' })),
    );
    expect(result.net.toNumber()).toBe(500);
    expect(result.tax.toNumber()).toBe(100);
    expect(result.gross.toNumber()).toBe(600);
  });

  it('handles a zero rate in both directions', () => {
    const added = expectOk(calculateTax(input({ ratePercent: '0' })));
    expect(added.tax.toNumber()).toBe(0);
    expect(added.gross.toNumber()).toBe(1200);

    const removed = expectOk(
      calculateTax(input({ mode: 'remove', amount: '600', ratePercent: '0' })),
    );
    expect(removed.net.toNumber()).toBe(600);
    expect(removed.tax.toNumber()).toBe(0);
  });

  it('handles a decimal rate', () => {
    const result = expectOk(
      calculateTax(input({ mode: 'remove', amount: '600', ratePercent: '8.25' })),
    );
    expect(result.netRounded.toFixed(2)).toBe('554.27');
    expect(result.taxRounded.toFixed(2)).toBe('45.73');
  });

  it('handles a zero amount', () => {
    const result = expectOk(calculateTax(input({ amount: '0' })));
    expect(result.tax.toNumber()).toBe(0);
    expect(result.gross.toNumber()).toBe(0);
  });

  it('handles a 100% rate', () => {
    const added = expectOk(calculateTax(input({ amount: '100', ratePercent: '100' })));
    expect(added.tax.toNumber()).toBe(100);
    expect(added.gross.toNumber()).toBe(200);

    const removed = expectOk(
      calculateTax(input({ mode: 'remove', amount: '600', ratePercent: '100' })),
    );
    expect(removed.net.toNumber()).toBe(300);
    expect(removed.tax.toNumber()).toBe(300);
  });

  it('rounds the gross at the half-cent boundary', () => {
    const result = expectOk(
      calculateTax(input({ amount: '10.005', ratePercent: '0' })),
    );
    expect(result.gross.toFixed(4)).toBe('10.0050');
    expect(result.grossRounded.toFixed(2)).toBe('10.01');
  });

  it('keeps the displayed net and tax adding up to the displayed gross', () => {
    const result = expectOk(
      calculateTax(input({ mode: 'remove', amount: '2.01', ratePercent: '100' })),
    );
    expect(result.netRounded.toFixed(2)).toBe('1.01');
    expect(result.taxRounded.toFixed(2)).toBe('1.00');
    expect(result.grossRounded.toFixed(2)).toBe('2.01');
  });

  it('keeps the displayed parts reconciled across amounts and rates', () => {
    for (const amount of ['0.01', '0.02', '2.01', '100', '600', '1200.55']) {
      for (const ratePercent of ['0', '5', '7.5', '20', '100']) {
        for (const mode of ['add', 'remove'] as const) {
          const value = expectOk(calculateTax(input({ mode, amount, ratePercent })));
          expect(
            value.netRounded.plus(value.taxRounded).toFixed(2),
            `${mode} ${amount} @ ${ratePercent}%`,
          ).toBe(value.grossRounded.toFixed(2));
        }
      }
    }
  });

  it('rejects negative inputs', () => {
    for (const field of ['amount', 'ratePercent'] as const) {
      const outcome = calculateTax(input({ [field]: '-1' }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('negative_input');
    }
  });

  it('rejects a rate above 100', () => {
    const outcome = calculateTax(input({ ratePercent: '101' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('rate_out_of_range');
  });

  it('rejects non-finite values instead of returning Infinity or NaN', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const outcome = calculateTax(input({ amount: String(bad) }));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
    }
  });

  it('rejects money values above the supported maximum', () => {
    const outcome = calculateTax(input({ amount: '1000000001' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('too_large');
  });

  it('does not mutate its inputs', () => {
    const values = input();
    calculateTax(values);
    expect(values.amount.toString()).toBe('1200');
    expect(values.ratePercent.toString()).toBe('8.25');
  });
});
