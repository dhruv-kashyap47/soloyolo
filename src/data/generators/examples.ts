import { addDays, todayIso } from '@/lib/formatting/date';
import type { DocumentDraft } from '@/lib/generators/document';

/**
 * The worked examples every generator opens with.
 *
 * These live apart from the page copy on purpose. The island imports an
 * example, so anything in the same module would be shipped to the browser:
 * keeping the example in its own file means the FAQ, the steps and the
 * build-time Zod schema stay out of the bundle entirely.
 *
 * The dates are built from today, so an example is never stale.
 */

export function invoiceExample(): DocumentDraft {
  const today = todayIso();

  return {
    businessName: 'Northwind Studio',
    businessAddress: 'Mill Lane\nBristol',
    businessEmail: 'hello@northwind.studio',
    businessPhone: '0117 496 0182',
    businessWebsite: 'northwind.studio',
    businessTaxId: 'GB 000 0000 00',
    businessTaxIdLabel: 'VAT number',
    logoDataUrl: '',

    customerName: 'Alex Morgan',
    customerCompany: 'Bright Coffee',
    customerAddress: 'Harbour Road\nBrighton',
    customerEmail: 'alex@brightcoffee.co.uk',

    number: 'INV-0042',
    issueDate: today,
    dueDate: addDays(today, 14),
    expiryDate: '',
    transactionDate: '',
    currency: 'GBP',
    taxLabel: 'VAT',
    discountPercent: '',

    paymentTerms: 'Due within 14 days',
    notes: 'Thank you for your business.',
    paymentDetails: 'Bank transfer\nAccount 12345678\nSort code 00-00-00',
    paymentMethod: 'Bank transfer',
    paymentStatus: 'pending',
    amountPaid: '',

    items: [
      {
        id: 'item-1',
        description: 'Brand identity',
        quantity: '1',
        unitPrice: '1200',
        discountPercent: '',
        taxPercent: '20',
      },
      {
        id: 'item-2',
        description: 'Design system, per hour',
        quantity: '7.5',
        unitPrice: '95.50',
        discountPercent: '',
        taxPercent: '20',
      },
    ],
    showFooterNote: false,
  };
}

export function quoteExample(): DocumentDraft {
  const today = todayIso();

  return {
    businessName: 'Northwind Studio',
    businessAddress: 'Mill Lane\nBristol',
    businessEmail: 'hello@northwind.studio',
    businessPhone: '0117 496 0182',
    businessWebsite: 'northwind.studio',
    businessTaxId: 'GB 000 0000 00',
    businessTaxIdLabel: 'VAT number',
    logoDataUrl: '',

    customerName: 'Alex Morgan',
    customerCompany: 'Bright Coffee',
    customerAddress: 'Harbour Road\nBrighton',
    customerEmail: 'alex@brightcoffee.co.uk',

    number: 'QUO-0018',
    issueDate: today,
    dueDate: '',
    expiryDate: addDays(today, 30),
    transactionDate: '',
    currency: 'GBP',
    taxLabel: 'VAT',
    discountPercent: '',

    paymentTerms: '50% on deposit, balance on delivery',
    notes:
      'This quote covers the work described above. Any work outside the scope needs a new quote.',
    paymentDetails: '',
    paymentMethod: 'Bank transfer',
    paymentStatus: 'pending',
    amountPaid: '',

    items: [
      {
        id: 'item-1',
        description: 'Brand identity, discovery and concepts',
        quantity: '1',
        unitPrice: '1800',
        discountPercent: '',
        taxPercent: '20',
      },
      {
        id: 'item-2',
        description: 'Design system, per hour',
        quantity: '12',
        unitPrice: '95.50',
        discountPercent: '',
        taxPercent: '20',
      },
    ],
    showFooterNote: false,
  };
}

export function receiptExample(): DocumentDraft {
  const today = todayIso();

  return {
    businessName: 'Northwind Studio',
    businessAddress: 'Mill Lane\nBristol',
    businessEmail: 'hello@northwind.studio',
    businessPhone: '0117 496 0182',
    businessWebsite: 'northwind.studio',
    businessTaxId: 'GB 000 0000 00',
    businessTaxIdLabel: 'VAT number',
    logoDataUrl: '',

    customerName: 'Alex Morgan',
    customerCompany: 'Bright Coffee',
    customerAddress: 'Harbour Road\nBrighton',
    customerEmail: 'alex@brightcoffee.co.uk',

    number: 'RCT-0204',
    issueDate: today,
    dueDate: '',
    expiryDate: '',
    transactionDate: today,
    currency: 'GBP',
    taxLabel: 'VAT',
    discountPercent: '',

    paymentTerms: '',
    notes: 'Payment received with thanks.',
    paymentDetails: '',
    paymentMethod: 'Bank transfer',
    paymentStatus: 'paid',
    amountPaid: '1669.20',

    items: [
      {
        id: 'item-1',
        description: 'Brand identity',
        quantity: '1',
        unitPrice: '1200',
        discountPercent: '',
        taxPercent: '20',
      },
      {
        id: 'item-2',
        description: 'Print artwork, per hour',
        quantity: '2',
        unitPrice: '95.50',
        discountPercent: '',
        taxPercent: '20',
      },
    ],
    showFooterNote: false,
  };
}
