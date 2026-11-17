import { toDisplayNumber, type DecimalInput } from '@/lib/finance/money';

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
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toDisplayNumber(value));
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
  // Strip every group separator a supported locale can draw, so a second
  // keystroke in a CHF field (1'234) keeps regrouping instead of freezing.
  const plain = text.replace(/[\s,'\u2018\u2019]/g, '');
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
