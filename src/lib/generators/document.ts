import Decimal from 'decimal.js';

import type { CurrencyCode } from '@/lib/formatting/currency';
import { calculateDocumentTotals, type DocumentTotals } from '@/lib/generators/totals';
import { parseAmountInput } from '@/lib/validation/amount';

/**
 * The document model shared by every generator.
 *
 * One model, four documents. An invoice, a quote and a receipt differ in the
 * words they use and the fields they show, but the money is the same money,
 * so the totals engine is the same engine. The kind only decides which fields
 * the form asks for and which blocks the preview draws.
 */

export type DocumentKind = 'invoice' | 'quote' | 'receipt';

export const DOCUMENT_KINDS: readonly DocumentKind[] = ['invoice', 'quote', 'receipt'];

/** The tax words a document can use. Phase 4 drives this from the country. */
export const TAX_LABELS = ['Tax', 'VAT', 'GST', 'HST', 'Sales tax'] as const;
export type TaxLabel = (typeof TAX_LABELS)[number];

/** The words for a business's registration number. */
export const TAX_ID_LABELS = [
  'Tax ID',
  'VAT number',
  'GST number',
  'HST number',
  'ABN',
  'Business number',
  'EIN',
] as const;
export type TaxIdLabel = (typeof TAX_ID_LABELS)[number];

export const PAYMENT_STATUSES = [
  'paid',
  'partially paid',
  'pending',
  'overdue',
  'failed',
  'refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  'Bank transfer',
  'Card',
  'Cash',
  'Cheque',
  'PayPal',
  'Stripe',
  'Square',
  'Other',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** The title a document prints at the top of the sheet. */
export const DOCUMENT_TITLES: Record<DocumentKind, string> = {
  invoice: 'INVOICE',
  quote: 'QUOTATION',
  receipt: 'PAYMENT RECEIPT',
};

/** A single charge on a document. */
export interface DocumentLineItem {
  id: string;
  description: string;
  quantity: Decimal;
  unitPrice: Decimal;
  discountPercent: Decimal;
  taxPercent: Decimal;
}

/** The business sending the document. */
export interface DocumentParty {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  taxIdLabel: TaxIdLabel;
  logoDataUrl: string;
}

/** The customer the document is for. */
export interface DocumentRecipient {
  name: string;
  company: string;
  address: string;
  email: string;
}

/** The document itself, with every figure already a Decimal. */
export interface DocumentModel {
  kind: DocumentKind;
  title: string;
  number: string;
  issueDate: string;
  dueDate: string;
  expiryDate: string;
  transactionDate: string;
  currency: CurrencyCode;
  taxLabel: TaxLabel;
  discountPercent: Decimal;
  business: DocumentParty;
  customer: DocumentRecipient;
  items: DocumentLineItem[];
  paymentTerms: string;
  notes: string;
  paymentDetails: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  amountPaid: Decimal;
  showFooterNote: boolean;
}

/** A document with its totals worked out. */
export interface ResolvedDocument {
  model: DocumentModel;
  totals: DocumentTotals;
}

/* -------------------------------------------------------------------------
 * The draft: what the form holds while it is being filled in.
 *
 * Every value is a string, because that is what an input holds. The draft is
 * the only shape the form ever works with; it becomes a document through
 * `resolveDocument`.
 * ---------------------------------------------------------------------- */

export interface LineItemDraft {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  taxPercent: string;
}

export interface DocumentDraft {
  businessName: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
  businessWebsite: string;
  businessTaxId: string;
  businessTaxIdLabel: TaxIdLabel;
  logoDataUrl: string;

  customerName: string;
  customerCompany: string;
  customerAddress: string;
  customerEmail: string;

  number: string;
  issueDate: string;
  dueDate: string;
  expiryDate: string;
  transactionDate: string;
  currency: CurrencyCode;
  taxLabel: TaxLabel;
  discountPercent: string;

  paymentTerms: string;
  notes: string;
  paymentDetails: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  amountPaid: string;

  items: LineItemDraft[];
  showFooterNote: boolean;
}

/**
 * A blank line item.
 *
 * The id is passed in rather than generated here. A module level counter
 * would give the server one set of ids and the browser another, and the
 * labels would then point at the wrong fields after hydration. The caller
 * owns the ids, so they are the same on both sides.
 */
export function emptyLineItem(id: string): LineItemDraft {
  return {
    id,
    description: '',
    quantity: '1',
    unitPrice: '',
    discountPercent: '',
    taxPercent: '',
  };
}

/** A number read from a field, with a fallback for an empty or broken value. */
function readNumber(raw: string | undefined, fallback: Decimal): Decimal {
  if (raw === undefined) return fallback;
  const parsed = parseAmountInput(raw);
  if (parsed === null) return fallback;
  return parsed;
}

const ZERO = new Decimal(0);

/** Turns a draft into the document it describes, with every total worked out. */
export function resolveDocument(draft: DocumentDraft, kind: DocumentKind): ResolvedDocument {
  const items: DocumentLineItem[] = draft.items.map((item) => ({
    id: item.id,
    description: item.description.trim(),
    quantity: readNumber(item.quantity, ZERO),
    unitPrice: readNumber(item.unitPrice, ZERO),
    discountPercent: readNumber(item.discountPercent, ZERO),
    taxPercent: readNumber(item.taxPercent, ZERO),
  }));

  const model: DocumentModel = {
    kind,
    title: DOCUMENT_TITLES[kind],
    number: draft.number.trim(),
    issueDate: draft.issueDate,
    dueDate: draft.dueDate,
    expiryDate: draft.expiryDate,
    transactionDate: draft.transactionDate,
    currency: draft.currency,
    taxLabel: draft.taxLabel,
    discountPercent: readNumber(draft.discountPercent, ZERO),
    business: {
      name: draft.businessName.trim(),
      address: draft.businessAddress,
      email: draft.businessEmail.trim(),
      phone: draft.businessPhone.trim(),
      website: draft.businessWebsite.trim(),
      taxId: draft.businessTaxId.trim(),
      taxIdLabel: draft.businessTaxIdLabel,
      logoDataUrl: draft.logoDataUrl,
    },
    customer: {
      name: draft.customerName.trim(),
      company: draft.customerCompany.trim(),
      address: draft.customerAddress,
      email: draft.customerEmail.trim(),
    },
    items,
    paymentTerms: draft.paymentTerms.trim(),
    notes: draft.notes.trim(),
    paymentDetails: draft.paymentDetails.trim(),
    paymentMethod: draft.paymentMethod,
    paymentStatus: draft.paymentStatus,
    amountPaid: readNumber(draft.amountPaid, ZERO),
    showFooterNote: draft.showFooterNote,
  };

  const totals = calculateDocumentTotals({
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      taxPercent: item.taxPercent,
    })),
    discountPercent: model.discountPercent,
    amountPaid: kind === 'receipt' ? model.amountPaid : 0,
  });

  return { model, totals };
}
