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
    monthlyHours: string;
    hourlyRate: string;
    monthlyExpenses: string;
    desiredMarginPercent: string;
    discountPercent: string;
  };
  takeaway: string;
}

export const RETAINER_META = {
  title: 'Retainer Pricing Calculator',
  description:
    'Turn hours, your rate, monthly expenses, a target margin and a client discount into a monthly retainer, with the effective hourly rate and profit it really leaves.',
  path: '/calculators/retainer-pricing-calculator/',
  eyebrow: 'Pricing calculator',
  intro:
    'A retainer is not hours times a rate with a number on top. Set the hours you commit, the costs they carry, the margin you want and the discount you are offering, and see what the month actually returns.',
} as const;

export const RETAINER_EXAMPLES: readonly WorkedExample[] = [
  {
    id: 'us-developer',
    name: 'Development retainer, United States',
    scenario:
      'A developer commits 20 hours a month at a $90 internal rate, carries $600 of tools and hosting for the client, wants a 30% margin and offers no discount.',
    currency: 'USD',
    inputs: {
      monthlyHours: '20',
      hourlyRate: '90',
      monthlyExpenses: '600',
      desiredMarginPercent: '30',
      discountPercent: '0',
    },
    takeaway:
      'The retainer is $3,428.57 a month, a $171.43 effective hourly rate and $1,028.57 of monthly profit. The $90 rate is the floor the work is costed at, not the price the client is charged.',
  },
  {
    id: 'uk-consultant',
    name: 'Consulting retainer, United Kingdom',
    scenario:
      'A consultant commits 15 hours at £70, with £400 of monthly costs, a 25% target margin and a 10% discount for a twelve-month commitment.',
    currency: 'GBP',
    inputs: {
      monthlyHours: '15',
      hourlyRate: '70',
      monthlyExpenses: '400',
      desiredMarginPercent: '25',
      discountPercent: '10',
    },
    takeaway:
      'The retainer is £1,740.00 a month, £116.00 an hour, with £290.00 of profit. The 10% discount cuts the achieved margin to about 16.7%, not 25%: a discount always comes out of the margin, never the cost.',
  },
  {
    id: 'au-designer',
    name: 'Design retainer, Australia',
    scenario:
      'A designer prices 10 hours at $120 with $250 of costs, a 20% target margin and a 15% discount to win a long-term client.',
    currency: 'AUD',
    inputs: {
      monthlyHours: '10',
      hourlyRate: '120',
      monthlyExpenses: '250',
      desiredMarginPercent: '20',
      discountPercent: '15',
    },
    takeaway:
      'The retainer is $1,540.63 a month and $154.06 an hour, but the profit is only $90.63: a 5.9% achieved margin. The list price was $1,812.50; the discount took $271.88 of it, which is most of the profit.',
  },
];

export const RETAINER_ASSUMPTIONS: readonly string[] = [
  'The hourly rate is what your hour is worth before the retainer margin. It is the cost you build the price from, not the rate quoted to the client.',
  'Base cost is monthly hours × hourly rate + monthly expenses. It does not include income tax.',
  'The desired margin is applied to the list price, then the discount is taken. A discount therefore reduces the achieved margin below the target.',
  'The discount is a percentage of the list price. A 100% discount is allowed and produces a zero retainer, which the panel shows as a loss against the base cost.',
  'Annual revenue assumes twelve identical months. Real retainers have holidays, rate reviews and changes in scope.',
  'The effective hourly rate is the retainer divided by committed hours. If the client uses fewer hours, the effective rate rises; if scope grows without a price review, it falls.',
  'The currency selector formats amounts only and does not convert them.',
];

export const RETAINER_FAQ: readonly Faq[] = [
  {
    question: 'How is a retainer different from hours multiplied by a rate?',
    answer:
      'A retainer is a fixed monthly price for committed capacity, and it has to carry costs and profit that an hourly rate alone ignores. Multiplying 20 hours by 90 gives 1,800; the retainer here is 3,428.57 because it adds 600 of monthly costs and a 30% margin on top. The gap is not extra income, it is what makes the month viable.',
  },
  {
    question: 'What margin should I choose?',
    answer:
      'Enough to cover the quiet months, unpaid admin and reinvestment. Many solo businesses aim for 20–40% on retainer work. The page shows the achieved margin after any discount, so you can see whether the number you wanted survived the negotiation.',
  },
  {
    question: 'Why does the discount hurt the margin so much?',
    answer:
      'Because it comes out of the price the margin was calculated on. At a 30% margin, a 10% discount leaves about 22%, not 20%, and at a 20% margin a 15% discount leaves under 6%. Discounts feel small in percentage terms and large in profit terms.',
  },
  {
    question: 'Should expenses be inside the retainer?',
    answer:
      'Yes, if the client’s work causes them. Software, hosting, stock, travel and subcontractors should be recovered in the monthly price. Keeping them separate and billing them on top is fine too, as long as the retainer itself is not expected to absorb them silently.',
  },
  {
    question: 'What if the client uses fewer hours than committed?',
    answer:
      'The effective hourly rate rises, which is good for you and usually acceptable to the client: a retainer buys availability, not a bank of hours. Decide in the agreement whether unused hours roll over, expire, or can be used for other work.',
  },
  {
    question: 'Should I include a minimum term?',
    answer:
      'Often, yes. A retainer is priced on the assumption of several months of continuity; a client who leaves after one month has taken the price without giving you the stability it was built on. The calculator does not model contract terms, so put them in the agreement rather than the spreadsheet.',
  },
];

export const RETAINER_RELATED_CALCULATORS: readonly string[] = [
  'freelance-rate-calculator',
  'project-profit-calculator',
  'hourly-rate-calculator',
  'invoice-generator',
];
