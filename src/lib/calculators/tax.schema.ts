import type Decimal from 'decimal.js';

import type { TaxInput } from '@/lib/calculators/tax';
import { MAX_MONEY } from '@/lib/finance/money';
import { formatNumber } from '@/lib/formatting/number';
import { parseAmountInput } from '@/lib/validation/amount';

export const TAX_FIELDS = ['amount', 'ratePercent'] as const;

export type TaxField = (typeof TAX_FIELDS)[number];

export type TaxFormValues = Record<TaxField, string>;
export type TaxFormErrors = Partial<Record<TaxField, string>>;

export type TaxValidationResult =
  { ok: true; input: TaxInput } | { ok: false; errors: TaxFormErrors };

function parseField(
  label: string,
  example: string,
  raw: string,
): { value: Decimal } | { error: string } {
  if (raw.trim() === '') {
    return { error: `Enter your ${label}.` };
  }
  const value = parseAmountInput(raw);
  if (value === null) {
    return { error: `Enter ${label} as a number, for example ${example}.` };
  }
  return { value };
}

export function validateTaxForm(
  mode: TaxInput['mode'],
  values: TaxFormValues,
): TaxValidationResult {
  const errors: TaxFormErrors = {};
  const parsed: Partial<Record<TaxField, Decimal>> = {};

  const amount = parseField('amount', '1200', values.amount);
  if ('error' in amount) {
    errors.amount = amount.error;
  } else if (amount.value.isNegative()) {
    errors.amount = 'Amount cannot be negative.';
  } else if (amount.value.greaterThan(MAX_MONEY)) {
    errors.amount = `Enter amount below ${formatNumber(MAX_MONEY)}.`;
  } else {
    parsed.amount = amount.value;
  }

  const rate = parseField('tax rate', '20', values.ratePercent);
  if ('error' in rate) {
    errors.ratePercent = rate.error;
  } else if (rate.value.isNegative() || rate.value.greaterThan(100)) {
    errors.ratePercent = 'Tax rate must be between 0 and 100.';
  } else {
    parsed.ratePercent = rate.value;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { amount: amountValue, ratePercent } = parsed;
  if (!amountValue || !ratePercent) {
    return { ok: false, errors: { amount: 'Check the values you entered.' } };
  }

  return { ok: true, input: { mode, amount: amountValue, ratePercent } };
}
