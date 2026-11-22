import { describe, expect, it } from 'vitest';

import { resolveDocument } from '@/lib/generators/document';
import { documentSummary } from '@/lib/generators/summary';
import { invoiceExample, quoteExample, receiptExample } from '@/data/generators/examples';
import { INVOICE_FAQ, INVOICE_META } from '@/data/generators/invoice';
import { QUOTE_FAQ, QUOTE_META } from '@/data/generators/quote';
import { RECEIPT_FAQ, RECEIPT_META } from '@/data/generators/receipt';
import { REMINDER_FAQ, REMINDER_META } from '@/data/generators/reminder';

interface PageContent {
  name: string;
  meta: { title: string; description: string; path: string; intro: string };
  faqs: readonly { question: string; answer: string }[];
}

const pages: PageContent[] = [
  { name: 'invoice', meta: INVOICE_META, faqs: INVOICE_FAQ },
  { name: 'quote', meta: QUOTE_META, faqs: QUOTE_FAQ },
  { name: 'receipt', meta: RECEIPT_META, faqs: RECEIPT_FAQ },
  { name: 'reminder', meta: REMINDER_META, faqs: REMINDER_FAQ },
];

describe('the generator page content', () => {
  for (const page of pages) {
    it(`gives the ${page.name} page a unique title, description and path`, () => {
      expect(page.meta.title.length).toBeGreaterThan(3);
      expect(page.meta.description.length).toBeGreaterThan(80);
      expect(page.meta.path.startsWith('/generators/')).toBe(true);
      expect(page.meta.intro.length).toBeGreaterThan(80);
    });

    it(`gives the ${page.name} page at least four questions worth asking`, () => {
      expect(page.faqs.length).toBeGreaterThanOrEqual(4);
      for (const faq of page.faqs) {
        expect(faq.question.length).toBeGreaterThan(8);
        expect(faq.answer.length).toBeGreaterThan(60);
      }
    });
  }

  it('gives every generator page a different path', () => {
    const paths = pages.map((page) => page.meta.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('never writes an em dash', () => {
    for (const page of pages) {
      const words: string[] = [page.meta.title, page.meta.description, page.meta.intro];
      for (const faq of page.faqs) words.push(faq.question, faq.answer);

      for (const word of words) {
        expect(word.includes('—'), page.name).toBe(false);
      }
    }
  });
});

describe('the worked examples', () => {
  it('builds an invoice that adds up', () => {
    const { model, totals } = resolveDocument(invoiceExample(), 'invoice');

    expect(model.business.name).toBe('Northwind Studio');
    expect(totals.lines).toHaveLength(2);
    expect(totals.total.toFixed(2)).toBe('2299.50');
    expect(totals.amountDue.toFixed(2)).toBe('2299.50');
  });

  it('builds a quote with an expiry date', () => {
    const { model, totals } = resolveDocument(quoteExample(), 'quote');

    expect(model.title).toBe('QUOTATION');
    expect(model.expiryDate).not.toBe('');
    expect(totals.subtotal.toFixed(2)).toBe('2946.00');
    expect(totals.taxTotal.toFixed(2)).toBe('589.20');
    expect(totals.total.toFixed(2)).toBe('3535.20');
  });

  it('builds a receipt that records the payment', () => {
    const { model, totals } = resolveDocument(receiptExample(), 'receipt');

    expect(model.title).toBe('PAYMENT RECEIPT');
    expect(model.paymentStatus).toBe('paid');
    expect(totals.amountPaid.toFixed(2)).toBe('1669.20');
    expect(totals.total.toFixed(2)).toBe('1669.20');
    expect(totals.amountDue.toFixed(2)).toBe('0.00');
  });

  it('reads a blank amount on a paid receipt as paid in full', () => {
    const { model, totals } = resolveDocument({ ...receiptExample(), amountPaid: '' }, 'receipt');

    expect(model.amountPaid.toFixed(2)).toBe('1669.20');
    expect(totals.amountPaid.toFixed(2)).toBe('1669.20');
    expect(totals.amountDue.toFixed(2)).toBe('0.00');
  });

  it('still shows a balance when a blank receipt is not marked paid', () => {
    const { totals } = resolveDocument(
      { ...receiptExample(), amountPaid: '', paymentStatus: 'pending' },
      'receipt',
    );

    expect(totals.amountPaid.toFixed(2)).toBe('0.00');
    expect(totals.amountDue.toFixed(2)).toBe('1669.20');
  });
});

describe('documentSummary', () => {
  it('writes the same figures the sheet shows', () => {
    const { model, totals } = resolveDocument(invoiceExample(), 'invoice');
    const text = documentSummary(model, totals);

    expect(text).toContain('INVOICE INV-0042');
    expect(text).toContain('Northwind Studio');
    expect(text).toContain('Alex Morgan');
    expect(text).toContain('Brand identity');
    expect(text).toContain('Subtotal: £1,916.25');
    expect(text).toContain('VAT 20%: £383.25');
    expect(text).toContain('Total: £2,299.50');
    expect(text).toContain('Amount due: £2,299.50');
  });

  it('writes the balance on a receipt when one is owed', () => {
    const draft = receiptExample();
    const { model, totals } = resolveDocument({ ...draft, amountPaid: '1000' }, 'receipt');
    const text = documentSummary(model, totals);

    expect(text).toContain('Paid: £1,000.00');
    expect(text).toContain('Balance due: £669.20');
  });

  it('never writes an em dash', () => {
    const { model, totals } = resolveDocument(invoiceExample(), 'invoice');

    expect(documentSummary(model, totals)).not.toContain('—');
  });

  it('writes the cross-border sentence and the customer VAT ID', () => {
    const base = invoiceExample();
    const draft = {
      ...base,
      country: 'DE' as const,
      taxInvoice: true,
      taxLabel: 'MwSt' as const,
      currency: 'EUR' as const,
      crossBorder: 'eu-reverse-charge',
      crossBorderCustomerTaxId: 'FR12345678901',
      items: base.items.map((item) => ({ ...item, taxPercent: '19' })),
    };

    const { model, totals } = resolveDocument(draft, 'invoice');
    const text = documentSummary(model, totals);

    expect(text).toContain('USt-IdNr.: FR12345678901');
    expect(text).toContain('Steuerschuldnerschaft');
    expect(text).toContain('Total: €1,916.25');

    const endorsement = text.indexOf('Steuerschuldnerschaft');
    const notes = text.indexOf('Notes');
    expect(endorsement).toBeGreaterThan(-1);
    expect(notes === -1 || endorsement < notes).toBe(true);
  });
});
