import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  DOCUMENT_TITLES,
  emptyLineItem,
  resolveDocument,
  type DocumentDraft,
  type DocumentKind,
} from '@/lib/generators/document';

function draft(overrides: Partial<DocumentDraft> = {}): DocumentDraft {
  return {
    businessName: 'Northwind Studio',
    businessAddress: '12 Mill Lane\nBristol',
    businessEmail: 'hello@northwind.test',
    businessPhone: '0117 000 0000',
    businessWebsite: 'northwind.test',
    businessTaxId: 'GB123456789',
    businessTaxIdLabel: 'VAT number',
    logoDataUrl: '',

    customerName: 'Alex Morgan',
    customerCompany: 'Bright Coffee',
    customerAddress: '4 Harbour Road\nBrighton',
    customerEmail: 'alex@brightcoffee.test',

    number: 'INV-0042',
    issueDate: '2026-11-16',
    dueDate: '2026-11-30',
    expiryDate: '2026-12-16',
    transactionDate: '2026-11-16',
    currency: 'GBP',
    taxLabel: 'VAT',
    discountPercent: '',

    paymentTerms: 'Due within 14 days',
    notes: 'Thank you for your business.',
    paymentDetails: 'Bank transfer, sort code 00-00-00',
    paymentMethod: 'Bank transfer',
    paymentStatus: 'pending',
    amountPaid: '',

    items: [
      {
        id: 'line-1',
        description: 'Brand identity',
        quantity: '1',
        unitPrice: '1200.00',
        discountPercent: '',
        taxPercent: '20',
      },
    ],
    showFooterNote: false,
    ...overrides,
  };
}

function resolve(kind: DocumentKind, overrides: Partial<DocumentDraft> = {}) {
  return resolveDocument(draft(overrides), kind);
}

describe('resolveDocument', () => {
  it('titles each kind of document', () => {
    expect(resolve('invoice').model.title).toBe('INVOICE');
    expect(resolve('quote').model.title).toBe('QUOTATION');
    expect(resolve('receipt').model.title).toBe('PAYMENT RECEIPT');
    expect(DOCUMENT_TITLES.invoice).toBe('INVOICE');
  });

  it('works the totals out from the draft', () => {
    const { totals } = resolve('invoice');

    expect(totals.subtotal.toFixed(2)).toBe('1200.00');
    expect(totals.taxTotal.toFixed(2)).toBe('240.00');
    expect(totals.total.toFixed(2)).toBe('1440.00');
  });

  it('reads a percentage discount on the document', () => {
    const { totals } = resolve('invoice', { discountPercent: '10' });

    expect(totals.documentDiscountTotal.toFixed(2)).toBe('120.00');
    expect(totals.netTotal.toFixed(2)).toBe('1080.00');
    expect(totals.taxTotal.toFixed(2)).toBe('216.00');
    expect(totals.total.toFixed(2)).toBe('1296.00');
  });

  it('reads an amount already paid on a receipt', () => {
    const { totals } = resolve('receipt', { amountPaid: '500.00' });

    expect(totals.amountPaid.toFixed(2)).toBe('500.00');
    expect(totals.amountDue.toFixed(2)).toBe('940.00');
  });

  it('does not count a payment towards an invoice', () => {
    const { totals } = resolve('invoice', { amountPaid: '500.00' });

    expect(totals.amountPaid.toFixed(2)).toBe('0.00');
    expect(totals.amountDue.toFixed(2)).toBe('1440.00');
  });

  it('treats an empty or broken number as nothing', () => {
    const { totals } = resolve('invoice', {
      items: [
        {
          id: 'line-1',
          description: 'Broken',
          quantity: '',
          unitPrice: 'not a number',
          discountPercent: '',
          taxPercent: '',
        },
      ],
    });

    expect(totals.subtotal.toFixed(2)).toBe('0.00');
    expect(totals.total.toFixed(2)).toBe('0.00');
  });

  it('trims the words it puts on the document', () => {
    const { model } = resolve('invoice', { businessName: '  Northwind Studio  ' });

    expect(model.business.name).toBe('Northwind Studio');
    expect(model.number).toBe('INV-0042');
  });

  it('keeps the address line breaks', () => {
    const { model } = resolve('invoice');

    expect(model.business.address).toBe('12 Mill Lane\nBristol');
  });

  it('reads a tax label and a tax id label', () => {
    const { model } = resolve('invoice');

    expect(model.taxLabel).toBe('VAT');
    expect(model.business.taxIdLabel).toBe('VAT number');
  });
});

describe('emptyLineItem', () => {
  it('starts with one unit and nothing else', () => {
    const item = emptyLineItem('line-1');

    expect(item.description).toBe('');
    expect(item.quantity).toBe('1');
    expect(item.unitPrice).toBe('');
    expect(item.id).toBe('line-1');
  });

  it('keeps the id the caller gave it', () => {
    expect(emptyLineItem('item-9').id).toBe('item-9');
  });
});

describe('totals with decimal quantities', () => {
  it('charges for a part of a unit', () => {
    const { totals } = resolve('invoice', {
      items: [
        {
          id: 'line-1',
          description: 'Design hours',
          quantity: '7.5',
          unitPrice: '95.50',
          discountPercent: '',
          taxPercent: '20',
        },
      ],
    });

    expect(totals.subtotal.toFixed(2)).toBe('716.25');
    expect(totals.taxTotal.toFixed(2)).toBe('143.25');
    expect(totals.total.toFixed(2)).toBe('859.50');
  });
});

describe('Decimal safety', () => {
  it('never adds a binary float error to a total', () => {
    const { totals } = resolve('invoice', {
      items: [
        {
          id: 'line-1',
          description: 'Tiny',
          quantity: '3',
          unitPrice: '0.10',
          discountPercent: '',
          taxPercent: '',
        },
      ],
    });

    expect(totals.subtotal.toFixed(2)).toBe('0.30');
    expect(totals.total.toFixed(2)).toBe('0.30');
    expect(totals.total).toBeInstanceOf(Decimal);
  });
});
