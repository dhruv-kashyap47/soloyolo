import { roundMoney, type DecimalInput } from '@/lib/finance/money';
import { isGroupedNumber } from '@/lib/validation/amount';

/**
 * A grouped number the visitor is still typing into the last group.
 *
 * "6,000" plus one keystroke is "6,0000"; the comma is still a group marker
 * even though the last group is over three digits, so it has to be regrouped
 * to "60,000" rather than frozen. Four or more digits after the last comma
 * cannot be a decimal comma in a money field, and an integer field never has
 * one, so this cannot turn "4,6" into 46.
 */
const STILL_TYPING_GROUP = /^\d{1,3}(?:,\d{3})*,\d{4,}$/;

/**
 * `Intl.NumberFormat` accepts an exact numeric string at runtime (ES2023), but
 * the TypeScript lib still declares number | bigint. The cast is only to the
 * declaration; the string is never converted to a float.
 */
function formatExact(formatter: Intl.NumberFormat, value: string): string {
  return (formatter.format as unknown as (input: string) => string)(value);
}

export function formatNumber(
  value: DecimalInput,
  options: { decimals?: number; locale?: string } = {},
): string {
  const decimals = options.decimals ?? 0;
  // Pass the rounded decimal as a string. Intl accepts an exact decimal string,
  // so grouping and separators are locale-correct without converting the value
  // to a binary float first.
  const rounded = roundMoney(value, decimals);
  return formatExact(
    new Intl.NumberFormat(options.locale ?? 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
    rounded.toFixed(decimals),
  );
}

export function formatPercent(value: DecimalInput, decimals = 1, locale = 'en-US'): string {
  // A percentage is a fraction: 0.029 is 2.9%. Two extra digits cover the
  // multiplication by 100 before Intl rounds to the requested decimals.
  const rounded = roundMoney(value, decimals + 2);
  return formatExact(
    new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
    rounded.toFixed(decimals + 2),
  );
}

/**
 * A tax or discount rate written the way a person writes it: 20 rather than
 * 20.00, but 7.5 kept as it is, and a split 0.125% kept exact rather than
 * rounded to a cent of a percent. The rate is already a percentage here, so
 * this is the number and not the percent form.
 */
export function formatRate(value: DecimalInput): string {
  const rounded = roundMoney(value, 3);
  return formatExact(
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }),
    rounded.toFixed(3),
  );
}

/**
 * Formats a typed amount the way it is shown in a field: thousands grouped
 * with the locale's separators, the decimal part left exactly as typed.
 *
 * Only pure number shapes are regrouped (a trailing separator is kept so the
 * visitor can keep typing); any other text is left untouched, so the field
 * validation can still say "that is not a number" instead of silently
 * dropping letters.
 */
export function formatGroupedInput(
  text: string,
  options: { decimals?: boolean; locale?: string } = {},
): string {
  const decimals = options.decimals ?? false;
  // A pasted currency mark is part of the value, not the number: drop it so
  // the field's own prefix is the only one drawn.
  const withoutSymbols = text
    .replace(/^\s*(?:c\$|a\$|us\$|chf|aed|[$£€¥₹])\s*/i, '')
    .replace(/\s*(?:chf|aed|[$£€¥₹])\s*$/i, '');
  // A short comma tail is a decimal comma (7,5, or the 7, still being typed),
  // not a thousands group. Leave it intact so the parser can read it instead
  // of turning 7,5 into 75.
  const compact = withoutSymbols.replace(/[\s\u00a0\u202f'\u2018\u2019]/g, '');
  if (decimals && /^\d+,\d{0,2}$/.test(compact) && !compact.includes('.')) return withoutSymbols;

  // A comma is only dropped when it is a group separator the parser accepts.
  // Deleting every comma turned `1.234,56` into 1.23456 and `5,,0` into 50,
  // i.e. a pasted European amount silently changed by a factor of a thousand.
  // Anything else is left exactly as typed so validation can reject it.
  let plain = compact;
  if (plain.includes(',')) {
    if (!isGroupedNumber(plain) && !STILL_TYPING_GROUP.test(plain)) return text;
    plain = plain.replace(/,/g, '');
  }

  const shape = decimals ? /^\d*\.?\d*$/ : /^\d*$/;
  if (!shape.test(plain)) return text;

  const [whole = '', fraction] = plain.split('.');
  // Group the digit string itself, never Number(whole): a long paste must not
  // lose digits before the formatter has a chance to validate it.
  const grouped =
    whole === ''
      ? ''
      : formatExact(new Intl.NumberFormat(options.locale ?? 'en-US'), whole);
  const tail = decimals && plain.includes('.') ? `.${fraction ?? ''}` : '';
  return grouped + tail;
}

/** How many digits sit before the caret (used to restore it after regrouping). */
export function digitsBefore(text: string, caret: number): number {
  return (text.slice(0, caret).match(/\d/g) ?? []).length;
}

/** The caret position that sits after `count` digits of `text`. */
export function caretAfterDigits(text: string, count: number): number {
  if (count <= 0) {
    const first = text.search(/\d/);
    return first === -1 ? text.length : first;
  }
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text.charAt(index);
    if (/\d/.test(character)) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return text.length;
}
