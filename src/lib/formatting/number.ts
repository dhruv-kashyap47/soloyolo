import { toDisplayNumber, type DecimalInput } from '@/lib/finance/money';
import { isGroupedNumber } from '@/lib/validation/amount';

export function formatNumber(
  value: DecimalInput,
  options: { decimals?: number; locale?: string } = {},
): string {
  const decimals = options.decimals ?? 0;
  return new Intl.NumberFormat(options.locale ?? 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toDisplayNumber(value));
}

export function formatPercent(value: DecimalInput, decimals = 1, locale = 'en-US'): string {
  const number = toDisplayNumber(value);
  // A percentage is a fraction: 0.029 is 2.9%, so the zero threshold is two
  // decimal places smaller than the money one.
  const normalized = Math.abs(number) < 0.5 * 10 ** (-decimals - 2) ? 0 : number;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(normalized);
}

/**
 * A tax or discount rate written the way a person writes it: 20 rather than
 * 20.00, but 7.5 kept as it is, and a split 0.125% kept exact rather than
 * rounded to a cent of a percent. The rate is already a percentage here, so
 * this is the number and not the percent form.
 */
export function formatRate(value: DecimalInput): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(
    toDisplayNumber(value),
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
    if (!isGroupedNumber(plain)) return text;
    plain = plain.replace(/,/g, '');
  }

  const shape = decimals ? /^\d*\.?\d*$/ : /^\d*$/;
  if (!shape.test(plain)) return text;

  const [whole = '', fraction] = plain.split('.');
  const grouped =
    whole === '' ? '' : new Intl.NumberFormat(options.locale ?? 'en-US').format(Number(whole));
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
