import type { CountryPageContent } from '@/data/countries/types';

/**
 * The two Germany guides.
 *
 * The normal page covers a Kleinunternehmer invoice under §19 UStG: no VAT,
 * no USt-IdNr. and the statutory note. The VAT page covers a registered
 * business with the full §14(4) details and the e-invoicing boundary.
 */
export const DE_INVOICE_PAGE: CountryPageContent = {
  guideId: 'de-invoice',
  meta: {
    title: 'German Invoice Generator',
    description:
      'Create a German Rechnung in EUR with a Kleinunternehmer example, the §19 note and the §14(4) details. Print it or save it as a PDF, with no account and no uploads.',
    eyebrow: 'Germany invoice guide',
    intro:
      'A German invoice is called a Rechnung. It carries both parties, a unique number, the dates and the amount, and a Kleinunternehmer adds the statutory note that no VAT is charged.',
  },
  breadcrumbLabel: 'Germany invoice generator',
  documentName: 'Rechnung',
  requirements: {
    title: 'What a German invoice must include',
    intro:
      'UStG §14(4) sets the particulars for a Rechnung. A small business under §19 UStG keeps the same invoice details and adds the note that no Umsatzsteuer is charged.',
    items: [
      'The full name and address of your business and of the customer, as §14(4) UStG requires.',
      'Your Steuernummer or USt-IdNr. A Kleinunternehmer shows the tax number issued by the tax office.',
      'A unique, sequential invoice number and the date the invoice was issued.',
      'The date the supply was made, where it differs from the invoice date.',
      'The quantity and a commercial description of the goods or services, and the amount charged.',
      'The tax rate and the tax amount, or the §19 note that no VAT is charged.',
    ],
  },
  changes: {
    title: 'What this page sets for you',
    intro:
      'The German defaults save typing. They do not decide whether you are a Kleinunternehmer or whether a supply is taxable; those are your facts and your tax adviser’s call.',
    items: [
      {
        label: 'Country',
        value: 'Germany',
        note: 'The invoice uses German wording, a Rechnung title and a 14 day default.',
      },
      {
        label: 'Currency',
        value: 'EUR (€)',
        note: 'Amounts are written in euros. The selector formats, it never converts.',
      },
      {
        label: 'Tax name',
        value: 'MwSt',
        note: 'Umsatzsteuer at 19% standard, 7% reduced and 0% for specific supplies.',
      },
      {
        label: 'Registration number',
        value: 'Tax number or VAT ID',
        note: 'A Kleinunternehmer can show a Steuernummer. A registered business uses a USt-IdNr. in the DE123456789 form.',
      },
      {
        label: 'Invoice title',
        value: 'RECHNUNG',
        note: 'The German title prints on the normal invoice and on the VAT invoice.',
      },
      {
        label: 'Supply date',
        value: 'Included',
        note: 'The §14(4) list asks for the date of the supply. It starts at the issue date and can be changed.',
      },
      {
        label: 'Default terms',
        value: 'Due within 14 days',
        note: '14 days is common practice, not a rule in the UStG. Change it to match your agreement.',
      },
    ],
  },
  rates: {
    title: 'Umsatzsteuer rates and the §19 limits',
    intro:
      'The rate depends on the supply. Most services are standard rated, so a small business must check the §19 turnover limits before it decides not to charge VAT.',
    items: [
      {
        label: 'Standard rate',
        rate: '19%',
        note: 'Most goods and services, including most freelance and consulting work.',
      },
      {
        label: 'Reduced rate',
        rate: '7%',
        note: 'The supplies listed in Anlage 2 to the UStG, such as most food and printed books.',
      },
      {
        label: 'Zero rate',
        rate: '0%',
        note: 'Specific supplies under §12(3) UStG, such as solar modules and their installation.',
      },
      {
        label: 'Kleinunternehmer, previous year',
        rate: '€25,000',
        note: 'The §19 limit on total turnover in the previous calendar year.',
      },
      {
        label: 'Kleinunternehmer, current year',
        rate: '€100,000',
        note: 'The §19 limit on total turnover in the current calendar year.',
      },
    ],
    note: 'The §19 limits are €25,000 for the previous calendar year and €100,000 for the current one. A business over either limit cannot use the Kleinunternehmer rule for that year.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a Berlin design studio invoicing a Munich café. It is a Kleinunternehmer invoice: the currency is EUR, no line carries VAT, and the notes carry the statutory sentence that no Umsatzsteuer is charged.',
    points: [
      'The sheet title is RECHNUNG and the amounts are in euros.',
      'The tax rate on every line is empty, because the example business uses the §19 rule.',
      'The note reads: Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
      'Use the VAT invoice page when the business is registered and has a USt-IdNr.',
    ],
  },
  notes: [
    'Only a business registered for VAT charges Umsatzsteuer and shows a USt-IdNr. A Kleinunternehmer shows the §19 note instead.',
    'The 14 day due date is common practice, not a rule in the UStG. Change it to match what you agreed with the customer.',
    'Print or PDF is not a compliant domestic B2B e-invoice. Receiving has been mandatory since 1 January 2025; issuing follows the 2027 and 2028 timetable.',
    'The tool does not check whether you are a Kleinunternehmer. Check your turnover against the §19 limits with your tax adviser.',
  ],
  faqs: [
    {
      question: 'Can a Kleinunternehmer use this page?',
      answer:
        'Yes. The normal page starts with a Kleinunternehmer example: no VAT on the lines, no USt-IdNr. required, and a notes field that explains the §19 treatment. Keep the statutory sentence on the invoice.',
    },
    {
      question: 'What is the difference between a USt-IdNr. and a Steuernummer?',
      answer:
        'The Steuernummer is issued by your local tax office. The USt-IdNr. is issued by the Federal Central Tax Office and is used for cross-border supplies. §14(4) accepts either one on a Rechnung.',
    },
    {
      question: 'When is the reduced 7% rate available?',
      answer:
        'Only for the supplies listed in Anlage 2 to the UStG, such as most food, books and newspapers. Most services, including design and consulting, are standard rated at 19%.',
    },
    {
      question: 'Is a PDF invoice enough in Germany?',
      answer:
        'For a domestic B2B supply, a PDF is an ordinary invoice and is not a structured e-invoice. Receiving has been mandatory since 1 January 2025. Issuing becomes mandatory for turnover above €800,000 from 1 January 2027 and for all businesses from 1 January 2028.',
    },
    {
      question: 'What payment terms are normal?',
      answer:
        'Fourteen or thirty days are common. The page starts with 14 days because it is a frequent practice, but the UStG does not set a payment period. Change the due date and the terms to what you agreed.',
    },
  ],
  sourceIds: [
    'de-ustg-invoice',
    'de-ustg-small',
    'de-ustg-rates',
    'de-bmf-einvoice',
    'de-einvoice-formats',
  ],
  related: [
    {
      label: 'German VAT invoice generator',
      href: '/de/vat-invoice-generator/',
      note: 'The registered business version with a USt-IdNr. and 19% Umsatzsteuer.',
    },
    {
      label: 'Swiss invoice generator',
      href: '/ch/invoice-generator/',
      note: 'CHF, MWST wording and the Art. 26 invoice details.',
    },
    {
      label: 'UAE VAT invoice generator',
      href: '/ae/vat-invoice-generator/',
      note: 'AED, a supplier TRN and the UAE e-invoicing boundary.',
    },
    {
      label: 'VAT, GST and sales tax calculator',
      href: '/calculators/vat-gst-sales-tax-calculator/',
      note: 'Check a VAT inclusive or exclusive figure before you type it.',
    },
  ],
};

export const DE_VAT_INVOICE_PAGE: CountryPageContent = {
  guideId: 'de-vat-invoice',
  meta: {
    title: 'German VAT Invoice Generator',
    description:
      'Create a German VAT invoice (Rechnung) in EUR with a USt-IdNr., both addresses, the supply date and 19% Umsatzsteuer. Print it or save it as a PDF.',
    eyebrow: 'Germany VAT invoice',
    intro:
      'A German VAT invoice is a Rechnung with the full §14(4) details. This page sets the RECHNUNG title, makes the USt-IdNr., both addresses and the supply date required, and starts every line at 19%.',
  },
  breadcrumbLabel: 'Germany VAT invoice generator',
  documentName: 'VAT invoice',
  requirements: {
    title: 'What a German VAT invoice must show',
    intro:
      'The list follows UStG §14(4). A full Rechnung is expected for a supply to another business, and the same details support the customer’s input VAT claim.',
    items: [
      'The full name and address of the supplier and of the customer.',
      'The supplier’s Steuernummer or USt-IdNr., issued by the tax office or the Federal Central Tax Office.',
      'The date the invoice was issued and a sequential number that identifies it once.',
      'The date the supply was made, where it differs from the invoice date.',
      'The quantity and commercial description of the supply, and the amount charged for it.',
      'The tax rate and the tax amount, broken down by rate, or a note that the supply is exempt.',
    ],
  },
  changes: {
    title: 'What turning on VAT invoice mode changes',
    intro:
      'The general generator lets you switch the mode. On this page it is already on, so the sheet and the form follow the German VAT rules from the first screen.',
    items: [
      {
        label: 'Sheet title',
        value: 'RECHNUNG',
        note: 'A German invoice keeps the German title in VAT mode; it does not switch to an English heading.',
      },
      {
        label: 'USt-IdNr. or Steuernummer',
        value: 'Required',
        note: 'The form will not print until a registration number is filled in.',
      },
      {
        label: 'Both addresses',
        value: 'Required',
        note: '§14(4) asks for the full name and address of the supplier and the customer.',
      },
      {
        label: 'Supply date',
        value: 'Required',
        note: 'The date of the supply is part of the §14(4) list. It starts at the issue date.',
      },
      {
        label: 'Tax rate',
        value: '19% default',
        note: 'Every line starts at the standard rate. Change a line to 7% or 0% only where the supply qualifies.',
      },
    ],
  },
  rates: {
    title: 'VAT rates and the e-invoicing timetable',
    intro:
      'The rate is a property of the supply, not of the invoice. The timetable below is about the format of a domestic B2B invoice.',
    items: [
      {
        label: 'Standard rate',
        rate: '19%',
        note: 'Most goods and services, including most freelance and consulting work.',
      },
      {
        label: 'Reduced rate',
        rate: '7%',
        note: 'The supplies listed in Anlage 2 to the UStG, such as most food and printed books.',
      },
      {
        label: 'Zero rate',
        rate: '0%',
        note: 'Specific supplies under §12(3) UStG, such as solar modules and their installation.',
      },
      {
        label: 'E-invoice issuing, large business',
        rate: '2027',
        note: 'Businesses with turnover above €800,000 in the previous year must issue structured e-invoices from 1 January 2027.',
      },
      {
        label: 'E-invoice issuing, all businesses',
        rate: '2028',
        note: 'The obligation reaches all domestic B2B businesses from 1 January 2028. Kleinunternehmer are exempt from issuing.',
      },
    ],
    note: 'Receiving an e-invoice has been mandatory since 1 January 2025. A PDF alone does not meet the structured e-invoice requirement.',
  },
  scenario: {
    title: 'The example on this page',
    body: 'The example is a registered Berlin studio invoicing a Munich café for a brand identity and a block of campaign design hours. Every line carries 19% Umsatzsteuer, the USt-IdNr. is on the sheet, and the supply date is today.',
    points: [
      'The sheet title is RECHNUNG, the currency is EUR and the lines carry 19%.',
      'The USt-IdNr., both addresses and the supply date are required before printing.',
      'The VAT is shown separately from the net amount, so the customer can see the tax they paid.',
      'Use the normal Germany page for a Kleinunternehmer invoice with no VAT.',
    ],
  },
  notes: [
    'Only a business registered for VAT issues a VAT invoice. Do not add a USt-IdNr. or charge Umsatzsteuer before the registration is in place.',
    'A PDF is not a compliant domestic B2B e-invoice. XRechnung and ZUGFeRD are structured formats; this tool prints and does not integrate with either.',
    'Receiving an e-invoice has been mandatory since 1 January 2025. Issuing is mandatory from 1 January 2027 above €800,000 of turnover and from 1 January 2028 for all businesses; Kleinunternehmer are exempt from issuing.',
    'Kleinunternehmer are exempt from the issuing obligation, even after 2028, but they must still be able to receive an e-invoice since 1 January 2025.',
    'Reverse charge and VAT group invoices are outside this tool. One document carries one registration number and one tax treatment.',
  ],
  faqs: [
    {
      question: 'When must a German business issue an e-invoice?',
      answer:
        'Receiving has been mandatory since 1 January 2025. Issuing is mandatory from 1 January 2027 where turnover in the previous year exceeded €800,000, and from 1 January 2028 for all domestic B2B businesses. Kleinunternehmer are exempt from issuing.',
    },
    {
      question: 'Is XRechnung the same as ZUGFeRD?',
      answer:
        'No. XRechnung is a structured XML invoice. ZUGFeRD is a hybrid: a PDF with an embedded structured data file. Both can meet the EN 16931 standard when the profile is right; the BMF FAQ and the federal e-invoicing portal explain the details.',
    },
    {
      question: 'Can I send a PDF and call it an e-invoice?',
      answer:
        'No. A PDF without a structured data part is an ordinary invoice, not an e-invoice. It can still be valid as an invoice in the transition period, but it does not meet the structured e-invoice requirement.',
    },
    {
      question: 'Can I use the 7% rate on a service?',
      answer:
        'Only if the service is in the list in Anlage 2 to the UStG. Most services, including design, consulting and software work, are standard rated at 19%. Check the specific supply before you change the line rate.',
    },
    {
      question: 'What must a Rechnung show?',
      answer:
        'Both names and addresses, the supplier’s tax number or USt-IdNr., the issue date, a unique number, the supply date, a description and quantity, the amount, and the tax rate and amount or an exemption note.',
    },
    {
      question: 'Can I invoice a customer outside Germany?',
      answer:
        'The form still prints a Rechnung, but cross-border VAT, reverse charge and export rules are outside this tool. Check the place of supply and the applicable rule before you send one.',
    },
  ],
  sourceIds: ['de-ustg-invoice', 'de-ustg-rates', 'de-bmf-einvoice', 'de-einvoice-formats'],
  related: [
    {
      label: 'German invoice generator',
      href: '/de/invoice-generator/',
      note: 'The Kleinunternehmer version with no VAT and the §19 note.',
    },
    {
      label: 'Swiss VAT invoice generator',
      href: '/ch/vat-invoice-generator/',
      note: 'The Swiss 8.1% MWST invoice with the Art. 26 details.',
    },
    {
      label: 'GST invoice generator for India',
      href: '/in/gst-invoice-generator/',
      note: 'GSTIN, place of supply and the CGST + SGST or IGST split.',
    },
    {
      label: 'Australia tax invoice generator',
      href: '/au/tax-invoice-generator/',
      note: 'A TAX INVOICE with the ABN and 10% GST.',
    },
  ],
};
