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
    revenue: string;
    labor: string;
    contractor: string;
    software: string;
    other: string;
    overhead: string;
  };
  takeaway: string;
}

export const PROJECT_PROFIT_META = {
  title: 'Project Profit Calculator',
  seoTitle: 'Freelance Project Profit Calculator',
  description:
    'Add up labor, contractors, software, other direct costs and overhead to see what a freelance project really earns: total cost, profit, margin and markup.',
  path: '/calculators/project-profit-calculator/',
  eyebrow: 'Profitability calculator',
  intro:
    'An invoice is not profit. Price the project against every cost it carries, including your own time and a share of overhead, then read the margin and the markup without mixing them up.',
} as const;

export const PROJECT_PROFIT_EXAMPLES: readonly WorkedExample[] = [
  {
    id: 'us-web-project',
    name: 'Website build, United States',
    scenario:
      'A $12,000 website uses $5,000 of the freelancer’s own time at an internal cost rate, $1,500 of subcontracted development, $300 of licenses, $200 of hosting and assets, and $1,000 of allocated overhead.',
    currency: 'USD',
    inputs: {
      revenue: '12000',
      labor: '5000',
      contractor: '1500',
      software: '300',
      other: '200',
      overhead: '1000',
    },
    takeaway:
      'The project earns $4,000 after every cost, a 33.3% margin and a 50.0% markup. Before overhead it looks like $5,000 of gross profit; the difference is the rent, insurance and admin the project really consumes.',
  },
  {
    id: 'uk-brand-project',
    name: 'Brand refresh, United Kingdom',
    scenario:
      'A £4,500 brand package carries £2,200 of design time at cost, £600 for a copywriter, £150 for stock assets, £100 for print proofs and £450 of allocated overhead.',
    currency: 'GBP',
    inputs: {
      revenue: '4500',
      labor: '2200',
      contractor: '600',
      software: '150',
      other: '100',
      overhead: '450',
    },
    takeaway:
      'The project leaves £1,000, a 22.2% margin and a 28.6% markup. It is profitable but thin: one extra revision day at cost would take most of the margin with it.',
  },
  {
    id: 'ca-app-project',
    name: 'Event app, Canada',
    scenario:
      'A $9,000 fixed-price app overruns: $6,500 of the developer’s time at cost, $2,000 of contracting, $400 of licenses, $150 of hosting and $1,200 of overhead.',
    currency: 'CAD',
    inputs: {
      revenue: '9000',
      labor: '6500',
      contractor: '2000',
      software: '400',
      other: '150',
      overhead: '1200',
    },
    takeaway:
      'The project loses $1,250: a -13.9% margin and a -12.2% markup. Fixed-price work without a scope buffer is how a full order book turns into a bad year, even when every invoice is paid on time.',
  },
];

export const PROJECT_PROFIT_ASSUMPTIONS: readonly string[] = [
  'Project revenue is what the client pays, excluding sales tax, VAT or GST you collect on their behalf and pass on.',
  'Labor cost is your own hours at an internal cost rate. If you do not cost your time, the profit number is fiction: unpaid work is still a cost to the business.',
  'Contractor cost covers subcontractors and freelancers paid for this project, including their fees and any platform charges.',
  'Software cost should include only licenses and subscriptions used for this project, not the whole yearly tool stack.',
  'Other direct costs cover hosting, printing, travel, materials, hardware and anything else the project would not have needed otherwise.',
  'Overhead is an allocation, not an exact number. A common method is to spread yearly rent, insurance, accounting and admin across projects by revenue share or hours used.',
  'Profit after overhead is closer to a net figure than a strict gross profit. The “gross profit before overhead” row shows the classic gross number for comparison.',
  'Margin divides profit by revenue; markup divides profit by total cost. They describe the same profit with different denominators and must never be used interchangeably.',
  'Income tax and payment processing fees are not modelled. The currency selector formats amounts only and does not convert them.',
];

export const PROJECT_PROFIT_FAQ: readonly Faq[] = [
  {
    question: 'How do I price a freelance project?',
    answer:
      'Estimate the hours the work will really take, including meetings, project management and the revisions you include. Cost those hours at an internal rate, add contractors, materials, software and a share of overhead, then divide by one minus your target margin. The result is the price that leaves the margin you wanted, before any tax you collect separately.',
  },
  {
    question: 'How do I calculate profit on a freelance project?',
    answer:
      'Take the project revenue, subtract every direct cost, then subtract the share of overhead the project consumes. Direct costs include your own time at an internal rate, subcontractors, software, materials, travel and payment fees. What remains is project profit; divide it by revenue for margin, or by total cost for markup.',
  },
  {
    question: 'What expenses should I include in a project profit calculation?',
    answer:
      'Include anything the project would not happen without: your hours, freelancers or contractors, licences and subscriptions used for the work, stock and materials, travel, hosting, payment processing fees and a share of rent, insurance, accounting and admin. Leave out income tax and any VAT, GST or sales tax you collect and remit.',
  },
  {
    question: 'Should I include meetings and revisions in project costs?',
    answer:
      'Yes. Kick-off calls, project management, client updates and the revisions included in your scope all consume hours that cannot be billed elsewhere. Estimate them as a percentage of delivery time, then compare the estimate with your time tracking after the project. If revisions regularly exceed the allowance, the price or the scope needs to change.',
  },
  {
    question: 'What is the difference between margin and markup?',
    answer:
      'Margin is profit divided by revenue and tells you what share of each invoice you keep. Markup is profit divided by total cost and tells you how much you added on top of what you spent. A $100 profit on a $300 project is a 25% margin but a 50% markup. Pricing with markup and reporting margin is how freelancers accidentally work for less than they think.',
  },
  {
    question: 'Should I include my own time as a project cost?',
    answer:
      'Yes. Cost your hours at an internal rate that covers your target income and the non-billable time around the work. If your time is free in the spreadsheet, every project looks profitable and you have no way to see that a client is consuming a week of capacity for very little return.',
  },
  {
    question: 'How should I allocate overhead to a single project?',
    answer:
      'Pick one method and keep it consistent. Common approaches are a percentage of revenue, a fixed percentage added to direct costs, or hours used multiplied by an overhead rate. The number only needs to be reasonable and repeatable: the point is to stop pretending rent, insurance and accounting are free.',
  },
  {
    question: 'Why is the profit lower than the invoice total?',
    answer:
      'The invoice is revenue, not profit. Contractors, licenses, hosting, materials, your own time at cost and a share of overhead all come out of it before anything reaches you. A project with a large invoice and heavy subcontracting can leave less than a small project you deliver yourself.',
  },
  {
    question: 'What is a healthy margin for a freelance project?',
    answer:
      'There is no universal number, but many solo service businesses aim for 30–50% margin on project work after direct costs and overhead. Below 20% there is little room for a scope change, a late payment or a slow month. Compare your own projects over time rather than against a single benchmark.',
  },
  {
    question: 'Does the calculator include income tax or sales tax?',
    answer:
      'No. Enter revenue and costs before income tax, and exclude any sales tax, VAT or GST you collect for a client and remit. This is a planning tool, not a tax return. Check the rules where you live or ask an accountant.',
  },
  {
    question: 'Why is margin or markup shown as a dash?',
    answer:
      'Margin needs revenue to divide by, and markup needs cost to divide by. If revenue is zero the margin has no meaning, and if every cost is zero the markup has none. The profit figure is still shown, because it is still real, and the dash simply says the percentage cannot be calculated.',
  },
];

export const PROJECT_PROFIT_RELATED_CALCULATORS: readonly string[] = [
  'markup-vs-margin-calculator',
  'freelance-rate-calculator',
  'break-even-calculator',
  'quote-generator',
  'invoice-generator',
];
