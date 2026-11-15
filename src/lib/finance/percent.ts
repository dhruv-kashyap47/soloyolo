import type Decimal from 'decimal.js';

import { toDecimal, type DecimalInput } from '@/lib/finance/money';

/**
 * Percentage helpers shared by the calculators.
 *
 * Every percentage in the UI is entered as a percentage (40 for 40%), but all
 * arithmetic happens on the decimal fraction (0.4). Keeping the conversion in
 * one place stops a "did I divide by 100 here" mistake from reaching a result.
 */

/** Converts a percentage to its fraction: 40 → 0.4. */
export function percentToFraction(percent: DecimalInput): Decimal {
  return toDecimal(percent).dividedBy(100);
}

/** The amount that `percent` of `value` represents, e.g. 10% of 105,000 → 10,500. */
export function percentOf(value: DecimalInput, percent: DecimalInput): Decimal {
  return toDecimal(value).times(percentToFraction(percent));
}
