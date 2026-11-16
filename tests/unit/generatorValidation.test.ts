import { describe, expect, it } from 'vitest';

import type { DocumentDraft, DocumentKind } from '@/lib/generators/document';
import { validateDocumentDraft, fieldLabel, itemFieldKey } from '@/lib/generators/validation';

function draft(overrides: Partial<DocumentDraft> = {}): DocumentDraft {
  return {
    businessName: 'Northwind Studio',
    businessAddress: '12 Mill Lane\nBristol',
    businessEmail: 'hello@northwind.test',
    businessPhone: '',
    businessWebsite: '',
    businessTaxId: '',
    businessTaxIdLabel: 'Tax ID',
    logoDataUrl: '',

    customerName: 'Alex Morgan',
    customerCompany: '',
    customerAddress: '',
    customerEmail: '',

    number: 'INV-0042',
    issueDate: '2026-11-16',
    dueDate: '2026-11-30',
    expiryDate: '2026-12-16',
    transactionDate: '2026-11-16',
    currency: 'GBP',
    taxLabel: 'VAT',
    discountPercent: '',

    paymentTerms: '',
    notes: '',
    paymentDetails: '',
    paymentMethod: 'Bank transfer',
    paymentStatus: 'pending',
    amountPaid: '',

    items: [
      {
        id: 'line-1',
        description: 'Brand identity',
        quantity: '1',
        unitPrice: '1200',
        discountPercent: '',
        taxPercent: '20',
      },
    ],
    showFooterNote: false,
    ...overrides,
  };
}

function validate(kind: DocumentKind, overrides: Partial<DocumentDraft> = {}) {
  return validateDocumentDraft(draft(overrides), kind);
}

describe('validateDocumentDraft', () => {
  it('accepts a complete invoice', () => {
    const result = validate('invoice');

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.invalidFields).toEqual([]);
  });

  it('accepts a complete quote and a complete receipt', () => {
    expect(validate('quote').ok).toBe(true);
    expect(validate('receipt').ok).toBe(true);
  });

  it('asks for the business name and the customer name', () => {
    const result = validate('invoice', { businessName: '', customerName: '' });

    expect(result.ok).toBe(false);
    expect(result.errors.businessName).toBe('Enter your business name.');
    expect(result.errors.customerName).toBe('Enter the customer name.');
  });

  it('names the number in the words of the document', () => {
    expect(validate('invoice', { number: '' }).errors.number).toBe('Enter the invoice number.');
    expect(validate('quote', { number: '' }).errors.number).toBe('Enter the quote number.');
    expect(validate('receipt', { number: '' }).errors.number).toBe('Enter the receipt number.');
  });

  it('checks the dates each document needs', () => {
    expect(validate('invoice', { dueDate: '' }).errors.dueDate).toBe('Enter the due date.');
    expect(validate('quote', { expiryDate: '' }).errors.expiryDate).toBe('Enter the expiry date.');
    expect(validate('receipt', { transactionDate: '' }).errors.transactionDate).toBe(
      'Enter the transaction date.',
    );
  });

  it('rejects a date that is not a real day', () => {
    expect(validate('invoice', { issueDate: '2026-02-30' }).errors.issueDate).toBe(
      'Enter the issue date as a real date.',
    );
  });

  it('does not ask an invoice for a quote date', () => {
    const result = validate('invoice', { expiryDate: '' });

    expect(result.errors.expiryDate).toBeUndefined();
  });

  it('checks an email address that does not look like one', () => {
    expect(validate('invoice', { businessEmail: 'hello@northwind' }).errors.businessEmail).toBe(
      'Enter an email address in the form name@example.com.',
    );
    expect(validate('invoice', { businessEmail: '' }).errors.businessEmail).toBeUndefined();
  });

  it('needs at least one line item with a description', () => {
    const result = validate('invoice', {
      items: [
        {
          id: 'line-1',
          description: '  ',
          quantity: '1',
          unitPrice: '10',
          discountPercent: '',
          taxPercent: '',
        },
      ],
    });

    expect(result.errors.items).toBe('Add at least one line item with a description.');
  });

  it('checks the numbers on a line item', () => {
    const result = validate('invoice', {
      items: [
        {
          id: 'line-1',
          description: 'Work',
          quantity: '0',
          unitPrice: 'abc',
          discountPercent: '200',
          taxPercent: '-1',
        },
      ],
    });

    expect(result.errors[itemFieldKey('line-1', 'quantity')]).toBe(
      'Quantity must be greater than zero.',
    );
    expect(result.errors[itemFieldKey('line-1', 'unitPrice')]).toBe(
      'Enter the unit price as a number, for example 1200.',
    );
    expect(result.errors[itemFieldKey('line-1', 'discountPercent')]).toBe(
      'Discount must be between 0 and 100.',
    );
    expect(result.errors[itemFieldKey('line-1', 'taxPercent')]).toBe(
      'Tax rate must be between 0 and 100.',
    );
  });

  it('leaves a blank optional field alone', () => {
    const result = validate('invoice', {
      items: [
        {
          id: 'line-1',
          description: 'Work',
          quantity: '1',
          unitPrice: '10',
          discountPercent: '',
          taxPercent: '',
        },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it('refuses a quantity or a price past the supported maximum', () => {
    const result = validate('invoice', {
      items: [
        {
          id: 'line-1',
          description: 'Work',
          quantity: '2000000',
          unitPrice: '2000000000',
          discountPercent: '',
          taxPercent: '',
        },
      ],
    });

    expect(result.errors[itemFieldKey('line-1', 'quantity')]).toBe(
      'Quantity must be 1,000,000 or less.',
    );
    expect(result.errors[itemFieldKey('line-1', 'unitPrice')]).toBe(
      'Enter the unit price below 1,000,000,000.',
    );
  });

  it('accepts a quantity and a price exactly on the maximum', () => {
    const result = validate('invoice', {
      items: [
        {
          id: 'line-1',
          description: 'Work',
          quantity: '1000000',
          unitPrice: '1000000000',
          discountPercent: '',
          taxPercent: '',
        },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it('checks a discount on the whole document', () => {
    expect(validate('invoice', { discountPercent: '150' }).errors.discountPercent).toBe(
      'Discount must be between 0 and 100.',
    );
    expect(validate('invoice', { discountPercent: '-5' }).errors.discountPercent).toBe(
      'Discount cannot be negative.',
    );
  });

  it('checks the amount received on a receipt', () => {
    expect(validate('receipt', { amountPaid: '-5' }).errors.amountPaid).toBe(
      'Amount paid cannot be negative.',
    );
  });

  it('lists every problem in the order the form shows them', () => {
    const result = validate('invoice', { businessName: '', customerName: '', number: '' });

    expect(result.invalidFields).toEqual(['businessName', 'customerName', 'number']);
  });
});

describe('fieldLabel', () => {
  it('names the plain fields', () => {
    expect(fieldLabel('businessName')).toBe('Business name');
    expect(fieldLabel('dueDate')).toBe('Due date');
  });

  it('names the line item fields', () => {
    expect(fieldLabel(itemFieldKey('line-1', 'unitPrice'))).toBe('Unit price');
    expect(fieldLabel(itemFieldKey('line-1', 'taxPercent'))).toBe('Tax rate');
  });
});
