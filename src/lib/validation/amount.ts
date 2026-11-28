import Decimal from 'decimal.js';

/**
 * Parses a human-entered amount into a Decimal.
 *
 * Deliberately strict: it accepts common copy-paste formats (`$1,200.50`,
 * `1 200,50`, `(250)` for negatives) and returns `null` for anything it cannot
 * read unambiguously. The caller turns `null` into a field-level error rather
 * than silently treating bad input as zero.
 */
const SYMBOL_PATTERN = '(?:c\\$|a\\$|us\\$|nz\\$|chf|aed|[$£€¥₹])';
const CURRENCY_SYMBOLS = new RegExp(`^${SYMBOL_PATTERN}|${SYMBOL_PATTERN}$`, 'gi');
const THOUSANDS_GROUPED = /^\d{1,3}(?:,\d{3})+(?:\.\d*)?$/;
/**
 * Indian digit grouping: the last group has three digits and the groups
 * before it have two, so 1,00,300 is one lakh three hundred. The app prints
 * INR this way, so a copied amount has to read back.
 */
const INDIAN_GROUPED = /^\d{1,3}(?:,\d{2})*,\d{3}(?:\.\d*)?$/;
const DECIMAL_COMMA = /^\d+,\d{1,2}$/;
const PLAIN_NUMBER = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

/**
 * True when the commas are group separators, not a decimal comma.
 *
 * Exported so the input formatter uses the same grammar as the parser: a
 * pasted `1.234,56` is neither grouped nor a decimal comma, and must be left
 * alone for validation to reject instead of being silently rewritten.
 */
export function isGroupedNumber(value: string): boolean {
  return THOUSANDS_GROUPED.test(value) || INDIAN_GROUPED.test(value);
}

export function parseAmountInput(raw: string): Decimal | null {
  if (typeof raw !== 'string') return null;

  let input = raw.trim().replace(/\u2212/g, '-');
  if (input === '') return null;

  let negative = false;
  let wrapped = false;

  // Accounting negatives: (1,250.00)
  if (input.startsWith('(') && input.endsWith(')')) {
    negative = true;
    wrapped = true;
    input = input.slice(1, -1).trim();
  }

  // Only one leading sign is meaningful. A second one ("--5") is a typo, not
  // a double negative, so it is rejected rather than silently flipped.
  let signSeen = false;

  // Allow signs and currency symbols in either order: -$5, $-5, £5, -5.
  for (let pass = 0; pass < 2; pass += 1) {
    if (input.startsWith('+')) {
      if (signSeen || wrapped) return null;
      signSeen = true;
      input = input.slice(1);
    } else if (input.startsWith('-')) {
      if (signSeen || wrapped) return null;
      signSeen = true;
      negative = true;
      input = input.slice(1);
    }
    input = input.replace(CURRENCY_SYMBOLS, '');
  }

  input = input
    .replace(/[\s\u00a0\u202f'\u2018\u2019]/g, '')
    .replace(CURRENCY_SYMBOLS, '');

  if (input === '' || input.endsWith('%')) return null;

  if (input.includes(',')) {
    if (isGroupedNumber(input)) {
      input = input.replace(/,/g, '');
    } else if (DECIMAL_COMMA.test(input)) {
      input = input.replace(',', '.');
    } else {
      return null;
    }
  }

  if (!PLAIN_NUMBER.test(input)) return null;

  const value = new Decimal(input);
  if (!value.isFinite()) return null;

  return negative ? value.negated() : value;
}
