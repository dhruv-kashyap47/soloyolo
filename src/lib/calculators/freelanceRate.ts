import Decimal from 'decimal.js';

import { MAX_MONEY, isUsableDecimal, roundMoney, toDecimal } from '@/lib/finance/money';
import { percentOf, percentToFraction } from '@/lib/finance/percent';

export const FREELANCE_RATE_LIMITS = {
  maxMoney: MAX_MONEY,
  minWorkingWeeks: new Decimal(1),
  maxWorkingWeeks: new Decimal(52),
  minWorkingHoursPerWeek: new Decimal(1),
  maxWorkingHoursPerWeek: new Decimal(168),
  /** A full week of non-billable time leaves nothing to invoice, so 100 is excluded. */
  maxNonBillablePercent: new Decimal(99),
  maxProfitBufferPercent: new Decimal(100),
} as const;

export interface FreelanceRateInput {
  /** What the freelancer wants to pay themselves before income tax. */
  desiredIncome: Decimal;
  annualExpenses: Decimal;
  workingWeeks: Decimal;
  /** Total hours worked in a week, billable and non-billable together. */
  workingHoursPerWeek: Decimal;
  /** Percentage of the working week that cannot be invoiced: 0–99. */
  nonBillablePercent: Decimal;
  /** Extra revenue held back on top of income and costs: 0–100. */
  profitBufferPercent: Decimal;
}

export interface FreelanceRateBreakdown {
  /** All hours worked in the year, billable and non-billable. */
  workingHoursPerYear: Decimal;
  /** Hours a week that can be invoiced after non-billable time. */
  billableHoursPerWeek: Decimal;
  /** Billable hours available in the year. */
  billableHoursPerYear: Decimal;
  /** Fraction of the working week that is billable: 0.6 for 60%. */
  billableShare: Decimal;
  /** Income plus expenses, before the profit buffer. */
  baseRevenue: Decimal;
  /** The buffer amount added on top of the base revenue. */
  bufferAmount: Decimal;
  /** Total revenue that must be billed in the year. */
  requiredAnnualRevenue: Decimal;
  /** Exact rate at full decimal precision. */
  hourlyRate: Decimal;
  /** Rate rounded half-up to whole cents, the number shown to the user. */
  hourlyRateRounded: Decimal;
  /** Exact rate if no profit buffer were added, for comparison. */
  baseHourlyRate: Decimal;
  requiredWeeklyRevenue: Decimal;
  requiredMonthlyRevenue: Decimal;
}

export type FreelanceRateErrorCode =
  | 'invalid_input'
  | 'negative_input'
  | 'working_weeks_out_of_range'
  | 'hours_out_of_range'
  | 'non_billable_out_of_range'
  | 'buffer_out_of_range'
  | 'zero_capacity';

export type FreelanceRateOutcome =
  | { ok: true; value: FreelanceRateBreakdown }
  | { ok: false; code: FreelanceRateErrorCode; message: string };

/**
 * Freelance rate with non-billable time and a profit buffer:
 *
 *   billable hours = working weeks × working hours a week × (1 − non-billable %)
 *   revenue        = (desired income + expenses) × (1 + buffer %)
 *   hourly rate    = revenue ÷ billable hours
 *
 * Pure function, no UI concerns. Guards live here as well as in the form schema
 * so a caller that bypasses the form still cannot produce Infinity/NaN.
 */
export function calculateFreelanceRate(input: FreelanceRateInput): FreelanceRateOutcome {
  const desiredIncome = toDecimal(input.desiredIncome);
  const annualExpenses = toDecimal(input.annualExpenses);
  const workingWeeks = toDecimal(input.workingWeeks);
  const workingHoursPerWeek = toDecimal(input.workingHoursPerWeek);
  const nonBillablePercent = toDecimal(input.nonBillablePercent);
  const profitBufferPercent = toDecimal(input.profitBufferPercent);

  const values = [
    desiredIncome,
    annualExpenses,
    workingWeeks,
    workingHoursPerWeek,
    nonBillablePercent,
    profitBufferPercent,
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
      message: 'None of these values can be negative.',
    };
  }

  if (
    workingWeeks.lessThan(FREELANCE_RATE_LIMITS.minWorkingWeeks) ||
    workingWeeks.greaterThan(FREELANCE_RATE_LIMITS.maxWorkingWeeks)
  ) {
    return {
      ok: false,
      code: 'working_weeks_out_of_range',
      message: 'Working weeks per year must be between 1 and 52.',
    };
  }

  if (
    workingHoursPerWeek.lessThan(FREELANCE_RATE_LIMITS.minWorkingHoursPerWeek) ||
    workingHoursPerWeek.greaterThan(FREELANCE_RATE_LIMITS.maxWorkingHoursPerWeek)
  ) {
    return {
      ok: false,
      code: 'hours_out_of_range',
      message: 'Working hours per week must be between 1 and 168.',
    };
  }

  if (nonBillablePercent.greaterThan(FREELANCE_RATE_LIMITS.maxNonBillablePercent)) {
    return {
      ok: false,
      code: 'non_billable_out_of_range',
      message:
        'Non-billable time must be between 0 and 99 percent, so at least some hours can be invoiced.',
    };
  }

  if (profitBufferPercent.greaterThan(FREELANCE_RATE_LIMITS.maxProfitBufferPercent)) {
    return {
      ok: false,
      code: 'buffer_out_of_range',
      message: 'The profit buffer must be between 0 and 100 percent.',
    };
  }

  if (desiredIncome.greaterThan(MAX_MONEY) || annualExpenses.greaterThan(MAX_MONEY)) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'Money values are too large to calculate reliably.',
    };
  }

  const billableShare = new Decimal(1).minus(percentToFraction(nonBillablePercent));
  const billableHoursPerWeek = workingHoursPerWeek.times(billableShare);
  const workingHoursPerYear = workingWeeks.times(workingHoursPerWeek);
  const billableHoursPerYear = workingWeeks.times(billableHoursPerWeek);

  if (billableHoursPerYear.lessThanOrEqualTo(0) || !billableHoursPerYear.isFinite()) {
    return {
      ok: false,
      code: 'zero_capacity',
      message: 'Leave some billable time in the week, otherwise there are no hours to bill.',
    };
  }

  const baseRevenue = desiredIncome.plus(annualExpenses);
  const bufferAmount = percentOf(baseRevenue, profitBufferPercent);
  const requiredAnnualRevenue = baseRevenue.plus(bufferAmount);

  const hourlyRate = requiredAnnualRevenue.dividedBy(billableHoursPerYear);
  const baseHourlyRate = baseRevenue.dividedBy(billableHoursPerYear);

  if (!hourlyRate.isFinite() || !baseHourlyRate.isFinite()) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'These values do not produce a usable hourly rate.',
    };
  }

  return {
    ok: true,
    value: {
      workingHoursPerYear,
      billableHoursPerWeek,
      billableHoursPerYear,
      billableShare,
      baseRevenue,
      bufferAmount,
      requiredAnnualRevenue,
      hourlyRate,
      hourlyRateRounded: roundMoney(hourlyRate),
      baseHourlyRate,
      requiredWeeklyRevenue: requiredAnnualRevenue.dividedBy(workingWeeks),
      requiredMonthlyRevenue: requiredAnnualRevenue.dividedBy(12),
    },
  };
}
