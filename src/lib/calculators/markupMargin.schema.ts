import type Decimal from 'decimal.js';

import {
  MARKUP_MARGIN_LIMITS,
  type MarkupMarginInput,
  type MarkupMarginMode,
} from '@/lib/calculators/markupMargin';
import { MAX_MONEY } from '@/lib/finance/money';
import { formatNumber } from '@/lib/formatting/number';
import { parseAmountInput } from '@/lib/validation/amount';

export const MARKUP_MARGIN_FIELDS = ['cost', 'price', 'markupPercent', 'marginPercent'] as const;

export type MarkupMarginField = (typeof MARKUP_MARGIN_FIELDS)[number];

export type MarkupMarginFormValues = Record<MarkupMarginField, string>;
export type MarkupMarginFormErrors = Partial<Record<MarkupMarginField, string>>;

export type MarkupMarginValidationResult =
  { ok: true; input: MarkupMarginInput } | { ok: false; errors: MarkupMarginFormErrors };

interface FieldDefinition {
  /** Lower-case label used inside sentences. */
  label: string;
  example: string;
}

const FIELD_DEFINITIONS: Record<MarkupMarginField, FieldDefinition> = {
  cost: { label: 'cost', example: '2500' },
  price: { label: 'price', example: '5000' },
  markupPercent: { label: 'markup', example: '100' },
  marginPercent: { label: 'margin', example: '50' },
};

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function parseField(
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

  return { value };
}

function validateMoney(
  definition: FieldDefinition,
  raw: string,
): { value: Decimal } | { error: string } {
  const parsed = parseField(definition, raw);
  if ('error' in parsed) return parsed;

  if (parsed.value.isNegative()) {
    return { error: `${capitalise(definition.label)} cannot be negative.` };
  }
  if (parsed.value.greaterThan(MAX_MONEY)) {
    return { error: `Enter ${definition.label} below ${formatNumber(MAX_MONEY)}.` };
  }

  return parsed;
}

function validatePercent(
  definition: FieldDefinition,
  raw: string,
  max: Decimal,
): { value: Decimal } | { error: string } {
  const parsed = parseField(definition, raw);
  if ('error' in parsed) return parsed;

  if (parsed.value.isNegative() || parsed.value.greaterThan(max)) {
    return {
      error: `${capitalise(definition.label)} must be between 0 and ${max.toString()}.`,
    };
  }

  return parsed;
}

/** The two fields a mode needs from the visitor; the other two are worked out. */
export function markupMarginFieldsForMode(mode: MarkupMarginMode): readonly MarkupMarginField[] {
  if (mode === 'price') return ['cost', 'markupPercent'];
  if (mode === 'cost') return ['price', 'marginPercent'];
  return ['cost', 'price'];
}

export function validateMarkupMarginForm(
  mode: MarkupMarginMode,
  values: MarkupMarginFormValues,
): MarkupMarginValidationResult {
  const errors: MarkupMarginFormErrors = {};
  const parsed: Partial<Record<MarkupMarginField, Decimal>> = {};

  for (const field of markupMarginFieldsForMode(mode)) {
    const definition = FIELD_DEFINITIONS[field];
    const result =
      field === 'markupPercent'
        ? validatePercent(definition, values[field], MARKUP_MARGIN_LIMITS.maxMarkupPercent)
        : field === 'marginPercent'
          ? validatePercent(definition, values[field], MARKUP_MARGIN_LIMITS.maxMarginPercent)
          : validateMoney(definition, values[field]);

    if ('error' in result) {
      errors[field] = result.error;
    } else {
      parsed[field] = result.value;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { cost, price, markupPercent, marginPercent } = parsed;

  if (mode === 'margin' || mode === 'markup') {
    if (!cost || !price) {
      return { ok: false, errors: { cost: 'Check the values you entered.' } };
    }
    return mode === 'margin'
      ? { ok: true, input: { mode: 'margin', cost, price } }
      : { ok: true, input: { mode: 'markup', cost, price } };
  }

  if (mode === 'price') {
    if (!cost || !markupPercent) {
      return { ok: false, errors: { cost: 'Check the values you entered.' } };
    }
    return { ok: true, input: { mode, cost, markupPercent } };
  }

  if (!price || !marginPercent) {
    return { ok: false, errors: { price: 'Check the values you entered.' } };
  }
  return { ok: true, input: { mode, price, marginPercent } };
}
