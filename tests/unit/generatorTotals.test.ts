import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  allocateProportionally,
  calculateDocumentTotals,
  type TotalsLineInput,
} from '@/lib/generators/totals';

function line(overrides: Partial<TotalsLineInput> & { id: string }): TotalsLineInput {
  return {
    description: 'Design work',
    quantity: new Decimal(1),
    unitPrice: new Decimal(100),
    discountPercent: new Decimal(0),
    taxPercent: new Decimal(0),
    ...overrides,
  };
}

describe('allocateProportionally', () => {
  it('splits an amount in proportion and keeps every cent', () => {
    const result = allocateProportionally(new Decimal('10'), [new Decimal(1), new Decimal(1)]);

    expect(result.map((value) => value.toFixed(2))).toEqual(['5.00', '5.00']);
  });

  it('gives the leftover cent to the largest fractional remainder', () => {
    const result = allocateProportionally(new Decimal('10'), [
      new Decimal('33.33'),
      new Decimal('66.67'),
    ]);

    expect(result.map((value) => value.toFixed(2))).toEqual(['3.33', '6.67']);
    expect(result.reduce((sum, value) => sum.plus(value), new Decimal(0)).toFixed(2)).toBe('10.00');
  });

  it('breaks a tie by the order of the lines', () => {
    const result = allocateProportionally(new Decimal('10.01'), [
      new Decimal('10.01'),
      new Decimal('10.01'),
    ]);

    expect(result.map((value) => value.toFixed(2))).toEqual(['5.01', '5.00']);
    expect(result.reduce((sum, value) => sum.plus(value), new Decimal(0)).toFixed(2)).toBe('10.01');
  });

  it('returns nothing when there is nothing to split', () => {
    expect(allocateProportionally(new Decimal('10'), [])).toEqual([]);
    expect(
      allocateProportionally(new Decimal('0'), [new Decimal(1), new Decimal(2)]).map((value) =>
        value.toFixed(2),
      ),
    ).toEqual(['0.00', '0.00']);
    expect(
      allocateProportionally(new Decimal('10'), [new Decimal(0), new Decimal(0)]).map((value) =>
        value.toFixed(2),
      ),
    ).toEqual(['0.00', '0.00']);
  });
});

describe('calculateDocumentTotals', () => {
  it('adds quantity and price into a line total', () => {
    const totals = calculateDocumentTotals({
      items: [line({ id: 'a', quantity: new Decimal(3), unitPrice: new Decimal('125.50') })],
    });

    expect(totals.subtotal.toFixed(2)).toBe('376.50');
    expect(totals.netTotal.toFixed(2)).toBe('376.50');
    expect(totals.taxTotal.toFixed(2)).toBe('0.00');
    expect(totals.total.toFixed(2)).toBe('376.50');
  });

  it('takes a line discount off before tax', () => {
    const totals = calculateDocumentTotals({
      items: [
        line({
          id: 'a',
          quantity: new Decimal(2),
          unitPrice: new Decimal(100),
          discountPercent: new Decimal(10),
          taxPercent: new Decimal(20),
        }),
      ],
    });

    expect(totals.subtotal.toFixed(2)).toBe('200.00');
    expect(totals.lineDiscountTotal.toFixed(2)).toBe('20.00');
    expect(totals.discountTotal.toFixed(2)).toBe('20.00');
    expect(totals.netTotal.toFixed(2)).toBe('180.00');
    expect(totals.taxTotal.toFixed(2)).toBe('36.00');
    expect(totals.total.toFixed(2)).toBe('216.00');
  });

  it('charges tax on the discounted base, not the original one', () => {
    const totals = calculateDocumentTotals({
      items: [
        line({
          id: 'a',
          quantity: new Decimal(1),
          unitPrice: new Decimal(100),
          taxPercent: new Decimal(10),
        }),
      ],
      discountPercent: new Decimal(50),
    });

    expect(totals.documentDiscountTotal.toFixed(2)).toBe('50.00');
    expect(totals.netTotal.toFixed(2)).toBe('50.00');
    expect(totals.taxTotal.toFixed(2)).toBe('5.00');
    expect(totals.total.toFixed(2)).toBe('55.00');
  });

  it('spreads a document discount across the lines without losing a cent', () => {
    const totals = calculateDocumentTotals({
      items: [
        line({ id: 'a', quantity: new Decimal(1), unitPrice: new Decimal('33.33') }),
        line({ id: 'b', quantity: new Decimal(1), unitPrice: new Decimal('66.67') }),
      ],
      discountPercent: new Decimal(10),
    });

    expect(totals.documentDiscountTotal.toFixed(2)).toBe('10.00');
    expect(totals.lines[0]?.documentDiscountShare.toFixed(2)).toBe('3.33');
    expect(totals.lines[1]?.documentDiscountShare.toFixed(2)).toBe('6.67');
    expect(totals.netTotal.toFixed(2)).toBe('90.00');
  });

  it('keeps the printed figures adding up to the total', () => {
    const totals = calculateDocumentTotals({
      items: [
        line({
          id: 'a',
          quantity: new Decimal('2.5'),
          unitPrice: new Decimal('99.99'),
          discountPercent: new Decimal('7.5'),
          taxPercent: new Decimal('19'),
        }),
        line({
          id: 'b',
          quantity: new Decimal(1),
          unitPrice: new Decimal('40'),
          taxPercent: new Decimal('5'),
        }),
      ],
      discountPercent: new Decimal('3'),
    });

    const sum = totals.subtotal.minus(totals.discountTotal).plus(totals.taxTotal);
    expect(sum.toFixed(2)).toBe(totals.total.toFixed(2));

    const lineSum = totals.lines.reduce((acc, entry) => acc.plus(entry.total), new Decimal(0));
    expect(lineSum.toFixed(2)).toBe(totals.total.toFixed(2));

    const baseSum = totals.lines.reduce(
      (acc, entry) => acc.plus(entry.taxableBase),
      new Decimal(0),
    );
    expect(baseSum.toFixed(2)).toBe(totals.netTotal.toFixed(2));
  });

  it('groups tax by rate, highest first', () => {
    const totals = calculateDocumentTotals({
      items: [
        line({
          id: 'a',
          quantity: new Decimal(1),
          unitPrice: new Decimal(100),
          taxPercent: new Decimal(5),
        }),
        line({
          id: 'b',
          quantity: new Decimal(1),
          unitPrice: new Decimal(200),
          taxPercent: new Decimal(20),
        }),
        line({
          id: 'c',
          quantity: new Decimal(1),
          unitPrice: new Decimal(300),
          taxPercent: new Decimal(20),
        }),
      ],
    });

    expect(totals.taxGroups).toHaveLength(2);
    expect(totals.taxGroups[0]?.ratePercent.toFixed(0)).toBe('20');
    expect(totals.taxGroups[0]?.base.toFixed(2)).toBe('500.00');
    expect(totals.taxGroups[0]?.amount.toFixed(2)).toBe('100.00');
    expect(totals.taxGroups[1]?.ratePercent.toFixed(0)).toBe('5');
    expect(totals.taxGroups[1]?.amount.toFixed(2)).toBe('5.00');
    expect(totals.taxTotal.toFixed(2)).toBe('105.00');
    expect(totals.total.toFixed(2)).toBe('705.00');
  });

  it('ignores lines with no description', () => {
    const totals = calculateDocumentTotals({
      items: [
        line({ id: 'a', description: '  ', quantity: new Decimal(2), unitPrice: new Decimal(50) }),
        line({
          id: 'b',
          description: 'Real work',
          quantity: new Decimal(1),
          unitPrice: new Decimal(20),
        }),
      ],
    });

    expect(totals.lines).toHaveLength(1);
    expect(totals.subtotal.toFixed(2)).toBe('20.00');
  });

  it('rounds a line amount half up', () => {
    const totals = calculateDocumentTotals({
      items: [line({ id: 'a', quantity: new Decimal(3), unitPrice: new Decimal('0.125') })],
    });

    expect(totals.subtotal.toFixed(2)).toBe('0.38');
  });

  it('works out what is still owed once a payment is counted', () => {
    const totals = calculateDocumentTotals({
      items: [line({ id: 'a', quantity: new Decimal(1), unitPrice: new Decimal(1000) })],
      amountPaid: new Decimal('250.00'),
    });

    expect(totals.total.toFixed(2)).toBe('1000.00');
    expect(totals.amountPaid.toFixed(2)).toBe('250.00');
    expect(totals.amountDue.toFixed(2)).toBe('750.00');
  });

  it('returns zeroes for an empty document', () => {
    const totals = calculateDocumentTotals({ items: [] });

    expect(totals.subtotal.toFixed(2)).toBe('0.00');
    expect(totals.total.toFixed(2)).toBe('0.00');
    expect(totals.amountDue.toFixed(2)).toBe('0.00');
    expect(totals.taxGroups).toEqual([]);
  });

  it('does not mutate the lines it was given', () => {
    const quantity = new Decimal(2);
    const unitPrice = new Decimal(50);
    const item = line({ id: 'a', quantity, unitPrice });

    const totals = calculateDocumentTotals({ items: [item] });

    expect(totals.total.toFixed(2)).toBe('100.00');
    expect(quantity.toFixed(2)).toBe('2.00');
    expect(unitPrice.toFixed(2)).toBe('50.00');
  });
});
