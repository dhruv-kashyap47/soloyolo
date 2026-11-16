import { isIsoDate } from '@/lib/formatting/date';
import { formatNumber } from '@/lib/formatting/number';
import { MAX_MONEY } from '@/lib/finance/money';
import { parseAmountInput } from '@/lib/validation/amount';
import type { DocumentDraft, DocumentKind } from '@/lib/generators/document';

/**
 * Form validation for the generators.
 *
 * The rules are hand written rather than schema driven, for the same reason
 * the calculators do it this way: Zod stays in the build, and the browser
 * gets a small hand written parser it can run on every keystroke.
 *
 * The messages follow the house style used by the calculators:
 *
 * - `Enter your <label>.`
 * - `Enter <label> as a number, for example 80000.`
 * - `<Label> cannot be negative.`
 * - `<Label> must be between X and Y.`
 */

/** A field of the draft, or a field of one line item. */
export type DocumentFieldKey =
  | 'businessName'
  | 'businessAddress'
  | 'businessEmail'
  | 'businessPhone'
  | 'businessWebsite'
  | 'businessTaxId'
  | 'customerName'
  | 'customerCompany'
  | 'customerAddress'
  | 'customerEmail'
  | 'number'
  | 'issueDate'
  | 'dueDate'
  | 'expiryDate'
  | 'transactionDate'
  | 'discountPercent'
  | 'amountPaid'
  | 'paymentTerms'
  | 'notes'
  | 'paymentDetails'
  | 'items'
  | `item.${string}.description`
  | `item.${string}.quantity`
  | `item.${string}.unitPrice`
  | `item.${string}.discountPercent`
  | `item.${string}.taxPercent`;

export type DocumentErrors = Partial<Record<DocumentFieldKey, string>>;

/** The key of one line item field, used by the error summary and the focus map. */
export function itemFieldKey(itemId: string, field: string): DocumentFieldKey {
  return `item.${itemId}.${field}` as DocumentFieldKey;
}

export interface DocumentValidation {
  ok: boolean;
  errors: DocumentErrors;
  /** The fields that are wrong, in the order they appear in the form. */
  invalidFields: DocumentFieldKey[];
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The most units a single line can carry. A quantity is a count or a number
 * of hours; beyond this it is a typo, and a total that large is not a
 * document anyone means to send.
 */
const MAX_QUANTITY = 1_000_000;

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The words a document uses for its number, which differ by kind. */
function numberLabel(kind: DocumentKind): string {
  if (kind === 'quote') return 'quote number';
  if (kind === 'receipt') return 'receipt number';
  return 'invoice number';
}

/**
 * Checks a draft.
 *
 * The result lists every problem, not just the first one, so the error
 * summary can show the visitor everything that needs attention in one go.
 */
export function validateDocumentDraft(
  draft: DocumentDraft,
  kind: DocumentKind,
): DocumentValidation {
  const errors: DocumentErrors = {};
  const invalidFields: DocumentFieldKey[] = [];

  function fail(field: DocumentFieldKey, message: string) {
    if (!errors[field]) {
      errors[field] = message;
      invalidFields.push(field);
    }
  }

  if (draft.businessName.trim() === '') {
    fail('businessName', 'Enter your business name.');
  }

  if (draft.businessEmail.trim() !== '' && !EMAIL.test(draft.businessEmail.trim())) {
    fail('businessEmail', 'Enter an email address in the form name@example.com.');
  }

  if (draft.customerName.trim() === '') {
    fail('customerName', 'Enter the customer name.');
  }

  if (draft.number.trim() === '') {
    fail('number', `Enter the ${numberLabel(kind)}.`);
  }

  if (kind === 'receipt') {
    if (draft.transactionDate.trim() === '') {
      fail('transactionDate', 'Enter the transaction date.');
    } else if (!isIsoDate(draft.transactionDate)) {
      fail('transactionDate', 'Enter the transaction date as a real date.');
    }
  } else {
    if (draft.issueDate.trim() === '') {
      fail('issueDate', 'Enter the issue date.');
    } else if (!isIsoDate(draft.issueDate)) {
      fail('issueDate', 'Enter the issue date as a real date.');
    }
  }

  if (kind === 'invoice') {
    if (draft.dueDate.trim() === '') {
      fail('dueDate', 'Enter the due date.');
    } else if (!isIsoDate(draft.dueDate)) {
      fail('dueDate', 'Enter the due date as a real date.');
    }
  }

  if (kind === 'quote') {
    if (draft.expiryDate.trim() === '') {
      fail('expiryDate', 'Enter the expiry date.');
    } else if (!isIsoDate(draft.expiryDate)) {
      fail('expiryDate', 'Enter the expiry date as a real date.');
    }
  }

  if (draft.discountPercent.trim() !== '') {
    const discount = parseAmountInput(draft.discountPercent);
    if (discount === null) {
      fail('discountPercent', 'Enter the discount as a number, for example 10.');
    } else if (discount.isNegative()) {
      fail('discountPercent', 'Discount cannot be negative.');
    } else if (discount.greaterThan(100)) {
      fail('discountPercent', 'Discount must be between 0 and 100.');
    }
  }

  if (kind === 'receipt' && draft.amountPaid.trim() !== '') {
    const paid = parseAmountInput(draft.amountPaid);
    if (paid === null) {
      fail('amountPaid', 'Enter the amount paid as a number, for example 500.');
    } else if (paid.isNegative()) {
      fail('amountPaid', 'Amount paid cannot be negative.');
    }
  }

  const described = draft.items.filter((item) => item.description.trim() !== '');

  if (described.length === 0) {
    fail('items', 'Add at least one line item with a description.');
  }

  for (const item of draft.items) {
    if (item.description.trim() === '') continue;

    if (item.quantity.trim() === '') {
      fail(itemFieldKey(item.id, 'quantity'), 'Enter the quantity.');
    } else {
      const quantity = parseAmountInput(item.quantity);
      if (quantity === null) {
        fail(itemFieldKey(item.id, 'quantity'), 'Enter the quantity as a number, for example 1.');
      } else if (quantity.lessThanOrEqualTo(0)) {
        fail(itemFieldKey(item.id, 'quantity'), 'Quantity must be greater than zero.');
      } else if (quantity.greaterThan(MAX_QUANTITY)) {
        fail(
          itemFieldKey(item.id, 'quantity'),
          `Quantity must be ${formatNumber(MAX_QUANTITY)} or less.`,
        );
      }
    }

    if (item.unitPrice.trim() === '') {
      fail(itemFieldKey(item.id, 'unitPrice'), 'Enter the unit price.');
    } else {
      const price = parseAmountInput(item.unitPrice);
      if (price === null) {
        fail(
          itemFieldKey(item.id, 'unitPrice'),
          'Enter the unit price as a number, for example 1200.',
        );
      } else if (price.isNegative()) {
        fail(itemFieldKey(item.id, 'unitPrice'), 'Unit price cannot be negative.');
      } else if (price.greaterThan(MAX_MONEY)) {
        fail(
          itemFieldKey(item.id, 'unitPrice'),
          `Enter the unit price below ${formatNumber(MAX_MONEY)}.`,
        );
      }
    }

    if (item.discountPercent.trim() !== '') {
      const discount = parseAmountInput(item.discountPercent);
      if (discount === null) {
        fail(
          itemFieldKey(item.id, 'discountPercent'),
          'Enter the discount as a number, for example 10.',
        );
      } else if (discount.isNegative() || discount.greaterThan(100)) {
        fail(itemFieldKey(item.id, 'discountPercent'), 'Discount must be between 0 and 100.');
      }
    }

    if (item.taxPercent.trim() !== '') {
      const tax = parseAmountInput(item.taxPercent);
      if (tax === null) {
        fail(
          itemFieldKey(item.id, 'taxPercent'),
          'Enter the tax rate as a number, for example 20.',
        );
      } else if (tax.isNegative() || tax.greaterThan(100)) {
        fail(itemFieldKey(item.id, 'taxPercent'), 'Tax rate must be between 0 and 100.');
      }
    }
  }

  return { ok: invalidFields.length === 0, errors, invalidFields };
}

/** The words a field is called in the error summary. */
export const FIELD_LABELS: Record<string, string> = {
  businessName: 'Business name',
  businessAddress: 'Business address',
  businessEmail: 'Business email',
  businessPhone: 'Business phone',
  businessWebsite: 'Business website',
  businessTaxId: 'Tax or registration number',
  customerName: 'Customer name',
  customerCompany: 'Customer company',
  customerAddress: 'Customer address',
  customerEmail: 'Customer email',
  number: 'Number',
  issueDate: 'Issue date',
  dueDate: 'Due date',
  expiryDate: 'Expiry date',
  transactionDate: 'Transaction date',
  discountPercent: 'Discount',
  amountPaid: 'Amount paid',
  paymentTerms: 'Payment terms',
  notes: 'Notes',
  paymentDetails: 'Payment details',
  items: 'Line items',
};

/** The words a line item field is called in the error summary. */
export function fieldLabel(key: DocumentFieldKey): string {
  if (key.startsWith('item.')) {
    const [, , field] = key.split('.');
    const labels: Record<string, string> = {
      description: 'Line item description',
      quantity: 'Quantity',
      unitPrice: 'Unit price',
      discountPercent: 'Line discount',
      taxPercent: 'Tax rate',
    };
    return (field && labels[field]) || 'Line item';
  }

  return FIELD_LABELS[key] ?? capitalise(key);
}
