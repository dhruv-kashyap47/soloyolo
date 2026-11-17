import type { CountryPageContent } from '@/data/countries/types';

/**
 * The two United Arab Emirates guides.
 *
 * The normal page covers a business that is not registered for VAT. The VAT
 * page covers a registered business, the supplier and customer TRN, and the
 * UAE e-invoicing boundary under Ministerial Decision 244/2025.
 */
export const AE_INVOICE_PAGE: CountryPageContent = {
  guideId: 'ae-invoice',
  meta: {
    title: 'UAE Invoice Generator',
    description:
      'Create a UAE invoice in AED with VAT terms and an optional TRN. Print it or save it as a PDF, with no account and no uploads, for a business below the VAT threshold.',
    eyebrow: 'UAE invoice guide',
    intro:
      'A UAE invoice may be issued in Arabic or English. This English site prints an English invoice with AED amounts. A business below the VAT registration threshold does not charge VAT or show a TRN.',
  },
  breadcrumbLabel: 'UAE invoice generator',
  documentName: 'UAE invoice',
  requirements: {
    title: 'What a UAE invoice must include',
    intro:
      'A normal commercial invoice needs the parties, the number, the date, the description and the amount. A registered business adds its TRN, the VAT rate and the VAT amount.',
    items: [
      'The supplier’s name and address, and the TRN where the business is registered for VAT.',
      'The customer’s name and address, and the customer TRN where the customer is registered.',
      'A unique invoice number and the date the invoice was issued.',
      'A description of the goods or services, the quantity and the unit price.',
      'The amount before VAT, the VAT rate and amount, and the total including VAT where registered.',
      'The invoice may be issued in Arabic or English. This tool prints English.',
    ],
  },
  changes: {
    title: 'What this page sets for you',
    intro:
      'The UAE defaults use AED, VAT terms and a 30 day payment period. The TRN stays optional on this page, because the example business is not registered.',
    items: [
      {
        label: 'Country',
        value: 'United Arab Emirates',
        note: 'The invoice uses UAE VAT wording, AED and a 30 day default.',
      },
      {
        label: 'Currency',
        value: 'AED',
        note: 'Amounts print with the AED code. The selector formats, it never converts.',
      },
      {
        label: 'Tax name',
        value: 'VAT',
        note: 'The standard rate is 5%. Zero-rated supplies use 0%, and exempt supplies are outside the VAT total.',
      },
      {
        label: 'Registration number',
        value: 'TRN',
        note: 'A 15 digit number issued by the Federal Tax Authority. Leave it blank if the business is not registered.',
      },
      {
        label: 'Invoice title',
        value: 'INVOICE',
        note: 'The normal invoice prints INVOICE. The tax invoice page prints TAX INVOICE.',
      },
      {
        label: 'Customer TRN',
        value: 'Optional',
        note: 'A registered customer needs its TRN on the invoice. A consumer sale has none.',
      },
      {
        label: 'Default terms',
        value: 'Net 30',
        note: 'The due date is 30 days after the issue date, and you can change it.',
      },
    ],
  },
  rates: {
    title: 'VAT rates and the registration thresholds',
    intro:
      'The standard rate is 5%. Registration is compulsory above AED 375,000 of taxable supplies and imports, and voluntary above AED 187,500.',
    items: [
      {
        label: 'Standard rate',
        rate: '5%',
        note: 'Most goods and services supplied in the UAE.',
      },
      {
        label: 'Zero rate',
        rate: '0%',
        note: 'Zero-rated supplies such as exports and certain international services. Zero rated is not the same as exempt.',
      },
      {
        label: 'Mandatory registration',
        rate: 'AED 375,000',
        note: 'The threshold for taxable supplies and imports over the previous 12 months, or the next 30 days.',
      },
      {
        label: 'Voluntary registration',
        rate: 'AED 187,500',
        note: 'The lower threshold for voluntary registration where taxable supplies or expenses exceed it.',
      },
    ],
    note: 'VAT is a consumption tax on supplies. UAE corporate tax is a separate direct tax on business profits; it is not VAT and it does not replace the 5% VAT on an invoice.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Dubai design studio below the VAT registration threshold, invoicing a local retail business. The currency is AED, no line carries VAT, and the business has no TRN.',
    points: [
      'The sheet title is INVOICE and the amounts are in AED.',
      'No VAT is charged, because the example business is not registered.',
      'The customer TRN is blank, and the invoice is still a clear commercial document.',
      'Use the VAT invoice page when the business is registered and has a TRN.',
    ],
  },
  notes: [
    'A business must register for VAT once taxable supplies and imports exceed AED 375,000 over the previous 12 months or are expected to exceed it in the next 30 days.',
    'VAT is not corporate tax. The 5% VAT on a supply is separate from the corporate tax on business profits, and one does not replace the other.',
    'An invoice may be issued in Arabic or English. This tool prints English, and it does not produce an Arabic or right-to-left document.',
    'Print or PDF is not a UAE e-invoice. The e-invoicing programme uses structured data reported to the Federal Tax Authority.',
  ],
  faqs: [
    {
      question: 'Do I need to register for VAT to use this page?',
      answer:
        'No. The normal page is for a business below the compulsory threshold and leaves the TRN and the VAT lines empty. A registered business should use the VAT invoice page, where the TRN is required.',
    },
    {
      question: 'What is a TRN?',
      answer:
        'The Tax Registration Number is the 15 digit number the Federal Tax Authority issues when a business registers for VAT. It is shown on a tax invoice together with the supplier’s name and address.',
    },
    {
      question: 'Is corporate tax the same as VAT?',
      answer:
        'No. VAT is a 5% tax on taxable supplies. Corporate tax is a direct tax on business profits. They are separate taxes with separate registrations and returns, and an invoice shows VAT, not corporate tax.',
    },
    {
      question: 'Can I issue the invoice in English?',
      answer:
        'Yes. A UAE invoice may be issued in Arabic or English, and this tool prints English. It does not produce an Arabic or right-to-left version.',
    },
    {
      question: 'Do I need an e-invoice?',
      answer:
        'The UAE e-invoicing programme requires structured electronic invoices reported to the Federal Tax Authority for businesses in scope. A PDF or a printed document is not an e-invoice; an accredited service provider is needed for the structured exchange.',
    },
    {
      question: 'What payment terms are normal?',
      answer:
        'Thirty days is a common default. The page starts with Net 30 and you can change the due date and the terms to match what you agreed with the customer.',
    },
  ],
  sourceIds: ['ae-vat', 'ae-registration', 'ae-einvoice', 'ae-legislation', 'ae-corporate'],
  related: [
    {
      label: 'UAE VAT invoice generator',
      href: '/ae/vat-invoice-generator/',
      note: 'The registered business version with a supplier TRN, a customer TRN and 5% VAT.',
    },
    {
      label: 'GST invoice generator for India',
      href: '/in/gst-invoice-generator/',
      note: 'GSTIN, place of supply and the CGST + SGST or IGST split.',
    },
    {
      label: 'Swiss invoice generator',
      href: '/ch/invoice-generator/',
      note: 'CHF, MWST wording and a business below the registration threshold.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check a VAT inclusive or exclusive figure before you type it.',
    },
  ],
};

export const AE_VAT_INVOICE_PAGE: CountryPageContent = {
  guideId: 'ae-vat-invoice',
  meta: {
    title: 'UAE VAT Invoice Generator',
    description:
      'Create a UAE VAT tax invoice in AED with a supplier TRN, a customer TRN and 5% VAT. Print it or save it as a PDF, with the e-invoicing boundary explained.',
    eyebrow: 'UAE VAT invoice',
    intro:
      'A UAE VAT tax invoice shows the supplier TRN and, where the customer is registered, the customer TRN. This page sets the TAX INVOICE title, makes the supplier TRN required and starts every line at 5%.',
  },
  breadcrumbLabel: 'UAE VAT invoice generator',
  documentName: 'VAT tax invoice',
  requirements: {
    title: 'What a UAE VAT tax invoice must show',
    intro:
      'The Federal Tax Authority expects a tax invoice to identify the supplier, the customer, the supply and the VAT. The customer TRN is needed where the customer is registered.',
    items: [
      'The supplier’s name, address and TRN.',
      'The customer’s name and address, and the customer TRN where the customer is registered.',
      'A unique invoice number and the date the invoice was issued.',
      'A description of the goods or services, the quantity and the unit price.',
      'The amount before VAT, the VAT rate and the VAT amount.',
      'The total including VAT, and the currency of the amounts.',
      'The invoice may be issued in Arabic or English. This tool prints English.',
    ],
  },
  changes: {
    title: 'What turning on VAT invoice mode changes',
    intro:
      'The page is already in tax invoice mode, so the TRN, the 5% rate and the tax invoice title are part of the sheet from the first screen.',
    items: [
      {
        label: 'Sheet title',
        value: 'TAX INVOICE',
        note: 'The title makes it plain that the document is a VAT tax invoice.',
      },
      {
        label: 'Your TRN',
        value: 'Required',
        note: 'The form will not print until the 15 digit supplier TRN is filled in.',
      },
      {
        label: 'Customer TRN',
        value: 'Where registered',
        note: 'A registered customer needs its TRN on the invoice. A consumer sale leaves it blank.',
      },
      {
        label: 'Both addresses',
        value: 'Required',
        note: 'The supplier and customer names and addresses are part of the tax invoice.',
      },
      {
        label: 'Line rate',
        value: '5% default',
        note: 'Every line starts at the standard rate. Change it to 0% only for a zero-rated supply.',
      },
    ],
  },
  rates: {
    title: 'UAE VAT and the e-invoicing boundary',
    intro:
      'The standard rate is 5%. The registration thresholds decide who must charge it, and the e-invoicing programme decides which invoices must be reported as structured data.',
    items: [
      {
        label: 'Standard rate',
        rate: '5%',
        note: 'Most goods and services supplied in the UAE.',
      },
      {
        label: 'Zero rate',
        rate: '0%',
        note: 'Zero-rated supplies such as exports and certain international services.',
      },
      {
        label: 'Mandatory registration',
        rate: 'AED 375,000',
        note: 'The threshold for taxable supplies and imports over the previous 12 months or the next 30 days.',
      },
      {
        label: 'Voluntary registration',
        rate: 'AED 187,500',
        note: 'The lower threshold for voluntary registration.',
      },
      {
        label: 'E-invoicing decision',
        rate: '244/2025',
        note: 'Ministerial Decision 244/2025 sets the structured e-invoicing system. A PDF is not an e-invoice.',
      },
    ],
    note: 'Corporate tax is separate from VAT. A business can be registered for VAT and charge 5% on a supply without the invoice showing anything about corporate tax.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a registered Dubai studio invoicing a retail business in the same emirate. The amounts are in AED, every line carries 5% VAT, the supplier TRN and the customer TRN are both on the sheet, and the invoice totals AED 35,700.00 with AED 1,700.00 of VAT.',
    points: [
      'The sheet title is TAX INVOICE and the amounts are in AED.',
      'The supplier TRN is required, and the customer TRN appears because the customer is registered.',
      'Each line carries 5%, and the VAT is shown separately from the net amount.',
      'Use the normal UAE page for a business below the registration threshold.',
    ],
  },
  notes: [
    'Only a registered business charges VAT and shows a TRN. Registration is compulsory above AED 375,000 of taxable supplies and imports, and voluntary above AED 187,500.',
    'A business customer needs its TRN on the invoice to support its input tax claim. A consumer sale has no TRN, so the field stays blank.',
    'The invoice may be issued in Arabic or English. This tool prints English and does not produce an Arabic or right-to-left document.',
    'Print or PDF is not a UAE e-invoice. Ministerial Decision 244/2025 requires structured data reported to the Federal Tax Authority, and an in-scope business needs an accredited service provider.',
  ],
  faqs: [
    {
      question: 'Is the customer TRN always required?',
      answer:
        'It is required where the customer is registered for VAT, because the invoice supports the customer’s input tax claim. A consumer sale has no TRN, so the field stays blank. The example on this page shows a registered customer.',
    },
    {
      question: 'Is the VAT rate always 5%?',
      answer:
        'The standard rate is 5%. Some supplies are zero rated at 0%, such as exports and certain international services, and some are exempt. Enter the rate that applies to the supply, and do not assume every line is 5%.',
    },
    {
      question: 'Does a PDF count as a UAE e-invoice?',
      answer:
        'No. The Federal Tax Authority says unstructured formats such as PDF, Word documents, images, scans and emails are not e-invoices. The e-invoicing programme uses structured data exchanged with the authority.',
    },
    {
      question: 'Can I issue the invoice in Arabic?',
      answer:
        'A UAE invoice may be issued in Arabic or English. This tool prints English and does not produce an Arabic or right-to-left layout. Use an Arabic template or a service provider if you need one.',
    },
    {
      question: 'Is UAE corporate tax shown on the invoice?',
      answer:
        'No. Corporate tax is a direct tax on business profits and is separate from VAT. The invoice shows the 5% VAT on the supply, not corporate tax.',
    },
    {
      question: 'What is the difference between zero rated and exempt?',
      answer:
        'A zero-rated supply is taxable at 0%, so it is reported and can allow input tax recovery. An exempt supply is outside the VAT charged on the invoice and generally does not allow input tax recovery. Check the treatment before you set the line rate.',
    },
  ],
  sourceIds: ['ae-vat', 'ae-registration', 'ae-einvoice', 'ae-legislation', 'ae-corporate'],
  related: [
    {
      label: 'UAE invoice generator',
      href: '/ae/invoice-generator/',
      note: 'The non-registered version with no VAT and no TRN requirement.',
    },
    {
      label: 'GST invoice generator for India',
      href: '/in/gst-invoice-generator/',
      note: 'GSTIN, place of supply and the CGST + SGST or IGST split.',
    },
    {
      label: 'Swiss VAT invoice generator',
      href: '/ch/vat-invoice-generator/',
      note: 'A CHF invoice with the CHE number and 8.1% MWST.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check a VAT inclusive or exclusive figure before you type it.',
    },
  ],
};
