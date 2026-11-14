import type Decimal from 'decimal.js';

import { HOURLY_RATE_LIMITS, type HourlyRateInput } from '@/lib/calculators/hourlyRate';
import { formatNumber } from '@/lib/formatting/number';
import { MAX_MONEY } from '@/lib/finance/money';
import { parseAmountInput } from '@/lib/validation/amount';

export const HOURLY_RATE_FIELDS = [
  'targetIncome',
  'annualExpenses',
  'workingWeeks',
  'billableHoursPerWeek',
] as const;

export type HourlyRateField = (typeof HOURLY_RATE_FIELDS)[number];

export type HourlyRateFormValues = Record<HourlyRateField, string>;
export type HourlyRateFormErrors = Partial<Record<HourlyRateField, string>>;

export type HourlyRateValidationResult =
  { ok: true; input: HourlyRateInput } | { ok: false; errors: HourlyRateFormErrors };

interface FieldLabel {
  /** Lower-case label used inside sentences. */
  label: string;
  example: string;
}

type FieldDefinition = FieldLabel &
  ({ kind: 'money' } | { kind: 'bounded'; min: number; max: number });

const FIELD_DEFINITIONS: Record<HourlyRateField, FieldDefinition> = {
  targetIncome: { kind: 'money', label: 'target annual income', example: '80000' },
  annualExpenses: { kind: 'money', label: 'annual business expenses', example: '12000' },
  workingWeeks: {
    kind: 'bounded',
    label: 'working weeks per year',
    example: '48',
    min: HOURLY_RATE_LIMITS.minWorkingWeeks.toNumber(),
    max: HOURLY_RATE_LIMITS.maxWorkingWeeks.toNumber(),
  },
  billableHoursPerWeek: {
    kind: 'bounded',
    label: 'billable hours per week',
    example: '25',
    min: HOURLY_RATE_LIMITS.minBillableHoursPerWeek.toNumber(),
    max: HOURLY_RATE_LIMITS.maxBillableHoursPerWeek.toNumber(),
  },
};

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function validateField(
  definition: FieldDefinition,
  raw: string,
): { value: Decimal } | { error: string } {
  if (raw.trim() === '') {
    return { error: `Enter your ${definition.label}.` };
  }

  const value = parseAmountInput(raw);
  if (value === null) {
    return {
      error: `Enter ${definition.label} as a number, for example ${definition.example}.`,
    };
  }

  if (definition.kind === 'money') {
    if (value.isNegative()) {
      return { error: `${capitalise(definition.label)} cannot be negative.` };
    }
    if (value.greaterThan(MAX_MONEY)) {
      return {
        error: `Enter ${definition.label} below ${formatNumber(MAX_MONEY)}.`,
      };
    }
  } else {
    if (value.lessThan(definition.min) || value.greaterThan(definition.max)) {
      return {
        error: `${capitalise(definition.label)} must be between ${definition.min} and ${definition.max}.`,
      };
    }
  }

  return { value };
}

export function validateHourlyRateForm(values: HourlyRateFormValues): HourlyRateValidationResult {
  const errors: HourlyRateFormErrors = {};
  const parsed: Partial<Record<HourlyRateField, Decimal>> = {};

  for (const field of HOURLY_RATE_FIELDS) {
    const result = validateField(FIELD_DEFINITIONS[field], values[field]);
    if ('error' in result) {
      errors[field] = result.error;
    } else {
      parsed[field] = result.value;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { targetIncome, annualExpenses, workingWeeks, billableHoursPerWeek } = parsed;

  if (!targetIncome || !annualExpenses || !workingWeeks || !billableHoursPerWeek) {
    return { ok: false, errors: { targetIncome: 'Check the values you entered.' } };
  }

  return {
    ok: true,
    input: { targetIncome, annualExpenses, workingWeeks, billableHoursPerWeek },
  };
}
