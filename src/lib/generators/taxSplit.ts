import Decimal from 'decimal.js';

import { allocateProportionally, type TaxGroup } from '@/lib/generators/totals';

/**
 * Splitting one GST total for display.
 *
 * India charges one GST on the taxable value. An intra-state supply is shown
 * as CGST plus SGST, an inter-state supply as IGST. The arithmetic stays in
 * one place: the tax is computed once, the rate is divided for the label, and
 * the amount is split with the same largest-remainder allocation the document
 * discount uses. The printed parts therefore always add back to the tax the
 * customer pays, even when a rate produces an odd half cent.
 */

/** The display split a market can use. Empty means no split. */
export type TaxSplitMode = 'cgst-sgst' | 'igst';

export interface TaxSplitDefinition {
  /** The stable id stored on the draft and the model. */
  id: TaxSplitMode;
  /** The words used in the form. */
  label: string;
  /** The printed row names, in order. Two names means a 50/50 split. */
  parts: readonly string[];
}

export interface TaxSummaryRow {
  /** The printed row name: "VAT", "CGST", "SGST" or "IGST". */
  label: string;
  /** The rate printed beside the row. A split halves the rate. */
  ratePercent: Decimal;
  /** The taxable value shown for this row. */
  base: Decimal;
  /** The tax shown for this row. */
  amount: Decimal;
}

/**
 * Turns the grouped tax figures into the rows a document prints.
 *
 * Without a split the groups pass through unchanged. With a split every group
 * becomes one row per part: an IGST group is a single row, and a CGST + SGST
 * group is two rows whose base and tax add back to the group exactly.
 */
export function taxSummaryRows(
  groups: readonly TaxGroup[],
  options: { taxLabel: string; split: TaxSplitDefinition | null },
): TaxSummaryRow[] {
  const { taxLabel, split } = options;
  const parts = split?.parts ?? [];

  if (!split || parts.length === 0) {
    return groups.map((group) => ({
      label: taxLabel,
      ratePercent: group.ratePercent,
      base: group.base,
      amount: group.amount,
    }));
  }

  const rows: TaxSummaryRow[] = [];

  for (const group of groups) {
    const shares = parts.map(() => new Decimal(1));
    const bases = allocateProportionally(group.base, shares);
    const amounts = allocateProportionally(group.amount, shares);
    const ratePercent = group.ratePercent.dividedBy(parts.length);

    // `allocateProportionally` returns one value per share, so every index
    // below exists. Asserting it keeps the loop free of an unreachable
    // fallback that coverage would otherwise have to chase.
    parts.forEach((part, index) => {
      rows.push({
        label: part,
        ratePercent,
        base: bases[index]!,
        amount: amounts[index]!,
      });
    });
  }

  return rows;
}
