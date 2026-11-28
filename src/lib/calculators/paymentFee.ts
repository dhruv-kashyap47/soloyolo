import type Decimal from 'decimal.js';

import { MAX_MONEY, isUsableDecimal, roundMoney, safeDivide, toDecimal } from '@/lib/finance/money';
import { percentOf } from '@/lib/finance/percent';

export const PAYMENT_FEE_LIMITS = {
  maxMoney: MAX_MONEY,
  maxPercent: 100,
} as const;

export interface PaymentFeeInput {
  /** The amount the client pays before the processor takes its cut. */
  amount: Decimal;
  /** Percentage fee, e.g. 2.9 for 2.9%. */
  percentFee: Decimal;
  /** Flat fee per transaction, e.g. 0.30. */
  fixedFee: Decimal;
}

export interface PaymentFeeBreakdown {
  /** The percentage part of the fee on its own. */
  percentFeeAmount: Decimal;
  /** The flat fee, echoed back so the panel never has to derive it. */
  fixedFee: Decimal;
  /** Percentage part plus the flat fee. */
  totalFee: Decimal;
  /** What actually lands in the account. */
  netAmount: Decimal;
  /** total fee ÷ amount as a fraction; null when the amount is zero. */
  effectivePercent: Decimal | null;
  totalFeeRounded: Decimal;
  netRounded: Decimal;
  amountRounded: Decimal;
}

export type PaymentFeeErrorCode =
  'invalid_input' | 'negative_input' | 'zero_amount' | 'percent_out_of_range' | 'too_large';

export type PaymentFeeOutcome =
  | { ok: true; value: PaymentFeeBreakdown }
  | { ok: false; code: PaymentFeeErrorCode; message: string };

/**
 * Payment processing fee:
 *
 *   fee = amount × percent fee + fixed fee
 *   net = amount − fee
 *   effective % = fee ÷ amount
 *
 * No processor rates are baked in: the fee inputs are whatever the processor
 * charges, so the tool stays correct when those rates change.
 */
export function calculatePaymentFee(input: PaymentFeeInput): PaymentFeeOutcome {
  const amount = toDecimal(input.amount);
  const percentFee = toDecimal(input.percentFee);
  const fixedFee = toDecimal(input.fixedFee);

  if (!isUsableDecimal(amount) || !isUsableDecimal(percentFee) || !isUsableDecimal(fixedFee)) {
    return invalid();
  }
  if (amount.isNegative() || percentFee.isNegative() || fixedFee.isNegative()) {
    return {
      ok: false,
      code: 'negative_input',
      message: 'The amount and the fees cannot be negative.',
    };
  }
  if (percentFee.greaterThan(PAYMENT_FEE_LIMITS.maxPercent)) {
    return {
      ok: false,
      code: 'percent_out_of_range',
      message: 'The percentage fee must be between 0 and 100.',
    };
  }
  if (amount.greaterThan(MAX_MONEY) || fixedFee.greaterThan(MAX_MONEY)) {
    return {
      ok: false,
      code: 'too_large',
      message: 'Money values are too large to calculate reliably.',
    };
  }
  if (amount.isZero()) {
    return {
      ok: false,
      code: 'zero_amount',
      message: 'Enter an amount above zero to see the fees.',
    };
  }

  const percentFeeAmount = percentOf(amount, percentFee);
  const totalFee = percentFeeAmount.plus(fixedFee);
  const netAmount = amount.minus(totalFee);

  // The amount, the fee and the net must add up on screen. Round the amount and
  // the fee, then derive the net, so the three displayed figures reconcile.
  const amountRounded = roundMoney(amount);
  const totalFeeRounded = roundMoney(totalFee);

  return {
    ok: true,
    value: {
      percentFeeAmount,
      fixedFee,
      totalFee,
      netAmount,
      effectivePercent: safeDivide(totalFee, amount),
      totalFeeRounded,
      netRounded: amountRounded.minus(totalFeeRounded),
      amountRounded,
    },
  };
}

function invalid(): PaymentFeeOutcome {
  return { ok: false, code: 'invalid_input', message: 'All values must be valid numbers.' };
}
