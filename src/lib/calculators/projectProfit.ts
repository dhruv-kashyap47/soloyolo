import type Decimal from 'decimal.js';

import { MAX_MONEY, isUsableDecimal, roundMoney, safeDivide, toDecimal } from '@/lib/finance/money';

export interface ProjectProfitInput {
  /** What the client pays for the project. */
  revenue: Decimal;
  /** Your own time, costed at an internal rate. */
  labor: Decimal;
  /** Subcontractors and freelancers paid for this project. */
  contractor: Decimal;
  /** Licences, plugins or subscriptions used only for this project. */
  software: Decimal;
  /** Hosting, printing, travel, materials, anything else direct. */
  other: Decimal;
  /** The share of rent, insurance, accounting and admin allocated to the project. */
  overhead: Decimal;
}

export interface ProjectProfitBreakdown {
  /** Labor + contractor + software + other. */
  directCosts: Decimal;
  /** The allocated overhead, echoed back so the panel never has to derive it. */
  overhead: Decimal;
  /** Direct costs plus allocated overhead. */
  totalCosts: Decimal;
  /** Revenue minus direct costs, before overhead. */
  grossProfit: Decimal;
  /** Revenue minus every cost, the number that actually reaches you. */
  profit: Decimal;
  /** Profit as a fraction of revenue (0.3333 for 33.33%); null when revenue is zero. */
  margin: Decimal | null;
  /** Profit as a fraction of total costs (0.5 for a 50% markup); null when costs are zero. */
  markup: Decimal | null;
  /** Revenue rounded half-up to cents. */
  revenueRounded: Decimal;
  directCostsRounded: Decimal;
  totalCostsRounded: Decimal;
  grossProfitRounded: Decimal;
  profitRounded: Decimal;
}

export type ProjectProfitErrorCode = 'invalid_input' | 'negative_input' | 'too_large';

export type ProjectProfitOutcome =
  | { ok: true; value: ProjectProfitBreakdown }
  | { ok: false; code: ProjectProfitErrorCode; message: string };

/**
 * Project profit, margin and markup:
 *
 *   direct costs = labor + contractor + software + other
 *   total costs  = direct costs + overhead
 *   profit       = revenue − total costs
 *   margin       = profit ÷ revenue
 *   markup       = profit ÷ total costs
 *
 * Margin and markup are different denominators on purpose: a 50% markup is a
 * 33.3% margin. Both are nullable because dividing by a zero revenue or a zero
 * cost has no meaningful answer, and the UI must not receive Infinity or NaN.
 *
 * Losses are a valid result: a project can cost more than it earns.
 */
export function calculateProjectProfit(input: ProjectProfitInput): ProjectProfitOutcome {
  const revenue = toDecimal(input.revenue);
  const labor = toDecimal(input.labor);
  const contractor = toDecimal(input.contractor);
  const software = toDecimal(input.software);
  const other = toDecimal(input.other);
  const overhead = toDecimal(input.overhead);

  const values = [revenue, labor, contractor, software, other, overhead];

  if (values.some((value) => !isUsableDecimal(value))) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'All values must be valid numbers.',
    };
  }

  if (values.some((value) => value.isNegative())) {
    return {
      ok: false,
      code: 'negative_input',
      message: 'Revenue and costs cannot be negative. Enter a loss as a cost above revenue.',
    };
  }

  if (values.some((value) => value.greaterThan(MAX_MONEY))) {
    return {
      ok: false,
      code: 'too_large',
      message: 'Money values are too large to calculate reliably.',
    };
  }

  const directCosts = labor.plus(contractor).plus(software).plus(other);
  const totalCosts = directCosts.plus(overhead);
  const grossProfit = revenue.minus(directCosts);
  const profit = revenue.minus(totalCosts);

  // Rounded once per printed row, with profit derived from the rounded
  // revenue and cost so the three figures on the sheet add up.
  const revenueRounded = roundMoney(revenue);
  const directCostsRounded = roundMoney(directCosts);
  const totalCostsRounded = roundMoney(totalCosts);

  return {
    ok: true,
    value: {
      directCosts,
      overhead,
      totalCosts,
      grossProfit,
      profit,
      margin: safeDivide(profit, revenue),
      markup: safeDivide(profit, totalCosts),
      revenueRounded,
      directCostsRounded,
      totalCostsRounded,
      grossProfitRounded: revenueRounded.minus(directCostsRounded),
      profitRounded: revenueRounded.minus(totalCostsRounded),
    },
  };
}
