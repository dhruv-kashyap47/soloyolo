import Decimal from 'decimal.js';

import { roundMoney, toDecimal, type DecimalInput } from '@/lib/finance/money';

/**
 * The totals engine every generator runs on.
 *
 * The rules this file exists to enforce:
 *
 * 1. **Nothing is a float.** Every amount is a Decimal, and the only rounding
 *    happens at the cent, at the moment a figure becomes a figure a reader
 *    will see.
 * 2. **The printed figures add up.** Each line is rounded once, then every
 *    total is built from those rounded parts, so a subtotal, a discount, a tax
 *    and a total can never disagree by a cent.
 * 3. **Tax is charged on the discounted base.** A document-level discount is
 *    spread across the lines in proportion to their value before tax is
 *    calculated, which is how VAT, GST and sales tax are actually meant to
 *    work. The spread uses the largest remainder method, so the parts always
 *    add back up to the whole.
 */

const CENT = new Decimal('0.01');

export interface TotalsLineInput {
  id: string;
  description: string;
  quantity: DecimalInput;
  unitPrice: DecimalInput;
  /** Line level discount, as a percentage (10 means 10%). */
  discountPercent?: DecimalInput;
  /** Tax rate for this line, as a percentage (20 means 20%). */
  taxPercent?: DecimalInput;
  /** The HSN or SAC code, printed under the description. */
  hsnCode?: string;
}

export interface TotalsLine {
  id: string;
  description: string;
  quantity: Decimal;
  unitPrice: Decimal;
  /** Quantity times unit price, rounded to the cent. */
  gross: Decimal;
  discountPercent: Decimal;
  /** The line's own discount, already taken off the gross. */
  discountAmount: Decimal;
  /** Gross less the line's own discount. */
  net: Decimal;
  /** This line's share of the document level discount. */
  documentDiscountShare: Decimal;
  /** The amount tax is charged on: net less the line's share of the discount. */
  taxableBase: Decimal;
  taxPercent: Decimal;
  taxAmount: Decimal;
  /** Taxable base plus tax: what the line contributes to the total. */
  total: Decimal;
  /** The HSN or SAC code, empty when the market does not use one. */
  hsnCode: string;
}

export interface TaxGroup {
  /** The rate, as a percentage. */
  ratePercent: Decimal;
  /** The total amount of taxable value at this rate. */
  base: Decimal;
  /** The tax charged at this rate. */
  amount: Decimal;
}

export interface DocumentTotals {
  lines: TotalsLine[];
  /** The sum of every line's gross amount, before any discount. */
  subtotal: Decimal;
  /** Discounts taken off individual lines. */
  lineDiscountTotal: Decimal;
  /** The document level discount, spread across the lines. */
  documentDiscountTotal: Decimal;
  /** Every discount, added together. */
  discountTotal: Decimal;
  /** Subtotal less every discount: the amount tax is charged on. */
  netTotal: Decimal;
  /** Tax broken down by rate, highest rate first. */
  taxGroups: TaxGroup[];
  /** The sum of every tax group. */
  taxTotal: Decimal;
  /** Net plus tax. */
  total: Decimal;
  /** What has already been paid towards the document. */
  amountPaid: Decimal;
  /** What is still owed: total less amount paid. */
  amountDue: Decimal;
}

export interface TotalsInput {
  items: readonly TotalsLineInput[];
  /** A discount applied to the whole document, as a percentage. */
  discountPercent?: DecimalInput;
  /** An amount already paid, used by receipts. */
  amountPaid?: DecimalInput;
}

function zero(): Decimal {
  return new Decimal(0);
}

/**
 * Spreads `total` across `shares` in proportion to their size, without losing
 * or inventing a cent.
 *
 * Each share is truncated to the cent and the remaining cents go to the
 * largest fractional remainders first. The result always sums to `total`
 * exactly, which is what keeps a document's tax base equal to its net total.
 */
export function allocateProportionally(
  total: DecimalInput,
  shares: readonly DecimalInput[],
): Decimal[] {
  const amount = toDecimal(total);
  const weights = shares.map((share) => toDecimal(share));

  if (amount.isZero() || weights.length === 0) {
    return weights.map(() => zero());
  }

  const weightTotal = weights.reduce((sum, weight) => sum.plus(weight), zero());
  if (!weightTotal.greaterThan(0)) {
    return weights.map(() => zero());
  }

  const exact = weights.map((weight) => amount.times(weight).dividedBy(weightTotal));
  const allocated = exact.map((value) => value.toDecimalPlaces(2, Decimal.ROUND_DOWN));

  const remainder = amount.minus(allocated.reduce((sum, value) => sum.plus(value), zero()));
  // The remainder is money, so it is counted in cents. `isPositive` is never
  // used here: decimal.js reads zero as carrying a positive sign.
  let units = remainder.dividedBy(CENT).toDecimalPlaces(0, Decimal.ROUND_DOWN).toNumber();

  if (units > 0) {
    const order = exact
      .map((value, index) => ({
        index,
        fraction: value.minus(value.toDecimalPlaces(2, Decimal.ROUND_DOWN)),
      }))
      .sort((a, b) => b.fraction.comparedTo(a.fraction) || a.index - b.index)
      .map((entry) => entry.index);

    for (let position = 0; units > 0; position += 1) {
      const target = order[position % order.length];
      if (target === undefined) break;
      allocated[target] = allocated[target]!.plus(CENT);
      units -= 1;
    }
  }

  return allocated;
}

/**
 * Works out every figure a document shows.
 *
 * Lines without a description are ignored: an empty row is not a charge, and
 * charging for it would put a zero line on a customer invoice.
 */
export function calculateDocumentTotals(input: TotalsInput): DocumentTotals {
  const documentDiscountPercent = toDecimal(input.discountPercent ?? 0);
  const amountPaid = toDecimal(input.amountPaid ?? 0);

  const rows = input.items.filter((item) => item.description.trim() !== '');

  const grossLines = rows.map((item) => {
    const quantity = toDecimal(item.quantity);
    const unitPrice = toDecimal(item.unitPrice);
    const discountPercent = toDecimal(item.discountPercent ?? 0);
    const taxPercent = toDecimal(item.taxPercent ?? 0);

    const gross = roundMoney(quantity.times(unitPrice));
    const discountAmount = discountPercent.isZero()
      ? zero()
      : roundMoney(gross.times(discountPercent).dividedBy(100));

    return {
      id: item.id,
      description: item.description.trim(),
      quantity,
      unitPrice,
      gross,
      discountPercent,
      discountAmount,
      net: gross.minus(discountAmount),
      taxPercent,
      hsnCode: (item.hsnCode ?? '').trim(),
    };
  });

  const lineDiscountTotal = grossLines.reduce((sum, line) => sum.plus(line.discountAmount), zero());
  const netBeforeDocumentDiscount = grossLines.reduce((sum, line) => sum.plus(line.net), zero());
  const subtotal = grossLines.reduce((sum, line) => sum.plus(line.gross), zero());

  // A document level discount is a percentage of everything the lines are
  // worth once their own discounts are off.
  const documentDiscountTotal = documentDiscountPercent.isZero()
    ? zero()
    : roundMoney(netBeforeDocumentDiscount.times(documentDiscountPercent).dividedBy(100));

  const shares = allocateProportionally(
    documentDiscountTotal,
    grossLines.map((line) => line.net),
  );

  const lines: TotalsLine[] = grossLines.map((line, index) => {
    const share = shares[index] ?? zero();
    const taxableBase = line.net.minus(share);
    const taxAmount = line.taxPercent.isZero()
      ? zero()
      : roundMoney(taxableBase.times(line.taxPercent).dividedBy(100));

    return {
      id: line.id,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      gross: line.gross,
      discountPercent: line.discountPercent,
      discountAmount: line.discountAmount,
      net: line.net,
      documentDiscountShare: share,
      taxableBase,
      taxPercent: line.taxPercent,
      taxAmount,
      total: taxableBase.plus(taxAmount),
      hsnCode: line.hsnCode,
    };
  });

  const groups = new Map<string, TaxGroup>();

  for (const line of lines) {
    if (line.taxPercent.isZero()) continue;

    const key = line.taxPercent.toFixed(4);
    const existing = groups.get(key);

    if (existing) {
      groups.set(key, {
        ratePercent: line.taxPercent,
        base: existing.base.plus(line.taxableBase),
        amount: existing.amount.plus(line.taxAmount),
      });
    } else {
      groups.set(key, {
        ratePercent: line.taxPercent,
        base: line.taxableBase,
        amount: line.taxAmount,
      });
    }
  }

  const taxGroups = [...groups.values()].sort((a, b) => b.ratePercent.comparedTo(a.ratePercent));
  const taxTotal = taxGroups.reduce((sum, group) => sum.plus(group.amount), zero());

  const discountTotal = lineDiscountTotal.plus(documentDiscountTotal);
  const netTotal = subtotal.minus(discountTotal);
  const total = netTotal.plus(taxTotal);

  return {
    lines,
    subtotal,
    lineDiscountTotal,
    documentDiscountTotal,
    discountTotal,
    netTotal,
    taxGroups,
    taxTotal,
    total,
    amountPaid,
    amountDue: total.minus(amountPaid),
  };
}
