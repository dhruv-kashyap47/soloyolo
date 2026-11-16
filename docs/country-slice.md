# Adding a country (the localization pattern)

Phase 4 added the country layer. One configuration per market now drives the
currency, the tax words, the registration number, the rates, the printed title
and the fields a tax invoice requires. Read this before changing a rate, a
threshold or a country page.

## 1. The configuration: `src/lib/countries/`

| File                               | What it owns                                                             |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `types.ts`                         | The `CountryConfig` shape: tax, invoice defaults, sources, `verifiedOn`  |
| `us.ts`, `uk.ts`, `ca.ts`, `au.ts` | One market each, with the official source for every tax claim            |
| `index.ts`                         | The registry, currency lookup, default line tax, registration label      |
| `draft.ts`                         | Applies a country to a document draft in one step                        |
| `schema.ts`                        | The Zod contract for the build and the tests, never shipped              |
| `guides.ts`                        | The seven country page links used by pages, the footer and the generator |

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
  island's props by Astro, so the four full examples travel as HTML rather than
  as a JavaScript chunk. The island only carries `hydrateCountryExample`, which
  fills today's dates.

## 2. The generator integration

The invoice, quote and receipt generators read the country from the draft.

- **Country change:** `applyCountryToDraft` moves the currency, tax name,
  registration label, line rate, due date, terms and payment details together.
  It clears the old registration number, because a VAT number under an EIN
  label is worse than an empty field.
- **Tax change:** choosing GST or HST also moves the line rate to the example
  rate for that label.
- **Tax invoice mode:** the UK prints `VAT INVOICE`, Australia prints
  `TAX INVOICE`, and Canada keeps `INVOICE` with the GST/HST breakdown. The
  dedicated country pages lock the mode on; the general generator lets the
  visitor switch it.
- **Required fields:** the UK needs the VAT number, supplier address and
  customer address. Australia needs the ABN. Canada needs the registration
  number once the total reaches $100 and the terms once it reaches $500. The
  total comes from the same engine that prints the sheet.
- **Supply date:** the UK requires a separate supply date on every invoice,
  because GOV.UK asks for the date the goods or services were supplied. The
  field starts at the issue date, and the value is cleared when the draft moves
  to a market that does not use it.
- **Locked pages:** a country page keeps its market even when a saved profile
  was written in another currency, and clears a registration number that does
  not belong to that market.

## 3. The pages: `src/pages/{us,uk,ca,au}/`

Seven routes, each six lines, all rendering `CountryInvoicePage`:

```text
/us/invoice-generator/
/uk/invoice-generator/
/uk/vat-invoice-generator/
/ca/invoice-generator/
/ca/gst-hst-invoice-generator/
/au/invoice-generator/
/au/tax-invoice-generator/
```

The copy lives in `src/data/countries/{us,uk,ca,au}.ts`, is collected in
`pages.ts` and validated by `schema.ts`. Each page has its own requirements,
field changes, rate table, worked scenario, notes, FAQs, sources and related
links. The `/countries/` hub compares the four markets and links all seven.

The worked example is a preset: `countryInvoicePreset` runs on the server and
its object is rendered into the island's props. The island only calls
`hydrateCountryExample`, which fills today's issue date, the market's due date
and, for a UK VAT invoice, the supply date. That keeps the four full examples
as HTML rather than a JavaScript chunk, and keeps a quote, a receipt or a
calculator page from downloading them.

Every page exposes `WebApplication`, `FAQPage` and `BreadcrumbList` data, a
canonical URL, a unique title and description, and a source list with the
verification date.

## 4. Adding or changing a country

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

## 5. What the verification found

Checked on 16 November 2026:

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

The country pages and the config sources record the same date. If a source
changes, change the claim, the `verifiedOn` date and the page copy together.
