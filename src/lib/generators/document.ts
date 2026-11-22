import Decimal from 'decimal.js';

import { getCountryConfig, type CountryCode, type CountryConfig } from '@/lib/countries';
import type { CountryCrossBorderOption } from '@/lib/countries/types';
import type { CurrencyCode } from '@/lib/formatting/currency';
import type { TaxSplitMode } from '@/lib/generators/taxSplit';
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
export const TAX_LABELS = [
  'Tax',
  'VAT',
  'GST',
  'HST',
  'Sales tax',
  'MwSt',
  'MWST',
  'TVA',
  'IVA',
] as const;
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
  'VAT ID',
  'Tax number',
  'MWST number',
  'GSTIN',
  'TRN',
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
  /** The Indian HSN or SAC code, printed under the description. */
  hsnCode: string;
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
  /** The customer's GSTIN or TRN where the market asks for it. */
  taxId: string;
  taxIdLabel: TaxIdLabel;
}

/** The document itself, with every figure already a Decimal. */
export interface DocumentModel {
  kind: DocumentKind;
  title: string;
  country: CountryCode;
  taxInvoice: boolean;
  number: string;
  issueDate: string;
  dueDate: string;
  supplyDate: string;
  expiryDate: string;
  transactionDate: string;
  currency: CurrencyCode;
  taxLabel: TaxLabel;
  /** The resolved place of supply, ready to print. */
  placeOfSupply: string;
  /** How the tax total is displayed: the Indian GST split, or empty. */
  taxSplitMode: TaxSplitMode | '';
  /** The cross-border sentence printed on the document, or empty. */
  crossBorderEndorsement: string;
  /** The customer tax number for a cross-border supply, or empty. */
  crossBorderCustomerTaxId: string;
  /** The words printed in front of that number. */
  crossBorderCustomerTaxIdLabel: string;
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
  hsnCode: string;
}

export interface DocumentDraft {
  country: CountryCode;
  taxInvoice: boolean;

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
  customerTaxId: string;
  customerTaxIdLabel: TaxIdLabel;

  number: string;
  issueDate: string;
  dueDate: string;
  supplyDate: string;
  expiryDate: string;
  transactionDate: string;
  currency: CurrencyCode;
  taxLabel: TaxLabel;
  placeOfSupply: string;
  taxSplitMode: TaxSplitMode | '';
  /**
   * The cross-border treatment id, or empty for a domestic supply.
   *
   * Optional so a draft stored before this control existed still resolves,
   * and so a country config without a cross-border block needs no change.
   */
  crossBorder?: string;
  /** The customer tax number for a cross-border supply. */
  crossBorderCustomerTaxId?: string;
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
export function emptyLineItem(id: string, taxPercent = ''): LineItemDraft {
  return {
    id,
    description: '',
    quantity: '1',
    unitPrice: '',
    discountPercent: '',
    taxPercent,
    hsnCode: '',
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

/**
 * The title printed at the top of the sheet.
 *
 * A quote and a receipt use their own fixed title. An invoice takes its title
 * from the country and the tax invoice switch: Germany prints RECHNUNG, the
 * UK prints VAT INVOICE, India and the UAE print TAX INVOICE in tax invoice
 * mode, and Switzerland, Canada and the US keep INVOICE.
 */
export function documentTitle(
  kind: DocumentKind,
  country: CountryConfig,
  taxInvoice: boolean,
): string {
  if (kind === 'quote') return DOCUMENT_TITLES.quote;
  if (kind === 'receipt') return DOCUMENT_TITLES.receipt;
  if (taxInvoice && country.tax.supportsTaxInvoice) return country.tax.taxInvoiceTitle;
  return country.invoice.documentTitle;
}

/** The place of supply the visitor chose, as the words the sheet prints. */
function resolvePlaceOfSupply(draft: DocumentDraft, country: CountryConfig): string {
  const config = country.invoice.placeOfSupply;
  if (!config) return '';
  return config.options.find((option) => option.value === draft.placeOfSupply)?.label ?? '';
}

/** The GST split the document uses, ignoring a mode the market does not offer. */
function resolveTaxSplitMode(draft: DocumentDraft, country: CountryConfig): TaxSplitMode | '' {
  const config = country.invoice.taxSplit;
  if (!config) return '';
  const mode = config.modes.find((entry) => entry.id === draft.taxSplitMode);
  return mode?.id ?? config.default;
}

/**
 * The cross-border treatment the visitor chose, or undefined.
 *
 * Only an option the market actually offers counts, so a stale or tampered
 * value cannot print wording that market never agreed to.
 */
export function crossBorderOptionFor(
  country: CountryConfig,
  value: string | undefined,
): CountryCrossBorderOption | undefined {
  if (!value) return undefined;
  return country.invoice.crossBorder?.find((option) => option.value === value);
}

/** Turns a draft into the document it describes, with every total worked out. */
export function resolveDocument(draft: DocumentDraft, kind: DocumentKind): ResolvedDocument {
  const country = getCountryConfig(draft.country);
  const taxInvoice = kind === 'invoice' && draft.taxInvoice && country.tax.supportsTaxInvoice;
  const invoice = kind === 'invoice';
  const customerTaxIdConfig = country.invoice.customerTaxId;
  const hsnConfig = country.invoice.hsnCode;
  const crossBorder = invoice ? crossBorderOptionFor(country, draft.crossBorder) : undefined;
  const crossBorderZeroRated = crossBorder?.zeroRated ?? false;

  const items: DocumentLineItem[] = draft.items.map((item) => ({
    id: item.id,
    description: item.description.trim(),
    quantity: readNumber(item.quantity, ZERO),
    unitPrice: readNumber(item.unitPrice, ZERO),
    discountPercent: readNumber(item.discountPercent, ZERO),
    taxPercent: crossBorderZeroRated ? ZERO : readNumber(item.taxPercent, ZERO),
    hsnCode: invoice && hsnConfig ? item.hsnCode.trim() : '',
  }));

  const model: DocumentModel = {
    kind,
    title: documentTitle(kind, country, taxInvoice),
    country: draft.country,
    taxInvoice,
    number: draft.number.trim(),
    issueDate: draft.issueDate,
    dueDate: draft.dueDate,
    supplyDate: draft.supplyDate,
    expiryDate: draft.expiryDate,
    transactionDate: draft.transactionDate,
    currency: draft.currency,
    taxLabel: draft.taxLabel,
    placeOfSupply:
      invoice && !crossBorder?.hidesPlaceOfSupply ? resolvePlaceOfSupply(draft, country) : '',
    taxSplitMode:
      invoice && !crossBorder?.hidesPlaceOfSupply ? resolveTaxSplitMode(draft, country) : '',
    crossBorderEndorsement: crossBorder?.endorsement ?? '',
    crossBorderCustomerTaxId: crossBorder ? (draft.crossBorderCustomerTaxId ?? '').trim() : '',
    crossBorderCustomerTaxIdLabel: crossBorder?.customerTaxIdPrintedLabel ?? 'Tax ID',
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
      taxId: invoice && customerTaxIdConfig ? draft.customerTaxId.trim() : '',
      taxIdLabel: customerTaxIdConfig?.label ?? 'Tax ID',
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
      hsnCode: item.hsnCode,
    })),
    discountPercent: model.discountPercent,
    amountPaid: kind === 'receipt' ? model.amountPaid : 0,
  });

  /*
   * A receipt with no amount entered means "paid in full": that is what the
   * field hint promises. Counting it as zero produced a contradictory sheet
   * that said PAID and still asked for the balance.
   */
  if (kind === 'receipt' && draft.amountPaid.trim() === '' && draft.paymentStatus === 'paid') {
    totals.amountPaid = totals.total;
    totals.amountDue = new Decimal(0);
    model.amountPaid = totals.total;
  }

  return { model, totals };
}
