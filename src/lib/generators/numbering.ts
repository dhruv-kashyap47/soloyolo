/**
 * Document numbering.
 *
 * Numbering is a local habit, not a rule: a studio might write INV-0042 while
 * another writes 2026-014. The engine therefore keeps the *pattern* separate
 * from the *sequence*, so a user can keep the pattern they already use and
 * let the tool do the counting.
 */

export type DocumentSeries = 'invoice' | 'quote' | 'receipt';

export interface SeriesConfig {
  id: DocumentSeries;
  /** The name of the document, for example "Invoice". */
  label: string;
  /** The plural, for example "Invoices". */
  plural: string;
  /** The letters that start a number in this series. */
  prefix: string;
  /** How many digits the sequence part carries by default. */
  padding: number;
}

export const DOCUMENT_SERIES: Record<DocumentSeries, SeriesConfig> = {
  invoice: { id: 'invoice', label: 'Invoice', plural: 'Invoices', prefix: 'INV', padding: 4 },
  quote: { id: 'quote', label: 'Quote', plural: 'Quotes', prefix: 'QUO', padding: 4 },
  receipt: { id: 'receipt', label: 'Receipt', plural: 'Receipts', prefix: 'RCT', padding: 4 },
};

export interface NumberFormat {
  /** The letters before the sequence, for example "INV". */
  prefix: string;
  /** How many digits the sequence carries. */
  padding: number;
  /** An optional year segment between the prefix and the sequence. */
  year?: number;
}

/** Writes a number in a pattern, for example `INV-0007` or `INV-2026-0007`. */
export function formatDocumentNumber(value: number, format: NumberFormat): string {
  const sequence = Math.max(0, Math.trunc(value));
  const digits = String(sequence).padStart(Math.max(1, format.padding), '0');
  const year = format.year === undefined ? '' : `-${format.year}`;
  return `${format.prefix}${year}-${digits}`;
}

export interface ParsedNumber {
  value: number;
  year?: number;
}

/**
 * Reads a number back out of one the user typed.
 *
 * `INV-0007`, `INV 0007`, `INV0007` and `INV-2026-0007` are all understood,
 * whatever the case, and a number with no prefix at all (`0007` or `7`) is
 * read as a plain sequence. Anything else returns `null`, which the form
 * treats as "start from one".
 */
export function parseDocumentNumber(text: string, prefix?: string): ParsedNumber | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;

  const parts = trimmed.split(/[-/\s_]+/).filter(Boolean);
  if (parts.length === 0) return null;

  // A prefix written straight onto the number, as in "INV0007": a very
  // common pattern, and one that used to restart the series at one.
  const merged = parts.length === 1 ? /^([A-Za-z]{1,6})(\d+)$/.exec(parts[0]!) : null;
  if (merged) {
    const [, letters, digits] = merged;
    if (prefix && letters && letters.toUpperCase() !== prefix.toUpperCase()) return null;
    const value = Number(digits);
    return Number.isFinite(value) ? { value } : null;
  }

  let sequenceText: string | undefined;
  let year: number | undefined;
  let usable = true;

  for (const [index, part] of parts.entries()) {
    const isLast = index === parts.length - 1;

    // A four digit part is a year only when something follows it, so a plain
    // sequence of "2026" is still read as a sequence.
    if (!isLast && sequenceText === undefined && /^\d{4}$/.test(part)) {
      const candidate = Number(part);
      if (candidate >= 1900 && candidate <= 2999) {
        year = candidate;
        continue;
      }
    }

    if (/^\d+$/.test(part)) {
      // Two number segments means the text is not a number this tool knows.
      if (sequenceText !== undefined) {
        usable = false;
        break;
      }
      sequenceText = part;
      continue;
    }

    if (prefix && part.toUpperCase() === prefix.toUpperCase()) continue;
    if (/^[A-Za-z]{1,6}$/.test(part)) continue;

    usable = false;
    break;
  }

  if (!usable || sequenceText === undefined) return null;

  const value = Number(sequenceText);
  if (!Number.isFinite(value) || value < 0) return null;

  return year === undefined ? { value } : { value, year };
}

/**
 * The next number in a series.
 *
 * `last` is whatever the user last used. When it cannot be read, the series
 * starts at one. The pattern is taken from the number that was read, so a
 * user who types `INV-2026-0041` keeps the year segment.
 */
export function nextDocumentNumber(
  series: DocumentSeries,
  last: string | undefined,
  options: { year?: number; padding?: number } = {},
): string {
  const config = DOCUMENT_SERIES[series];
  const parsed = parseDocumentNumber(last ?? '', config.prefix);

  const format: NumberFormat = {
    prefix: config.prefix,
    padding: options.padding ?? config.padding,
    year: parsed?.year ?? options.year,
  };

  return formatDocumentNumber((parsed?.value ?? 0) + 1, format);
}

/** The first number of a series. */
export function firstDocumentNumber(
  series: DocumentSeries,
  options: { year?: number; padding?: number } = {},
): string {
  const config = DOCUMENT_SERIES[series];
  return formatDocumentNumber(1, {
    prefix: config.prefix,
    padding: options.padding ?? config.padding,
    year: options.year,
  });
}
