import Decimal from 'decimal.js';

import {
  MAX_MONEY,
  isUsableDecimal,
  roundMoney,
  toDecimal,
  type DecimalInput,
} from '@/lib/finance/money';

export const HOURLY_RATE_LIMITS = {
  maxMoney: MAX_MONEY,
  minWorkingWeeks: new Decimal(1),
  maxWorkingWeeks: new Decimal(52),
  minBillableHoursPerWeek: new Decimal(1),
  maxBillableHoursPerWeek: new Decimal(168),
  maxBillableHoursPerYear: new Decimal(8736),
} as const;

export interface HourlyRateInput {
  targetIncome: Decimal;
  annualExpenses: Decimal;
  workingWeeks: Decimal;
  billableHoursPerWeek: Decimal;
}

export interface HourlyRateBreakdown {
  /** Revenue that must be billed in a year to hit the target and cover expenses. */
  requiredAnnualRevenue: Decimal;
  /** Billable hours available in a year. */
  billableHoursPerYear: Decimal;
  /** Exact rate at full decimal precision. */
  hourlyRate: Decimal;
  /** Rate rounded half-up to whole cents, the number shown to the user. */
  hourlyRateRounded: Decimal;
  requiredWeeklyRevenue: Decimal;
  requiredMonthlyRevenue: Decimal;
}

export type HourlyRateErrorCode =
  | 'invalid_input'
  | 'negative_input'
  | 'working_weeks_out_of_range'
  | 'hours_out_of_range'
  | 'zero_capacity';

export type HourlyRateOutcome =
  | { ok: true; value: HourlyRateBreakdown }
  | { ok: false; code: HourlyRateErrorCode; message: string };

/**
 * Required hourly rate: *   (target income + annual expenses) / (working weeks × billable hours per week)
 *
 * Pure function, no UI concerns. All guards live here as well as in the form
 * schema so a caller that bypasses the UI still cannot produce Infinity/NaN.
 */
export function calculateHourlyRate(input: HourlyRateInput): HourlyRateOutcome {
  const targetIncome = toDecimal(input.targetIncome);
  const annualExpenses = toDecimal(input.annualExpenses);
  const workingWeeks = toDecimal(input.workingWeeks);
  const billableHoursPerWeek = toDecimal(input.billableHoursPerWeek);

  const values = [targetIncome, annualExpenses, workingWeeks, billableHoursPerWeek];
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
      message: 'Income, expenses, weeks and hours cannot be negative.',
    };
  }

  if (
    workingWeeks.lessThan(HOURLY_RATE_LIMITS.minWorkingWeeks) ||
    workingWeeks.greaterThan(HOURLY_RATE_LIMITS.maxWorkingWeeks)
  ) {
    return {
      ok: false,
      code: 'working_weeks_out_of_range',
      message: 'Working weeks per year must be between 1 and 52.',
    };
  }

  if (
    billableHoursPerWeek.lessThan(HOURLY_RATE_LIMITS.minBillableHoursPerWeek) ||
    billableHoursPerWeek.greaterThan(HOURLY_RATE_LIMITS.maxBillableHoursPerWeek)
  ) {
    return {
      ok: false,
      code: 'hours_out_of_range',
      message: 'Billable hours per week must be between 1 and 168.',
    };
  }

  if (targetIncome.greaterThan(MAX_MONEY) || annualExpenses.greaterThan(MAX_MONEY)) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'Money values are too large to calculate reliably.',
    };
  }

  const billableHoursPerYear = workingWeeks.times(billableHoursPerWeek);

  if (billableHoursPerYear.lessThanOrEqualTo(0) || !billableHoursPerYear.isFinite()) {
    return {
      ok: false,
      code: 'zero_capacity',
      message: 'Working weeks and billable hours must give you at least one billable hour.',
    };
  }

  const requiredAnnualRevenue = targetIncome.plus(annualExpenses);
  const hourlyRate = requiredAnnualRevenue.dividedBy(billableHoursPerYear);

  if (!hourlyRate.isFinite()) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'These values do not produce a usable hourly rate.',
    };
  }

  return {
    ok: true,
    value: {
      requiredAnnualRevenue,
      billableHoursPerYear,
      hourlyRate,
      hourlyRateRounded: roundMoney(hourlyRate),
      requiredWeeklyRevenue: requiredAnnualRevenue.dividedBy(workingWeeks),
      requiredMonthlyRevenue: requiredAnnualRevenue.dividedBy(12),
    },
  };
}

/** Prices a block of hours at a rate, rounded to cents for display. */
export function quoteWork(rate: DecimalInput, hours: DecimalInput): Decimal {
  return roundMoney(toDecimal(rate).times(toDecimal(hours)));
}
