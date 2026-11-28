import type { CountryPageContent } from '@/data/countries/types';

/**
 * The two Canadian guides.
 *
 * Canada is the market where the invoice detail changes with the total, so the
 * GST/HST page is built around the CRA input tax credit chart rather than a
 * generic list of fields.
 */
export const CA_INVOICE_PAGE: CountryPageContent = {
  guideId: 'ca-invoice',
  meta: {
    title: 'Canada Invoice Generator',
    description:
      'Create a Canadian invoice in CAD with a business number, GST or HST and itemised tax. Print it or save it as a PDF, all in your browser.',
    eyebrow: 'Canada invoice guide',
    intro:
      'A Canadian invoice needs the parties, a date, a unique number and clear line items. If you are registered for GST/HST, the invoice also needs the tax rate and amount, and the registration number from $100.',
  },
  breadcrumbLabel: 'Canada invoice generator',
  documentName: 'Canadian invoice',
  requirements: {
    title: 'What a Canadian invoice should show',
    intro:
      'The CRA sets the detail a GST/HST registrant customer needs to support an input tax credit. The amount grows with the invoice total, so the list below is ordered by value.',
    items: [
      'Your business name or trading name and the invoice date.',
      'The total amount paid or payable.',
      'A unique invoice number and the customer name or trading name.',
      'A description of each supply, the quantity and the price.',
      'The GST/HST rate and amount, or a clear statement that the price includes it.',
      'Your GST/HST registration number when the total is $100 or more.',
      'The customer name, description and terms of payment when the total is $500 or more.',
    ],
  },
  changes: {
    title: 'What this page sets for you',
    intro:
      'Canada has three layers of sales tax: GST, HST and separate provincial taxes. The page starts with the federal GST and lets you switch to HST for a participating province.',
    items: [
      {
        label: 'Country',
        value: 'Canada',
        note: 'The invoice uses Canadian wording and a Net 30 default.',
      },
      {
        label: 'Currency',
        value: 'CAD ($)',
        note: 'Amounts are written as Canadian dollars. The selector formats, it never converts.',
      },
      {
        label: 'Tax name',
        value: 'GST or HST',
        note: 'GST is 5%. HST is 13% in Ontario, 14% in Nova Scotia and 15% in the other participating provinces.',
      },
      {
        label: 'Registration number',
        value: 'Business number',
        note: 'Add the RT program account for GST/HST, for example 00000 0000 RT0001.',
      },
      {
        label: 'GST/HST details',
        value: 'Available',
        note: 'Turn it on to require the registration number from $100 and the terms from $500.',
      },
      {
        label: 'Default terms',
        value: 'Net 30',
        note: 'The due date is 30 days after the issue date, and you can change it.',
      },
    ],
  },
  rates: {
    title: 'GST and HST rates by place of supply',
    intro:
      'The rate depends on the place of supply, not only on where your business is. A sale delivered in Ontario carries 13% HST even when the seller is in Alberta.',
    items: [
      {
        label: 'GST',
        rate: '5%',
        note: 'Non-participating provinces: Alberta, British Columbia, Manitoba, Quebec, Saskatchewan and the territories.',
      },
      {
        label: 'HST, Ontario',
        rate: '13%',
        note: 'The combined federal and provincial rate.',
      },
      {
        label: 'HST, Nova Scotia',
        rate: '14%',
        note: 'The rate has been 14% since 1 April 2025.',
      },
      {
        label: 'HST, New Brunswick, Newfoundland and Labrador, Prince Edward Island',
        rate: '15%',
        note: 'The combined federal and provincial rate.',
      },
      {
        label: 'PST or QST',
        rate: 'Separate',
        note: 'British Columbia 7% PST, Manitoba 7% RST, Saskatchewan 6% PST and Quebec 9.975% QST are separate from GST.',
      },
    ],
    note: 'You must register for GST/HST when your worldwide taxable supplies go over $30,000 in a single calendar quarter or over the last four consecutive calendar quarters.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Toronto studio invoicing a Calgary analytics company for brand strategy and website design. The place of supply is Alberta, so the lines carry 5% GST rather than Ontario HST.',
    points: [
      'The currency is CAD and the terms are Net 30.',
      'The business number is on the sheet because the customer may need it for an input tax credit.',
      'Change the tax label to HST and the line rate to 13% when the place of supply is Ontario.',
    ],
  },
  notes: [
    'Do not charge GST/HST before you are registered. Below the $30,000 threshold you can register voluntarily, but once registered you must charge the tax and file returns.',
    'HST is shown as one total rate. Do not split it into federal and provincial parts on the invoice.',
    'PST and QST are separate taxes with their own rules. This tool does not add them automatically, so enter the right rate or show the provincial tax separately.',
  ],
  faqs: [
    {
      question: 'Do I need a GST/HST number on every invoice?',
      answer:
        'The CRA requires the registration number on an invoice for a GST/HST registrant when the total is $100 or more. Under $100, the supplier name, the date and the total are the minimum detail.',
    },
    {
      question: 'Which rate do I charge?',
      answer:
        'It depends on the place of supply. GST is 5%. HST is 13% in Ontario, 14% in Nova Scotia and 15% in New Brunswick, Newfoundland and Labrador, and Prince Edward Island.',
    },
    {
      question: 'What changes at $500?',
      answer:
        'The CRA input tax credit chart also asks for the buyer name, a brief description of the supply and the terms of payment once the total reaches $500. This page keeps those fields on every invoice.',
    },
    {
      question: 'What about PST or QST?',
      answer:
        'British Columbia, Manitoba, Saskatchewan and Quebec have separate provincial taxes. This tool does not add them automatically, so put the correct rate on the line or show the provincial tax separately.',
    },
    {
      question: 'Can I charge GST/HST if I am a small supplier?',
      answer:
        'You can register voluntarily below the $30,000 threshold. Once registered, you charge the tax and file returns. If you are not registered, do not show GST/HST on the invoice.',
    },
  ],
  sourceIds: ['ca-charge', 'ca-itc', 'ca-register'],
  related: [
    {
      label: 'GST/HST invoice generator',
      href: '/ca/gst-hst-invoice-generator/',
      note: 'The input tax credit version with the $100 and $500 rules.',
    },
    {
      label: 'UK invoice generator',
      href: '/uk/invoice-generator/',
      note: 'GBP, VAT and a 14 day default for a UK invoice.',
    },
    {
      label: 'US invoice generator',
      href: '/us/invoice-generator/',
      note: 'USD, sales tax you enter yourself, and an optional EIN.',
    },
    {
      label: 'Australia invoice generator',
      href: '/au/invoice-generator/',
      note: 'AUD, GST and an ABN, with a tax invoice mode.',
    },
  ],
};

export const CA_GST_HST_INVOICE_PAGE: CountryPageContent = {
  guideId: 'ca-gst-hst-invoice',
  meta: {
    title: 'GST/HST Invoice Generator',
    seoTitle: 'Canada GST/HST Invoice Generator',
    description:
      'Create a Canadian GST/HST invoice in CAD with the registration number, the total HST rate and the details a customer needs for an input tax credit.',
    eyebrow: 'Canada GST/HST invoice',
    intro:
      'This page starts with HST at 13%, the Ontario rate, and an HST number, so the tax is shown as one total rate. Change the line rate when the place of supply is outside Ontario.',
  },
  breadcrumbLabel: 'Canada GST/HST invoice generator',
  documentName: 'GST/HST invoice',
  requirements: {
    title: 'What a GST/HST invoice needs',
    intro:
      'The CRA sets the information by invoice total. This is the input tax credit information a GST/HST registrant customer needs before they can claim the tax back.',
    items: [
      'Under $100: your business or trading name, the invoice date and the total amount.',
      '$100 to $499.99: add your GST/HST registration number, the tax amount or a statement that the price includes it, and which lines are taxable.',
      '$500 or more: add the buyer name, a description of each supply and the terms of payment.',
      'Show the GST/HST rate that applies, and show HST as one total rate.',
      'Show the amount paid or payable and the GST/HST as separate lines, or state clearly that the total includes it.',
      'Keep a copy of the invoice and the records that support it for six years.',
    ],
  },
  changes: {
    title: 'What this page sets for you',
    intro:
      'The page is built for the most common Canadian case: a service business in Ontario supply, where HST is 13% and one rate covers the whole invoice.',
    items: [
      {
        label: 'Tax name',
        value: 'HST',
        note: 'The example uses HST 13%. Use GST 5% for a non-participating province.',
      },
      {
        label: 'Registration number',
        value: 'HST number',
        note: 'The field is labelled HST number and uses the business number plus the RT account.',
      },
      {
        label: 'GST/HST details',
        value: 'On',
        note: 'The registration number is required from $100, and the terms from $500.',
      },
      {
        label: 'Currency',
        value: 'CAD ($)',
        note: 'Amounts are written as Canadian dollars. The selector formats, it never converts.',
      },
      {
        label: 'Rate shown',
        value: 'One total HST rate',
        note: 'The CRA asks for the total HST rate, not the federal and provincial parts separately.',
      },
      {
        label: 'Default terms',
        value: 'Net 30',
        note: 'The example total is over $500, so the terms are part of the invoice.',
      },
    ],
  },
  rates: {
    title: 'The HST rate depends on the place of supply',
    intro:
      'Ontario is not the only HST province, and the rate is not the same everywhere. The example uses Ontario because it is the most common case, not because every Canadian invoice uses 13%.',
    items: [
      {
        label: 'GST',
        rate: '5%',
        note: 'Non-participating provinces and the territories. Some also charge PST or QST separately.',
      },
      { label: 'HST, Ontario', rate: '13%', note: 'The combined federal and provincial rate.' },
      {
        label: 'HST, Nova Scotia',
        rate: '14%',
        note: 'The rate has been 14% since 1 April 2025.',
      },
      {
        label: 'HST, New Brunswick, Newfoundland and Labrador, Prince Edward Island',
        rate: '15%',
        note: 'The combined federal and provincial rate.',
      },
      {
        label: 'PST or QST',
        rate: 'Separate',
        note: 'British Columbia 7% PST, Manitoba 7% RST, Saskatchewan 6% PST and Quebec 9.975% QST are separate from GST.',
      },
    ],
    note: 'The CRA says to show the total HST rate and not the federal and provincial parts separately. The rate follows the place of supply.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Toronto studio invoicing an Ottawa bakery for brand strategy and packaging design. The supply is in Ontario, so the lines carry 13% HST and the invoice total is over $500.',
    points: [
      'The HST number and the terms of payment are on the sheet.',
      'The tax appears as one HST line, not as federal and provincial parts.',
      'Change the rate to 5% GST, 14% HST or 15% HST when the place of supply changes.',
    ],
  },
  notes: [
    'HST is one combined rate. Do not split the federal and provincial parts on the invoice.',
    'The place of supply decides the rate, not the address you invoice from. A Toronto seller can charge 5% GST on a supply made in Alberta.',
    'PST and QST are separate from GST and are not added by this tool. Show them separately when they apply.',
    'This is not tax advice. Check the CRA place of supply rules before you choose a rate.',
  ],
  faqs: [
    {
      question: 'What is the difference between GST and HST?',
      answer:
        'GST is the 5% federal tax in non-participating provinces. HST combines the federal and provincial parts: 13% in Ontario, 14% in Nova Scotia and 15% in New Brunswick, Newfoundland and Labrador, and Prince Edward Island.',
    },
    {
      question: 'Why does the example use 13%?',
      answer:
        'The example is an Ontario supply, so it uses HST at 13%. Change the line rate when the place of supply is in another province or territory, because the rate follows the supply rather than the seller.',
    },
    {
      question: 'When is the business number required?',
      answer:
        'For an input tax credit, the CRA asks for the supplier GST/HST registration number when the total is $100 or more, and the buyer name and terms of payment at $500 or more.',
    },
    {
      question: 'Should I show the federal and provincial parts of HST separately?',
      answer:
        'No. The CRA says to show the total HST rate, not the federal and provincial parts separately. The sheet shows one HST line at the rate you enter.',
    },
    {
      question: 'Does this handle Quebec QST?',
      answer:
        'No. Quebec has GST at 5% and QST at 9.975%. This tool does not add QST automatically, so show it separately or use the line rate your records need.',
    },
    {
      question: 'Can I use this invoice for a US client?',
      answer:
        'A cross-border sale may be zero-rated or outside the scope of GST/HST. Check the place of supply rules before you add tax, and use 0% only when that is the right treatment.',
    },
  ],
  sourceIds: ['ca-itc', 'ca-charge', 'ca-register'],
  related: [
    {
      label: 'Canada invoice generator',
      href: '/ca/invoice-generator/',
      note: 'The general Canadian invoice with GST or HST and a business number.',
    },
    {
      label: 'UK VAT invoice generator',
      href: '/uk/vat-invoice-generator/',
      note: 'The UK equivalent with a VAT number, customer address and supply date.',
    },
    {
      label: 'Australia tax invoice generator',
      href: '/au/tax-invoice-generator/',
      note: 'The Australian tax invoice with an ABN and 10% GST.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check a GST or HST inclusive figure before you type it.',
    },
  ],
};
