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
    targetIncome: string;
    annualExpenses: string;
    workingWeeks: string;
    billableHoursPerWeek: string;
  };
  takeaway: string;
}

export const HOURLY_RATE_META = {
  title: 'Hourly Rate Calculator',
  description:
    'Work out the hourly rate you need to charge to reach your income target, cover business expenses and allow for the hours you can actually bill.',
  path: '/calculators/hourly-rate-calculator/',
  eyebrow: 'Pricing calculator',
  intro:
    'Work out the hourly rate you need to charge to hit your income target, cover your business expenses, and account for the hours you can actually bill.',
} as const;

export const HOURLY_RATE_EXAMPLES: readonly WorkedExample[] = [
  {
    id: 'us-developer',
    name: 'Freelance developer, United States',
    scenario:
      'A solo developer wants to earn $80,000 before income tax, expects $12,000 of business costs, and can bill 25 hours a week for 48 weeks of the year.',
    currency: 'USD',
    inputs: {
      targetIncome: '80000',
      annualExpenses: '12000',
      workingWeeks: '48',
      billableHoursPerWeek: '25',
    },
    takeaway:
      'The rate is $76.67 an hour. Every $1,000 of extra annual costs adds about $0.83 to the rate, while adding one billable hour a week lowers it by roughly $3.',
  },
  {
    id: 'uk-consultant',
    name: 'Consultant, United Kingdom',
    scenario:
      'A consultant wants £45,000 of income, budgets £6,000 for insurance, software and accounting, and plans to bill 20 hours a week across 46 working weeks.',
    currency: 'GBP',
    inputs: {
      targetIncome: '45000',
      annualExpenses: '6000',
      workingWeeks: '46',
      billableHoursPerWeek: '20',
    },
    takeaway:
      'The required rate is £55.43 an hour. The long holiday allowance and a 20-hour billable week push the rate above a full-time salary equivalent.',
  },
  {
    id: 'au-designer',
    name: 'Part-time designer, Australia',
    scenario:
      'A designer works three days a week, wants $60,000 of income, carries $8,000 of costs and can bill 15 hours a week for 40 weeks.',
    currency: 'AUD',
    inputs: {
      targetIncome: '60000',
      annualExpenses: '8000',
      workingWeeks: '40',
      billableHoursPerWeek: '15',
    },
    takeaway:
      'The rate is $113.33 an hour. Fewer billable hours mean a higher rate: part-time capacity is not cheaper, it is simply spread across less billable work.',
  },
];

export const HOURLY_RATE_ASSUMPTIONS: readonly string[] = [
  'Your target income is the amount you want before income tax. Tax, pension contributions and student loan repayments are not modelled.',
  'Annual business expenses are running costs only: software, insurance, accounting, workspace, equipment, marketing, payment fees and contractors.',
  'Working weeks per year should exclude holidays and sick leave. The calculator allows 1 to 52 weeks.',
  'Billable hours per week should include only hours you can put on an invoice. Admin, sales, marketing, learning and unbilled revisions are not billable.',
  'The rate is a floor, not a ceiling. Specialist skills, urgency, risk and project size can justify charging more.',
  'The currency selector formats the result only. It does not apply exchange rates, so enter every value in the same currency.',
];

export const HOURLY_RATE_FAQ: readonly Faq[] = [
  {
    question: 'Why is the calculated rate higher than my old salary divided by hours?',
    answer:
      'A salary pays for all of your working time, including holidays, sick leave, admin and internal meetings. A freelance rate has to fund only the hours you can invoice while also covering the unbillable hours around them. It must also pay for costs an employer used to cover, from software to insurance.',
  },
  {
    question: 'How many billable hours per week should I enter?',
    answer:
      'Count only hours you can put on an invoice. For most solo professionals that is 50–70% of actual working time; the rest goes to sales, admin, learning and unbilled revisions. If you are unsure, start with 20–25 hours a week and adjust after a month of tracking your time.',
  },
  {
    question: 'Should I include income tax in my target income?',
    answer:
      'No. Enter the amount you want before income tax, or add an estimate for tax on top of the take-home pay you need. This calculator does not model income tax, VAT or GST, pension contributions or student loan repayments. For your own situation, check the rules for your country or ask an accountant.',
  },
  {
    question: 'What counts as annual business expenses?',
    answer:
      'Software subscriptions, insurance, accounting and bookkeeping, workspace or home-office costs, equipment, marketing, payment processing fees, professional development and any contractors you expect to pay over the year. Do not include your own drawings or salary (that is the target income figure).',
  },
  {
    question: 'How do I turn the hourly rate into a day rate or a project price?',
    answer:
      'Multiply the rate by the billable hours in the unit you are pricing. At $76.67 an hour, a six-hour day is about $460. For a fixed-price project, estimate the billable hours, multiply, then add a risk buffer of roughly 10–20% for revisions and scope changes.',
  },
  {
    question: 'What if I want more holiday or a four-day week?',
    answer:
      'Reduce the working weeks or the billable hours per week. The rate rises because the same income has to come from fewer billable hours. That trade-off is the point of the calculator: it shows what a shorter year or a shorter week actually costs you.',
  },
  {
    question: 'Does the currency selector convert my numbers?',
    answer:
      'No. It only changes how amounts are formatted. Enter all figures in the currency you are working in and use your own exchange rate if you need to compare markets.',
  },
];

export const HOURLY_RATE_RELATED_CALCULATORS: readonly string[] = [
  'freelance-rate-calculator',
  'project-profit-calculator',
  'retainer-pricing-calculator',
];
