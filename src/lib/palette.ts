/**
 * Palette data + local storage, shared by the CommandPalette island, the
 * Today dashboard and the tests.
 *
 * Kept free of Preact imports so the palette can mount on every page without
 * pulling component code into the base script, and so the storage helpers
 * stay unit-testable.
 */

import { dispatchIntent } from '@/lib/intents';

export interface PaletteItem {
  id: string;
  name: string;
  description: string;
  href?: string;
  category: 'Calculator' | 'Generator' | 'Country' | 'Action';
  shortcut?: string;
  keywords?: string[];
  /**
   * Quick actions run in place instead of navigating. Entries with `run`
   * are never recorded as recents and never render as links.
   */
  run?: () => void;
  /**
   * True for entries derived from local data (saved clients). They are
   * searchable but stay out of the default "everything" list so the first
   * screen stays tools-first.
   */
  dynamic?: boolean;
}

/** Fires the same intent events the home quick actions use, queued by
 *  the intent bridge so an early tap is never lost. */
function runIntent(name: Parameters<typeof dispatchIntent>[0]) {
  dispatchIntent(name);
}

export const RECENTS_KEY = 'soloyolo-recents';
export const PINNED_KEY = 'soloyolo-pinned';

export const ALL_COMMAND_ITEMS: readonly PaletteItem[] = [
  {
    id: 'hourly-rate-calculator',
    name: 'Hourly Rate Calculator',
    description: 'Find the rate that covers income targets, tax and business expenses.',
    href: '/calculators/hourly-rate-calculator/',
    category: 'Calculator',
    shortcut: '1',
    keywords: ['rate', 'hour', 'pricing', 'salary', 'billable', 'income'],
  },
  {
    id: 'invoice-generator',
    name: 'New Invoice',
    description: 'Build professional, country-compliant invoices and print to PDF.',
    href: '/generators/invoice-generator/',
    category: 'Generator',
    shortcut: '2',
    keywords: [
      'invoice',
      'new invoice',
      'bill',
      'pdf',
      'document',
      'client',
      'payment',
      'create',
      'make',
    ],
  },
  {
    id: 'freelance-rate-calculator',
    name: 'Freelance Rate Calculator',
    description: 'Set a sustainable rate factoring in non-billable time and buffers.',
    href: '/calculators/freelance-rate-calculator/',
    category: 'Calculator',
    shortcut: '3',
    keywords: ['freelance', 'rate', 'non-billable', 'vacation', 'pricing'],
  },
  {
    id: 'project-profit-calculator',
    name: 'Project Profit Calculator',
    description: 'Calculate net profit, margin and true hourly yield for client projects.',
    href: '/calculators/project-profit-calculator/',
    category: 'Calculator',
    keywords: ['profit', 'project', 'margin', 'fixed price', 'scope', 'costs'],
  },
  {
    id: 'markup-vs-margin-calculator',
    name: 'Markup vs Margin Calculator',
    description: 'Convert between cost, price, markup percentage and profit margin.',
    href: '/calculators/markup-vs-margin-calculator/',
    category: 'Calculator',
    keywords: ['markup', 'margin', 'gross profit', 'cost', 'pricing'],
  },
  {
    id: 'payment-processing-fee-calculator',
    name: 'Payment Fee Calculator',
    description: 'Calculate net payout after Stripe, PayPal and processor fees.',
    href: '/calculators/payment-processing-fee-calculator/',
    category: 'Calculator',
    keywords: ['fee', 'stripe', 'paypal', 'processor', 'credit card', 'payout'],
  },
  {
    id: 'vat-gst-sales-tax-calculator',
    name: 'VAT / GST / Sales Tax Calculator',
    description: 'Add or extract tax with official rates and terminology.',
    href: '/calculators/vat-gst-sales-tax-calculator/',
    category: 'Calculator',
    keywords: ['tax', 'vat', 'gst', 'sales tax', 'reverse charge'],
  },
  {
    id: 'retainer-pricing-calculator',
    name: 'Retainer Pricing Calculator',
    description: 'Structure recurring monthly retainers with guaranteed margin.',
    href: '/calculators/retainer-pricing-calculator/',
    category: 'Calculator',
    keywords: ['retainer', 'recurring', 'monthly', 'subscription', 'client'],
  },
  {
    id: 'break-even-calculator',
    name: 'Break-even Calculator',
    description: 'Find the minimum billable hours or sales to cover fixed overheads.',
    href: '/calculators/break-even-calculator/',
    category: 'Calculator',
    keywords: ['break-even', 'fixed costs', 'overhead', 'minimum'],
  },
  {
    id: 'quote-generator',
    name: 'Quote & Estimate Generator',
    description: 'Create clear project quotes with scope, milestones and terms.',
    href: '/generators/quote-generator/',
    category: 'Generator',
    keywords: ['quote', 'estimate', 'proposal', 'bid', 'terms'],
  },
  {
    id: 'receipt-generator',
    name: 'Receipt Generator',
    description: 'Generate payment receipts for paid invoices and completed work.',
    href: '/generators/receipt-generator/',
    category: 'Generator',
    keywords: ['receipt', 'paid', 'payment', 'proof', 'transaction'],
  },
  {
    id: 'payment-reminder-generator',
    name: 'Payment Reminder Generator',
    description: 'Write professional, firm chase letters for overdue invoices.',
    href: '/generators/payment-reminder-generator/',
    category: 'Generator',
    keywords: ['reminder', 'overdue', 'late', 'chase', 'collection', 'email'],
  },
  {
    id: 'us-invoice-generator',
    name: 'United States Invoice Generator',
    description: 'Standard US business invoice format with state tax and W9 notes.',
    href: '/us/invoice-generator/',
    category: 'Country',
    keywords: ['us', 'usa', 'united states', 'dollar', 'w9', 'ein'],
  },
  {
    id: 'uk-vat-invoice-generator',
    name: 'UK VAT Invoice Generator',
    description: 'HMRC-compliant VAT invoice with 20%/5%/0% rates and VAT number.',
    href: '/uk/vat-invoice-generator/',
    category: 'Country',
    keywords: ['uk', 'united kingdom', 'vat', 'hmrc', 'gbp', 'pound'],
  },
  {
    id: 'ca-gst-hst-invoice-generator',
    name: 'Canada GST/HST Invoice Generator',
    description: 'CRA compliant provincial GST/HST rules and business numbers.',
    href: '/ca/gst-hst-invoice-generator/',
    category: 'Country',
    keywords: ['canada', 'cad', 'gst', 'hst', 'cra', 'quebec', 'ontario'],
  },
  {
    id: 'au-tax-invoice-generator',
    name: 'Australia Tax Invoice Generator',
    description: 'ATO compliant Tax Invoice with ABN and 10% GST breakdown.',
    href: '/au/tax-invoice-generator/',
    category: 'Country',
    keywords: ['australia', 'ato', 'abn', 'aud', 'tax invoice'],
  },
  {
    id: 'de-vat-invoice-generator',
    name: 'Germany Rechnung (USt & §19)',
    description: 'German invoice format with USt-IdNr., Steuernummer and §19 rule.',
    href: '/de/vat-invoice-generator/',
    category: 'Country',
    keywords: ['germany', 'deutschland', 'rechnung', 'ust', 'kleinunternehmer'],
  },
  {
    id: 'ch-vat-invoice-generator',
    name: 'Switzerland MWST / TVA Invoice',
    description: 'Swiss MWST 8.1% / 2.6% invoice with CHE number validation.',
    href: '/ch/vat-invoice-generator/',
    category: 'Country',
    keywords: ['switzerland', 'schweiz', 'chf', 'mwst', 'tva'],
  },
  {
    id: 'in-gst-invoice-generator',
    name: 'India GST Tax Invoice',
    description: 'CGST/SGST/IGST split with GSTIN, HSN/SAC codes and rupee format.',
    href: '/in/gst-invoice-generator/',
    category: 'Country',
    keywords: ['india', 'gst', 'gstin', 'inr', 'hsn', 'cgst', 'sgst'],
  },
  {
    id: 'ae-vat-invoice-generator',
    name: 'UAE Tax Invoice (TRN & FTA)',
    description: 'Federal Tax Authority compliant invoice with 5% VAT and TRN.',
    href: '/ae/vat-invoice-generator/',
    category: 'Country',
    keywords: ['uae', 'dubai', 'emirates', 'aed', 'trn', 'fta'],
  },
  {
    id: 'all-countries',
    name: 'All Country Guides & Rules',
    description: 'Review invoice regulations, mandatory fields and tax rates across 8 markets.',
    href: '/countries/',
    category: 'Country',
    keywords: ['countries', 'rules', 'international', 'cross-border'],
  },
  {
    id: 'action-start-timer',
    name: 'Start timer',
    description: 'Start or stop the billable-hours timer on this device.',
    category: 'Action',
    keywords: ['timer', 'start', 'stop', 'track', 'time', 'hours', 'log'],
    run: () => runIntent('soloyolo:timer-toggle'),
  },
  {
    id: 'action-add-client',
    name: 'Add client',
    description: 'Save a client name to this browser for faster invoices.',
    category: 'Action',
    keywords: ['client', 'add', 'customer', 'new', 'save'],
    run: () => runIntent('soloyolo:focus-clients'),
  },
];

function getStoredArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function setStoredArray(key: string, items: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, 8)));
  } catch {
    // storage quota or private browsing
  }
}

export function getRecents(): string[] {
  return getStoredArray(RECENTS_KEY);
}

export function getPinned(): string[] {
  return getStoredArray(PINNED_KEY);
}

export function setPinned(ids: string[]): void {
  setStoredArray(PINNED_KEY, ids);
}

/** Records a tool visit (most recent first, deduped, capped). */
export function recordToolVisit(toolId: string): void {
  const current = getStoredArray(RECENTS_KEY);
  const updated = [toolId, ...current.filter((id) => id !== toolId)].slice(0, 6);
  setStoredArray(RECENTS_KEY, updated);
}

/**
 * Records the visit for the page the browser is on right now, if it is a
 * known tool. Called once when the palette hydrates, so recents reflect
 * real tool usage from any entry point (quick actions, cards, footer,
 * direct links), not just palette selections.
 */
export function recordVisitForLocation(pathname: string): void {
  const item = ALL_COMMAND_ITEMS.find((candidate) => candidate.href === pathname);
  if (item && !item.dynamic) recordToolVisit(item.id);
}

export interface ClientRecord {
  id: string;
  name: string;
}

export const CLIENTS_KEY = 'soloyolo-clients';

export function getClients(): ClientRecord[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is ClientRecord => {
        if (typeof entry !== 'object' || entry === null) return false;
        const record = entry as Partial<ClientRecord>;
        return typeof record.name === 'string' && record.name.trim() !== '';
      })
      .map((entry) => ({ id: entry.id ?? String(entry.name), name: entry.name }));
  } catch {
    return [];
  }
}

/** Saved clients as searchable palette entries: "invoice for <name>". */
export function clientPaletteItems(clients: readonly ClientRecord[]): PaletteItem[] {
  return clients.slice(0, 6).map((client) => ({
    id: `client-${client.id}`,
    name: `Invoice ${client.name}`,
    description: `Start a new invoice for ${client.name}.`,
    href: `/generators/invoice-generator/?client=${encodeURIComponent(client.name)}`,
    category: 'Action' as const,
    keywords: ['invoice', 'client', 'new', 'bill', client.name.toLowerCase()],
    dynamic: true,
  }));
}
