import type { CountryPageContent } from '@/data/countries/types';

/**
 * The two United Kingdom guides.
 *
 * The normal invoice and the VAT invoice are deliberately different pages:
 * the first explains what every UK invoice needs, the second switches on the
 * HMRC VAT invoice fields and says what changes on the sheet.
 */
export const UK_INVOICE_PAGE: CountryPageContent = {
  guideId: 'uk-invoice',
  meta: {
    title: 'UK Invoice Generator',
    description:
      'Create a UK invoice in GBP with VAT fields, a VAT number and a 14 day default. Print it or save it as a PDF, with no account and no uploads.',
    eyebrow: 'United Kingdom invoice guide',
    intro:
      'A UK invoice carries the parties, a unique number, the dates and the amounts. If you are VAT registered and your customer is too, it also needs the extra details that make it a VAT invoice.',
  },
  breadcrumbLabel: 'UK invoice generator',
  documentName: 'UK invoice',
  requirements: {
    title: 'What a UK invoice must include',
    intro:
      'GOV.UK sets the core details for every invoice. The VAT invoice page adds the HMRC list for a supply between VAT registered businesses.',
    items: [
      'A unique identification number.',
      'Your business name, address and contact details.',
      'The customer name and address.',
      'A clear description of what you are charging for.',
      'The date the work was supplied and the date of the invoice.',
      'The amount or amounts being charged and the total owed.',
      'The VAT amount if VAT applies, and your VAT number if you are registered.',
      'The full company name for a limited company, or your own name and any business name for a sole trader.',
    ],
  },
  changes: {
    title: 'What this page sets for you',
    intro:
      'The UK defaults are there to save typing, not to make a legal decision for you. Change the tax label or the terms when the document needs it.',
    items: [
      {
        label: 'Country',
        value: 'United Kingdom',
        note: 'The invoice uses UK wording and a 14 day default.',
      },
      {
        label: 'Currency',
        value: 'GBP (£)',
        note: 'Amounts are written as pounds sterling. The selector formats, it never converts.',
      },
      {
        label: 'Tax name',
        value: 'VAT',
        note: 'The standard rate is 20%, with 5% reduced and 0% zero-rated supplies.',
      },
      {
        label: 'Registration number',
        value: 'VAT number',
        note: 'Leave it blank if you are not VAT registered. The field prints only when filled.',
      },
      {
        label: 'VAT invoice mode',
        value: 'Available',
        note: 'Turn it on for a full VAT invoice with the VAT number and the customer address.',
      },
      {
        label: 'Supply date',
        value: 'Required',
        note: 'The date the work was supplied. It starts at the issue date and can be changed.',
      },
      {
        label: 'Default terms',
        value: 'Due within 14 days',
        note: 'The due date is 14 days after the issue date, and you can change it.',
      },
    ],
  },
  rates: {
    title: 'VAT rates to know',
    intro:
      'The rate depends on what you sell. Most services are standard rated, but the rules for reduced and zero rates are specific, so check the goods or service before you choose.',
    items: [
      { label: 'Standard rate', rate: '20%', note: 'Most goods and services.' },
      {
        label: 'Reduced rate',
        rate: '5%',
        note: 'Some goods and services, for example child car seats and domestic energy.',
      },
      {
        label: 'Zero rate',
        rate: '0%',
        note: 'Zero-rated goods and services, for example most food and children’s clothes.',
      },
    ],
    note: 'You must register for VAT when your taxable turnover goes over £90,000 in the last 12 months, or you expect it to go over £90,000 in the next 30 days.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Bristol studio invoicing a Brighton coffee shop for a brand identity and a block of design hours. It is a normal UK invoice with VAT lines, and the VAT invoice switch is off.',
    points: [
      'The currency is GBP and the terms are 14 days.',
      'The VAT number prints because the example business is registered.',
      'The supply date is on the sheet because a UK invoice needs it.',
      'Turn on VAT invoice mode when the customer needs a full VAT invoice.',
    ],
  },
  notes: [
    'Only VAT registered businesses should charge VAT or issue a VAT invoice. If you are not registered, leave the VAT rate and the VAT number blank.',
    'Keep a copy of every invoice you issue. HMRC normally asks VAT registered businesses to keep records for at least six years.',
    'The tool does not know which rate applies to your supply. Enter the rate on each line and check the goods or service rules.',
  ],
  faqs: [
    {
      question: 'Do I have to be VAT registered to use this page?',
      answer:
        'No. You can issue a normal invoice without a VAT number. Only add VAT and a VAT number once HMRC has registered you, and only charge VAT on supplies that are taxable.',
    },
    {
      question: 'What is the difference between this page and the VAT invoice generator?',
      answer:
        'This page starts with a normal UK invoice. The VAT invoice page switches on the extra fields and the VAT INVOICE title that a full VAT invoice needs, including the customer address and the supply date.',
    },
    {
      question: 'What is the VAT registration threshold?',
      answer:
        'You must register when your taxable turnover goes over £90,000 in the last 12 months, or you expect it to go over £90,000 in the next 30 days. Check GOV.UK before you rely on the figure.',
    },
    {
      question: 'Can I use a different currency?',
      answer:
        'Yes. The currency selector changes the way the amounts are written, not the amounts themselves. A UK VAT invoice must still show the total VAT in sterling, so check that before you send one in another currency.',
    },
    {
      question: 'What payment terms are normal?',
      answer:
        '14 or 30 days are common. The page starts with 14 days, and you can change the due date and the terms on the document to match what you agreed with the customer.',
    },
  ],
  sourceIds: ['uk-invoices', 'uk-vat-invoices', 'uk-vat-rates', 'uk-vat-registration'],
  related: [
    {
      label: 'UK VAT invoice generator',
      href: '/uk/vat-invoice-generator/',
      note: 'The full VAT invoice version with the HMRC field list.',
    },
    {
      label: 'US invoice generator',
      href: '/us/invoice-generator/',
      note: 'USD, sales tax you enter yourself, and an optional EIN.',
    },
    {
      label: 'Canada invoice generator',
      href: '/ca/invoice-generator/',
      note: 'CAD, GST or HST, and a business number when the total needs one.',
    },
    {
      label: 'Australia invoice generator',
      href: '/au/invoice-generator/',
      note: 'AUD, GST and an ABN, with a tax invoice mode.',
    },
  ],
};

export const UK_VAT_INVOICE_PAGE: CountryPageContent = {
  guideId: 'uk-vat-invoice',
  meta: {
    title: 'VAT Invoice Generator',
    description:
      'Create a full UK VAT invoice with your VAT number, the customer address, per line VAT and the total VAT in sterling. Print it or save it as a PDF.',
    eyebrow: 'United Kingdom VAT invoice',
    intro:
      'A full VAT invoice is a normal invoice with the details HMRC requires. This page sets the VAT INVOICE title, makes the VAT number, your business address and the customer address required, and adds a supply date field.',
  },
  breadcrumbLabel: 'UK VAT invoice generator',
  documentName: 'VAT invoice',
  requirements: {
    title: 'What a full VAT invoice must show',
    intro:
      'The list follows HMRC record keeping guidance for VAT invoices. A full invoice is always acceptable, including for supplies of £250 or less where a simplified invoice would also be allowed.',
    items: [
      'A sequential number from one or more series that uniquely identifies the document.',
      'The time of supply, and the date of issue if it is different.',
      'Your name, address and VAT registration number.',
      'The customer name and address.',
      'A description that identifies the goods or services, with the quantity or extent and the unit price.',
      'For each line, the VAT rate and the amount excluding VAT.',
      'The total excluding VAT, the rate of any cash discount, and the total VAT in sterling.',
      'The total including VAT and the amount due.',
    ],
  },
  changes: {
    title: 'What turning on VAT invoice mode changes',
    intro:
      'The switch is off on the normal UK page. With it on, the sheet and the form both follow the full VAT invoice rules.',
    items: [
      {
        label: 'Sheet title',
        value: 'VAT INVOICE',
        note: 'The document is a VAT invoice because of the information it carries, and the title makes that plain.',
      },
      {
        label: 'VAT number',
        value: 'Required',
        note: 'The form will not print until the VAT registration number is filled in.',
      },
      {
        label: 'Your business address',
        value: 'Required',
        note: 'A full VAT invoice must show the supplier name, address and VAT number.',
      },
      {
        label: 'Customer address',
        value: 'Required',
        note: 'A full VAT invoice must show the name and address of the person receiving the supply.',
      },
      {
        label: 'VAT breakdown',
        value: 'Per line and total',
        note: 'Each line carries its rate, and the total VAT appears separately from the net total.',
      },
    ],
  },
  rates: {
    title: 'VAT rates and the £250 rule',
    intro:
      'A full VAT invoice can be used for any value. A simplified VAT invoice is the shorter form allowed for small supplies, not a lower rate.',
    items: [
      { label: 'Standard rate', rate: '20%', note: 'Most goods and services.' },
      {
        label: 'Reduced rate',
        rate: '5%',
        note: 'Some goods and services, for example child car seats and domestic energy.',
      },
      {
        label: 'Zero rate',
        rate: '0%',
        note: 'Zero-rated goods and services, for example most food and children’s clothes.',
      },
      {
        label: 'Simplified invoice limit',
        rate: '£250',
        note: 'Allowed for supplies of £250 or less including VAT, if the customer agrees.',
      },
    ],
    note: 'You must register for VAT when your taxable turnover goes over £90,000 in the last 12 months, or you expect it to go over £90,000 in the next 30 days.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a full VAT invoice from a Bristol studio to a Brighton coffee shop. The VAT number, business address, customer address and supply date are all part of the sheet, and each line carries 20% VAT.',
    points: [
      'The sheet title is VAT INVOICE and the currency is GBP.',
      'The supply date is filled in because a VAT invoice needs the time of supply.',
      'The VAT number and the customer address are required before printing.',
    ],
  },
  notes: [
    'Only a VAT registered business can issue a VAT invoice. Do not turn this mode on before HMRC has registered you.',
    'If the supply date is different from the issue date, fill in both. The supply date is the tax point that decides the VAT period.',
    'The total VAT must be in sterling. If you invoice in another currency, add the sterling VAT total to the notes before you send it.',
    'The tool prints a full invoice. It does not decide whether a supply is standard, reduced or zero rated.',
  ],
  faqs: [
    {
      question: 'What makes an invoice a VAT invoice?',
      answer:
        'It is the information it carries: the VAT number, the customer, the supply date, the line detail and the VAT breakdown. HMRC guidance lists the full set, and this page sets the fields that are easy to miss.',
    },
    {
      question: 'Do I need the words VAT INVOICE on the sheet?',
      answer:
        'The document is a VAT invoice because of what it contains. This page prints VAT INVOICE as a clear heading, which is helpful, but the information is what makes it valid.',
    },
    {
      question: 'Does the VAT number have to be on the invoice?',
      answer:
        'A full VAT invoice must show the supplier VAT registration number. When VAT invoice mode is on, this page will not print until the field is filled in.',
    },
    {
      question: 'Can I use a simplified invoice for a small sale?',
      answer:
        'A simplified VAT invoice is allowed for supplies of £250 or less including VAT, if the customer agrees. This tool prints a full invoice, which is always acceptable for a VAT registered supplier.',
    },
    {
      question: 'How is VAT worked out when I give a discount?',
      answer:
        'The discount is spread across the lines first, and VAT is charged on the discounted amount. The totals on the sheet add up to the amount due, so the net, the VAT and the gross agree.',
    },
    {
      question: 'What if I invoice in USD or EUR?',
      answer:
        'You can, but HMRC requires the total VAT in sterling. Keep the invoice in GBP, or add the sterling VAT total to the notes before you send it, so the customer has the figure they need.',
    },
  ],
  sourceIds: ['uk-vat-invoices', 'uk-invoices', 'uk-vat-rates', 'uk-vat-registration'],
  related: [
    {
      label: 'UK invoice generator',
      href: '/uk/invoice-generator/',
      note: 'The normal UK invoice page without the VAT invoice switch.',
    },
    {
      label: 'Canada GST/HST invoice generator',
      href: '/ca/gst-hst-invoice-generator/',
      note: 'The Canadian equivalent with GST or HST and a business number.',
    },
    {
      label: 'Australia tax invoice generator',
      href: '/au/tax-invoice-generator/',
      note: 'The Australian tax invoice with an ABN and 10% GST.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check a VAT inclusive or exclusive figure before you type it.',
    },
  ],
};
