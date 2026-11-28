import Decimal from 'decimal.js';

/**
 * Shared decimal configuration.
 *
 * Financial values must never be computed with binary floating point. All money
 * math in this project goes through Decimal with a precision high enough that
 * intermediate divisions (hourly rates, tax splits) stay stable before the final
 * two-decimal rounding for display.
 */
export const DECIMAL_PRECISION = 40;

Decimal.set({
  precision: DECIMAL_PRECISION,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 40,
});

/** Upper bound for a single monetary input: 1,000,000,000. */
export const MAX_MONEY = new Decimal('1000000000');

export type DecimalInput = Decimal.Value;

export function toDecimal(value: DecimalInput): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

/**
 * True when a value can be used in arithmetic: finite and not NaN. Calculators
 * check this before dividing so a bad input can never produce Infinity or NaN.
 */
export function isUsableDecimal(value: DecimalInput): boolean {
  const decimal = toDecimal(value);
  return decimal.isFinite() && !decimal.isNaN();
}

/**
 * Rounds a monetary value for display. Half-up is the convention used by
 * invoices and price lists; it is applied only at the presentation boundary so
 * intermediate math keeps full precision.
 */
export function roundMoney(value: DecimalInput, decimals = 2): Decimal {
  const rounded = toDecimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
  // Decimal keeps the sign of zero; Intl would then print "-$0.00".
  return rounded.isZero() ? new Decimal(0) : rounded;
}

/** Sums a list of decimal-able values without accumulating float error. */
export function sumDecimals(values: readonly DecimalInput[]): Decimal {
  return values.reduce<Decimal>((total, value) => total.plus(toDecimal(value)), new Decimal(0));
}

/**
 * Divides two decimals, returning null instead of Infinity or NaN when the
 * denominator is zero. Callers must handle null explicitly.
 */
export function safeDivide(numerator: DecimalInput, denominator: DecimalInput): Decimal | null {
  const divisor = toDecimal(denominator);
  if (divisor.isZero()) return null;
  const result = toDecimal(numerator).dividedBy(divisor);
  return result.isFinite() ? result : null;
}
