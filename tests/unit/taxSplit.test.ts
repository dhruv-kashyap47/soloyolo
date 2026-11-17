import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { formatRate } from '@/lib/formatting/number';
import { taxSummaryRows, type TaxSplitDefinition } from '@/lib/generators/taxSplit';
import type { TaxGroup } from '@/lib/generators/totals';

const CGST_SGST: TaxSplitDefinition = {
  id: 'cgst-sgst',
  label: 'CGST + SGST (intra-state)',
  parts: ['CGST', 'SGST'],
};

const IGST: TaxSplitDefinition = {
  id: 'igst',
  label: 'IGST (inter-state)',
  parts: ['IGST'],
};

function group(ratePercent: string, base: string, amount: string): TaxGroup {
  return {
    ratePercent: new Decimal(ratePercent),
    base: new Decimal(base),
    amount: new Decimal(amount),
  };
}

function sum(rows: ReturnType<typeof taxSummaryRows>, key: 'base' | 'amount'): Decimal {
  return rows.reduce((total, row) => total.plus(row[key]), new Decimal(0));
}

describe('taxSummaryRows', () => {
  it('passes the groups through when the market does not split', () => {
    const groups = [group('20', '1200', '240'), group('5', '100', '5')];
    const rows = taxSummaryRows(groups, { taxLabel: 'VAT', split: null });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.label).toBe('VAT');
    expect(rows[0]?.ratePercent.toFixed(1)).toBe('20.0');
    expect(rows[0]?.amount.toFixed(2)).toBe('240.00');
    expect(rows[1]?.label).toBe('VAT');
  });

  it('shows IGST as one row with the full rate', () => {
    const rows = taxSummaryRows([group('18', '85000', '15300')], {
      taxLabel: 'GST',
      split: IGST,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe('IGST');
    expect(rows[0]?.ratePercent.toFixed(1)).toBe('18.0');
    expect(rows[0]?.base.toFixed(2)).toBe('85000.00');
    expect(rows[0]?.amount.toFixed(2)).toBe('15300.00');
  });

  it('splits CGST and SGST into two equal rows that add back', () => {
    const rows = taxSummaryRows([group('18', '85000', '15300')], {
      taxLabel: 'GST',
      split: CGST_SGST,
    });

    expect(rows.map((row) => row.label)).toEqual(['CGST', 'SGST']);
    expect(rows.map((row) => row.ratePercent.toFixed(2))).toEqual(['9.00', '9.00']);
    expect(rows.map((row) => row.amount.toFixed(2))).toEqual(['7650.00', '7650.00']);
    expect(sum(rows, 'amount').toFixed(2)).toBe('15300.00');
    expect(sum(rows, 'base').toFixed(2)).toBe('85000.00');
  });

  it.each([
    ['5', '2.5'],
    ['18', '9'],
    ['40', '20'],
    ['8.1', '4.05'],
    ['0.25', '0.125'],
  ])('halves a %s%% group to %s%% in each row', (rate, half) => {
    const rows = taxSummaryRows([group(rate, '100', '10')], {
      taxLabel: 'GST',
      split: CGST_SGST,
    });

    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(formatRate(row.ratePercent)).toBe(half);
    }
  });

  it('gives the leftover cent to one row so odd amounts still add up', () => {
    const rows = taxSummaryRows([group('18', '0.28', '0.05')], {
      taxLabel: 'GST',
      split: CGST_SGST,
    });

    expect(rows.map((row) => row.amount.toFixed(2))).toEqual(['0.03', '0.02']);
    expect(sum(rows, 'amount').toFixed(2)).toBe('0.05');
    expect(sum(rows, 'base').toFixed(2)).toBe('0.28');
  });

  it('handles a zero amount without inventing rows', () => {
    const rows = taxSummaryRows([group('0', '0', '0')], {
      taxLabel: 'GST',
      split: CGST_SGST,
    });

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.amount.isZero())).toBe(true);
    expect(sum(rows, 'amount').isZero()).toBe(true);
  });

  it('splits every group when a document carries several rates', () => {
    const groups = [
      group('40', '1000', '400'),
      group('18', '2000', '360'),
      group('5', '3000', '150'),
    ];
    const rows = taxSummaryRows(groups, { taxLabel: 'GST', split: CGST_SGST });

    expect(rows).toHaveLength(6);
    expect(sum(rows, 'amount').toFixed(2)).toBe('910.00');
    expect(sum(rows, 'base').toFixed(2)).toBe('6000.00');
  });

  it('leaves the groups alone when a split has no parts', () => {
    const rows = taxSummaryRows([group('18', '100', '18')], {
      taxLabel: 'GST',
      split: { id: 'igst', label: 'Nothing', parts: [] },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe('GST');
    expect(rows[0]?.amount.toFixed(2)).toBe('18.00');
  });

  it('formats the split rates a reader expects', () => {
    expect(formatRate(new Decimal('2.5'))).toBe('2.5');
    expect(formatRate(new Decimal('9'))).toBe('9');
    expect(formatRate(new Decimal('0.125'))).toBe('0.125');
    expect(formatRate(new Decimal('20'))).toBe('20');
  });
});
