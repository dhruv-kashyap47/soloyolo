import type Decimal from 'decimal.js';

import { FREELANCE_RATE_LIMITS, type FreelanceRateInput } from '@/lib/calculators/freelanceRate';
import { MAX_MONEY } from '@/lib/finance/money';
import { formatNumber } from '@/lib/formatting/number';
import { parseAmountInput } from '@/lib/validation/amount';

export const FREELANCE_RATE_FIELDS = [
  'desiredIncome',
  'annualExpenses',
  'workingWeeks',
  'workingHoursPerWeek',
  'nonBillablePercent',
  'profitBufferPercent',
] as const;

export type FreelanceRateField = (typeof FREELANCE_RATE_FIELDS)[number];

export type FreelanceRateFormValues = Record<FreelanceRateField, string>;
export type FreelanceRateFormErrors = Partial<Record<FreelanceRateField, string>>;

export type FreelanceRateValidationResult =
  { ok: true; input: FreelanceRateInput } | { ok: false; errors: FreelanceRateFormErrors };

interface FieldLabel {
  /** Lower-case label used inside sentences. */
  label: string;
  example: string;
}

type FieldDefinition = FieldLabel &
  ({ kind: 'money' } | { kind: 'bounded'; min: number; max: number });

const FIELD_DEFINITIONS: Record<FreelanceRateField, FieldDefinition> = {
  desiredIncome: { kind: 'money', label: 'target annual income', example: '90000' },
  annualExpenses: { kind: 'money', label: 'annual business expenses', example: '15000' },
  workingWeeks: {
    kind: 'bounded',
    label: 'working weeks per year',
    example: '46',
    min: FREELANCE_RATE_LIMITS.minWorkingWeeks.toNumber(),
    max: FREELANCE_RATE_LIMITS.maxWorkingWeeks.toNumber(),
  },
  workingHoursPerWeek: {
    kind: 'bounded',
    label: 'working hours per week',
    example: '40',
    min: FREELANCE_RATE_LIMITS.minWorkingHoursPerWeek.toNumber(),
    max: FREELANCE_RATE_LIMITS.maxWorkingHoursPerWeek.toNumber(),
  },
  nonBillablePercent: {
    kind: 'bounded',
    label: 'non-billable time',
    example: '40',
    min: 0,
    max: FREELANCE_RATE_LIMITS.maxNonBillablePercent.toNumber(),
  },
  profitBufferPercent: {
    kind: 'bounded',
    label: 'profit buffer',
    example: '10',
    min: 0,
    max: FREELANCE_RATE_LIMITS.maxProfitBufferPercent.toNumber(),
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
  } else if (value.lessThan(definition.min) || value.greaterThan(definition.max)) {
    return {
      error: `${capitalise(definition.label)} must be between ${definition.min} and ${definition.max}.`,
    };
  }

  return { value };
}

export function validateFreelanceRateForm(
  values: FreelanceRateFormValues,
): FreelanceRateValidationResult {
  const errors: FreelanceRateFormErrors = {};
  const parsed: Partial<Record<FreelanceRateField, Decimal>> = {};

  for (const field of FREELANCE_RATE_FIELDS) {
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

  const {
    desiredIncome,
    annualExpenses,
    workingWeeks,
    workingHoursPerWeek,
    nonBillablePercent,
    profitBufferPercent,
  } = parsed;

  if (
    !desiredIncome ||
    !annualExpenses ||
    !workingWeeks ||
    !workingHoursPerWeek ||
    !nonBillablePercent ||
    !profitBufferPercent
  ) {
    return { ok: false, errors: { desiredIncome: 'Check the values you entered.' } };
  }

  return {
    ok: true,
    input: {
      desiredIncome,
      annualExpenses,
      workingWeeks,
      workingHoursPerWeek,
      nonBillablePercent,
      profitBufferPercent,
    },
  };
}
