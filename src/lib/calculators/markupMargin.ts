import Decimal from 'decimal.js';

import { MAX_MONEY, isUsableDecimal, roundMoney, safeDivide, toDecimal } from '@/lib/finance/money';
import { percentToFraction } from '@/lib/finance/percent';

export const MARKUP_MARGIN_LIMITS = {
  maxMoney: MAX_MONEY,
  /** A 10,000% markup is already a 100× price; above that the input is a typo. */
  maxMarkupPercent: new Decimal(10000),
  /** A 100% margin would need an infinite price, so it is excluded. */
  maxMarginPercent: new Decimal('99.99'),
} as const;

export type MarkupMarginMode = 'margin' | 'markup' | 'price' | 'cost';

/**
 * The four values are linked by two identities, so any two determine the rest:
 *
 *   price  = cost × (1 + markup)
 *   cost   = price × (1 − margin)
 *   margin = profit ÷ price
 *   markup = profit ÷ cost
 *
 * The input is a union because the three accepted pairs are genuinely
 * different: price and cost, cost and markup, or price and margin.
 */
export type MarkupMarginInput =
  | { mode: 'margin'; cost: Decimal; price: Decimal }
  | { mode: 'markup'; cost: Decimal; price: Decimal }
  | { mode: 'price'; cost: Decimal; markupPercent: Decimal }
  | { mode: 'cost'; price: Decimal; marginPercent: Decimal };

export interface MarkupMarginBreakdown {
  cost: Decimal;
  price: Decimal;
  profit: Decimal;
  /** Profit as a fraction of price; null when price is zero. */
  margin: Decimal | null;
  /** Profit as a fraction of cost; null when cost is zero. */
  markup: Decimal | null;
  /** The value the visitor asked to work out. */
  solved: MarkupMarginMode;
  costRounded: Decimal;
  priceRounded: Decimal;
  profitRounded: Decimal;
}

export type MarkupMarginErrorCode =
  'invalid_input' | 'negative_input' | 'too_large' | 'markup_out_of_range' | 'margin_out_of_range';

export type MarkupMarginOutcome =
  | { ok: true; value: MarkupMarginBreakdown }
  | { ok: false; code: MarkupMarginErrorCode; message: string };

export function calculateMarkupMargin(input: MarkupMarginInput): MarkupMarginOutcome {
  let cost: Decimal;
  let price: Decimal;

  if (input.mode === 'margin' || input.mode === 'markup') {
    cost = toDecimal(input.cost);
    price = toDecimal(input.price);

    if (!isUsableDecimal(cost) || !isUsableDecimal(price)) {
      return invalidInput();
    }
    if (cost.isNegative() || price.isNegative()) {
      return negativeInput();
    }
    if (cost.greaterThan(MAX_MONEY) || price.greaterThan(MAX_MONEY)) {
      return tooLarge();
    }
  } else if (input.mode === 'price') {
    cost = toDecimal(input.cost);
    const markupPercent = toDecimal(input.markupPercent);

    if (!isUsableDecimal(cost) || !isUsableDecimal(markupPercent)) {
      return invalidInput();
    }
    if (cost.isNegative() || markupPercent.isNegative()) {
      return negativeInput();
    }
    if (cost.greaterThan(MAX_MONEY)) {
      return tooLarge();
    }
    if (markupPercent.greaterThan(MARKUP_MARGIN_LIMITS.maxMarkupPercent)) {
      return {
        ok: false,
        code: 'markup_out_of_range',
        message: 'Markup must be between 0 and 10,000 percent.',
      };
    }

    price = cost.times(new Decimal(1).plus(percentToFraction(markupPercent)));
  } else {
    price = toDecimal(input.price);
    const marginPercent = toDecimal(input.marginPercent);

    if (!isUsableDecimal(price) || !isUsableDecimal(marginPercent)) {
      return invalidInput();
    }
    if (price.isNegative() || marginPercent.isNegative()) {
      return negativeInput();
    }
    if (price.greaterThan(MAX_MONEY)) {
      return tooLarge();
    }
    if (marginPercent.greaterThan(MARKUP_MARGIN_LIMITS.maxMarginPercent)) {
      return {
        ok: false,
        code: 'margin_out_of_range',
        message: 'Margin must be between 0 and 99.99 percent.',
      };
    }

    cost = price.times(new Decimal(1).minus(percentToFraction(marginPercent)));
  }

  if (!price.isFinite() || !cost.isFinite()) {
    return invalidInput();
  }

  const profit = price.minus(cost);
  const costRounded = roundMoney(cost);
  const priceRounded = roundMoney(price);

  return {
    ok: true,
    value: {
      cost,
      price,
      profit,
      margin: safeDivide(profit, price),
      markup: safeDivide(profit, cost),
      solved: input.mode,
      costRounded,
      priceRounded,
      profitRounded: priceRounded.minus(costRounded),
    },
  };
}

function invalidInput(): MarkupMarginOutcome {
  return { ok: false, code: 'invalid_input', message: 'All values must be valid numbers.' };
}

function negativeInput(): MarkupMarginOutcome {
  return {
    ok: false,
    code: 'negative_input',
    message: 'Cost, price and percentages cannot be negative.',
  };
}

function tooLarge(): MarkupMarginOutcome {
  return {
    ok: false,
    code: 'too_large',
    message: 'Money values are too large to calculate reliably.',
  };
}
