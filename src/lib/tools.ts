export type ToolKind = 'calculator' | 'generator';

export interface Tool {
  id: string;
  name: string;
  href: string;
  kind: ToolKind;
  summary: string;
  live: boolean;
}

/**
 * Single registry of tools. Pages, internal links and related-tool blocks read
 * from here so a new tool is wired up in one place.
 *
 * `live: false` entries are the agreed roadmap: they must never be linked until
 * the page exists, which is why every consumer filters on `live`.
 */
export const TOOLS: readonly Tool[] = [
  {
    id: 'hourly-rate-calculator',
    name: 'Hourly Rate Calculator',
    href: '/calculators/hourly-rate-calculator/',
    kind: 'calculator',
    summary: 'Find the hourly rate that covers your income target and business costs.',
    live: true,
  },
  {
    id: 'freelance-rate-calculator',
    name: 'Freelance Rate Calculator',
    href: '/calculators/freelance-rate-calculator/',
    kind: 'calculator',
    summary: 'A sustainable rate that accounts for non-billable time and a profit buffer.',
    live: true,
  },
  {
    id: 'project-profit-calculator',
    name: 'Project Profit Calculator',
    href: '/calculators/project-profit-calculator/',
    kind: 'calculator',
    summary: 'See true project profit, margin and markup after every cost.',
    live: true,
  },
  {
    id: 'markup-vs-margin-calculator',
    name: 'Markup vs Margin Calculator',
    href: '/calculators/markup-vs-margin-calculator/',
    kind: 'calculator',
    summary: 'Convert between cost, price, markup and margin without mixing them up.',
    live: true,
  },
  {
    id: 'payment-processing-fee-calculator',
    name: 'Payment Fee Calculator',
    href: '/calculators/payment-processing-fee-calculator/',
    kind: 'calculator',
    summary: 'Work out exactly what lands in your account after processor fees.',
    live: true,
  },
  {
    id: 'vat-gst-sales-tax-calculator',
    name: 'VAT / GST / Sales Tax Calculator',
    href: '/calculators/vat-gst-sales-tax-calculator/',
    kind: 'calculator',
    summary: 'Add or remove tax with the right terminology for your country.',
    live: true,
  },
  {
    id: 'retainer-pricing-calculator',
    name: 'Retainer Pricing Calculator',
    href: '/calculators/retainer-pricing-calculator/',
    kind: 'calculator',
    summary: 'Price a monthly retainer that still hits your target margin.',
    live: true,
  },
  {
    id: 'break-even-calculator',
    name: 'Break-even Calculator',
    href: '/calculators/break-even-calculator/',
    kind: 'calculator',
    summary: 'Find the revenue, projects or hours needed to cover your costs.',
    live: true,
  },
  {
    id: 'invoice-generator',
    name: 'Invoice Generator',
    href: '/generators/invoice-generator/',
    kind: 'generator',
    summary: 'Create a professional, itemised invoice in your browser.',
    live: false,
  },
  {
    id: 'quote-generator',
    name: 'Quote Generator',
    href: '/generators/quote-generator/',
    kind: 'generator',
    summary: 'Send a clear estimate with scope, terms and an expiry date.',
    live: false,
  },
  {
    id: 'receipt-generator',
    name: 'Receipt Generator',
    href: '/generators/receipt-generator/',
    kind: 'generator',
    summary: 'Issue a simple payment receipt for a completed transaction.',
    live: false,
  },
  {
    id: 'payment-reminder-generator',
    name: 'Payment Reminder Generator',
    href: '/generators/payment-reminder-generator/',
    kind: 'generator',
    summary: 'Write a polite, professional chase for an overdue invoice.',
    live: false,
  },
] as const;

export function liveTools(kind?: ToolKind): Tool[] {
  return TOOLS.filter((tool) => tool.live && (kind ? tool.kind === kind : true));
}

export function findTool(id: string): Tool | undefined {
  return TOOLS.find((tool) => tool.id === id);
}
