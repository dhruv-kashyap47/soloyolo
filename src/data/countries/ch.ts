import type { CountryPageContent } from '@/data/countries/types';

/**
 * The two Switzerland guides.
 *
 * The normal page covers a business below the CHF 100,000 threshold: no MWST
 * number, no VAT on the lines. The VAT page covers a registered business and
 * the MWST / TVA / IVA label switch, with the Art. 26 MWSTG details.
 */
export const CH_INVOICE_PAGE: CountryPageContent = {
  guideId: 'ch-invoice',
  meta: {
    title: 'Swiss Invoice Generator',
    description:
      'Create a Swiss invoice in CHF with MWST, TVA or IVA wording and the Art. 26 details. Print it or save it as a PDF, with no account and no uploads.',
    eyebrow: 'Switzerland invoice guide',
    intro:
      'A Swiss invoice is written in CHF and may use the German MWST, French TVA or Italian IVA name for the tax. A business below the CHF 100,000 threshold does not charge VAT or show a MWST number.',
  },
  breadcrumbLabel: 'Switzerland invoice generator',
  documentName: 'Swiss invoice',
  requirements: {
    title: 'What a Swiss invoice must include',
    intro:
      'Art. 26 MWSTG sets the invoice contents for a registered business. A business that is not registered still sends a normal commercial invoice, without VAT and without a MWST number.',
    items: [
      'The name and address of the supplier and of the recipient.',
      'The date the supply was made, where it differs from the invoice date.',
      'The date the invoice was issued and a number that identifies it once.',
      'A description of the supply, its quantity and the price charged for it.',
      'The tax rate and the tax amount, where the supplier is registered for VAT.',
      'The MWST number in the CHE-123.456.789 MWST form, where the supplier is registered.',
    ],
  },
  changes: {
    title: 'What this page sets for you',
    intro:
      'The Swiss defaults are deliberately neutral. Switzerland has four official languages, so the English site prints INVOICE and lets you choose the tax label.',
    items: [
      {
        label: 'Country',
        value: 'Switzerland',
        note: 'The invoice uses Swiss wording, CHF and a 30 day default.',
      },
      {
        label: 'Currency',
        value: 'CHF',
        note: 'Amounts print with the CHF code. The selector formats, it never converts.',
      },
      {
        label: 'Tax name',
        value: 'MWST, TVA or IVA',
        note: 'VAT is the default English label. Switch to MWST, TVA or IVA for the language of your customer.',
      },
      {
        label: 'Registration number',
        value: 'MWST number',
        note: 'Only a registered business has one. The number is the UID with the suffix MWST, TVA or IVA.',
      },
      {
        label: 'Invoice title',
        value: 'INVOICE',
        note: 'The English title is the neutral choice on a multilingual Swiss document.',
      },
      {
        label: 'Default terms',
        value: 'Net 30',
        note: 'The due date is 30 days after the issue date, and you can change it.',
      },
    ],
  },
  rates: {
    title: 'MWST rates and the registration threshold',
    intro:
      'The current rates have applied since 1 January 2024. A business below the registration threshold does not charge them and does not show a MWST number.',
    items: [
      {
        label: 'Normal rate',
        rate: '8.1%',
        note: 'Most goods and services, including most freelance and consulting work.',
      },
      {
        label: 'Reduced rate',
        rate: '2.6%',
        note: 'Specific goods and services such as most food, medicines, books and newspapers.',
      },
      {
        label: 'Accommodation rate',
        rate: '3.8%',
        note: 'Accommodation services, including overnight stays with breakfast.',
      },
      {
        label: 'Registration threshold',
        rate: 'CHF 100,000',
        note: 'Worldwide turnover from taxable or zero-rated supplies in a year before a business becomes liable to VAT.',
      },
    ],
    note: 'A ballot on 29 November 2026 could raise the normal rate to 8.5% and the accommodation rate to 4.0% from 2028. The current 8.1% and 3.8% stay in force until any change takes effect, and the reduced 2.6% rate is unchanged.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Zurich design studio invoicing a local café below the CHF 100,000 threshold. The tax label is MWST, the currency is CHF, no line carries VAT, and the business has no MWST number yet.',
    points: [
      'The sheet title is INVOICE and the amounts are in CHF.',
      'The tax label can be switched to MWST, TVA or IVA without changing the amounts.',
      'No VAT is charged, because the example business is below the registration threshold.',
      'Use the VAT invoice page when the business is registered and has a MWST number.',
    ],
  },
  notes: [
    'A business below the CHF 100,000 threshold does not charge VAT and must not show a MWST number. It can register voluntarily, for example to recover input tax.',
    'The MWST number is your UID with the suffix MWST, TVA or IVA. The ESTV does not accept the English suffix VAT on the number.',
    'A Swiss invoice paid by bank transfer usually carries a QR-bill: the payment part with the Swiss QR code at the bottom of the sheet. It is a payment slip, not an e-invoice, and this page does not print one.',
    'Keep invoices and the books they belong to for 10 years from the end of the financial year. Switzerland has no general B2B e-invoicing mandate.',
    'A ballot on 29 November 2026 could change the normal and accommodation rates from 2028. The current rates apply until any change takes effect.',
    'This tool prints a document. It does not submit an e-invoice or report anything to the ESTV.',
  ],
  faqs: [
    {
      question: 'When does a Swiss business have to register for VAT?',
      answer:
        'When its worldwide turnover from taxable or zero-rated supplies reaches CHF 100,000 a year. A new business can be liable from the start if it expects to reach the threshold within twelve months. Voluntary registration is possible below it.',
    },
    {
      question: 'Can I write VAT on a Swiss invoice?',
      answer:
        'You can use VAT as the English label for the tax on this site, because the page copy is English. The MWST number itself must use MWST, TVA or IVA; the ESTV does not accept the English suffix VAT on the number.',
    },
    {
      question: 'Which suffix should the MWST number use?',
      answer:
        'Use MWST in German-speaking Switzerland, TVA in the Romandie and IVA in Ticino. It is the same number in every case, and the suffix should match the language of the invoice.',
    },
    {
      question: 'What are the current Swiss VAT rates?',
      answer:
        'The normal rate is 8.1%, the reduced rate is 2.6% and the accommodation rate is 3.8%. They have applied since 1 January 2024 and stay in force until a change takes effect.',
    },
    {
      question: 'What happens if the 29 November 2026 ballot passes?',
      answer:
        'The proposal would raise the normal rate to 8.5% and the accommodation rate to 4.0% from 2028. The reduced 2.6% rate is unchanged. Do not use the proposed figures until the change actually takes effect.',
    },
    {
      question: 'Can I invoice a Swiss customer in EUR?',
      answer:
        'The currency selector formats amounts without converting them. A Swiss VAT invoice normally uses CHF, and the VAT amount should be clear in the currency of the invoice. Check with your accountant before you invoice in another currency.',
    },
  ],
  sourceIds: ['ch-mwstg', 'ch-estv-rates', 'ch-registration', 'ch-uid', 'ch-ballot', 'ch-records', 'ch-qr-bill'],
  related: [
    {
      label: 'Swiss VAT invoice generator',
      href: '/ch/vat-invoice-generator/',
      note: 'The registered business version with a MWST number and 8.1% VAT.',
    },
    {
      label: 'German invoice generator',
      href: '/de/invoice-generator/',
      note: 'EUR, Rechnung wording and a Kleinunternehmer invoice with no VAT.',
    },
    {
      label: 'UAE invoice generator',
      href: '/ae/invoice-generator/',
      note: 'AED, VAT terms and a business that is not VAT registered.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check a tax inclusive or exclusive figure before you type it.',
    },
  ],
};

export const CH_VAT_INVOICE_PAGE: CountryPageContent = {
  guideId: 'ch-vat-invoice',
  meta: {
    title: 'Swiss VAT Invoice Generator',
    description:
      'Create a Swiss VAT invoice in CHF with an 8.1% MWST line rate, the CHE number and the Art. 26 details. Switch the tax label between MWST, TVA and IVA.',
    eyebrow: 'Switzerland VAT invoice',
    intro:
      'A Swiss VAT invoice is an invoice from a registered business. This page sets the MWST number, both addresses and the Art. 26 details, starts every line at 8.1%, and lets the tax label move between MWST, TVA and IVA.',
  },
  breadcrumbLabel: 'Switzerland VAT invoice generator',
  documentName: 'VAT invoice',
  requirements: {
    title: 'What a Swiss VAT invoice must show',
    intro:
      'Art. 26 MWSTG lists the details. The invoice must identify both parties, the supply, the price and the tax, and it must carry the supplier’s MWST number.',
    items: [
      'The name and address of the supplier and of the recipient.',
      'The date the supply was made, where it differs from the invoice date.',
      'The date the invoice was issued and a number that identifies it once.',
      'A description of the supply, its quantity and the price charged for it.',
      'The tax rate and the tax amount, or the note that the supply is exempt or outside the scope.',
      'The supplier’s MWST number in the CHE-123.456.789 MWST form, with MWST, TVA or IVA.',
    ],
  },
  changes: {
    title: 'What turning on VAT invoice mode changes',
    intro:
      'The page is already in VAT invoice mode, so the Art. 26 fields and the MWST number are part of the sheet from the first screen.',
    items: [
      {
        label: 'Sheet title',
        value: 'INVOICE',
        note: 'Switzerland has no single language, so the English title stays neutral even in VAT mode.',
      },
      {
        label: 'MWST number',
        value: 'Required',
        note: 'The form will not print until the CHE number is filled in.',
      },
      {
        label: 'Both addresses',
        value: 'Required',
        note: 'Art. 26 asks for the name and address of the supplier and the recipient.',
      },
      {
        label: 'Tax label',
        value: 'MWST, TVA or IVA',
        note: 'The label can follow the language of the customer. The rate and the amount stay the same.',
      },
      {
        label: 'Line rate',
        value: '8.1% default',
        note: 'Every line starts at the normal rate. Change it to 2.6% or 3.8% only where the supply qualifies.',
      },
    ],
  },
  rates: {
    title: 'Swiss VAT rates and the rate watch',
    intro:
      'The current rates apply from 1 January 2024. The November 2026 ballot is a watch item, not a change that has taken effect.',
    items: [
      {
        label: 'Normal rate',
        rate: '8.1%',
        note: 'Most goods and services, including most freelance and consulting work.',
      },
      {
        label: 'Reduced rate',
        rate: '2.6%',
        note: 'Specific goods and services such as most food, medicines, books and newspapers.',
      },
      {
        label: 'Accommodation rate',
        rate: '3.8%',
        note: 'Accommodation services, including overnight stays with breakfast.',
      },
      {
        label: 'Proposed normal rate from 2028',
        rate: '8.5%',
        note: 'Only if the 29 November 2026 ballot passes. Do not use it as a current rate before the change takes effect.',
      },
    ],
    note: 'The reduced 2.6% rate is unchanged by the ballot proposal. The current 8.1% and 3.8% stay in force until any change takes effect, at the earliest in 2028.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a registered Geneva studio invoicing a Zurich café. The tax label is TVA, the currency is CHF, every line carries 8.1% MWST and the CHE number is on the sheet.',
    points: [
      'The sheet title is INVOICE and the amounts are in CHF.',
      'The tax label is TVA for the French-speaking customer; MWST and IVA are the other two options.',
      'The CHE number is required, and the VAT is shown separately from the net amount.',
      'Use the normal Switzerland page for a business below the CHF 100,000 threshold.',
    ],
  },
  notes: [
    'Only a registered business charges MWST and shows a MWST number. Registration is compulsory above CHF 100,000 of relevant worldwide turnover, and voluntary below it.',
    'The MWST number must use the MWST, TVA or IVA suffix. The ESTV does not accept the English abbreviation VAT on the number, even when the invoice copy is in English.',
    'A Swiss invoice paid by bank transfer usually carries a QR-bill: the payment part with the Swiss QR code at the bottom of the sheet. It is a payment slip, not an e-invoice, and this page does not print one.',
    'Keep invoices and the books they belong to for 10 years from the end of the financial year. Switzerland has no general B2B e-invoicing mandate.',
    'The 29 November 2026 ballot could raise the normal rate to 8.5% and the accommodation rate to 4.0% from 2028. The reduced 2.6% rate is unchanged.',
    'This tool prints a document. It does not submit an e-invoice, report to the ESTV or check a customer’s VAT status.',
  ],
  faqs: [
    {
      question: 'Which suffix should I use on the MWST number?',
      answer:
        'Use MWST for a German-speaking customer, TVA for a French-speaking customer and IVA for an Italian-speaking customer. It is the same number, and the suffix should match the language of the invoice.',
    },
    {
      question: 'Is the standard rate 8.1% or 8.5%?',
      answer:
        'The current standard rate is 8.1%. The 8.5% figure is a proposal that would apply from 2028 only if the 29 November 2026 ballot passes. Do not print 8.5% as a current rate before the change takes effect.',
    },
    {
      question: 'When does the reduced 2.6% rate apply?',
      answer:
        'To the categories listed in the VAT Act, such as most food, medicines, newspapers, magazines, books and electronic publications without advertising character. The ballot proposal does not change it.',
    },
    {
      question: 'When does the 3.8% accommodation rate apply?',
      answer:
        'To accommodation services in the hotel and accommodation business, including overnight stays with breakfast. The ballot proposal would raise it to 4.0% from 2028 if it passes.',
    },
    {
      question: 'Can I use EUR on a Swiss VAT invoice?',
      answer:
        'The selector formats the amounts and does not convert them. A Swiss VAT invoice normally uses CHF, and the tax amount should be clear in the currency of the invoice. Check with your accountant before using another currency.',
    },
    {
      question: 'Is this an e-invoice?',
      answer:
        'No. It is a printable invoice or PDF. It is not submitted to the ESTV and it is not an e-invoice under any Swiss reporting requirement. The tool does not integrate with an e-invoicing service.',
    },
  ],
  sourceIds: ['ch-mwstg', 'ch-estv-rates', 'ch-uid', 'ch-registration', 'ch-ballot', 'ch-records', 'ch-qr-bill'],
  related: [
    {
      label: 'Swiss invoice generator',
      href: '/ch/invoice-generator/',
      note: 'The non-registered version with no VAT and no MWST number.',
    },
    {
      label: 'German VAT invoice generator',
      href: '/de/vat-invoice-generator/',
      note: 'A Rechnung with a USt-IdNr. and 19% Umsatzsteuer.',
    },
    {
      label: 'GST invoice generator for India',
      href: '/in/gst-invoice-generator/',
      note: 'GSTIN, place of supply and the CGST + SGST or IGST split.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check a tax inclusive or exclusive figure before you type it.',
    },
  ],
};
