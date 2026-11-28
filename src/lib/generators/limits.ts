import Decimal from 'decimal.js';

import { MAX_MONEY } from '@/lib/finance/money';

/**
 * The outer bounds a document may reach.
 *
 * These are deliberately far above a real freelance invoice while staying at a
 * scale where every figure is a plain decimal with at most two fraction digits.
 * Decimal arithmetic and the string formatter in `formatting/number.ts` keep
 * cents exact; the limits stop a typo from producing a sheet nobody can read or
 * print. Nothing is silently clamped: exceeding a bound is a validation error.
 *
 * - 1,000,000 units: a count or number of hours; beyond this it is a typo.
 * - 1,000,000,000 per unit: the same ceiling the calculators use for money.
 * - 1,000,000,000 per line: quantity × unit price before discounts.
 * - 10,000,000,000 per document: leaves room for tax and several large lines,
 *   while keeping the total printable and easy to scan.
 */
export const MAX_QUANTITY = 1_000_000;
export const MAX_UNIT_PRICE = MAX_MONEY;
export const MAX_LINE_TOTAL = new Decimal('1000000000');
export const MAX_DOCUMENT_TOTAL = new Decimal('10000000000');
