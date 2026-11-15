import Decimal from 'decimal.js';

import { MAX_MONEY, isUsableDecimal, roundMoney, toDecimal } from '@/lib/finance/money';

export const BREAK_EVEN_LIMITS = {
  maxMoney: MAX_MONEY,
  maxHoursPerUnit: new Decimal(10000),
} as const;

export type BreakEvenMode = 'project' | 'hour';

export type BreakEvenInput =
  | {
      mode: 'project';
      fixedCosts: Decimal;
      pricePerUnit: Decimal;
      variableCostPerUnit: Decimal;
      hoursPerUnit: Decimal;
    }
  | {
      mode: 'hour';
      fixedCosts: Decimal;
      pricePerUnit: Decimal;
      variableCostPerUnit: Decimal;
    };

export interface BreakEvenBreakdown {
  /** Price minus variable cost: what each sale contributes to fixed costs. */
  contributionPerUnit: Decimal;
  /** Exact number of units needed, before rounding up. */
  breakEvenUnits: Decimal;
  /** Whole units: you cannot deliver 6.3 projects. */
  unitsRoundedUp: Decimal;
  /** Revenue at the exact break-even point. */
  breakEvenRevenue: Decimal;
  /** Hours needed to reach break-even; null when no hours figure applies. */
  breakEvenHours: Decimal | null;
  revenueRounded: Decimal;
}

export type BreakEvenErrorCode =
  | 'invalid_input'
  | 'negative_input'
  | 'too_large'
  | 'no_break_even'
  | 'hours_out_of_range';

export type BreakEvenOutcome =
  | { ok: true; value: BreakEvenBreakdown }
  | { ok: false; code: BreakEvenErrorCode; message: string };

/**
 * Break-even:
 *
 *   contribution = price − variable cost
 *   units        = fixed costs ÷ contribution
 *   revenue      = units × price
 *
 * A price at or below variable cost never covers fixed costs, so that case is
 * an explicit error rather than an infinite number.
 */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenOutcome {
  const fixedCosts = toDecimal(input.fixedCosts);
  const pricePerUnit = toDecimal(input.pricePerUnit);
  const variableCostPerUnit = toDecimal(input.variableCostPerUnit);
  const hoursPerUnit = input.mode === 'project' ? toDecimal(input.hoursPerUnit) : null;

  const values = [fixedCosts, pricePerUnit, variableCostPerUnit];
  if (hoursPerUnit) values.push(hoursPerUnit);

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
      message: 'Costs, prices and hours cannot be negative.',
    };
  }

  if (values.some((value) => value.greaterThan(MAX_MONEY))) {
    return {
      ok: false,
      code: 'too_large',
      message: 'Money values are too large to calculate reliably.',
    };
  }

  if (hoursPerUnit && hoursPerUnit.greaterThan(BREAK_EVEN_LIMITS.maxHoursPerUnit)) {
    return {
      ok: false,
      code: 'hours_out_of_range',
      message: 'Hours per project must be between 0 and 10,000.',
    };
  }

  const contributionPerUnit = pricePerUnit.minus(variableCostPerUnit);

  if (contributionPerUnit.lessThanOrEqualTo(0)) {
    return {
      ok: false,
      code: 'no_break_even',
      message: 'Price must be above the variable cost, otherwise no volume reaches break-even.',
    };
  }

  const breakEvenUnits = fixedCosts.dividedBy(contributionPerUnit);
  const breakEvenRevenue = breakEvenUnits.times(pricePerUnit);
  const breakEvenHours = hoursPerUnit ? breakEvenUnits.times(hoursPerUnit) : breakEvenUnits;

  if (!breakEvenUnits.isFinite() || !breakEvenRevenue.isFinite() || !breakEvenHours.isFinite()) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'These values do not produce a usable break-even point.',
    };
  }

  return {
    ok: true,
    value: {
      contributionPerUnit,
      breakEvenUnits,
      unitsRoundedUp: breakEvenUnits.ceil(),
      breakEvenRevenue,
      breakEvenHours,
      revenueRounded: roundMoney(breakEvenRevenue),
    },
  };
}
