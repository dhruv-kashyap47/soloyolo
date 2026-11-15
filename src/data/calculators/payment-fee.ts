import type { CurrencyCode } from '@/lib/formatting/currency';

export interface Faq {
  question: string;
  answer: string;
}

export interface WorkedExample {
  id: string;
  name: string;
  scenario: string;
  currency: CurrencyCode;
  inputs: {
    amount: string;
    percentFee: string;
    fixedFee: string;
  };
  takeaway: string;
}

export const PAYMENT_FEE_META = {
  title: 'Payment Fee Calculator',
  description:
    'See exactly what lands in your account after a percentage fee and a fixed fee, with the effective rate that small payments really cost you.',
  path: '/calculators/payment-processing-fee-calculator/',
  eyebrow: 'Cash-flow calculator',
  intro:
    'Processors quote a percentage and a flat fee, then take both. Enter the payment and your own rates to see the fee, the net and the effective rate.',
} as const;

export const PAYMENT_FEE_EXAMPLES: readonly WorkedExample[] = [
  {
    id: 'us-card',
    name: 'Card payment · United States',
    scenario:
      'A client pays a $1,000 invoice by card. The processor charges 2.9% plus $0.30 per transaction, which is the rate the freelancer actually has on their account.',
    currency: 'USD',
    inputs: { amount: '1000', percentFee: '2.9', fixedFee: '0.30' },
    takeaway:
      'The fee is $29.30, so $970.70 arrives, an effective rate of 2.9%. At this size the fixed fee barely moves the number: it is a rounding error on a four-figure payment.',
  },
  {
    id: 'uk-small',
    name: 'Small deposit · United Kingdom',
    scenario:
      'A £250 deposit is paid online at 1.5% plus £0.20. The percentage is lower than the US example, but the payment is much smaller.',
    currency: 'GBP',
    inputs: { amount: '250', percentFee: '1.5', fixedFee: '0.20' },
    takeaway:
      'The fee is £3.95 and the net is £246.05, an effective rate of 1.6%. The fixed fee is doing more work than the percentage here, which is why small payments feel expensive.',
  },
  {
    id: 'au-micro',
    name: 'Micro-payment · Australia',
    scenario:
      'A $45 add-on is charged by card at 1.75% plus $0.30. The amount is small enough that rounding and the flat fee both matter.',
    currency: 'AUD',
    inputs: { amount: '45', percentFee: '1.75', fixedFee: '0.30' },
    takeaway:
      'The fee is $1.09 and $43.91 lands, an effective rate of 2.4%. The headline 1.75% never applies to a payment this small: the flat fee adds more than half a point on its own.',
  },
];

export const PAYMENT_FEE_ASSUMPTIONS: readonly string[] = [
  'The percentage fee is applied to the full payment amount, which is how card processors charge. It is not applied after the fixed fee.',
  'No processor rates are included. Rates differ by processor, country, card type and turnover, and they change; enter what you are actually charged.',
  'The effective rate is the total fee divided by the payment amount. It is always higher than the headline percentage because it includes the fixed fee.',
  'Chargebacks, refunds, disputes, monthly account fees, terminal rental and currency conversion are not modelled.',
  'A payment small enough for the fee to exceed the amount is allowed and shown as a negative net, because that is what happens on micro-transactions.',
  'The currency selector formats amounts only. It does not convert between currencies or apply cross-border fees.',
];

export const PAYMENT_FEE_FAQ: readonly Faq[] = [
  {
    question: 'Why is the effective rate higher than the processor’s percentage?',
    answer:
      'Because the fixed fee is charged on every payment regardless of size. On a $1,000 payment a $0.30 fixed fee adds 0.03 points; on a $10 payment the same fee adds three full points. The effective rate is the total fee divided by the amount, so it always includes that flat charge.',
  },
  {
    question: 'Can I pass the fee on to the client?',
    answer:
      'You can price for it, but the arithmetic is not simply adding the percentage. To receive a target amount after a percentage fee and a fixed fee, divide the target plus the fixed fee by one minus the percentage rate. Many jurisdictions also restrict surcharging card payments, so check the rules where you operate before adding a visible card fee.',
  },
  {
    question: 'Are the processor rates included in the tool?',
    answer:
      'No, deliberately. Rates vary by processor, country, card type, turnover and negotiation, and they change without notice. A baked-in rate would go stale and quietly produce wrong numbers. Enter the rate from your own statement or contract.',
  },
  {
    question: 'Why do small payments cost proportionally more?',
    answer:
      'The fixed fee does not scale. A $0.30 charge is trivial on a $1,000 invoice and substantial on a $10 one. That is why many businesses set a minimum card payment, bundle small items, or absorb card fees only above a threshold.',
  },
  {
    question: 'Does this include refunds, chargebacks or monthly fees?',
    answer:
      'No. Refunds often keep the original processing fee, chargebacks add a fixed penalty, and some accounts carry a monthly or terminal fee. Those costs belong in your overhead rather than in a single payment calculation, and the project profit calculator is a better place to absorb them.',
  },
  {
    question: 'What about international cards or currency conversion?',
    answer:
      'Cross-border and conversion fees are usually charged on top of the headline rate, often as an extra percentage. Add that percentage to the percentage fee field to see the combined effect. The currency selector only changes formatting and does not convert the amount.',
  },
];

export const PAYMENT_FEE_RELATED_CALCULATORS: readonly string[] = [
  'project-profit-calculator',
  'markup-vs-margin-calculator',
  'hourly-rate-calculator',
];
