# Adding a country (the localization pattern)

Phase 4 added the country layer for four markets, and Phase 8 extended it to
eight. One configuration per market now drives the currency, the tax words, the
registration number, the rates, the printed title and the fields a tax invoice
requires. Read this before changing a rate, a threshold or a country page.

## 1. The configuration: `src/lib/countries/`

| File                                                    | What it owns                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `types.ts`                                              | The `CountryConfig` shape: tax, invoice defaults, sources, `verifiedOn`   |
| `us.ts`, `uk.ts`, `ca.ts`, `au.ts`, `de.ts`, `ch.ts`, `in.ts`, `ae.ts` | One market each, with the official source for every tax claim |
| `index.ts`                                              | The registry, currency lookup, default line tax, registration label       |
| `draft.ts`                                              | Applies a country to a document draft in one step                         |
| `schema.ts`                                             | The Zod contract for the build and the tests, never shipped               |
| `guides.ts`                                             | The fifteen country page links used by pages, the footer and the generator|
| `taxTerms.ts`                                           | The small tax-name list the tax calculator island reads                   |

Rules:

- **One fact, one place.** A rate, a title, a registration label or a threshold
  lives in the config, never in a component.
- **Every tax claim has a source.** Each source carries a URL, a note saying
  what it supports, and the config carries the day the claim was checked
  (`verifiedOn`).
- **The browser never sees Zod.** `countries/index.ts` is plain objects; the
  schema stays in `countries/schema.ts` and runs in tests and at build time.
- **Country pages are build-only.** The long copy lives in `data/countries/`
  and validates itself with Zod. The example preset is rendered into the
  island's props by Astro, so the full examples travel as HTML rather than
  as a JavaScript chunk. The island only carries `hydrateCountryExample`, which
  fills today's dates.

## 2. The generator integration

The invoice, quote and receipt generators read the country from the draft.

- **Country change:** `applyCountryToDraft` moves the currency, tax name,
  registration label, line rate, due date, terms and payment details together.
  It clears the old registration number, because a VAT number under an EIN
  label is worse than an empty field. It also clears the customer tax number,
  the place of supply and the HSN/SAC codes, and sets the new market's GST
  split default.
- **Tax change:** choosing GST or HST also moves the line rate to the example
  rate for that label. A Swiss MWST, TVA or IVA switch keeps the same rate.
- **Tax invoice mode:** the UK prints `VAT INVOICE`, Australia, India and the
  UAE print `TAX INVOICE`, Germany prints `RECHNUNG`, and Switzerland and
  Canada keep `INVOICE`. The dedicated country pages lock the mode on; the
  general generator lets the visitor switch it.
- **Required fields:** the UK needs the VAT number, supplier address and
  customer address. Australia needs the ABN. Canada needs the registration
  number once the total reaches $100 and the terms once it reaches $500.
  Germany needs the USt-IdNr., both addresses and the supply date. Switzerland
  needs the MWST number and both addresses. India needs the GSTIN, the customer
  GSTIN, the place of supply and HSN/SAC. The UAE needs the supplier TRN.
  The total comes from the same engine that prints the sheet.
- **Supply date:** the UK and Germany require a separate supply date, because
  their rules ask for the time of supply. The field starts at the issue date,
  and the value is cleared when the draft moves to a market that does not use
  it.
- **Locked pages:** a country page keeps its market even when a saved profile
  was written in another currency, and clears a registration number that does
  not belong to that market.

## 3. The pages: `src/pages/{us,uk,ca,au,de,ch,in,ae}/`

Fifteen routes, each six lines, all rendering `CountryInvoicePage`:

```text
/us/invoice-generator/
/uk/invoice-generator/
/uk/vat-invoice-generator/
/ca/invoice-generator/
/ca/gst-hst-invoice-generator/
/au/invoice-generator/
/au/tax-invoice-generator/
/de/invoice-generator/
/de/vat-invoice-generator/
/ch/invoice-generator/
/ch/vat-invoice-generator/
/in/invoice-generator/
/in/gst-invoice-generator/
/ae/invoice-generator/
/ae/vat-invoice-generator/
```

The copy lives in `src/data/countries/{us,uk,ca,au,de,ch,in,ae}.ts`, is collected
in `pages.ts` and validated by `schema.ts`. Each page has its own requirements,
field changes, rate table, worked scenario, notes, FAQs, sources and related
links. The `/countries/` hub compares the eight markets and links all fifteen.

The worked example is a preset: `countryInvoicePreset` runs on the server and
its object is rendered into the island's props. The island only calls
`hydrateCountryExample`, which fills today's issue date, the market's due date
and, where the market uses one, the supply date. That keeps the full examples
as HTML rather than a JavaScript chunk, and keeps a quote, a receipt or a
calculator page from downloading them.

Every page exposes `WebApplication`, `FAQPage` and `BreadcrumbList` data, a
canonical URL, a unique title and description, and a source list with the
verification date.

## 4. India, the one market with a split

India computes one GST total on the taxable value and then displays it as
CGST + SGST for an intra-state supply or IGST for an inter-state supply. The
line rate stays the total GST, and `lib/generators/taxSplit.ts` allocates the
two display rows with the same largest-remainder helper the document discount
uses. The printed parts therefore add back to the total, even when a rate
produces an odd half cent. `taxSplit.test.ts` covers 5%, 18%, 40%, 8.1%, odd
cents, zero and multiple rates.

## 5. Adding or changing a country

1. Add or edit the config in `src/lib/countries/`.
2. Add the official source and update `verifiedOn`.
3. Add a guide link in `guides.ts`.
4. Add the page copy in `data/countries/`.
5. Add the route under `src/pages/`.
6. Add the route to `tests/e2e/routes.ts` and the accessibility list.
7. Run the gate:

```bash
pnpm verify
pnpm test:e2e
```

The tests cover the config schema, the source list, the tax invoice titles, the
country switch, the required fields, the currency and tax labels, the locked
country page, the profile guard, the hub links, the sources, the mobile layout,
and axe on every route.

## 6. What the verification found

Checked between 16 and 17 November 2026:

- **UK:** VAT standard 20%, reduced 5%, zero 0%; registration threshold
  £90,000; full VAT invoice list in VAT Notice 700/21; simplified invoice up to
  £250.
- **Canada:** GST 5%; HST 13% Ontario, 14% Nova Scotia (since 1 April 2025),
  15% New Brunswick, Newfoundland and Labrador, and Prince Edward Island; the
  CRA invoice chart uses $100 and $500 thresholds.
- **Australia:** GST 10%; tax invoice seven details; buyer identity or ABN at
  $1,000 or more; registration threshold $75,000; 28 days to provide a tax
  invoice when asked, unless the sale is $82.50 or less.
- **United States:** no federal sales tax; state and local rates; the EIN is
  optional on an invoice; there is no federal invoice format.
- **Germany:** Umsatzsteuer 19% standard, 7% reduced and 0% for specific
  supplies; the §19 Kleinunternehmer limits are €25,000 in the previous year
  and €100,000 in the current year; §14(4) sets the invoice particulars;
  e-invoice receiving is mandatory since 1 January 2025, issuing from 2027
  above €800,000 and from 2028 for all, with Kleinunternehmer exempt.
- **Switzerland:** MWST 8.1% standard, 2.6% reduced and 3.8% accommodation;
  CHF 100,000 registration threshold; the MWST number is the UID in the
  `CHE-123.456.789 MWST` form, with TVA and IVA the other allowed suffixes;
  Art. 26 MWSTG sets the invoice contents. The 29 November 2026 ballot is a
  watch item, not a current rate change.
- **India:** GST 5% merit, 18% standard and 40% special rate from 22 September
  2025, with 0%, 3% and 0.25% special rates remaining; registration thresholds
  of ₹40 lakh for goods and ₹20 lakh for services, lower in special category
  states; Rule 46 sets the tax invoice particulars, including a serial number
  of up to sixteen characters, HSN/SAC and the place of supply; e-invoicing
  applies above ₹5 crore and an e-way bill above ₹50,000.
- **UAE:** VAT 5%; mandatory registration at AED 375,000 and voluntary at AED
  187,500; a TRN is 15 digits; an invoice may be issued in Arabic or English;
  Ministerial Decision 244/2025 governs e-invoicing, and a PDF is not an
  e-invoice.

The country pages and the config sources record the same dates. If a source
changes, change the claim, the `verifiedOn` date and the page copy together.
