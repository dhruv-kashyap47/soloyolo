import Decimal from 'decimal.js';

import type { BreakEvenInput } from '@/lib/calculators/breakEven';
import type { CurrencyCode } from '@/lib/formatting/currency';

export interface Faq {
  question: string;
  answer: string;
}

export type BreakEvenExampleInputs =
  | {
      mode: 'project';
      fixedCosts: string;
      pricePerUnit: string;
      variableCostPerUnit: string;
      hoursPerUnit: string;
    }
  | {
      mode: 'hour';
      fixedCosts: string;
      pricePerUnit: string;
      variableCostPerUnit: string;
    };

export interface WorkedExample {
  id: string;
  name: string;
  scenario: string;
  currency: CurrencyCode;
  inputs: BreakEvenExampleInputs;
  takeaway: string;
}

export const BREAK_EVEN_META = {
  title: 'Break-even Calculator',
  description:
    'Find the revenue, projects or hours you need each month to cover fixed costs, with contribution per sale and a break-even point rounded to whole units.',
  path: '/calculators/break-even-calculator/',
  eyebrow: 'Planning calculator',
  intro:
    'Fixed costs are paid whether or not work arrives. This tool shows how much each sale contributes to them, and how many sales or hours it takes to cover the month.',
} as const;

export const BREAK_EVEN_EXAMPLES: readonly WorkedExample[] = [
  {
    id: 'us-studio',
    name: 'Design studio, United States',
    scenario:
      'A studio carries $4,000 a month of fixed costs, sells projects at $1,500, spends $500 on variable costs per project, and takes 20 hours to deliver one.',
    currency: 'USD',
    inputs: {
      mode: 'project',
      fixedCosts: '4000',
      pricePerUnit: '1500',
      variableCostPerUnit: '500',
      hoursPerUnit: '20',
    },
    takeaway:
      'Each project contributes $1,000, so the month breaks even at 4 projects: $6,000 of revenue and 80 hours of work. Everything after the fourth project is profit before tax.',
  },
  {
    id: 'uk-consultant',
    name: 'Consultant selling hours, United Kingdom',
    scenario:
      'A consultant has £2,000 of monthly fixed costs, charges £75 an hour and spends £15 an hour on delivery, from a subcontractor and travel.',
    currency: 'GBP',
    inputs: {
      mode: 'hour',
      fixedCosts: '2000',
      pricePerUnit: '75',
      variableCostPerUnit: '15',
    },
    takeaway:
      'Each hour contributes £60, so break-even is 33.3 hours a month, rounded up to 34. At £75 an hour that is £2,500 of revenue: the extra half hour is the buffer between the maths and the invoice.',
  },
  {
    id: 'au-maker',
    name: 'Small-batch maker, Australia',
    scenario:
      'A maker has $3,500 of monthly fixed costs, sells a product for $900, spends $350 on materials and delivery, and needs 12 hours per batch.',
    currency: 'AUD',
    inputs: {
      mode: 'project',
      fixedCosts: '3500',
      pricePerUnit: '900',
      variableCostPerUnit: '350',
      hoursPerUnit: '12',
    },
    takeaway:
      'Contribution is $550 per batch, so break-even is 6.4 batches: 7 whole batches, $5,727.27 of revenue and 76.4 hours. The seventh batch is not spare capacity, it is the difference between covering the month and not.',
  },
];

export function toBreakEvenInput(inputs: BreakEvenExampleInputs): BreakEvenInput {
  if (inputs.mode === 'project') {
    return {
      mode: 'project',
      fixedCosts: new Decimal(inputs.fixedCosts),
      pricePerUnit: new Decimal(inputs.pricePerUnit),
      variableCostPerUnit: new Decimal(inputs.variableCostPerUnit),
      hoursPerUnit: new Decimal(inputs.hoursPerUnit),
    };
  }

  return {
    mode: 'hour',
    fixedCosts: new Decimal(inputs.fixedCosts),
    pricePerUnit: new Decimal(inputs.pricePerUnit),
    variableCostPerUnit: new Decimal(inputs.variableCostPerUnit),
  };
}

export const BREAK_EVEN_ASSUMPTIONS: readonly string[] = [
  'Fixed costs are monthly: rent, software, insurance, accounting, loan payments and your own target pay if you choose to treat it that way.',
  'Variable cost is what one sale costs to deliver: materials, subcontractors, delivery, payment fees and any per-project software.',
  'Contribution per unit is price minus variable cost. It is what each sale adds towards fixed costs, before fixed costs are covered.',
  'Break-even units are rounded up, because a fraction of a project or an hour cannot always be sold. The revenue figure uses the exact break-even point, not the rounded one.',
  'A price at or below variable cost never covers fixed costs, so the tool reports that as an error instead of an infinite number.',
  'The per-hour mode treats the hour as the unit, with no hours-per-unit step. The per-project mode converts projects into hours using the hours you enter.',
  'Income tax, VAT/GST and one-off costs are not modelled. If you want annual break-even, multiply the monthly fixed costs by twelve.',
];

export const BREAK_EVEN_FAQ: readonly Faq[] = [
  {
    question: 'What counts as a fixed cost?',
    answer:
      'Anything you pay whether or not you sell that month: rent or workspace, software subscriptions, insurance, accounting, bank fees, loan repayments and your own target salary if you want the business to fund it. Put your target pay in as a fixed cost and break-even becomes the point where the business pays you, not just the bills.',
  },
  {
    question: 'What is contribution and why does it matter?',
    answer:
      'Contribution is the price of one sale minus its variable cost. It is the money each sale adds towards the fixed costs. A project sold at 1,500 with 500 of materials contributes 1,000; that is the number to divide fixed costs by, not the price and not the profit after everything.',
  },
  {
    question: 'Why are whole units rounded up?',
    answer:
      'Because break-even at 6.4 projects means six projects lose money and seven cover the month. Rounding down would promise a profit that does not exist. The revenue figure is calculated at the exact 6.4 point so you can see the true threshold, while the headline shows the number of units you actually have to sell.',
  },
  {
    question: 'Why does the calculator refuse a price below variable cost?',
    answer:
      'If each sale costs more to deliver than it brings in, selling more makes the loss bigger, not smaller. There is no break-even point to find, only a decision to change the price, cut the variable cost or stop selling. The tool says so plainly instead of returning an impossible number.',
  },
  {
    question: 'Are these monthly or annual figures?',
    answer:
      'Fixed costs are treated as monthly. The result is the monthly break-even. For an annual view, multiply the fixed costs by twelve and the answer scales with them; the per-unit contribution stays the same.',
  },
  {
    question: 'When should I use per hour instead of per project?',
    answer:
      'Use per project when you sell fixed-scope work and know roughly how long one takes. Use per hour when you bill time directly, or when projects vary so much that an average project would mislead. The per-project mode still reports the hours behind the project, which is usually the more useful number for planning a week.',
  },
];

export const BREAK_EVEN_RELATED_CALCULATORS: readonly string[] = [
  'project-profit-calculator',
  'freelance-rate-calculator',
  'retainer-pricing-calculator',
  'quote-generator',
];
