import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  canAddLineItem,
  DOCUMENT_TITLES,
  emptyLineItem,
  MAX_LINE_ITEMS,
  resolveDocument,
  type DocumentDraft,
  type DocumentKind,
} from '@/lib/generators/document';

function draft(overrides: Partial<DocumentDraft> = {}): DocumentDraft {
  return {
    country: 'UK',
    taxInvoice: false,

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
    customerTaxId: '',
    customerTaxIdLabel: 'Tax ID',

    number: 'INV-0042',
    issueDate: '2026-11-16',
    dueDate: '2026-11-30',
    supplyDate: '',
    expiryDate: '2026-12-16',
    transactionDate: '2026-11-16',
    currency: 'GBP',
    taxLabel: 'VAT',
    placeOfSupply: '',
    taxSplitMode: '',
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
        hsnCode: '',
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

  it('takes the invoice title from the country and the tax invoice switch', () => {
    expect(resolve('invoice', { country: 'UK', taxInvoice: true }).model.title).toBe('VAT INVOICE');
    expect(resolve('invoice', { country: 'AU', taxInvoice: true }).model.title).toBe('TAX INVOICE');
    expect(resolve('invoice', { country: 'CA', taxInvoice: true }).model.title).toBe('INVOICE');
    expect(resolve('invoice', { country: 'US', taxInvoice: true }).model.title).toBe('INVOICE');
    expect(resolve('invoice', { country: 'DE', taxInvoice: false }).model.title).toBe('RECHNUNG');
    expect(resolve('invoice', { country: 'DE', taxInvoice: true }).model.title).toBe('RECHNUNG');
    expect(resolve('invoice', { country: 'CH', taxInvoice: true }).model.title).toBe('INVOICE');
    expect(resolve('invoice', { country: 'IN', taxInvoice: true }).model.title).toBe('TAX INVOICE');
    expect(resolve('invoice', { country: 'AE', taxInvoice: true }).model.title).toBe('TAX INVOICE');
    expect(resolve('quote', { country: 'UK', taxInvoice: true }).model.title).toBe('QUOTATION');
    expect(resolve('receipt', { country: 'AU', taxInvoice: true }).model.title).toBe(
      'PAYMENT RECEIPT',
    );
  });

  it('resolves the place of supply to the words on the sheet', () => {
    const { model } = resolve('invoice', {
      country: 'IN',
      taxInvoice: true,
      placeOfSupply: '29',
    });

    expect(model.placeOfSupply).toBe('29 - Karnataka');
    expect(model.taxSplitMode).toBe('cgst-sgst');
  });

  it('clears a place of supply or split a market does not offer', () => {
    const { model } = resolve('invoice', {
      country: 'UK',
      placeOfSupply: '29',
      taxSplitMode: 'igst',
    });

    expect(model.placeOfSupply).toBe('');
    expect(model.taxSplitMode).toBe('');
  });

  it('carries the customer tax ID only where the market asks for one', () => {
    const india = resolve('invoice', {
      country: 'IN',
      taxInvoice: true,
      customerTaxId: '29AAACB1234C1Z8',
    });
    const uk = resolve('invoice', {
      country: 'UK',
      customerTaxId: '29AAACB1234C1Z8',
    });

    expect(india.model.customer.taxId).toBe('29AAACB1234C1Z8');
    expect(india.model.customer.taxIdLabel).toBe('GSTIN');
    expect(uk.model.customer.taxId).toBe('');
  });

  it('keeps invoice-only fields off a quote and a receipt', () => {
    const quote = resolve('quote', {
      country: 'IN',
      taxInvoice: true,
      placeOfSupply: '29',
      taxSplitMode: 'igst',
      customerTaxId: '29AAACB1234C1Z8',
      items: [
        {
          id: 'line-1',
          description: 'Scope',
          quantity: '1',
          unitPrice: '1000',
          discountPercent: '',
          taxPercent: '18',
          hsnCode: '998221',
        },
      ],
    });

    expect(quote.model.placeOfSupply).toBe('');
    expect(quote.model.taxSplitMode).toBe('');
    expect(quote.model.customer.taxId).toBe('');
    expect(quote.model.items[0]?.hsnCode).toBe('');
    expect(quote.totals.lines[0]?.hsnCode).toBe('');
  });

  it('carries an HSN code onto the line and into the totals', () => {
    const { model, totals } = resolve('invoice', {
      country: 'IN',
      taxInvoice: true,
      items: [
        {
          id: 'line-1',
          description: 'GST advisory',
          quantity: '1',
          unitPrice: '60000',
          discountPercent: '',
          taxPercent: '18',
          hsnCode: '998221',
        },
      ],
    });

    expect(model.items[0]?.hsnCode).toBe('998221');
    expect(totals.lines[0]?.hsnCode).toBe('998221');
  });

  it('does not carry an HSN code into a market without the field', () => {
    const { model } = resolve('invoice', {
      country: 'UK',
      items: [
        {
          id: 'line-1',
          description: 'Brand identity',
          quantity: '1',
          unitPrice: '1200',
          discountPercent: '',
          taxPercent: '20',
          hsnCode: '998221',
        },
      ],
    });

    expect(model.items[0]?.hsnCode).toBe('');
  });

  it('carries the supply date onto the model', () => {
    const { model } = resolve('invoice', { supplyDate: '2026-11-10' });

    expect(model.supplyDate).toBe('2026-11-10');
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
          hsnCode: '',
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
          hsnCode: '',
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
          hsnCode: '',
        },
      ],
    });

    expect(totals.subtotal.toFixed(2)).toBe('0.30');
    expect(totals.total.toFixed(2)).toBe('0.30');
    expect(totals.total).toBeInstanceOf(Decimal);
  });
});

describe('cross-border treatments', () => {
  it('removes German VAT and prints the reverse-charge sentence', () => {
    const { model, totals } = resolve('invoice', {
      country: 'DE',
      taxInvoice: true,
      crossBorder: 'eu-reverse-charge',
      crossBorderCustomerTaxId: 'FR12345678901',
    });

    expect(model.crossBorderEndorsement).toMatch(/3a Abs. 2 UStG/);
    expect(model.crossBorderEndorsement).toMatch(/Steuerschuldnerschaft/);
    expect(model.crossBorderEndorsement).toMatch(/Reverse Charge/);
    expect(model.crossBorderCustomerTaxId).toBe('FR12345678901');
    expect(model.crossBorderCustomerTaxIdLabel).toBe('USt-IdNr.');
    expect(totals.taxTotal.toFixed(2)).toBe('0.00');
    expect(totals.total.toFixed(2)).toBe('1200.00');
  });

  it('leaves a domestic German invoice alone', () => {
    const { model, totals } = resolve('invoice', {
      country: 'DE',
      taxLabel: 'MwSt',
      items: [
        {
          id: 'line-1',
          description: 'Brand identity',
          quantity: '1',
          unitPrice: '1200.00',
          discountPercent: '',
          taxPercent: '19',
          hsnCode: '',
        },
      ],
    });

    expect(model.crossBorderEndorsement).toBe('');
    expect(totals.taxTotal.toFixed(2)).toBe('228.00');
  });

  it('ignores a treatment the market does not offer', () => {
    const { model, totals } = resolve('invoice', {
      country: 'UK',
      taxInvoice: true,
      crossBorder: 'eu-reverse-charge',
      crossBorderCustomerTaxId: 'FR12345678901',
    });

    expect(model.crossBorderEndorsement).toBe('');
    expect(model.crossBorderCustomerTaxId).toBe('');
    expect(totals.taxTotal.toFixed(2)).toBe('240.00');
  });

  it('drops the place of supply on an Indian export under LUT', () => {
    const { model, totals } = resolve('invoice', {
      country: 'IN',
      taxInvoice: true,
      taxLabel: 'GST',
      placeOfSupply: '29',
      taxSplitMode: 'cgst-sgst',
      crossBorder: 'export-lut',
    });

    expect(model.placeOfSupply).toBe('');
    expect(model.taxSplitMode).toBe('');
    expect(model.crossBorderEndorsement).toMatch(/WITHOUT PAYMENT OF INTEGRATED TAX/);
    expect(totals.taxTotal.toFixed(2)).toBe('0.00');
  });

  it('only applies the treatment to an invoice', () => {
    const { model } = resolve('quote', {
      country: 'DE',
      taxInvoice: true,
      crossBorder: 'eu-reverse-charge',
    });

    expect(model.crossBorderEndorsement).toBe('');
  });

  it('ignores the treatment until tax invoice mode is on', () => {
    const { model, totals } = resolve('invoice', {
      country: 'DE',
      taxInvoice: false,
      crossBorder: 'eu-reverse-charge',
      crossBorderCustomerTaxId: 'FR12345678901',
    });

    expect(model.title).toBe('RECHNUNG');
    expect(model.crossBorderEndorsement).toBe('');
    expect(model.crossBorderCustomerTaxId).toBe('');
    expect(totals.taxTotal.toFixed(2)).toBe('240.00');
  });
});

describe('the line item limit', () => {
  it('allows another line below the limit and refuses one at it', () => {
    const below = Array.from({ length: MAX_LINE_ITEMS - 1 }, (_, index) =>
      emptyLineItem(`line-${index + 1}`),
    );
    const at = [...below, emptyLineItem(`line-${MAX_LINE_ITEMS}`)];

    expect(canAddLineItem(below)).toBe(true);
    expect(canAddLineItem(at)).toBe(false);
  });
});
