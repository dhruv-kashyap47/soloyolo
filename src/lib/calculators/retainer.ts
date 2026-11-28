import Decimal from 'decimal.js';

import { MAX_MONEY, isUsableDecimal, roundMoney, safeDivide, toDecimal } from '@/lib/finance/money';
import { percentOf, percentToFraction } from '@/lib/finance/percent';

export const RETAINER_LIMITS = {
  maxMoney: MAX_MONEY,
  minMonthlyHours: new Decimal(1),
  /** A month has 744 hours; anything above that is a typo. */
  maxMonthlyHours: new Decimal(744),
  maxMarginPercent: new Decimal(99),
  maxDiscountPercent: new Decimal(100),
} as const;

export interface RetainerInput {
  monthlyHours: Decimal;
  /** What your hour is worth before the retainer margin. */
  hourlyRate: Decimal;
  /** Monthly business costs the retainer has to carry. */
  monthlyExpenses: Decimal;
  /** Margin on the discounted retainer, e.g. 30 for 30%. */
  desiredMarginPercent: Decimal;
  /** Concession offered to the client, e.g. 10 for 10% off. */
  discountPercent: Decimal;
}

export interface RetainerBreakdown {
  /** Hours × rate + expenses: what the month costs you. */
  baseCost: Decimal;
  /** List price before the discount, already carrying the margin. */
  quote: Decimal;
  discountAmount: Decimal;
  /** What the client actually pays each month. */
  retainer: Decimal;
  monthlyProfit: Decimal;
  annualRevenue: Decimal;
  /** Retainer ÷ hours, the rate the client is really paying. */
  effectiveHourly: Decimal;
  /** Profit ÷ retainer after the discount; null when the retainer is zero. */
  achievedMargin: Decimal | null;
  baseRounded: Decimal;
  quoteRounded: Decimal;
  discountRounded: Decimal;
  retainerRounded: Decimal;
  annualRounded: Decimal;
  effectiveHourlyRounded: Decimal;
  profitRounded: Decimal;
}

export type RetainerErrorCode =
  | 'invalid_input'
  | 'negative_input'
  | 'hours_out_of_range'
  | 'margin_out_of_range'
  | 'discount_out_of_range'
  | 'too_large';

export type RetainerOutcome =
  | { ok: true; value: RetainerBreakdown }
  | { ok: false; code: RetainerErrorCode; message: string };

/**
 * Retainer pricing:
 *
 *   base  = monthly hours × hourly rate + monthly expenses
 *   quote = base ÷ (1 − desired margin)
 *   retainer = quote × (1 − discount)
 *
 * The discount comes out of the price the margin was built on, so a 10%
 * discount on a 30% margin does not leave a 20% margin. achievedMargin reports
 * what is actually left.
 */
export function calculateRetainer(input: RetainerInput): RetainerOutcome {
  const monthlyHours = toDecimal(input.monthlyHours);
  const hourlyRate = toDecimal(input.hourlyRate);
  const monthlyExpenses = toDecimal(input.monthlyExpenses);
  const desiredMarginPercent = toDecimal(input.desiredMarginPercent);
  const discountPercent = toDecimal(input.discountPercent);

  const values = [
    monthlyHours,
    hourlyRate,
    monthlyExpenses,
    desiredMarginPercent,
    discountPercent,
  ];

  if (values.some((value) => !isUsableDecimal(value))) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'All values must be valid numbers.',
    };
  }

  if (values.some((value) => value.isNegative())) {
    return {
      ok: false,
      code: 'negative_input',
      message: 'Hours, rates, expenses and percentages cannot be negative.',
    };
  }

  if (
    monthlyHours.lessThan(RETAINER_LIMITS.minMonthlyHours) ||
    monthlyHours.greaterThan(RETAINER_LIMITS.maxMonthlyHours)
  ) {
    return {
      ok: false,
      code: 'hours_out_of_range',
      message: 'Monthly hours must be between 1 and 744.',
    };
  }

  if (desiredMarginPercent.greaterThan(RETAINER_LIMITS.maxMarginPercent)) {
    return {
      ok: false,
      code: 'margin_out_of_range',
      message: 'The desired margin must be between 0 and 99 percent.',
    };
  }

  if (discountPercent.greaterThan(RETAINER_LIMITS.maxDiscountPercent)) {
    return {
      ok: false,
      code: 'discount_out_of_range',
      message: 'The discount must be between 0 and 100 percent.',
    };
  }

  if (
    hourlyRate.greaterThan(MAX_MONEY) ||
    monthlyExpenses.greaterThan(MAX_MONEY)
  ) {
    return {
      ok: false,
      code: 'too_large',
      message: 'Money values are too large to calculate reliably.',
    };
  }

  const baseCost = monthlyHours.times(hourlyRate).plus(monthlyExpenses);
  const quote = baseCost.dividedBy(new Decimal(1).minus(percentToFraction(desiredMarginPercent)));
  const discountAmount = percentOf(quote, discountPercent);
  const retainer = quote.minus(discountAmount);
  const monthlyProfit = retainer.minus(baseCost);
  const annualRevenue = retainer.times(12);
  const effectiveHourly = retainer.dividedBy(monthlyHours);

  if (!quote.isFinite() || !retainer.isFinite() || !effectiveHourly.isFinite()) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'These values do not produce a usable retainer.',
    };
  }

  // The headline figures keep their own rounding, but the discount and profit
  // rows are derived from the rounded figures above them. Otherwise a panel
  // can show $1.01 − $0.50 = $0.50, which is exactly the kind of arithmetic a
  // visitor checks first.
  const baseRounded = roundMoney(baseCost);
  const quoteRounded = roundMoney(quote);
  const retainerRounded = roundMoney(retainer);

  return {
    ok: true,
    value: {
      baseCost,
      quote,
      discountAmount,
      retainer,
      monthlyProfit,
      annualRevenue,
      effectiveHourly,
      achievedMargin: safeDivide(monthlyProfit, retainer),
      baseRounded,
      quoteRounded,
      discountRounded: quoteRounded.minus(retainerRounded),
      retainerRounded,
      annualRounded: roundMoney(annualRevenue),
      effectiveHourlyRounded: roundMoney(effectiveHourly),
      profitRounded: retainerRounded.minus(baseRounded),
    },
  };
}
