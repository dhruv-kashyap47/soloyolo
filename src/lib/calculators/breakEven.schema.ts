import type Decimal from 'decimal.js';

import {
  BREAK_EVEN_LIMITS,
  type BreakEvenInput,
  type BreakEvenMode,
} from '@/lib/calculators/breakEven';
import { MAX_MONEY } from '@/lib/finance/money';
import { formatNumber } from '@/lib/formatting/number';
import { parseAmountInput } from '@/lib/validation/amount';

export const BREAK_EVEN_FIELDS = [
  'fixedCosts',
  'pricePerUnit',
  'variableCostPerUnit',
  'hoursPerUnit',
] as const;

export type BreakEvenField = (typeof BREAK_EVEN_FIELDS)[number];

export type BreakEvenFormValues = Record<BreakEvenField, string>;
export type BreakEvenFormErrors = Partial<Record<BreakEvenField, string>>;

export type BreakEvenValidationResult =
  | { ok: true; input: BreakEvenInput }
  | { ok: false; errors: BreakEvenFormErrors };

/** The fields a mode needs; hour mode has no hours-per-unit. */
export function breakEvenFieldsForMode(mode: BreakEvenMode): readonly BreakEvenField[] {
  return mode === 'project'
    ? ['fixedCosts', 'pricePerUnit', 'variableCostPerUnit', 'hoursPerUnit']
    : ['fixedCosts', 'pricePerUnit', 'variableCostPerUnit'];
}

function unitNoun(mode: BreakEvenMode): string {
  return mode === 'project' ? 'project' : 'hour';
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function validateMoney(
  label: string,
  example: string,
  raw: string,
): { value: Decimal } | { error: string } {
  if (raw.trim() === '') {
    return { error: `Enter your ${label}.` };
  }

  const value = parseAmountInput(raw);
  if (value === null) {
    return { error: `Enter ${label} as a number, for example ${example}.` };
  }
  if (value.isNegative()) {
    return { error: `${capitalise(label)} cannot be negative.` };
  }
  if (value.greaterThan(MAX_MONEY)) {
    return { error: `Enter ${label} below ${formatNumber(MAX_MONEY)}.` };
  }

  return { value };
}

function validateHours(raw: string): { value: Decimal } | { error: string } {
  if (raw.trim() === '') {
    return { error: 'Enter your hours per project.' };
  }
  const value = parseAmountInput(raw);
  if (value === null) {
    return { error: 'Enter hours per project as a number, for example 20.' };
  }
  if (value.isNegative() || value.greaterThan(BREAK_EVEN_LIMITS.maxHoursPerUnit)) {
    return { error: 'Hours per project must be between 0 and 10000.' };
  }
  return { value };
}

export function validateBreakEvenForm(
  mode: BreakEvenMode,
  values: BreakEvenFormValues,
): BreakEvenValidationResult {
  const errors: BreakEvenFormErrors = {};
  const parsed: Partial<Record<BreakEvenField, Decimal>> = {};
  const noun = unitNoun(mode);

  const fixed = validateMoney('fixed costs', '4000', values.fixedCosts);
  if ('error' in fixed) errors.fixedCosts = fixed.error;
  else parsed.fixedCosts = fixed.value;

  const price = validateMoney(`price per ${noun}`, '1500', values.pricePerUnit);
  if ('error' in price) errors.pricePerUnit = price.error;
  else parsed.pricePerUnit = price.value;

  const variable = validateMoney(
    `variable cost per ${noun}`,
    '500',
    values.variableCostPerUnit,
  );
  if ('error' in variable) errors.variableCostPerUnit = variable.error;
  else parsed.variableCostPerUnit = variable.value;

  let hours: Decimal | undefined;
  if (mode === 'project') {
    const result = validateHours(values.hoursPerUnit);
    if ('error' in result) errors.hoursPerUnit = result.error;
    else hours = result.value;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { fixedCosts, pricePerUnit, variableCostPerUnit } = parsed;
  if (!fixedCosts || !pricePerUnit || !variableCostPerUnit) {
    return { ok: false, errors: { fixedCosts: 'Check the values you entered.' } };
  }

  if (mode === 'project') {
    if (!hours) {
      return { ok: false, errors: { hoursPerUnit: 'Check the values you entered.' } };
    }
    return {
      ok: true,
      input: { mode: 'project', fixedCosts, pricePerUnit, variableCostPerUnit, hoursPerUnit: hours },
    };
  }

  return {
    ok: true,
    input: { mode: 'hour', fixedCosts, pricePerUnit, variableCostPerUnit },
  };
}
