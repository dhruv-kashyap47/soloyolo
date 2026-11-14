import Decimal from 'decimal.js';

/**
 * Parses a human-entered amount into a Decimal.
 *
 * Deliberately strict: it accepts common copy-paste formats (`$1,200.50`,
 * `1 200,50`, `(250)` for negatives) and returns `null` for anything it cannot
 * read unambiguously. The caller turns `null` into a field-level error rather
 * than silently treating bad input as zero.
 */
const SYMBOL_PATTERN = '(?:c\\$|a\\$|us\\$|nz\\$|[$£€¥₹])';
const CURRENCY_SYMBOLS = new RegExp(`^${SYMBOL_PATTERN}|${SYMBOL_PATTERN}$`, 'gi');
const THOUSANDS_GROUPED = /^\d{1,3}(?:,\d{3})+(?:\.\d*)?$/;
const DECIMAL_COMMA = /^\d+,\d{1,2}$/;
const PLAIN_NUMBER = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

export function parseAmountInput(raw: string): Decimal | null {
  if (typeof raw !== 'string') return null;

  let input = raw.trim().replace(/\u2212/g, '-');
  if (input === '') return null;

  let negative = false;

  // Accounting negatives: (1,250.00)
  if (input.startsWith('(') && input.endsWith(')')) {
    negative = true;
    input = input.slice(1, -1).trim();
  }

  // Allow signs and currency symbols in either order: -$5, $-5, £5, -5.
  for (let pass = 0; pass < 2; pass += 1) {
    if (input.startsWith('+')) {
      input = input.slice(1);
    } else if (input.startsWith('-')) {
      negative = !negative;
      input = input.slice(1);
    }
    input = input.replace(CURRENCY_SYMBOLS, '');
  }

  input = input.replace(/[\s\u00a0\u202f']/g, '').replace(CURRENCY_SYMBOLS, '');

  if (input === '' || input.endsWith('%')) return null;

  if (input.includes(',')) {
    if (THOUSANDS_GROUPED.test(input)) {
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
