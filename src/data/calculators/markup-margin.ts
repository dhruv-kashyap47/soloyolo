import Decimal from 'decimal.js';

import type { MarkupMarginInput } from '@/lib/calculators/markupMargin';
import type { CurrencyCode } from '@/lib/formatting/currency';

export interface Faq {
  question: string;
  answer: string;
}

export type WorkedExampleInputs =
  | { mode: 'margin' | 'markup'; cost: string; price: string }
  | { mode: 'price'; cost: string; markupPercent: string }
  | { mode: 'cost'; price: string; marginPercent: string };

export interface WorkedExample {
  id: string;
  name: string;
  scenario: string;
  currency: CurrencyCode;
  inputs: WorkedExampleInputs;
  takeaway: string;
}

export const MARKUP_MARGIN_META = {
  title: 'Markup vs Margin Calculator',
  description:
    'Convert between cost, price, markup and margin, and see how far apart the two percentages really are. Enter any two numbers and the rest are worked out.',
  path: '/calculators/markup-vs-margin-calculator/',
  eyebrow: 'Pricing calculator',
  intro:
    'Markup and margin describe the same profit from different denominators, which is why they never match. Enter any two numbers and this tool works out the rest, without the spreadsheet.',
} as const;

export const MARKUP_MARGIN_EXAMPLES: readonly WorkedExample[] = [
  {
    id: 'us-retail',
    name: 'Product resale, United States',
    scenario:
      'A maker buys materials and components for $2,500 and sells the finished piece for $5,000. The question is what that pricing actually returns as a margin.',
    currency: 'USD',
    inputs: { mode: 'margin', cost: '2500', price: '5000' },
    takeaway:
      'Doubling the cost is a 100.0% markup but only a 50.0% margin. Half of the price goes back out as cost, so the business keeps half of every sale, not the full profit it added.',
  },
  {
    id: 'uk-service',
    name: 'Service package, United Kingdom',
    scenario:
      'A consultant delivers a £1,200 package and charges £1,800. This time the question is the markup, because the proposal quotes a percentage on cost.',
    currency: 'GBP',
    inputs: { mode: 'markup', cost: '1200', price: '1800' },
    takeaway:
      'The markup is 50.0% and the margin is 33.3%. Quoting “50% on top” sounds bolder than it is: a third of the invoice is consumed by delivery cost.',
  },
  {
    id: 'au-products',
    name: 'Small-batch products, Australia',
    scenario:
      'A studio knows each unit costs $800 and wants a 25% markup when pricing a wholesale order. The price is the unknown, and with it the margin the order really carries.',
    currency: 'AUD',
    inputs: { mode: 'price', cost: '800', markupPercent: '25' },
    takeaway:
      'A 25.0% markup prices the unit at $1,000, which is a 20.0% margin. The difference between the two numbers is the profit itself, and it grows with every point of markup.',
  },
];

/** Markups used by the on-page comparison table; margins are computed, never typed. */
export const MARKUP_MARGIN_COMPARISON: readonly string[] = ['10', '20', '25', '50', '100', '200'];

/**
 * Turns a worked example into the engine's discriminated input. Shared by the
 * page and the drift test so a published figure can never be calculated one way
 * on the page and another way in the test.
 */
export function toMarkupMarginInput(inputs: WorkedExampleInputs): MarkupMarginInput {
  switch (inputs.mode) {
    case 'margin':
    case 'markup':
      return {
        mode: inputs.mode,
        cost: new Decimal(inputs.cost),
        price: new Decimal(inputs.price),
      };
    case 'price':
      return {
        mode: 'price',
        cost: new Decimal(inputs.cost),
        markupPercent: new Decimal(inputs.markupPercent),
      };
    case 'cost':
      return {
        mode: 'cost',
        price: new Decimal(inputs.price),
        marginPercent: new Decimal(inputs.marginPercent),
      };
  }
}

export const MARKUP_MARGIN_ASSUMPTIONS: readonly string[] = [
  'Cost is what the item or project costs you: materials, subcontractors, licenses and your own time at an internal rate. It does not include income tax.',
  'Price is what the client pays before any sales tax, VAT or GST you collect and remit on their behalf.',
  'Markup is profit divided by cost. Margin is profit divided by price. They are different denominators and can never be the same number for the same project.',
  'Each mode asks for only the two numbers it needs: cost and price, cost and markup, or price and margin. Supplying all four can describe an impossible project, so the tool does not accept it.',
  'Percentages are shown to one decimal place. The exact figures are kept at full precision and rounded half-up only for display.',
  'In the margin and markup modes a price below cost is allowed and produces a negative result. In the price and cost modes the input percentage must be zero or more.',
  'Markup is limited to 10,000% and margin to 99.99%. A 100% margin would require an infinite price.',
  'The currency selector formats amounts only. It does not convert them and does not apply exchange rates.',
];

export const MARKUP_MARGIN_FAQ: readonly Faq[] = [
  {
    question: 'What is the difference between markup and margin?',
    answer:
      'Markup is the profit added on top of cost, divided by that cost. Margin is the profit left in the price, divided by the price. On a $2,500 cost sold for $5,000 the profit is $2,500: that is a 100% markup but a 50% margin. Both are correct; they answer different questions.',
  },
  {
    question: 'Why is markup always higher than margin?',
    answer:
      'Because markup divides by the smaller number. Profit is always less than the price (unless cost is zero) and the cost is always less than or equal to the price. Dividing the same profit by a smaller denominator gives a bigger percentage, so markup is above margin for any profitable sale.',
  },
  {
    question: 'Is a 100% markup the same as a 100% margin?',
    answer:
      'No. A 100% markup doubles the cost: $2,500 becomes $5,000, and the margin is 50%. A 100% margin would mean the price has no cost at all, which is impossible for anything you have to deliver. That is why the margin input stops at 99.99%.',
  },
  {
    question: 'How do I price for a target margin?',
    answer:
      'Switch the mode to Cost, enter the price you want to charge and the margin you need. The calculator returns the highest cost that still leaves that margin, which is your spending ceiling for the project. If you already know the cost, use the Price mode with a markup instead, or convert the target margin into a markup first.',
  },
  {
    question: 'Which number should I quote to a client?',
    answer:
      'Quote a price, not a percentage. If a client asks how the figure is built, talk about the cost of delivery and the value of the outcome. Markup is an internal pricing tool; margin is how you judge whether the work was worth doing. Mixing the two in a negotiation is how a 50% markup gets mistaken for a 50% profit.',
  },
  {
    question: 'Why can I only enter two numbers at a time?',
    answer:
      'Cost, price, markup and margin are linked, so any two determine the other two. If the tool accepted all four, it could be given a cost, a price and a margin that contradict each other and would have to ignore one silently. Two inputs and two outputs keeps the answer honest.',
  },
  {
    question: 'What does a negative margin mean?',
    answer:
      'It means the price is below the cost: the project loses money on every sale. That is a valid answer in the margin and markup modes, and it is worth seeing. In the price and cost modes the inputs are constrained to zero or more, because a pricing decision starts from a positive cost and a positive markup.',
  },
  {
    question: 'Why is margin or markup shown as a dash?',
    answer:
      'Margin needs a price to divide by and markup needs a cost. At a zero price the margin has no meaning, and at a zero cost the markup has none. The rest of the calculation still works, so the tool shows a dash for that one percentage rather than inventing a number.',
  },
];

export const MARKUP_MARGIN_RELATED_CALCULATORS: readonly string[] = [
  'project-profit-calculator',
  'freelance-rate-calculator',
  'retainer-pricing-calculator',
  'quote-generator',
];
