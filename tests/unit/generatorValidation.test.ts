import { describe, expect, it } from 'vitest';

import type { DocumentDraft, DocumentKind } from '@/lib/generators/document';
import { validateDocumentDraft, fieldLabel, itemFieldKey } from '@/lib/generators/validation';

function draft(overrides: Partial<DocumentDraft> = {}): DocumentDraft {
  return {
    country: 'UK',
    taxInvoice: false,

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
    customerAddress: '4 Harbour Road\nBrighton',
    customerEmail: '',
    customerTaxId: '',
    customerTaxIdLabel: 'Tax ID',

    number: 'INV-0042',
    issueDate: '2026-11-16',
    dueDate: '2026-11-30',
    supplyDate: '2026-11-16',
    expiryDate: '2026-12-16',
    transactionDate: '2026-11-16',
    currency: 'GBP',
    taxLabel: 'VAT',
    placeOfSupply: '',
    taxSplitMode: '',
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
        hsnCode: '',
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

  it('checks a supply date when one is filled in', () => {
    expect(validate('invoice', { supplyDate: '2026-02-30' }).errors.supplyDate).toBe(
      'Enter the supply date as a real date.',
    );
    expect(validate('invoice', { country: 'US', supplyDate: '' }).errors.supplyDate).toBeUndefined();
  });

  it('requires the VAT number, the business address and the customer address on a UK VAT invoice', () => {
    const result = validate('invoice', {
      country: 'UK',
      taxInvoice: true,
      customerAddress: '',
    });

    expect(result.errors.businessAddress).toBeUndefined();
    expect(result.errors.businessTaxId).toBe('Enter your VAT number.');
    expect(result.errors.customerAddress).toBe('Enter the customer address.');
  });

  it('accepts a UK VAT invoice once the required fields are there', () => {
    const result = validate('invoice', {
      country: 'UK',
      taxInvoice: true,
      businessTaxId: 'GB 000 0000 00',
      customerAddress: '4 Harbour Road\nBrighton',
    });

    expect(result.ok).toBe(true);
  });

  it('requires the parties addresses and the supply date on a normal UK invoice', () => {
    const result = validate('invoice', {
      country: 'UK',
      taxInvoice: false,
      businessAddress: '',
      customerAddress: '',
      supplyDate: '',
    });

    expect(result.errors.businessAddress).toBe('Enter your business address.');
    expect(result.errors.customerAddress).toBe('Enter the customer address.');
    expect(result.errors.supplyDate).toBe('Enter the supply date.');
  });

  it('requires the ABN on an Australian tax invoice', () => {
    expect(validate('invoice', { country: 'AU', taxInvoice: true }).errors.businessTaxId).toBe(
      'Enter your ABN.',
    );
  });

  it('requires the Canadian registration number from $100 and the terms from $500', () => {
    const result = validate('invoice', { country: 'CA', taxInvoice: true });

    expect(result.errors.businessTaxId).toBe('Enter your Business number.');
    expect(result.errors.paymentTerms).toBe('Enter the terms of payment.');
  });

  it('does not require a Canadian registration number under $100', () => {
    const result = validate('invoice', {
      country: 'CA',
      taxInvoice: true,
      items: [
        {
          id: 'line-1',
          description: 'Small job',
          quantity: '1',
          unitPrice: '10',
          discountPercent: '',
          taxPercent: '',
          hsnCode: '',
        },
      ],
    });

    expect(result.errors.businessTaxId).toBeUndefined();
    expect(result.errors.paymentTerms).toBeUndefined();
    expect(result.ok).toBe(true);
  });

  it('does not apply tax invoice rules where the country has no tax invoice', () => {
    const result = validate('invoice', {
      country: 'US',
      taxInvoice: true,
      customerAddress: '',
      businessTaxId: '',
    });

    expect(result.ok).toBe(true);
  });

  it('accepts a complete Indian GST tax invoice', () => {
    const result = validate('invoice', {
      country: 'IN',
      taxInvoice: true,
      currency: 'INR',
      taxLabel: 'GST',
      businessTaxId: '29ABCDE1234F1Z5',
      customerTaxId: '29AAACB1234C1Z8',
      placeOfSupply: '29',
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

    expect(result.ok).toBe(true);
    expect(result.invalidFields).toEqual([]);
  });

  it('requires the Indian GSTIN, place of supply and HSN on a tax invoice', () => {
    const result = validate('invoice', {
      country: 'IN',
      taxInvoice: true,
      businessTaxId: '',
      customerTaxId: '',
      placeOfSupply: '',
      items: [
        {
          id: 'line-1',
          description: 'GST advisory',
          quantity: '1',
          unitPrice: '60000',
          discountPercent: '',
          taxPercent: '18',
          hsnCode: '',
        },
      ],
    });

    expect(result.errors.businessTaxId).toBe('Enter your GSTIN.');
    expect(result.errors.customerTaxId).toBeUndefined();
    expect(result.errors.placeOfSupply).toBe('Choose the place of supply.');
    expect(result.errors[itemFieldKey('line-1', 'hsnCode')]).toBe('Enter the HSN/SAC code.');
  });

  it('accepts a B2C GST tax invoice without a customer GSTIN', () => {
    const result = validate('invoice', {
      country: 'IN',
      taxInvoice: true,
      businessTaxId: '29ABCDE1234F1Z5',
      customerTaxId: '',
      placeOfSupply: '29',
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

    expect(result.errors.customerTaxId).toBeUndefined();
    expect(result.ok).toBe(true);
  });

  it('checks the GSTIN, TRN, German VAT ID and Swiss MWST formats', () => {
    expect(
      validate('invoice', { country: 'IN', businessTaxId: '29ABCDE1234F1Z5' }).errors.businessTaxId,
    ).toBeUndefined();
    expect(
      validate('invoice', { country: 'IN', businessTaxId: '29ABCDE1234F1Z' }).errors.businessTaxId,
    ).toBe('Enter a 15 character GSTIN, for example 29ABCDE1234F1Z5.');

    expect(
      validate('invoice', { country: 'AE', businessTaxId: '000000000000000' }).errors.businessTaxId,
    ).toBeUndefined();
    expect(
      validate('invoice', { country: 'AE', businessTaxId: '00000000000000' }).errors.businessTaxId,
    ).toBe('Enter a 15 digit TRN.');

    expect(
      validate('invoice', {
        country: 'DE',
        businessTaxId: 'DE123456789',
        businessTaxIdLabel: 'VAT ID',
      }).errors.businessTaxId,
    ).toBeUndefined();
    expect(
      validate('invoice', {
        country: 'DE',
        businessTaxId: 'DE12345678',
        businessTaxIdLabel: 'VAT ID',
      }).errors.businessTaxId,
    ).toBe('Enter a German VAT ID as DE followed by 9 digits, for example DE123456789.');

    expect(
      validate('invoice', { country: 'CH', businessTaxId: 'CHE-123.456.789 MWST' }).errors
        .businessTaxId,
    ).toBeUndefined();
    expect(
      validate('invoice', { country: 'CH', businessTaxId: 'CHE-123.456.789 TVA' }).errors
        .businessTaxId,
    ).toBeUndefined();
    expect(
      validate('invoice', { country: 'CH', businessTaxId: 'CHE-123.456.789 VAT' }).errors
        .businessTaxId,
    ).toBe('Enter a Swiss MWST number as CHE-123.456.789 MWST.');
  });

  it('accepts a German Steuernummer when that label is selected', () => {
    const result = validate('invoice', {
      country: 'DE',
      businessTaxId: '00/000/00000',
      businessTaxIdLabel: 'Tax number',
    });

    expect(result.errors.businessTaxId).toBeUndefined();
  });

  it('requires a German registration number on a normal invoice too', () => {
    const result = validate('invoice', {
      country: 'DE',
      taxInvoice: false,
      businessTaxId: '',
      businessTaxIdLabel: 'Tax number',
    });

    expect(result.errors.businessTaxId).toBe('Enter your Tax number.');
  });

  it('does not require a UK VAT number on a normal invoice', () => {
    const result = validate('invoice', {
      country: 'UK',
      taxInvoice: false,
      businessTaxId: '',
    });

    expect(result.errors.businessTaxId).toBeUndefined();
  });

  it('still checks the German VAT ID when the VAT ID label is selected', () => {
    const result = validate('invoice', {
      country: 'DE',
      businessTaxId: '00/000/00000',
      businessTaxIdLabel: 'VAT ID',
    });

    expect(result.errors.businessTaxId).toBe(
      'Enter a German VAT ID as DE followed by 9 digits, for example DE123456789.',
    );
  });

  it('checks a customer TRN where the UAE asks for one', () => {
    const result = validate('invoice', {
      country: 'AE',
      taxInvoice: true,
      businessTaxId: '000000000000000',
      customerTaxId: '12345',
    });

    expect(result.errors.customerTaxId).toBe('Enter a 15 digit TRN.');
    expect(result.ok).toBe(false);
  });

  it('leaves a UAE customer TRN optional for a consumer sale', () => {
    const result = validate('invoice', {
      country: 'AE',
      taxInvoice: true,
      businessTaxId: '000000000000000',
      customerTaxId: '',
    });

    expect(result.errors.customerTaxId).toBeUndefined();
    expect(result.ok).toBe(true);
  });

  it('caps an Indian invoice number at sixteen characters', () => {
    const result = validate('invoice', {
      country: 'IN',
      number: 'INV-2026-12345678',
      businessTaxId: '29ABCDE1234F1Z5',
    });

    expect(result.errors.number).toBe('Keep the invoice number to 16 characters or fewer.');
  });

  it('accepts a sixteen character Indian invoice number', () => {
    const result = validate('invoice', {
      country: 'IN',
      number: 'INV-2026-1234567',
      businessTaxId: '29ABCDE1234F1Z5',
    });

    expect(result.errors.number).toBeUndefined();
  });

  it('checks the HSN/SAC shape where the market uses one', () => {
    const result = validate('invoice', {
      country: 'IN',
      taxInvoice: true,
      businessTaxId: '29ABCDE1234F1Z5',
      customerTaxId: '29AAACB1234C1Z8',
      placeOfSupply: '29',
      items: [
        {
          id: 'line-1',
          description: 'GST advisory',
          quantity: '1',
          unitPrice: '60000',
          discountPercent: '',
          taxPercent: '18',
          hsnCode: 'ABC',
        },
      ],
    });

    expect(result.errors[itemFieldKey('line-1', 'hsnCode')]).toBe(
      'Enter the HSN/SAC as 2 to 8 digits.',
    );
  });

  it('does not require the HSN on a normal Indian invoice', () => {
    const result = validate('invoice', {
      country: 'IN',
      taxInvoice: false,
      businessTaxId: '',
      placeOfSupply: '',
      items: [
        {
          id: 'line-1',
          description: 'Website design',
          quantity: '1',
          unitPrice: '45000',
          discountPercent: '',
          taxPercent: '',
          hsnCode: '',
        },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it('checks an email address that does not look like one', () => {
    expect(validate('invoice', { businessEmail: 'hello@northwind' }).errors.businessEmail).toBe(
      'Enter an email address in the form name@example.com.',
    );
    expect(validate('invoice', { businessEmail: '' }).errors.businessEmail).toBeUndefined();
    expect(validate('invoice', { customerEmail: 'alex@' }).errors.customerEmail).toBe(
      'Enter an email address in the form name@example.com.',
    );
    expect(validate('invoice', { customerEmail: '' }).errors.customerEmail).toBeUndefined();
  });

  it('keeps the due date on or after the issue date', () => {
    expect(
      validate('invoice', { issueDate: '2026-11-18', dueDate: '2026-11-01' }).errors.dueDate,
    ).toBe('The due date must be on or after the issue date.');
    expect(
      validate('quote', { issueDate: '2026-11-18', expiryDate: '2026-11-01' }).errors.expiryDate,
    ).toBe('The expiry date must be on or after the issue date.');
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
          hsnCode: '',
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
          hsnCode: '',
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
          hsnCode: '',
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
          hsnCode: '',
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
          hsnCode: '',
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

describe('cross-border validation', () => {
  it('asks for the customer VAT ID on a German reverse-charge invoice', () => {
    const result = validate('invoice', {
      country: 'DE',
      crossBorder: 'eu-reverse-charge',
      businessTaxId: 'DE123456789',
    });

    expect(result.errors.crossBorderCustomerTaxId).toBe('Customer USt-IdNr. is required.');

    const fixed = validate('invoice', {
      country: 'DE',
      crossBorder: 'eu-reverse-charge',
      crossBorderCustomerTaxId: 'FR12345678901',
      businessTaxId: 'DE123456789',
    });

    expect(fixed.errors.crossBorderCustomerTaxId).toBeUndefined();
  });

  it('does not ask for a place of supply on an Indian export', () => {
    const result = validate('invoice', {
      country: 'IN',
      taxInvoice: true,
      taxLabel: 'GST',
      taxSplitMode: 'igst',
      placeOfSupply: '',
      crossBorder: 'export-lut',
      businessTaxId: '29ABCDE1234F1Z5',
    });

    expect(result.errors.placeOfSupply).toBeUndefined();
  });
});
