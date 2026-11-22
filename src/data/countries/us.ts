import type { CountryPageContent } from '@/data/countries/types';

/**
 * The United States guide.
 *
 * There is no federal invoice format and no federal sales tax. The page is
 * written around that fact: the invoice is a commercial document, the rate is
 * entered by the seller, and the tool never guesses a location.
 */
export const US_INVOICE_PAGE: CountryPageContent = {
  guideId: 'us-invoice',
  meta: {
    title: 'US Invoice Generator',
    description:
      'Create a US invoice in USD with an optional EIN, itemised lines and sales tax you enter yourself. Print it or save it as a PDF, all in your browser.',
    eyebrow: 'United States invoice guide',
    intro:
      'A US invoice needs clear parties, a unique number, dates and itemised charges. Sales tax is set by state and local governments, so this page leaves the rate to you and never guesses a location.',
  },
  breadcrumbLabel: 'US invoice generator',
  documentName: 'US invoice',
  requirements: {
    title: 'What a US invoice should show',
    intro:
      'There is no federal invoice format. The details below are what a client and a bookkeeper expect to see, and what most state tax offices ask for when a sale is taxable.',
    items: [
      'Your business name, address and contact details.',
      'The customer name, company and address.',
      'A unique invoice number and the date you issued it.',
      'A due date and the payment terms, for example Net 30.',
      'A description, quantity, unit price and amount for each line.',
      'The subtotal, any discount, sales tax if you charge it, and the total.',
      'Your EIN or another tax ID if the customer asks for one. It is not a federal invoice requirement.',
    ],
  },
  changes: {
    title: 'What this page sets for you',
    intro:
      'The country selector drives these defaults. You can still change the currency or the tax label when a document crosses a border.',
    items: [
      {
        label: 'Country',
        value: 'United States',
        note: 'The invoice uses US wording and a Net 30 default.',
      },
      {
        label: 'Currency',
        value: 'USD ($)',
        note: 'Amounts are written as US dollars. The selector formats, it never converts.',
      },
      {
        label: 'Tax name',
        value: 'Sales tax',
        note: 'There is no federal rate, so the line rate is yours to enter.',
      },
      {
        label: 'Registration number',
        value: 'EIN, optional',
        note: 'The EIN prints only when you fill it in. No federal rule requires it on an invoice.',
      },
      {
        label: 'Tax invoice title',
        value: 'None',
        note: 'The sheet says INVOICE. A US invoice is a commercial document, not a VAT invoice.',
      },
      {
        label: 'Default terms',
        value: 'Net 30',
        note: 'The due date is 30 days after the issue date, and you can change it.',
      },
    ],
  },
  rates: {
    title: 'Sales tax is not a national rate',
    intro:
      'The United States has no federal sales tax. Rates are set by state and local governments, and whether a sale is taxable depends on the place of supply and your registration there.',
    items: [
      {
        label: 'State and local sales tax',
        rate: 'Varies',
        note: 'Enter the combined rate for the customer location when the sale is taxable.',
      },
      {
        label: 'Federal sales tax',
        rate: 'None',
        note: 'The IRS does not set a national sales tax rate.',
      },
    ],
    note: 'This page does not look up a rate and does not decide whether you should charge one. That depends on your registrations and the rules for the sale.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Texas studio invoicing a Colorado client for a brand identity, a landing page and a strategy workshop. Sales tax is left at zero on purpose, because whether the sale is taxable depends on the seller’s registration and the place of supply.',
    points: [
      'The currency is USD and the terms are Net 30.',
      'The EIN field is optional and prints only when it is filled in.',
      'Add sales tax only when you are registered where the sale is taxable.',
    ],
  },
  notes: [
    'Do not add sales tax before you are registered where the sale is taxable. Charging a tax you cannot remit causes problems for you and your customer.',
    'State and local rates change. Check the state revenue office before you send a taxable invoice.',
    'A US client that pays you for services now reports the total on Form 1099-NEC once it reaches 2,000 USD for payments made after 31 December 2025. The invoice is what the client reads to fill that form in, so keep the legal name and address accurate.',
    'A contractor working outside the United States sends the client Form W-8BEN or W-8BEN-E instead of a W-9. The form is about withholding on the payment, not about the invoice.',
    'This is not tax advice. The tool does not decide nexus, taxability or the rate for a sale.',
  ],
  faqs: [
    {
      question: 'Do I need an EIN on a US invoice?',
      answer:
        'No federal rule requires an EIN on an invoice. Some clients ask for a tax ID before they pay, so the field is there when you need it, and it stays off the sheet when you leave it blank.',
    },
    {
      question: 'How do I work out sales tax?',
      answer:
        'Use the combined state and local rate that applies where the sale is taxed, if you are registered there. The tool does not look up rates or decide whether a sale is taxable, so check your state revenue office.',
    },
    {
      question: 'Can I invoice in another currency?',
      answer:
        'Yes. The currency selector changes how the amounts are written, not what they are. It does not convert the figures, so the number you type is the number on the sheet.',
    },
    {
      question: 'What payment terms should I use?',
      answer:
        'Net 30 is common, but the terms are yours. Put the date you expect payment and the method on the invoice so the customer has no reason to guess.',
    },
    {
      question: 'Does a US invoice have to look a certain way?',
      answer:
        'There is no federal format. State rules and your contract matter more, so keep the parties, dates, line items and total clear, and keep a copy of every invoice you send.',
    },
    {
      question: 'Will my client send me a 1099-NEC?',
      answer:
        'Usually only above the reporting threshold. For payments made after 31 December 2025 the threshold is 2,000 US dollars per payee for the year, up from 600. Your earnings are taxable whether or not a form arrives.',
    },
  ],
  sourceIds: ['us-irs-business-taxes', 'us-state-websites', 'us-sba-pay-taxes', 'us-ein', 'us-1099'],
  related: [
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
      label: 'Australia invoice generator',
      href: '/au/invoice-generator/',
      note: 'AUD, GST and an ABN, with a tax invoice mode.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Add or remove a tax rate with the right words for the market.',
    },
  ],
};
