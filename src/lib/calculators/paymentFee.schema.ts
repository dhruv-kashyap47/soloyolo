import type Decimal from 'decimal.js';

import type { PaymentFeeInput } from '@/lib/calculators/paymentFee';
import { MAX_MONEY } from '@/lib/finance/money';
import { formatNumber } from '@/lib/formatting/number';
import { parseAmountInput } from '@/lib/validation/amount';

export const PAYMENT_FEE_FIELDS = ['amount', 'percentFee', 'fixedFee'] as const;

export type PaymentFeeField = (typeof PAYMENT_FEE_FIELDS)[number];

export type PaymentFeeFormValues = Record<PaymentFeeField, string>;
export type PaymentFeeFormErrors = Partial<Record<PaymentFeeField, string>>;

export type PaymentFeeValidationResult =
  | { ok: true; input: PaymentFeeInput }
  | { ok: false; errors: PaymentFeeFormErrors };

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

export function validatePaymentFeeForm(
  values: PaymentFeeFormValues,
): PaymentFeeValidationResult {
  const errors: PaymentFeeFormErrors = {};
  const parsed: Partial<Record<PaymentFeeField, Decimal>> = {};

  const amount = parseField('amount', '1000', values.amount);
  if ('error' in amount) {
    errors.amount = amount.error;
  } else if (amount.value.isNegative()) {
    errors.amount = 'Amount cannot be negative.';
  } else if (amount.value.isZero()) {
    errors.amount = 'Amount must be above zero.';
  } else if (amount.value.greaterThan(MAX_MONEY)) {
    errors.amount = `Enter amount below ${formatNumber(MAX_MONEY)}.`;
  } else {
    parsed.amount = amount.value;
  }

  const percentFee = parseField('percentage fee', '2.9', values.percentFee);
  if ('error' in percentFee) {
    errors.percentFee = percentFee.error;
  } else if (percentFee.value.isNegative() || percentFee.value.greaterThan(100)) {
    errors.percentFee = 'Percentage fee must be between 0 and 100.';
  } else {
    parsed.percentFee = percentFee.value;
  }

  const fixedFee = parseField('fixed fee', '0.30', values.fixedFee);
  if ('error' in fixedFee) {
    errors.fixedFee = fixedFee.error;
  } else if (fixedFee.value.isNegative()) {
    errors.fixedFee = 'Fixed fee cannot be negative.';
  } else if (fixedFee.value.greaterThan(MAX_MONEY)) {
    errors.fixedFee = `Enter fixed fee below ${formatNumber(MAX_MONEY)}.`;
  } else {
    parsed.fixedFee = fixedFee.value;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { amount: amountValue, percentFee: percentValue, fixedFee: fixedValue } = parsed;
  if (!amountValue || !percentValue || !fixedValue) {
    return { ok: false, errors: { amount: 'Check the values you entered.' } };
  }

  return {
    ok: true,
    input: { amount: amountValue, percentFee: percentValue, fixedFee: fixedValue },
  };
}
