/**
 * The facts behind /resources/e-invoicing-and-record-keeping/.
 *
 * This page is the one place on the site that compares e-invoicing deadlines
 * and retention periods across all eight markets. It is deliberately narrower
 * than the research it came from: no income tax, no social contributions, no
 * filing calendar and no number that was not checked against the authority
 * that owns it.
 *
 * Every claim carries the id of a source below. A row without a source does
 * not ship, which is why India has no retention row and the United States has
 * no single period.
 */

export const RECORDS_VERIFIED_ON = '2026-11-22';

export interface RecordsSource {
  id: string;
  label: string;
  url: string;
  /** What this source is used for on the page. */
  note: string;
}

/**
 * The short name used on the inline source chips.
 *
 * Two IRS pages, two FTA pages and two ATO pages appear on the same page, so
 * the first word of the label is not enough to tell them apart.
 */
export const SOURCE_SHORT_LABELS: Readonly<Record<string, string>> = {
  'rec-uk-roadmap': 'HMRC roadmap',
  'rec-uk-records': 'GOV.UK records',
  'rec-uk-vat-records': 'VAT Notice 700/21',
  'rec-uk-mtd': 'GOV.UK MTD',
  'rec-us-business-taxes': 'IRS business taxes',
  'rec-us-1099': 'IRS 1099',
  'rec-us-records': 'IRS records',
  'rec-ca-records': 'CRA records',
  'rec-ca-invoices': 'CRA invoices',
  'rec-au-records': 'ATO records',
  'rec-au-invoices': 'ATO invoices',
  'rec-de-einvoice': 'BMF e-invoicing',
  'rec-de-retention': 'UStG 14b',
  'rec-ch-records': 'KMU records',
  'rec-ch-qr': 'SIX QR-bill',
  'rec-in-einvoice': 'GST e-invoice',
  'rec-in-rule46': 'CBIC Rule 46',
  'rec-ae-einvoice': 'FTA e-invoicing',
  'rec-ae-dates': 'FTA dates',
  'rec-ae-records': 'FTA legislation',
};

export const RECORDS_SOURCES: readonly RecordsSource[] = [
  {
    id: 'rec-uk-roadmap',
    label: 'HMRC: Roadmap for e-invoicing implementation',
    url: 'https://www.gov.uk/government/publications/e-invoicing-implementation-roadmap/roadmap-for-e-invoicing-implementation',
    note: 'VAT registered persons must issue and receive VAT invoices as e-invoices from 1 April 2029, with Peppol as the core network. Consumer and cross-border sales are outside the requirement.',
  },
  {
    id: 'rec-uk-records',
    label: 'GOV.UK: How long to keep your records if you are self-employed',
    url: 'https://www.gov.uk/self-employed-records/how-long-to-keep-your-records',
    note: 'Self-employed records must be kept for at least five years after the 31 January submission deadline of the relevant tax year.',
  },
  {
    id: 'rec-uk-vat-records',
    label: 'HMRC: Record keeping (VAT Notice 700/21)',
    url: 'https://www.gov.uk/guidance/record-keeping-for-vat-notice-70021',
    note: 'VAT records must generally be kept for at least six years.',
  },
  {
    id: 'rec-uk-mtd',
    label: 'GOV.UK: Making Tax Digital for Income Tax',
    url: 'https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax',
    note: 'Quarterly digital updates for sole traders over the qualifying income threshold, starting from 6 April 2026.',
  },
  {
    id: 'rec-us-business-taxes',
    label: 'IRS: Business taxes',
    url: 'https://www.irs.gov/businesses/business-taxes',
    note: 'The federal business taxes are income tax, self-employment tax, employment tax and excise tax. No federal invoice format or e-invoicing requirement appears among them.',
  },
  {
    id: 'rec-us-1099',
    label: 'IRS: Instructions for Forms 1099-MISC and 1099-NEC',
    url: 'https://www.irs.gov/instructions/i1099mec',
    note: 'For payments made after 31 December 2025 the reporting threshold for Forms 1099-NEC and 1099-MISC is 2,000 US dollars per payee for the year.',
  },
  {
    id: 'rec-us-records',
    label: 'IRS: How long should I keep records?',
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records',
    note: 'The period depends on the tax issue: three years generally, six years where income is understated by more than 25%, and indefinitely where no return was filed.',
  },
  {
    id: 'rec-ca-records',
    label: 'CRA: Keeping records',
    url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc188/keeping-records.html',
    note: 'Records must be kept for six years from the end of the last tax year they relate to, unless the CRA gives permission to destroy them earlier.',
  },
  {
    id: 'rec-ca-invoices',
    label: 'CRA: GST/HST records to keep',
    url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/gst-hst-records-keep.html',
    note: 'Paper and readable electronic invoices are accepted for GST/HST, with no structured B2B e-invoicing mandate.',
  },
  {
    id: 'rec-au-records',
    label: 'ATO: Records you need to keep',
    url: 'https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/overview-of-record-keeping-rules-for-business',
    note: 'Most business records, including tax invoices and GST records, must be kept for five years.',
  },
  {
    id: 'rec-au-invoices',
    label: 'ATO: Tax invoices',
    url: 'https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/tax-invoices',
    note: 'The tax invoice requirements for sales above and below 1,000 Australian dollars. No B2B e-invoicing mandate is part of the rule.',
  },
  {
    id: 'rec-de-einvoice',
    label: 'BMF: E-invoicing FAQ',
    url: 'https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html',
    note: 'Receiving structured e-invoices has been mandatory since 1 January 2025. Issuing is mandatory from 1 January 2027 above 800,000 euros of prior-year turnover and from 1 January 2028 for all, with Kleinunternehmer exempt from issuing.',
  },
  {
    id: 'rec-de-retention',
    label: 'UStG 14b: Retaining invoices',
    url: 'https://www.gesetze-im-internet.de/ustg_1980/__14b.html',
    note: 'Invoices must be kept for eight years from the end of the calendar year of issue, reduced from ten years from 1 January 2025.',
  },
  {
    id: 'rec-ch-records',
    label: 'KMU Portal: Retention of accounting records',
    url: 'https://www.kmu.admin.ch/en/preservation-of-electronic-invoices-and-accounting-documents-must-comply-with-strict-rules',
    note: 'Art. 958f CO requires accounting records and invoices to be kept for 10 years from the end of the financial year.',
  },
  {
    id: 'rec-ch-qr',
    label: 'SIX: Swiss Implementation Guidelines QR-bill',
    url: 'https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.2-en.pdf',
    note: 'The QR-bill is the payment part Swiss banks accept for a scanned payment. It is not an e-invoice and Switzerland has no general B2B e-invoicing mandate.',
  },
  {
    id: 'rec-in-einvoice',
    label: 'GST e-Invoice: Frequently asked questions',
    url: 'https://einvoice.gst.gov.in/faqs',
    note: 'IRN and QR reporting through the Invoice Registration Portal, required above the prescribed aggregate turnover, currently 5 crore rupees.',
  },
  {
    id: 'rec-in-rule46',
    label: 'CBIC: CGST Rules, Rule 46 (tax invoice)',
    url: 'https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter6/rule46_v1.00.html',
    note: 'The tax invoice particulars and the export endorsement printed on an invoice issued under a Letter of Undertaking.',
  },
  {
    id: 'rec-ae-einvoice',
    label: 'FTA: UAE e-Invoicing',
    url: 'https://tax.gov.ae/en/content/uae.einvoicing.aspx',
    note: 'The structured e-invoicing system under Ministerial Decisions 243 and 244 of 2025, and the statement that PDF, Word, images and scans are not e-invoices.',
  },
  {
    id: 'rec-ae-dates',
    label: 'FTA: e-invoicing deadlines and penalties',
    url: 'https://tax.gov.ae/en/media.centre/news/federal.tax.authority.calls.on.persons.subject.to.einvoicing.to.comply.wit.the.prescribed.legal.deadlines.and.avoid.administrative.penalties.aspx',
    note: 'Businesses at or above AED 50 million appoint an accredited service provider by 30 October 2026 and go live on 1 January 2027. Smaller businesses appoint one by 31 March 2027 and go live on 1 July 2027. The penalty is AED 5,000 for each month of delay.',
  },
  {
    id: 'rec-ae-records',
    label: 'FTA: UAE tax legislation',
    url: 'https://tax.gov.ae/en/legislation.aspx',
    note: 'VAT records must be kept for five years and corporate tax records for seven years, counted from the end of the tax period.',
  },
];

export interface EInvoicingRow {
  /** The market, as the site names it. */
  country: string;
  /** The state of play today, in four words or fewer. */
  status: 'No mandate' | 'Live now' | 'Dated mandate' | 'Already required';
  /** What changes and when, as a short line. */
  next: string;
  /** Who is in scope, or what counts. */
  scope: string;
  /** The detail worth knowing. */
  note: string;
  sourceIds: readonly string[];
}

export const EINVOICING_ROWS: readonly EInvoicingRow[] = [
  {
    country: 'United States',
    status: 'No mandate',
    next: 'Nothing announced',
    scope: 'Private B2B is voluntary',
    note: 'There is no federal B2B or B2C e-invoicing requirement and no federal invoice format. The federal rule that touches a contractor invoice is information reporting, not the invoice layout.',
    sourceIds: ['rec-us-business-taxes', 'rec-us-1099'],
  },
  {
    country: 'United Kingdom',
    status: 'Dated mandate',
    next: '1 April 2029',
    scope: 'VAT invoices between VAT registered businesses and public bodies',
    note: 'Both issuing and receiving become electronic, over Peppol. A PDF, an image or an email does not count. Consumer sales and cross-border sales are outside the requirement. Making Tax Digital for Income Tax runs alongside it, with quarterly updates from 6 April 2026 above £50,000 of qualifying income.',
    sourceIds: ['rec-uk-roadmap', 'rec-uk-mtd'],
  },
  {
    country: 'Canada',
    status: 'No mandate',
    next: 'Nothing announced',
    scope: 'Paper or readable electronic invoices',
    note: 'The CRA accepts paper and electronic invoices. Registration, the tax rate and the invoice details depend on the province of supply.',
    sourceIds: ['rec-ca-invoices'],
  },
  {
    country: 'Australia',
    status: 'No mandate',
    next: 'Nothing announced',
    scope: 'Tax invoices as the ATO describes them',
    note: 'Current ATO tax invoice rules do not require B2B e-invoicing. A valid tax invoice above 1,000 Australian dollars needs the buyer identity or ABN.',
    sourceIds: ['rec-au-invoices'],
  },
  {
    country: 'Germany',
    status: 'Already required',
    next: 'Issue from 1 January 2027, all from 1 January 2028',
    scope: 'Domestic B2B, with Kleinunternehmer exempt from issuing',
    note: 'Receiving a structured e-invoice has been mandatory since 1 January 2025. Issuing starts with businesses above 800,000 euros of prior-year turnover, then covers all remaining domestic B2B suppliers.',
    sourceIds: ['rec-de-einvoice'],
  },
  {
    country: 'Switzerland',
    status: 'No mandate',
    next: 'Nothing announced',
    scope: 'B2B invoicing is not prescribed',
    note: 'A PDF or a paper invoice stays valid. A QR-bill is a payment part that banks accept, not an e-invoice.',
    sourceIds: ['rec-ch-qr'],
  },
  {
    country: 'India',
    status: 'Already required',
    next: 'Above 5 crore rupees of turnover',
    scope: 'Registered businesses above the e-invoicing threshold',
    note: 'An in-scope invoice is reported to the Invoice Registration Portal and carries an IRN and a QR code. A PDF on its own is not the clearance.',
    sourceIds: ['rec-in-einvoice', 'rec-in-rule46'],
  },
  {
    country: 'United Arab Emirates',
    status: 'Dated mandate',
    next: '1 January 2027 for large businesses, 1 July 2027 below AED 50 million',
    scope: 'B2B and B2G transactions in scope',
    note: 'Invoices are exchanged as structured data through an accredited service provider and reported to the FTA. The FTA says PDFs, Word files, images, scans and emails are not e-invoices.',
    sourceIds: ['rec-ae-einvoice', 'rec-ae-dates'],
  },
];

export interface RetentionRow {
  country: string;
  /** The period in words, as the authority states it. */
  period: string;
  /** When the clock starts. */
  from: string;
  note: string;
  sourceIds: readonly string[];
}

export const RETENTION_ROWS: readonly RetentionRow[] = [
  {
    country: 'United States',
    period: '3 years, longer for some issues',
    from: 'The date the return was filed',
    note: 'Six years where income is understated by more than 25 per cent, seven years for a worthless security or bad debt claim, and indefinitely where no return was filed.',
    sourceIds: ['rec-us-records'],
  },
  {
    country: 'United Kingdom',
    period: '5 years for income tax, 6 years for VAT',
    from: '31 January after the tax year, and the end of the VAT period',
    note: 'The VAT period is the longer of the two, so a VAT registered freelancer keeps the invoice for six years.',
    sourceIds: ['rec-uk-records', 'rec-uk-vat-records'],
  },
  {
    country: 'Canada',
    period: '6 years',
    from: 'The end of the last tax year the record relates to',
    note: 'Records must be kept in Canada unless the CRA gives written permission for storage elsewhere.',
    sourceIds: ['rec-ca-records'],
  },
  {
    country: 'Australia',
    period: '5 years',
    from: 'When the record was prepared or the transaction completed',
    note: 'Some records need to be kept longer, for example records for a depreciating asset until the end of the year it is disposed of.',
    sourceIds: ['rec-au-records'],
  },
  {
    country: 'Germany',
    period: '8 years',
    from: 'The end of the calendar year of issue',
    note: 'The period was ten years until 31 December 2024. An e-invoice has to be kept in its original structured format.',
    sourceIds: ['rec-de-retention'],
  },
  {
    country: 'Switzerland',
    period: '10 years',
    from: 'The end of the financial year',
    note: 'Article 958f of the Code of Obligations applies to the books and to the invoices behind them.',
    sourceIds: ['rec-ch-records'],
  },
  {
    country: 'United Arab Emirates',
    period: '5 years for VAT, 7 years for corporate tax',
    from: 'The end of the tax period',
    note: 'The longer period applies to the records that support a corporate tax return.',
    sourceIds: ['rec-ae-records'],
  },
];

export interface CrossBorderNote {
  title: string;
  body: string;
  sourceIds: readonly string[];
}

export const CROSS_BORDER_NOTES: readonly CrossBorderNote[] = [
  {
    title: 'The customer address is not the place of supply',
    body: 'A supply is taxed where the rules say it is supplied, not where the invoice is posted. Training a client team in Melbourne for a US employer is an Australian supply. Work on UAE property stays a UAE supply even when the invoice goes to a foreign head office.',
    sourceIds: ['rec-ae-einvoice'],
  },
  {
    title: 'A PDF is still a document, not a clearance',
    body: 'Germany, India and the UAE now separate the readable invoice from the structured record. In Germany the structured file is what has to be archived from 2025. In India the IRN comes from the portal. In the UAE the exchange goes through an accredited service provider.',
    sourceIds: ['rec-de-einvoice', 'rec-in-einvoice', 'rec-ae-einvoice'],
  },
  {
    title: 'Cross-border sales sit outside the UK 2029 rule',
    body: 'The UK requirement covers VAT invoices between UK VAT registered persons. HMRC says e-invoices are not required for cross-border transactions, because a UK VAT invoice is not required for them. The existing place of supply rules still decide the VAT.',
    sourceIds: ['rec-uk-roadmap'],
  },
];

export interface RecordsFaq {
  question: string;
  answer: string;
}

export const RECORDS_FAQS: readonly RecordsFaq[] = [
  {
    question: 'Does this page replace my accountant?',
    answer:
      'No. It is a dated index of what the authorities publish, with a link to each one. It does not decide your place of supply, your registration or your liability, and it does not calculate income tax or social contributions.',
  },
  {
    question: 'Why is there no Indian retention period in the table?',
    answer:
      'Because the CGST and income tax rules were not confirmed against a primary source before this page was published. A blank cell with a reason is more useful than a number that might be wrong, so the row is left out until the rule is checked.',
  },
  {
    question: 'Why is there no single United States figure?',
    answer:
      'The IRS does not set one period for every record. Three years is the usual starting point, six years applies where income is understated by more than 25 per cent, and some records are kept indefinitely. The table shows the range rather than a tidy number.',
  },
  {
    question: 'Do I have to stop sending PDF invoices?',
    answer:
      'Only where a rule says so. In Germany, India and the UAE an in-scope business already needs a structured record, and the UK requires one from 1 April 2029. The United States, Canada, Australia and Switzerland still accept a readable invoice.',
  },
  {
    question: 'What should I do first?',
    answer:
      'Match your own situation to the table, then read the linked page for that market. If you are in scope for a dated mandate, the practical step is to choose a service provider before the appointment deadline, not on the go live date.',
  },
];
