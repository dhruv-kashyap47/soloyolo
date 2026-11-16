import { currencyLocale, type CurrencyCode } from '@/lib/formatting/currency';

/**
 * Date helpers for the document generators.
 *
 * Every date in a generator is a plain calendar day, never an instant. The
 * form holds `YYYY-MM-DD` strings and the printed document says "16 November
 * 2026", so a timezone must never be able to move a date to the day before or
 * after. The helpers below therefore parse and format in UTC, and the "today"
 * helper reads the visitor's own local calendar day.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True when the string is a real calendar day in `YYYY-MM-DD` form. */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value.trim());
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** The calendar day as a UTC midnight date, or `null` when the input is not a day. */
export function parseIsoDate(value: string): Date | null {
  if (!isIsoDate(value)) return null;
  const [year = '0', month = '0', day = '0'] = value.trim().split('-');
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

/** Today's calendar day in the visitor's own timezone, as `YYYY-MM-DD`. */
export function todayIso(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** The same calendar day, moved by `days`. Returns the input when it is not a day. */
export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return date.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number | null {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * A date written the way a reader expects: "16 November 2026" in the UK,
 * "November 16, 2026" in the United States. The locale follows the currency
 * unless the caller asks for a different one.
 */
export function formatDate(
  iso: string,
  options: { currency?: CurrencyCode; locale?: string } = {},
): string {
  const date = parseIsoDate(iso);
  if (!date) return '';

  const locale = options.locale ?? (options.currency ? currencyLocale(options.currency) : 'en-US');

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** The short form: "16 Nov 2026". Used where space is tight, such as a meta row. */
export function formatDateShort(
  iso: string,
  options: { currency?: CurrencyCode; locale?: string } = {},
): string {
  const date = parseIsoDate(iso);
  if (!date) return '';

  const locale = options.locale ?? (options.currency ? currencyLocale(options.currency) : 'en-US');

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
