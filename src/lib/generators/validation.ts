import { getCountryConfig } from '@/lib/countries';
import type { TaxIdFormat } from '@/lib/countries/types';
import { isIsoDate } from '@/lib/formatting/date';
import { formatNumber } from '@/lib/formatting/number';
import { MAX_MONEY } from '@/lib/finance/money';
import { parseAmountInput } from '@/lib/validation/amount';
import { resolveDocument, crossBorderOptionFor, type DocumentDraft, type DocumentKind } from '@/lib/generators/document';

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
  | 'customerTaxId'
  | 'crossBorder'
  | 'crossBorderCustomerTaxId'
  | 'number'
  | 'issueDate'
  | 'dueDate'
  | 'supplyDate'
  | 'expiryDate'
  | 'transactionDate'
  | 'placeOfSupply'
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
  | `item.${string}.taxPercent`
  | `item.${string}.hsnCode`;

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
 * A lenient local format check for a registration number.
 *
 * The tool never calls a registry, so this catches a transposed digit or a
 * number pasted into the wrong field. It is not a verification that the
 * number is registered, and the hint under the field says so.
 */
function taxIdFormatError(format: TaxIdFormat, raw: string): string | undefined {
  if (format === 'none') return undefined;

  const value = raw.trim().toUpperCase();
  if (value === '') return undefined;

  if (format === 'gstin') {
    const compact = value.replace(/\s/g, '');
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(compact)
      ? undefined
      : 'Enter a 15 character GSTIN, for example 29ABCDE1234F1Z5.';
  }

  if (format === 'trn') {
    const digits = value.replace(/\s/g, '');
    return /^[0-9]{15}$/.test(digits) ? undefined : 'Enter a 15 digit TRN.';
  }

  if (format === 'de-vat') {
    const compact = value.replace(/[\s.]/g, '');
    return /^DE[0-9]{9}$/.test(compact)
      ? undefined
      : 'Enter a German VAT ID as DE followed by 9 digits, for example DE123456789.';
  }

  const compact = value.replace(/\s+/g, ' ');
  return /^CHE-?[0-9]{3}[. ]?[0-9]{3}[. ]?[0-9]{3} (MWST|TVA|IVA)$/.test(compact)
    ? undefined
    : 'Enter a Swiss MWST number as CHE-123.456.789 MWST.';
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

  const country = getCountryConfig(draft.country);
  const taxInvoiceOn =
    kind === 'invoice' && draft.taxInvoice && country.tax.supportsTaxInvoice;
  const customerTaxIdConfig = country.invoice.customerTaxId;
  const placeOfSupplyConfig = country.invoice.placeOfSupply;
  const hsnConfig = country.invoice.hsnCode;
  const crossBorder =
    kind === 'invoice' && (!country.tax.supportsTaxInvoice || taxInvoiceOn)
      ? crossBorderOptionFor(country, draft.crossBorder)
      : undefined;
  const crossBorderCustomerTaxIdRequired =
    crossBorder?.customerTaxIdRequired === true &&
    (draft.crossBorderCustomerTaxId ?? '').trim() === '';

  if (draft.businessName.trim() === '') {
    fail('businessName', 'Enter your business name.');
  }

  if (draft.businessEmail.trim() !== '' && !EMAIL.test(draft.businessEmail.trim())) {
    fail('businessEmail', 'Enter an email address in the form name@example.com.');
  }

  if (draft.customerName.trim() === '') {
    fail('customerName', 'Enter the customer name.');
  }

  if (draft.customerEmail.trim() !== '' && !EMAIL.test(draft.customerEmail.trim())) {
    fail('customerEmail', 'Enter an email address in the form name@example.com.');
  }

  if (customerTaxIdConfig) {
    const value = draft.customerTaxId.trim();

    if (taxInvoiceOn && customerTaxIdConfig.required && value === '') {
      fail('customerTaxId', `Enter the customer ${customerTaxIdConfig.label}.`);
    } else if (value !== '') {
      const formatError = taxIdFormatError(customerTaxIdConfig.format, value);
      if (formatError) fail('customerTaxId', formatError);
    }
  }

  if (draft.number.trim() === '') {
    fail('number', `Enter the ${numberLabel(kind)}.`);
  } else if (
    kind === 'invoice' &&
    country.invoice.numberMaxLength !== undefined &&
    draft.number.trim().length > country.invoice.numberMaxLength
  ) {
    fail(
      'number',
      `Keep the invoice number to ${country.invoice.numberMaxLength} characters or fewer.`,
    );
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
    } else if (isIsoDate(draft.issueDate) && draft.dueDate < draft.issueDate) {
      fail('dueDate', 'The due date must be on or after the issue date.');
    }
  }

  if (kind === 'quote') {
    if (draft.expiryDate.trim() === '') {
      fail('expiryDate', 'Enter the expiry date.');
    } else if (!isIsoDate(draft.expiryDate)) {
      fail('expiryDate', 'Enter the expiry date as a real date.');
    } else if (isIsoDate(draft.issueDate) && draft.expiryDate < draft.issueDate) {
      fail('expiryDate', 'The expiry date must be on or after the issue date.');
    }
  }

  if (draft.supplyDate.trim() !== '' && !isIsoDate(draft.supplyDate)) {
    fail('supplyDate', 'Enter the supply date as a real date.');
  }

  if (placeOfSupplyConfig && !crossBorder?.hidesPlaceOfSupply) {
    const value = draft.placeOfSupply.trim();

    if (taxInvoiceOn && placeOfSupplyConfig.required && value === '') {
      fail('placeOfSupply', 'Choose the place of supply.');
    } else if (
      value !== '' &&
      !placeOfSupplyConfig.options.some((option) => option.value === value)
    ) {
      fail('placeOfSupply', 'Choose a place of supply from the list.');
    }
  }

  /*
   * Country rules for a tax invoice.
   *
   * The requirements differ enough to matter: the UK needs the VAT number and
   * the customer address, Australia needs the ABN, and Canada needs its
   * registration number only once the total reaches $100 and the terms only
   * once it reaches $500. The total is taken from the same engine that prints
   * the sheet, so validation and paper never disagree.
   */
  if (kind === 'invoice') {
    if (country.tax.supplierAddressRequired && draft.businessAddress.trim() === '') {
      fail('businessAddress', 'Enter your business address.');
    }

    if (country.tax.customerAddressRequired && draft.customerAddress.trim() === '') {
      fail('customerAddress', 'Enter the customer address.');
    }

    if (country.tax.supplyDateField && draft.supplyDate.trim() === '') {
      fail('supplyDate', 'Enter the supply date.');
    }
  }

  if (crossBorderCustomerTaxIdRequired) {
    fail(
      'crossBorderCustomerTaxId',
      `${crossBorder?.customerTaxIdLabel ?? 'Customer tax number'} is required.`,
    );
  }

  /*
   * A registration number that every invoice must carry. Germany is the
   * market that needs this: §14(4) asks a Kleinunternehmer for a
   * Steuernummer even though the invoice carries no VAT. Other markets only
   * require the number in tax invoice mode.
   */
  const registrationRequiredOnThisInvoice =
    kind === 'invoice' &&
    country.tax.registrationRequired &&
    (taxInvoiceOn || country.tax.registrationRequiredOnAllInvoices);

  function registrationLabel(): string {
    return country.tax.registrationLabels.includes(draft.businessTaxIdLabel)
      ? draft.businessTaxIdLabel
      : country.tax.registrationLabel;
  }

  if (registrationRequiredOnThisInvoice && draft.businessTaxId.trim() === '') {
    fail('businessTaxId', `Enter your ${registrationLabel()}.`);
  }

  if (taxInvoiceOn) {
    const total = resolveDocument(draft, kind).totals.total;

    if (
      country.tax.registrationRequiredOver !== null &&
      total.greaterThanOrEqualTo(country.tax.registrationRequiredOver) &&
      draft.businessTaxId.trim() === ''
    ) {
      fail('businessTaxId', `Enter your ${registrationLabel()}.`);
    }

    if (
      country.tax.paymentTermsRequiredOver !== null &&
      total.greaterThanOrEqualTo(country.tax.paymentTermsRequiredOver) &&
      draft.paymentTerms.trim() === ''
    ) {
      fail('paymentTerms', 'Enter the terms of payment.');
    }
  }

  if (draft.businessTaxId.trim() !== '') {
    /*
     * Germany accepts either a USt-IdNr. in the DE123456789 form or a
     * Steuernummer issued by the local tax office. The strict format check
     * belongs to the USt-IdNr. only; a Steuernummer chosen from the label
     * selector is checked leniently (not at all) rather than rejected.
     */
    const usesUstId =
      country.tax.registrationLabels.length === 1 ||
      draft.businessTaxIdLabel === country.tax.registrationLabel;
    const format = usesUstId ? country.tax.registrationFormat : 'none';
    const formatError = taxIdFormatError(format, draft.businessTaxId);
    if (formatError) fail('businessTaxId', formatError);
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

    if (hsnConfig) {
      const code = item.hsnCode.trim();

      if (code === '') {
        if (taxInvoiceOn && hsnConfig.requiredOnTaxInvoice) {
          fail(itemFieldKey(item.id, 'hsnCode'), `Enter the ${hsnConfig.label} code.`);
        }
      } else if (!/^\d{2,8}$/.test(code)) {
        fail(itemFieldKey(item.id, 'hsnCode'), `Enter the ${hsnConfig.label} as 2 to 8 digits.`);
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
  customerTaxId: 'Customer tax or registration number',
  crossBorder: 'Cross-border treatment',
  crossBorderCustomerTaxId: 'Customer tax number for the cross-border supply',
  number: 'Number',
  issueDate: 'Issue date',
  dueDate: 'Due date',
  supplyDate: 'Supply date',
  expiryDate: 'Expiry date',
  transactionDate: 'Transaction date',
  placeOfSupply: 'Place of supply',
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
      hsnCode: 'HSN/SAC code',
    };
    return (field && labels[field]) || 'Line item';
  }

  return FIELD_LABELS[key] ?? capitalise(key);
}
