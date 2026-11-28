# Tax research to shipped facts (slice 10)

The brief (`tax_research.md`) covered eight markets across income tax, social
contributions, indirect tax, e-invoicing and retention. Shipping all of it would
turn a rate-free invoice tool into a tax product with annual numbers to maintain.
This slice takes the part that is structural, stable and already part of the
invoice story, and leaves the arithmetic out.

## 1. Decision

| Option | What it is                                         | Outcome                                   |
| ------ | -------------------------------------------------- | ----------------------------------------- |
| E      | Dated facts added to existing country guides       | Shipped                                   |
| A      | Cross-border wording in the generator (DE, IN, AE) | Shipped                                   |
| B      | One page comparing e-invoicing and retention       | Shipped                                   |
| D      | Income tax and take-home estimators                | **Rejected** (plan §1, T-32)              |
| -      | Publishing the research document as an article     | **Rejected** (YMYL, no per-claim sources) |

Reasons for rejecting D are unchanged from T-32: sub-national rates, annual
churn, and the site's own rule that a rate without a source and a date does not
go on it. The tax calculator stays rate-free on purpose.

## 2. What was verified, against what

Checked 2026-11-22 unless the country config already carried an earlier date.

| Fact                                                                                                                                                                                         | Source                                                            | Where it ships                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| UK: VAT invoices between VAT registered persons must be issued and received as e-invoices from 1 April 2029, over Peppol; B2C and cross-border out of scope                                  | GOV.UK, _Roadmap for e-invoicing implementation_, 28 October 2026 | `/uk/invoice-generator/`, `/uk/vat-invoice-generator/`, records page |
| UK: self-employed records 5 years after the 31 January deadline; VAT records 6 years                                                                                                         | GOV.UK self-employed records; VAT Notice 700/21                   | UK guides, records page                                              |
| UK: Making Tax Digital for Income Tax from 6 April 2026 above £50,000 of 2024-25 qualifying income                                                                                           | GOV.UK MTD for Income Tax                                         | UK guide, records page                                               |
| US: 1099-NEC and 1099-MISC reporting threshold 2,000 USD for payments after 31 December 2025                                                                                                 | IRS, Instructions for Forms 1099-MISC and 1099-NEC                | US guide, records page                                               |
| US: record retention depends on the issue, 3 years generally, 6 years above a 25 per cent understatement                                                                                     | IRS, How long should I keep records                               | records page                                                         |
| CA: 6 years from the end of the last tax year                                                                                                                                                | CRA, Keeping records (RC188)                                      | records page                                                         |
| CA: paper and readable electronic invoices accepted, no B2B e-invoicing mandate                                                                                                              | CRA, GST/HST records to keep                                      | records page                                                         |
| AU: 5 years                                                                                                                                                                                  | ATO, record keeping for business                                  | records page                                                         |
| DE: receiving mandatory since 1 January 2025; issuing from 1 January 2027 above €800,000 and from 1 January 2028 for the rest                                                                | BMF e-invoicing FAQ (already in the DE config)                    | DE guides                                                            |
| DE: invoices kept 8 years from the end of the calendar year (was 10 before 2025)                                                                                                             | UStG § 14b                                                        | DE guides, records page                                              |
| DE: B2B services are supplied where the customer runs its business; both USt-IdNr. belong on the invoice                                                                                     | UStG § 3a(2), § 14a(1)                                            | DE generator, DE guide                                               |
| CH: 10 years from the end of the financial year                                                                                                                                              | Art. 958f CO, KMU Portal                                          | CH guides, records page                                              |
| CH: QR-bill is a payment part, not an e-invoice; no general B2B mandate                                                                                                                      | SIX QR-bill implementation guidelines                             | CH guide, records page                                               |
| IN: IRN and QR through the Invoice Registration Portal above 5 crore rupees                                                                                                                  | GST e-Invoice FAQ, CBIC Rule 46 (already in the IN config)        | IN guide, records page                                               |
| IN: the Rule 46 export endorsement under a Letter of Undertaking                                                                                                                             | CBIC CGST Rules, Rule 46                                          | IN generator, records page                                           |
| AE: AED 50 million or more appoints an accredited service provider by 30 October 2026 and goes live 1 January 2027; below that, 31 March 2027 and 1 July 2027; AED 5,000 per month for delay | FTA news release, 25 October 2026                                 | AE guides, records page                                              |
| AE: PDF, Word, images, scans and email are not e-invoices                                                                                                                                    | FTA, UAE e-Invoicing page                                         | AE guides, records page                                              |
| AE: VAT records 5 years, corporate tax records 7 years                                                                                                                                       | FTA legislation (Federal Decree-Law 47/2022, Art. 56)             | AE guide, records page                                               |

## 3. What the research contained that was not shipped

| Claim                                                                                                            | Why not                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Income tax bands, SE tax, NI, CPP, GST/HST, provisional, KSK, AHV, India slabs, UAE CT and Small Business Relief | D, rejected. Numbers, not structure                                                                       |
| India invoice retention                                                                                          | Not confirmed against a primary source. The records page says so in one line instead of printing a figure |
| US 7 year retention from vendor guidance                                                                         | Not statutory. Replaced with the IRS periods-of-limitation table                                          |
| India Section 393, Form 140, Form 145/146 and the presumptive-tax rewrite                                        | Not verified against an official publication in this pass                                                 |
| UAE Ministerial Decision 131 of 2026 extending Small Business Relief                                             | Not verified in this pass. No UAE tax-rate claim was added                                                |
| UK reverse-charge restriction proposed for 1 April 2027                                                          | The research itself notes the draft legislation was not published. Nothing is claimed                     |
| German § 233a interest change in the Jahressteuergesetz 2026                                                     | Pending Bundesrat in the research. Not shipped                                                            |
| Payday Super, IR35 size thresholds, W-8BEN validity, FX conversion rules, Swiss B2G threshold                    | Out of this slice's surface. A generator field or a country note is not the right home for them           |

## 4. Option A: how the cross-border control works

The generator gains one optional block per country config:

```ts
invoice: {
  crossBorderLabel: 'Cross-border treatment',
  crossBorder: [
    {
      value: 'eu-reverse-charge',
      label: 'EU business customer (reverse charge)',
      hint: '...',
      endorsement: 'Nicht steuerbar nach § 3a Abs. 2 UStG. ...',
      zeroRated: true,
      customerTaxIdRequired: true,
      customerTaxIdLabel: 'Customer USt-IdNr.',
      ...
    },
  ],
}
```

Behaviour:

- The select appears only where the config offers an option, and only in tax
  invoice mode, so a Kleinunternehmer on the German normal page never sees a
  reverse-charge control. The US, UK, CA, AU and CH forms are unchanged.
- Selecting a zero-rated treatment sets every line rate to zero at resolve
  time. The draft keeps the typed rate, so switching back restores it.
- The endorsement prints between the totals and the notes. Every option
  carries its own sentence, so a wording change is data.
- Germany also shows a customer USt-IdNr. field, required by validation, and
  prints it in the customer block.
- India hides the place-of-supply and GST split controls when the export
  treatment is selected, because neither applies to an export under LUT.
- Quotes and receipts never print a treatment.

The control records a decision the freelancer has already made. It does not
decide place of supply, and the copy says so.

## 5. Option B: the records page

`/resources/e-invoicing-and-record-keeping/` renders `src/data/records.ts`:

- eight e-invoicing rows, each with a status, a date or threshold, a scope and
  its sources;
- seven retention rows, each with the period, the start of the clock and its
  sources;
- three cross-border notes and five questions;
- a sources block that lists only what the page cited, with the checked date.

There is no India retention row and no single US period. Both omissions are
explained on the page, which is cheaper than a wrong number and consistent with
the site's sourcing rule.

## 6. Tests and gates

Unit:

- `generatorDocument.test.ts`: German reverse charge zeroes the tax and prints
  the sentence; a domestic German invoice is untouched; a treatment the market
  does not offer is ignored; an Indian export drops the place of supply and the
  split; a quote never prints a treatment; a leftover treatment is ignored
  until tax invoice mode is on.
- `generatorValidation.test.ts`: the customer USt-IdNr. is required on a German
  reverse-charge invoice; the place of supply is not required on an Indian
  export; a leftover treatment does not fail a non-tax invoice.
- `generatorContent.test.ts`: the copied summary carries the endorsement and
  the customer VAT ID, so copy and sheet agree.
- `records.test.ts`, `countryContent.test.ts` and the country schema cover the
  new notes, sources and config ids.

End to end:

- `cross-border.spec.ts`: each treatment prints and zero-rates, the German
  customer ID blocks printing, the Indian controls disappear, a market without
  a config renders no control, and the German normal page hides the treatment
  until VAT invoice mode is on.
- `records-page.spec.ts`: 15 rows, the UK date, an external source with
  `rel="noopener"`, the stated omission and no overflow at 360 px.
- the records page is in `tests/e2e/routes.ts` and the axe sweep, and the
  orphan and link audits include it.

Gates: `pnpm verify`, `pnpm test:e2e`, axe on the records page and the three
generator pages, and a print check on a German reverse-charge sheet.

## 7. Watch list

| Item                                                        | When                                          |
| ----------------------------------------------------------- | --------------------------------------------- |
| UK e-invoicing requirements and secondary legislation       | published between October 2027 and April 2028 |
| UAE launch dates and any change to the AED 50 million split | before 1 January 2027                         |
| German 2027 threshold in practice                           | before 1 January 2027                         |
| Swiss 29 November 2026 ballot                               | already tracked as D-32                       |
| India retention rule                                        | when a primary source is read                 |
| Any UK 2027 reverse-charge reform                           | only if legislation is published              |

Re-verify the records page within 12 months of `RECORDS_VERIFIED_ON`.
