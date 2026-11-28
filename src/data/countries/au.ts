import type { CountryPageContent } from '@/data/countries/types';

/**
 * The two Australian guides.
 *
 * The tax invoice page is built around the ATO seven details and the $1,000
 * buyer identity rule. The general page keeps the same engine but leaves the
 * tax invoice mode off.
 */
export const AU_INVOICE_PAGE: CountryPageContent = {
  guideId: 'au-invoice',
  meta: {
    title: 'Australia Invoice Generator',
    description:
      'Create an Australian invoice in AUD with an ABN, GST and 14 day terms. Print it or save it as a PDF, with no account and no uploads.',
    eyebrow: 'Australia invoice guide',
    intro:
      'An Australian invoice needs the seller, the buyer, a date, a description and the amount. Once you are registered for GST, a tax invoice also needs your ABN and the GST amount.',
  },
  breadcrumbLabel: 'Australia invoice generator',
  documentName: 'Australian invoice',
  requirements: {
    title: 'What an Australian invoice should show',
    intro:
      'A normal invoice is a commercial document. A tax invoice is the version a GST registered buyer needs to claim a GST credit, and the ATO sets the details it must carry.',
    items: [
      'Your business name and contact details.',
      'The customer name or business name.',
      'A unique invoice number and the date you issued it.',
      'A description of what you sold, with the quantity and the price.',
      'The total amount and, if you are registered, the GST amount.',
      'Your ABN on a tax invoice, shown with your business details.',
      'The buyer identity or ABN on a tax invoice of $1,000 or more.',
    ],
  },
  changes: {
    title: 'What this page sets for you',
    intro:
      'The page starts with a normal Australian invoice and an ABN. Turn on tax invoice mode when the customer needs a GST tax invoice.',
    items: [
      {
        label: 'Country',
        value: 'Australia',
        note: 'The invoice uses Australian wording and a 14 day default.',
      },
      {
        label: 'Currency',
        value: 'AUD ($)',
        note: 'Amounts are written as Australian dollars. The selector formats, it never converts.',
      },
      {
        label: 'Tax name',
        value: 'GST',
        note: 'GST is 10%, which is one eleventh of a GST inclusive price.',
      },
      {
        label: 'Registration number',
        value: 'ABN',
        note: 'The ABN is 11 digits and is required on a tax invoice.',
      },
      {
        label: 'Tax invoice mode',
        value: 'Available',
        note: 'Turn it on to print TAX INVOICE and make the ABN required.',
      },
      {
        label: 'Default terms',
        value: 'Due within 14 days',
        note: 'The due date is 14 days after the issue date, and you can change it.',
      },
    ],
  },
  rates: {
    title: 'GST and the registration threshold',
    intro:
      'GST is 10% on most goods and services. Some supplies are GST free, and some are input taxed, which means no GST is charged and no GST credit is available.',
    items: [
      {
        label: 'GST',
        rate: '10%',
        note: 'Most goods and services sold in Australia. GST is one eleventh of a GST inclusive price.',
      },
      {
        label: 'GST free',
        rate: '0%',
        note: 'Some food, health, education and exports. No GST is charged, but the sale is still reported.',
      },
      {
        label: 'Input taxed',
        rate: 'No GST',
        note: 'Examples include financial supplies and residential rent. No GST and no GST credit.',
      },
    ],
    note: 'You must register for GST when your GST turnover reaches $75,000, or $150,000 for a non profit, and within 21 days of becoming aware you will go over the threshold.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Melbourne creative studio invoicing a Sydney retailer for a brand identity and campaign design. It is set up as a normal Australian invoice, with the ABN on the sheet and 10% GST on each line.',
    points: [
      'The currency is AUD and the terms are 14 days.',
      'The ABN prints with the business details.',
      'Turn on tax invoice mode when the customer asks for a tax invoice.',
    ],
  },
  notes: [
    'Only a GST registered business should issue a tax invoice. If you are not registered, do not charge GST or show a GST amount.',
    'For a tax invoice, the ABN is required. A normal invoice can carry it too, but the tax invoice rules are what make it mandatory.',
    'If you sell a mix of taxable and GST free items, mark which lines are GST free instead of putting 10% on everything.',
  ],
  faqs: [
    {
      question: 'Do I need an ABN?',
      answer:
        'A tax invoice must show the seller ABN. If you are not registered for GST and are issuing a normal invoice, the ABN is still useful, but the tax invoice rules do not apply until you register.',
    },
    {
      question: 'When do I have to register for GST?',
      answer:
        'You must register when your GST turnover reaches $75,000, or $150,000 for a non profit, and within 21 days of becoming aware you will go over the threshold. Taxi and ride sourcing drivers register regardless of turnover.',
    },
    {
      question: 'What is the difference between an invoice and a tax invoice?',
      answer:
        'A tax invoice includes the information a GST registered buyer needs to claim a GST credit. This page can print either one; turn on tax invoice mode for the full set of details.',
    },
    {
      question: 'How much GST is on a price?',
      answer:
        'GST is 10%, which is one eleventh of a GST inclusive price. On a $1,100 sale, the GST is $100. On a $100 sale before GST, the total is $110 and the GST is $10.',
    },
    {
      question: 'What changes over $1,000?',
      answer:
        'A tax invoice for a sale of $1,000 or more must also show the buyer identity or ABN. The customer name field is always required on this page, so the detail is there when the total crosses the line.',
    },
  ],
  sourceIds: ['au-tax-invoices', 'au-register-gst', 'au-how-to-invoice'],
  related: [
    {
      label: 'Australia tax invoice generator',
      href: '/au/tax-invoice-generator/',
      note: 'The ATO tax invoice version with the ABN and the $1,000 rule.',
    },
    {
      label: 'UK invoice generator',
      href: '/uk/invoice-generator/',
      note: 'GBP, VAT and a 14 day default for a UK invoice.',
    },
    {
      label: 'Canada invoice generator',
      href: '/ca/invoice-generator/',
      note: 'CAD, GST or HST, and a business number when the total needs one.',
    },
    {
      label: 'US invoice generator',
      href: '/us/invoice-generator/',
      note: 'USD, sales tax you enter yourself, and an optional EIN.',
    },
  ],
};

export const AU_TAX_INVOICE_PAGE: CountryPageContent = {
  guideId: 'au-tax-invoice',
  meta: {
    title: 'Tax Invoice Generator',
    seoTitle: 'Australia Tax Invoice Generator',
    description:
      'Create an Australian tax invoice with an ABN, 10% GST and the buyer details required for sales of $1,000 or more. Print it or save it as a PDF.',
    eyebrow: 'Australia tax invoice',
    intro:
      'This page prints TAX INVOICE, makes the ABN required and starts each line at 10% GST. For a sale of $1,000 or more, the buyer identity is on the sheet too.',
  },
  breadcrumbLabel: 'Australia tax invoice generator',
  documentName: 'tax invoice',
  requirements: {
    title: 'What a tax invoice must show',
    intro:
      'The ATO groups the requirements by sale value. A tax invoice for $1,000 or more includes everything a smaller one needs, plus the buyer identity or ABN.',
    items: [
      'The document must be intended as a tax invoice, and this page prints TAX INVOICE.',
      'The seller identity and the seller ABN.',
      'The date the invoice was issued.',
      'A description of each item, including quantity and price.',
      'The GST amount, or a statement that the total price includes GST.',
      'The extent to which each sale is taxable, and which lines are GST free or input taxed.',
      'For a sale of $1,000 or more, the buyer identity or ABN.',
    ],
  },
  changes: {
    title: 'What turning on tax invoice mode changes',
    intro:
      'The switch is off on the general Australian page. With it on, the sheet and the form follow the ATO tax invoice rules.',
    items: [
      {
        label: 'Sheet title',
        value: 'TAX INVOICE',
        note: 'A tax invoice must be intended as one, and the heading makes that clear.',
      },
      {
        label: 'ABN',
        value: 'Required',
        note: 'The form will not print until the seller ABN is filled in.',
      },
      {
        label: 'GST rate',
        value: '10% per line',
        note: 'Each line starts at the standard GST rate. Change a line to 0% when it is GST free.',
      },
      {
        label: 'Buyer identity',
        value: 'Required over $1,000',
        note: 'The customer name is always on the sheet, which covers the buyer identity rule.',
      },
      {
        label: 'GST amount',
        value: 'Shown separately',
        note: 'The sheet shows the GST as its own total, which is one of the two accepted methods.',
      },
      {
        label: 'Default terms',
        value: 'Due within 14 days',
        note: 'The due date is 14 days after the issue date, and you can change it.',
      },
    ],
  },
  rates: {
    title: 'GST, GST free and input taxed',
    intro:
      'The 10% rate is the standard case. A tax invoice that mixes taxable and non taxable supplies must show which lines are which, so use 0% on a GST free line and explain it in the description.',
    items: [
      {
        label: 'GST',
        rate: '10%',
        note: 'Most goods and services. GST is one eleventh of a GST inclusive price.',
      },
      {
        label: 'GST free',
        rate: '0%',
        note: 'Some food, health, education and exports. No GST is charged, but the sale is still reported.',
      },
      {
        label: 'Input taxed',
        rate: 'No GST',
        note: 'Examples include financial supplies and residential rent. No GST and no GST credit.',
      },
      {
        label: 'Buyer identity rule',
        rate: '$1,000',
        note: 'A tax invoice for a sale of $1,000 or more must show the buyer identity or ABN.',
      },
    ],
    note: 'If a customer asks for a tax invoice, you must provide one within 28 days, unless the sale is $82.50 including GST or less.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Melbourne studio invoicing a Sydney retailer for a brand identity and a block of art direction. The sale is over $1,000, so the buyer identity is part of the tax invoice, and each line carries 10% GST.',
    points: [
      'The sheet title is TAX INVOICE and the ABN is required.',
      'The buyer identity is on the sheet because the total is over $1,000.',
      'The GST is shown as its own total, separate from the net amount.',
    ],
  },
  notes: [
    'The ABN must be the seller ABN, not the buyer ABN. Check the number before you send the invoice.',
    'A tax invoice of $1,000 or more needs the buyer identity or ABN. Under $1,000 the buyer detail is not required, although this page always keeps a customer name.',
    'Do not charge GST on a supply that is GST free or input taxed. Use 0% on that line and say why in the description.',
    'Keep a copy of every tax invoice with your other tax records.',
  ],
  faqs: [
    {
      question: 'When is an invoice a tax invoice?',
      answer:
        'It must be intended as a tax invoice and contain the seller identity and ABN, the issue date, a description and price, the GST amount or a statement that the total includes GST, and the extent to which each sale is taxable.',
    },
    {
      question: 'Is the buyer ABN always required?',
      answer:
        'Only for a sale of $1,000 or more. Under $1,000 the buyer identity is not required, although the customer name field on this page is always filled in for your own records and for the larger sale case.',
    },
    {
      question: 'Can I show GST as a single total?',
      answer:
        'Yes, when every line is taxable at 10%. If the invoice mixes taxable and GST free or input taxed sales, show which lines are which and the GST that applies, so the buyer can claim the right credit.',
    },
    {
      question: 'What does Total price includes GST mean?',
      answer:
        'It is an alternative to showing the GST separately when GST is exactly one eleventh of the total price. This tool shows the GST as its own line, which is clearer and works for mixed invoices too.',
    },
    {
      question: 'How long do I have to provide a tax invoice?',
      answer:
        'If a customer asks for a tax invoice, the ATO says to provide one within 28 days, unless the sale is $82.50 including GST or less. Keep a copy with your tax records.',
    },
    {
      question: 'Can I use this for a sale under $1,000?',
      answer:
        'Yes. A tax invoice that meets the $1,000 rules also works for smaller sales. The buyer identity is simply extra detail that the ATO does not require below the threshold.',
    },
  ],
  sourceIds: ['au-tax-invoices', 'au-register-gst', 'au-how-to-invoice'],
  related: [
    {
      label: 'Australia invoice generator',
      href: '/au/invoice-generator/',
      note: 'The general Australian invoice without the tax invoice switch.',
    },
    {
      label: 'UK VAT invoice generator',
      href: '/uk/vat-invoice-generator/',
      note: 'The UK equivalent with a VAT number, customer address and supply date.',
    },
    {
      label: 'Canada GST/HST invoice generator',
      href: '/ca/gst-hst-invoice-generator/',
      note: 'The Canadian input tax credit version with GST or HST.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check the GST inside a total before you type it.',
    },
  ],
};
