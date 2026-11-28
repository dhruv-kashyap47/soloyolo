import type Decimal from 'decimal.js';

import { RETAINER_LIMITS, type RetainerInput } from '@/lib/calculators/retainer';
import { MAX_MONEY } from '@/lib/finance/money';
import { formatNumber } from '@/lib/formatting/number';
import { parseAmountInput } from '@/lib/validation/amount';

export const RETAINER_FIELDS = [
  'monthlyHours',
  'hourlyRate',
  'monthlyExpenses',
  'desiredMarginPercent',
  'discountPercent',
] as const;

export type RetainerField = (typeof RETAINER_FIELDS)[number];

export type RetainerFormValues = Record<RetainerField, string>;
export type RetainerFormErrors = Partial<Record<RetainerField, string>>;

export type RetainerValidationResult =
  { ok: true; input: RetainerInput } | { ok: false; errors: RetainerFormErrors };

interface FieldDefinition {
  label: string;
  example: string;
  kind: 'money' | 'percent' | 'hours';
  max: Decimal;
}

const FIELDS: Record<RetainerField, FieldDefinition> = {
  monthlyHours: {
    label: 'monthly hours',
    example: '20',
    kind: 'hours',
    max: RETAINER_LIMITS.maxMonthlyHours,
  },
  hourlyRate: { label: 'hourly rate', example: '90', kind: 'money', max: MAX_MONEY },
  monthlyExpenses: {
    label: 'monthly expenses',
    example: '600',
    kind: 'money',
    max: MAX_MONEY,
  },
  desiredMarginPercent: {
    label: 'desired margin',
    example: '30',
    kind: 'percent',
    max: RETAINER_LIMITS.maxMarginPercent,
  },
  discountPercent: {
    label: 'discount',
    example: '10',
    kind: 'percent',
    max: RETAINER_LIMITS.maxDiscountPercent,
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

  if (value.isNegative()) {
    return { error: `${capitalise(definition.label)} cannot be negative.` };
  }

  if (definition.kind === 'hours') {
    if (value.lessThan(1) || value.greaterThan(definition.max)) {
      return {
        error: `${capitalise(definition.label)} must be between 1 and ${definition.max.toString()}.`,
      };
    }
    return { value };
  }

  if (definition.kind === 'percent') {
    if (value.greaterThan(definition.max)) {
      return {
        error: `${capitalise(definition.label)} must be between 0 and ${definition.max.toString()}.`,
      };
    }
    return { value };
  }

  if (value.greaterThan(definition.max)) {
    return { error: `Enter ${definition.label} below ${formatNumber(definition.max)}.` };
  }

  return { value };
}

export function validateRetainerForm(values: RetainerFormValues): RetainerValidationResult {
  const errors: RetainerFormErrors = {};
  const parsed: Partial<Record<RetainerField, Decimal>> = {};

  for (const field of RETAINER_FIELDS) {
    const result = validateField(FIELDS[field], values[field]);
    if ('error' in result) {
      errors[field] = result.error;
    } else {
      parsed[field] = result.value;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { monthlyHours, hourlyRate, monthlyExpenses, desiredMarginPercent, discountPercent } =
    parsed;

  if (
    !monthlyHours ||
    !hourlyRate ||
    !monthlyExpenses ||
    !desiredMarginPercent ||
    !discountPercent
  ) {
    return { ok: false, errors: { monthlyHours: 'Check the values you entered.' } };
  }

  return {
    ok: true,
    input: {
      monthlyHours,
      hourlyRate,
      monthlyExpenses,
      desiredMarginPercent,
      discountPercent,
    },
  };
}
