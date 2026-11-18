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
    desiredIncome: string;
    annualExpenses: string;
    workingWeeks: string;
    workingHoursPerWeek: string;
    nonBillablePercent: string;
    profitBufferPercent: string;
  };
  takeaway: string;
}

export const FREELANCE_RATE_META = {
  title: 'Freelance Rate Calculator',
  description:
    'Turn a target income, business costs, non-billable time and a profit buffer into one sustainable hourly rate, with the hours you can actually invoice.',
  path: '/calculators/freelance-rate-calculator/',
  eyebrow: 'Pricing calculator',
  intro:
    'Build a rate from the hours you really work: set your income target and costs, subtract the time you cannot invoice, then add the buffer that keeps the year survivable.',
} as const;

export const FREELANCE_RATE_EXAMPLES: readonly WorkedExample[] = [
  {
    id: 'us-developer',
    name: 'Freelance developer, United States',
    scenario:
      'A developer wants $90,000 before income tax, carries $15,000 of business costs, works 46 weeks of 40 hours, loses 40% of that week to admin and sales, and wants a 10% buffer.',
    currency: 'USD',
    inputs: {
      desiredIncome: '90000',
      annualExpenses: '15000',
      workingWeeks: '46',
      workingHoursPerWeek: '40',
      nonBillablePercent: '40',
      profitBufferPercent: '10',
    },
    takeaway:
      'The rate is $104.62 an hour. Only 24 of the 40 hours are billable, so the week that looks like 40 paid hours is really 24; the buffer adds $10,500, and without it the rate would be $95.11.',
  },
  {
    id: 'uk-consultant',
    name: 'Consultant, United Kingdom',
    scenario:
      'A consultant wants £60,000 of income, budgets £8,000 for insurance, software and accounting, works 44 weeks of 37.5 hours, treats 45% of that time as non-billable, and adds a 15% buffer.',
    currency: 'GBP',
    inputs: {
      desiredIncome: '60000',
      annualExpenses: '8000',
      workingWeeks: '44',
      workingHoursPerWeek: '37.5',
      nonBillablePercent: '45',
      profitBufferPercent: '15',
    },
    takeaway:
      'The rate is £86.17 an hour across 907.5 billable hours. Nearly half the working week is unbillable, so the 37.5-hour week produces about 20.6 billable hours; the 15% buffer covers the months where work is thin.',
  },
  {
    id: 'au-designer',
    name: 'Part-time designer, Australia',
    scenario:
      'A designer works three days a week: 30 hours across 40 weeks, with 35% of that time non-billable. They want $70,000 of income, carry $9,500 of costs and hold back an 8% buffer.',
    currency: 'AUD',
    inputs: {
      desiredIncome: '70000',
      annualExpenses: '9500',
      workingWeeks: '40',
      workingHoursPerWeek: '30',
      nonBillablePercent: '35',
      profitBufferPercent: '8',
    },
    takeaway:
      'The rate is $110.08 an hour. Part-time capacity does not lower the rate; it raises it, because the same income has to come from 780 billable hours instead of a full-time year.',
  },
];

export const FREELANCE_RATE_ASSUMPTIONS: readonly string[] = [
  'Your target income is the amount you want to pay yourself before income tax. Income tax, pension contributions and student loan repayments are not modelled.',
  'Annual business expenses are running costs only: software, insurance, accounting, workspace, equipment, marketing, payment fees and contractors.',
  'Working weeks should exclude holidays and sick leave. The calculator accepts 1 to 52 weeks.',
  'Working hours per week means every hour you work, including admin, sales, marketing, learning and unbilled revisions. It is not the number of billable hours.',
  'Non-billable time is an annual average, not a best week. If you are unsure, start higher: understating it is the most common reason a freelance rate fails.',
  'The profit buffer is extra revenue held back on top of income and costs. It funds slow months, equipment, tax bills and reinvestment, so it is not part of your take-home pay.',
  'The result is a floor, not a ceiling. Urgency, specialist skills, risk and fixed-price work can justify charging more.',
  'The currency selector formats the result only. It does not apply exchange rates, so enter every value in the same currency.',
];

export const FREELANCE_RATE_FAQ: readonly Faq[] = [
  {
    question: 'How is this different from the hourly rate calculator?',
    answer:
      'The hourly rate calculator takes billable hours per week as a known number. This one starts from all the hours you work and subtracts a non-billable percentage, then adds a profit buffer on top of income and costs. Use this one when you want to model the real shape of your week, or when you need a rate that survives a slow quarter.',
  },
  {
    question: 'What should I enter for non-billable time?',
    answer:
      'Count everything you cannot put on an invoice: email, proposals, invoicing, bookkeeping, marketing, learning, internal admin, travel and time between projects. Most solo professionals find 30–50% is realistic. If you are new to freelancing, start at 50% and lower it only after a month of tracking your actual billable hours.',
  },
  {
    question: 'What is a profit buffer and how much should it be?',
    answer:
      'The buffer is revenue you keep beyond your income and costs. It pays for the weeks with no work, replaces equipment, covers a tax bill, or funds a quiet period of building something new. A common range is 10–20%; anything above 0% is better than a rate with no slack at all. The calculator shows the rate with and without it so you can see what the buffer costs.',
  },
  {
    question: 'Should the profit buffer cover my income tax?',
    answer:
      'Only if that is how you choose to fund it. This calculator treats the buffer as business profit and does not calculate income tax. If you would rather set the buffer aside for tax, enter a percentage that leaves you comfortable after your effective tax rate, or raise the target income figure. Check the rules where you live or ask an accountant.',
  },
  {
    question: 'Why is the calculated rate so much higher than my old salary divided by hours?',
    answer:
      'A salary pays for every hour you are at work, including holidays, sick leave and internal meetings, and your employer also pays for software, insurance and equipment. A freelance rate has to fund only the billable hours while covering the unbillable ones and the business costs around them. Dividing an old salary by 2,080 hours ignores both of those.',
  },
  {
    question: 'What if I want to work fewer hours or take more holiday?',
    answer:
      'Reduce the working weeks or the working hours per week. The rate rises because the same income has to come from fewer billable hours. That trade-off is the point of the calculator: a four-day week is a real choice with a real price, and it is better to see the number before you commit to it.',
  },
  {
    question: 'Can I use one rate for every client and project?',
    answer:
      'A single rate is a useful floor, not a universal price. Urgent work, unusual risk, fixed-price scope and clients who need heavy communication should pay more. Use the calculated rate as the minimum you accept for routine work, then price each project from the billable hours it really takes, plus a risk allowance.',
  },
  {
    question: 'Does the currency selector convert my numbers?',
    answer:
      'No. It only changes how amounts are formatted. Enter all figures in the currency you are working in and use your own exchange rate if you need to compare markets.',
  },
];

export const FREELANCE_RATE_RELATED_CALCULATORS: readonly string[] = [
  'hourly-rate-calculator',
  'project-profit-calculator',
  'retainer-pricing-calculator',
];
