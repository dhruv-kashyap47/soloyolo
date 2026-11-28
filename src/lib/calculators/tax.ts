import Decimal from 'decimal.js';

import { MAX_MONEY, isUsableDecimal, roundMoney, toDecimal } from '@/lib/finance/money';
import { percentOf, percentToFraction } from '@/lib/finance/percent';

export const TAX_LIMITS = {
  maxMoney: MAX_MONEY,
  maxRatePercent: new Decimal(100),
} as const;

export type TaxMode = 'add' | 'remove';

export interface TaxInput {
  /** add: the amount is before tax. remove: the amount is the tax-inclusive total. */
  mode: TaxMode;
  amount: Decimal;
  /** Tax rate as a percentage, e.g. 20 for 20%. */
  ratePercent: Decimal;
}

export interface TaxBreakdown {
  /** Amount before tax. */
  net: Decimal;
  /** The tax on its own. */
  tax: Decimal;
  /** Amount including tax. */
  gross: Decimal;
  netRounded: Decimal;
  taxRounded: Decimal;
  grossRounded: Decimal;
}

export type TaxErrorCode = 'invalid_input' | 'negative_input' | 'rate_out_of_range' | 'too_large';

export type TaxOutcome =
  { ok: true; value: TaxBreakdown } | { ok: false; code: TaxErrorCode; message: string };

/**
 * Adds tax to a net amount, or removes it from a gross amount.
 *
 *   add:    tax = net × rate;        gross = net + tax
 *   remove: net = gross ÷ (1 + rate); tax = gross − net
 *
 * Removing tax divides rather than subtracting a percentage: at 20% VAT, £600
 * includes £100 of VAT, not £120. The rate itself is never hard-coded here.
 */
export function calculateTax(input: TaxInput): TaxOutcome {
  const amount = toDecimal(input.amount);
  const ratePercent = toDecimal(input.ratePercent);

  if (!isUsableDecimal(amount) || !isUsableDecimal(ratePercent)) {
    return {
      ok: false,
      code: 'invalid_input',
      message: 'All values must be valid numbers.',
    };
  }

  if (amount.isNegative() || ratePercent.isNegative()) {
    return {
      ok: false,
      code: 'negative_input',
      message: 'The amount and the tax rate cannot be negative.',
    };
  }

  if (ratePercent.greaterThan(TAX_LIMITS.maxRatePercent)) {
    return {
      ok: false,
      code: 'rate_out_of_range',
      message: 'The tax rate must be between 0 and 100.',
    };
  }

  if (amount.greaterThan(MAX_MONEY)) {
    return {
      ok: false,
      code: 'too_large',
      message: 'Money values are too large to calculate reliably.',
    };
  }

  const rate = percentToFraction(ratePercent);

  let net: Decimal;
  let tax: Decimal;
  let gross: Decimal;

  if (input.mode === 'add') {
    net = amount;
    tax = percentOf(amount, ratePercent);
    gross = net.plus(tax);
  } else {
    gross = amount;
    net = amount.dividedBy(new Decimal(1).plus(rate));
    tax = gross.minus(net);
  }

  return {
    ok: true,
    value: {
      net,
      tax,
      gross,
      // Displayed parts must add up: an invoice cannot show a net, a tax and a
      // total that disagree by a cent. Round once, then derive the third value.
      netRounded: roundMoney(net),
      taxRounded:
        input.mode === 'remove' ? roundMoney(gross).minus(roundMoney(net)) : roundMoney(tax),
      grossRounded:
        input.mode === 'add' ? roundMoney(net).plus(roundMoney(tax)) : roundMoney(gross),
    },
  };
}
