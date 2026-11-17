import { addDays, todayIso } from '@/lib/formatting/date';
import type { DocumentDraft } from '@/lib/generators/document';

/**
 * The UK invoice example shared by the general invoice generator and the UK
 * country page. It lives in its own module so the country example bundle and
 * the general example bundle share the base invoice without pulling the
 * country examples onto a quote or receipt page.
 */
export function ukInvoiceExample(): DocumentDraft {
  const today = todayIso();

  return {
    country: 'UK',
    taxInvoice: false,

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
    customerTaxId: '',
    customerTaxIdLabel: 'Tax ID',

    number: 'INV-0042',
    issueDate: today,
    dueDate: addDays(today, 14),
    supplyDate: today,
    expiryDate: '',
    transactionDate: '',
    currency: 'GBP',
    taxLabel: 'VAT',
    placeOfSupply: '',
    taxSplitMode: '',
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
        hsnCode: '',
      },
      {
        id: 'item-2',
        description: 'Design system, per hour',
        quantity: '7.5',
        unitPrice: '95.50',
        discountPercent: '',
        taxPercent: '20',
        hsnCode: '',
      },
    ],
    showFooterNote: false,
  };
}
