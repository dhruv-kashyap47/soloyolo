import type Decimal from 'decimal.js';

import type { ProjectProfitInput } from '@/lib/calculators/projectProfit';
import { MAX_MONEY } from '@/lib/finance/money';
import { formatNumber } from '@/lib/formatting/number';
import { parseAmountInput } from '@/lib/validation/amount';

export const PROJECT_PROFIT_FIELDS = [
  'revenue',
  'labor',
  'contractor',
  'software',
  'other',
  'overhead',
] as const;

export type ProjectProfitField = (typeof PROJECT_PROFIT_FIELDS)[number];

export type ProjectProfitFormValues = Record<ProjectProfitField, string>;
export type ProjectProfitFormErrors = Partial<Record<ProjectProfitField, string>>;

export type ProjectProfitValidationResult =
  | { ok: true; input: ProjectProfitInput }
  | { ok: false; errors: ProjectProfitFormErrors };

interface FieldDefinition {
  /** Lower-case label used inside sentences. */
  label: string;
  example: string;
}

const FIELD_DEFINITIONS: Record<ProjectProfitField, FieldDefinition> = {
  revenue: { label: 'project revenue', example: '12000' },
  labor: { label: 'labor cost', example: '5000' },
  contractor: { label: 'contractor cost', example: '1500' },
  software: { label: 'software cost', example: '300' },
  other: { label: 'other direct costs', example: '200' },
  overhead: { label: 'allocated overhead', example: '1000' },
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

  if (value.greaterThan(MAX_MONEY)) {
    return {
      error: `Enter ${definition.label} below ${formatNumber(MAX_MONEY)}.`,
    };
  }

  return { value };
}

export function validateProjectProfitForm(
  values: ProjectProfitFormValues,
): ProjectProfitValidationResult {
  const errors: ProjectProfitFormErrors = {};
  const parsed: Partial<Record<ProjectProfitField, Decimal>> = {};

  for (const field of PROJECT_PROFIT_FIELDS) {
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

  const { revenue, labor, contractor, software, other, overhead } = parsed;

  if (!revenue || !labor || !contractor || !software || !other || !overhead) {
    return { ok: false, errors: { revenue: 'Check the values you entered.' } };
  }

  return {
    ok: true,
    input: { revenue, labor, contractor, software, other, overhead },
  };
}
