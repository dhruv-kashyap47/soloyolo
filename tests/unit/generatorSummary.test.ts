import { describe, expect, it } from 'vitest';

import { formatCurrency } from '@/lib/formatting/currency';
import {
  resolveDocument,
  type DocumentDraft,
  type DocumentKind,
} from '@/lib/generators/document';
import { documentSummary } from '@/lib/generators/summary';

/**
 * The plain-text copy of a document is a second way to send it, so every
 * block the sheet prints has to appear here too. These tests walk each kind
 * of document and each optional block.
 */

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

function text(kind: DocumentKind, overrides: Partial<DocumentDraft> = {}): string {
  const document = resolveDocument(draft(overrides), kind);
  return documentSummary(document.model, document.totals);
}

describe('documentSummary', () => {
  it('writes the invoice header, both parties and every date', () => {
    const summary = text('invoice');

    expect(summary.startsWith('INVOICE INV-0042\n')).toBe(true);
    expect(summary).toContain('From\nNorthwind Studio\n12 Mill Lane\nBristol');
    expect(summary).toContain('hello@northwind.test');
    expect(summary).toContain('0117 000 0000');
    expect(summary).toContain('northwind.test');
    expect(summary).toContain('VAT number: GB123456789');
    expect(summary).toContain('Bill to\nAlex Morgan\nBright Coffee');
    expect(summary).toContain('4 Harbour Road\nBrighton');
    expect(summary).toContain('alex@brightcoffee.test');
    expect(summary).toMatch(/Issued: .*2026/);
    expect(summary).toMatch(/Due: .*2026/);
    expect(summary).toContain('Terms: Due within 14 days');
    expect(summary).toContain('Notes\nThank you for your business.');
    expect(summary).toContain('Payment details\nBank transfer, sort code 00-00-00');
  });

  it('writes the line, the tax and the total with the sheet figures', () => {
    const summary = text('invoice');
    const currency = 'GBP' as const;
    const line = `Brand identity: 1 x ${formatCurrency('1200', currency)} = ${formatCurrency('1200', currency)}`;

    expect(summary).toContain(line);
    expect(summary).toContain(`Subtotal: ${formatCurrency('1200', currency)}`);
    expect(summary).toContain(`VAT 20%: ${formatCurrency('240', currency)}`);
    expect(summary).toContain(`Total: ${formatCurrency('1440', currency)}`);
    expect(summary).toContain(`Amount due: ${formatCurrency('1440', currency)}`);
  });

  it('prints an HSN code and the Indian GST split when the market uses them', () => {
    const summary = text('invoice', {
      country: 'IN',
      taxInvoice: true,
      currency: 'INR',
      taxLabel: 'GST',
      placeOfSupply: '29',
      taxSplitMode: 'cgst-sgst',
      customerTaxId: '29ABCDE1234F1Z5',
      customerTaxIdLabel: 'GSTIN',
      items: [
        {
          id: 'line-1',
          description: 'Brand identity',
          quantity: '1',
          unitPrice: '1200.00',
          discountPercent: '',
          taxPercent: '18',
          hsnCode: '998314',
        },
      ],
    });

    expect(summary).toContain('Place of supply: 29 - Karnataka');
    expect(summary).toContain('GSTIN: 29ABCDE1234F1Z5');
    expect(summary).toContain('Brand identity (HSN/SAC 998314):');
    expect(summary).toContain('CGST 9%:');
    expect(summary).toContain('SGST 9%:');
  });

  it('prints a line discount and a document discount separately', () => {
    const summary = text('invoice', {
      discountPercent: '10',
      items: [
        {
          id: 'line-1',
          description: 'Brand identity',
          quantity: '1',
          unitPrice: '100',
          discountPercent: '5',
          taxPercent: '20',
          hsnCode: '',
        },
      ],
    });

    expect(summary).toContain('Discount:');
    expect(summary).toContain('Discount (10%):');
  });

  it('writes a receipt with its own words and a balance', () => {
    const summary = text('receipt', {
      paymentStatus: 'partially paid',
      amountPaid: '500',
    });

    expect(summary.startsWith('PAYMENT RECEIPT INV-0042')).toBe(true);
    expect(summary).toContain('Received from');
    expect(summary).not.toContain('Bill to');
    expect(summary).toMatch(/Date: .*2026/);
    expect(summary).toContain('Method: Bank transfer');
    expect(summary).toContain('Status: partially paid');
    expect(summary).toContain('Paid:');
    expect(summary).toContain('Balance due:');
  });

  it('does not show a balance on a fully paid receipt', () => {
    const summary = text('receipt', {
      paymentStatus: 'paid',
      amountPaid: '1440',
    });

    expect(summary).toContain('Status: paid');
    expect(summary).not.toContain('Balance due:');
  });

  it('writes a quote with a validity date and no amount due', () => {
    const summary = text('quote');

    expect(summary.startsWith('QUOTATION INV-0042')).toBe(true);
    expect(summary).toMatch(/Valid until: .*2026/);
    expect(summary).not.toMatch(/^Due:/m);
    expect(summary).not.toContain('Amount due:');
  });

  it('falls back to neutral labels when a market declares none', () => {
    const document = resolveDocument(
      draft({
        country: 'US',
        currency: 'USD',
        taxLabel: 'Sales tax',
        supplyDate: '2026-11-16',
        placeOfSupply: 'California',
        items: [
          {
            id: 'line-1',
            description: 'Brand identity',
            quantity: '1',
            unitPrice: '1200',
            discountPercent: '',
            taxPercent: '8',
            hsnCode: '998314',
          },
        ],
      }),
      'invoice',
    );

    // The US market has no place-of-supply or HSN field, so the business
    // draft cannot set one. The engine still clears what the market does not
    // print; the summary's neutral labels only apply to a model that carries
    // a value from another source.
    expect(document.model.placeOfSupply).toBe('');
    const summary = documentSummary(document.model, document.totals);
    expect(summary).toContain('Sales tax 8%');
    expect(summary).not.toContain('HSN/SAC');
  });

  it('uses the plain labels for a model that carries place and HSN values', () => {
    const document = resolveDocument(
      draft({ country: 'US', currency: 'USD', taxLabel: 'Sales tax' }),
      'invoice',
    );
    document.model.placeOfSupply = 'California';
    document.model.supplyDate = '2026-11-16';
    const firstLine = document.totals.lines[0];
    if (!firstLine) throw new Error('expected a line');

    const withHsn = {
      ...document.totals,
      lines: [{ ...firstLine, hsnCode: '998314' }],
    };
    const summary = documentSummary(document.model, withHsn);

    expect(summary).toContain('Place of supply: California');
    expect(summary).toContain('Supply date:');
    expect(summary).toContain('(HSN/SAC 998314)');
  });

  it('prints a cross-border endorsement after the total', () => {
    const document = resolveDocument(
      draft({
        country: 'IN',
        taxInvoice: true,
        currency: 'INR',
        taxLabel: 'GST',
        crossBorder: 'export-lut',
        crossBorderCustomerTaxId: 'DE123456789',
        items: [
          {
            id: 'line-1',
            description: 'Brand identity',
            quantity: '1',
            unitPrice: '1200',
            discountPercent: '',
            taxPercent: '18',
            hsnCode: '998314',
          },
        ],
      }),
      'invoice',
    );

    const summary = documentSummary(document.model, document.totals);

    expect(document.model.crossBorderEndorsement).not.toBe('');
    expect(summary).toContain('SUPPLY MEANT FOR EXPORT');
    expect(summary.indexOf('Total:')).toBeLessThan(summary.indexOf('SUPPLY MEANT FOR EXPORT'));
  });

  it('copes with a blank document and fractional quantities', () => {
    const summary = text('invoice', {
      number: '',
      businessName: '',
      businessEmail: '',
      businessPhone: '',
      businessWebsite: '',
      businessTaxId: '',
      businessAddress: '\n  \n',
      customerName: '',
      customerCompany: '',
      customerAddress: '',
      customerEmail: '',
      paymentTerms: '',
      notes: '',
      paymentDetails: '',
      items: [
        {
          id: 'line-1',
          description: 'Half day',
          quantity: '2.5',
          unitPrice: '100',
          discountPercent: '',
          taxPercent: '0',
          hsnCode: '',
        },
      ],
    });

    expect(summary.startsWith('INVOICE\n')).toBe(true);
    expect(summary).not.toContain('From');
    expect(summary).not.toContain('Bill to');
    expect(summary).not.toContain('Notes');
    expect(summary).not.toContain('Payment details');
    expect(summary).not.toContain('undefined');
    expect(summary).toContain('Half day: 2.50 x');
    expect(summary).toContain('Total:');
  });

  it('omits optional party details that are blank', () => {
    const summary = text('invoice', {
      businessEmail: '',
      businessPhone: '',
      businessWebsite: '',
      businessTaxId: '',
      customerCompany: '',
      customerAddress: '',
      customerEmail: '',
      customerTaxId: '',
    });

    expect(summary).toContain('From\nNorthwind Studio');
    expect(summary).toContain('Bill to\nAlex Morgan');
    expect(summary).not.toContain('Bright Coffee');
    expect(summary).not.toContain('alex@brightcoffee.test');
    expect(summary).not.toContain('VAT number');
    expect(summary).not.toContain('undefined');
  });

  it('omits dates and methods that are blank', () => {
    const receipt = text('receipt', {
      transactionDate: '',
      paymentMethod: '',
      paymentStatus: 'paid',
      amountPaid: '1440',
    });
    expect(receipt).not.toMatch(/^Date:/m);
    expect(receipt).not.toMatch(/^Method:/m);
    expect(receipt).toContain('Status: paid');

    const invoice = text('invoice', {
      issueDate: '',
      dueDate: '',
      supplyDate: '',
      expiryDate: '',
    });
    expect(invoice).not.toMatch(/^Issued:/m);
    expect(invoice).not.toMatch(/^Due:/m);
    expect(invoice).not.toMatch(/^Supply date:/m);

    const quote = text('quote', { expiryDate: '' });
    expect(quote).not.toMatch(/^Valid until:/m);
  });

  it('omits the empty-lines gap when there is nothing to charge', () => {
    const summary = text('invoice', { items: [] });

    expect(summary).toContain('Subtotal:');
    expect(summary).toContain('Total:');
    expect(summary.split('\n')).not.toContain('undefined');
  });
});
