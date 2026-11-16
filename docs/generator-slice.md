# Adding a generator (the document pattern)

Four generators now share one engine: an invoice, a quote, a receipt and a
payment reminder. The invoice is the reference. Read this before adding a
fifth document type, or before changing how a total is worked out.

## 1. The engine: `src/lib/generators/`

Every generator is a pure layer first and an interface second.

| File            | What it owns                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `document.ts`   | The document model, the six editable field groups, and `resolveDocument`, which turns the form's raw strings into a typed document |
| `totals.ts`     | Subtotal, line discounts, the document discount, per-line tax, grouped tax summary, total, amount due                              |
| `numbering.ts`  | Number patterns (`INV-0042`, `INV-2026-0042`) and the next-number helper                                                           |
| `reminder.ts`   | The four reminder tones, written as copy rather than typed into a component                                                        |
| `summary.ts`    | A plain-text version of a document, for the Copy button                                                                            |
| `validation.ts` | Field-level messages, in the same house style the calculators use                                                                  |

Rules:

- Every amount is a `Decimal`. The only rounding is at the cent, at the moment
  a figure becomes a figure a reader sees.
- **The printed figures add up.** Each line is rounded once, then the totals are
  built from those rounded parts. A subtotal, a discount, a tax and a total can
  never disagree by a cent.
- **Tax is charged on the discounted base.** A document-level discount is
  allocated across the lines in proportion to their value, by largest remainder,
  before tax is calculated.
- `isPositive()` is never used on a Decimal: decimal.js reads zero as carrying a
  positive sign. Use `greaterThan(0)`.
- A line with no description is not a charge. It is skipped by the engine and by
  the preview.

## 2. The draft, not the document

The form holds a `DocumentDraft`: flat strings, exactly what an input element
holds. It becomes a `DocumentModel` through `resolveDocument(draft, kind)`,
which also returns the totals.

Line item ids are **given by the caller**, never generated in the model. Astro
renders islands on the server and hydrates them in the browser: a module-level
counter would give the two sides different ids, and every label would end up
pointing at the wrong field. The example documents use fixed ids (`item-1`,
`item-2`) and `useDocumentForm` owns a ref counter for new lines.

## 3. Content is build-only, examples are runtime

`src/data/generators/<tool>.ts` holds the copy, the FAQs and the steps, and
validates itself with Zod at the bottom of the file.

The worked example lives in `src/data/generators/examples.ts`. The island
imports it, so anything in the same module would be shipped to the browser.
Keeping the example separate is what stops Zod, the FAQ and the page copy from
landing in the bundle: it is worth roughly 23 KB of gzip.

Dates in an example are built from `todayIso()`, so an example is never stale,
and the server and client agree because both read the same day.

## 3b. The country layer

A document's country is part of the draft. `src/lib/countries` owns the
currency, tax name, registration label, rates, tax invoice title and required
fields, and `applyCountryToDraft` moves them together. See
[`country-slice.md`](./country-slice.md) for the full contract.

Two rules matter here:

- A country switch clears the old registration number and replaces the line
  tax rate. A US invoice must never keep a 20% VAT line, and a VAT number
  under an EIN label is worse than an empty field.
- A country page locks its market and, when it is a tax invoice page, locks the
  mode on. A saved profile can fill the business details but cannot move the
  page to another currency.
- The four country examples are rendered into the page as island props by
  Astro, not imported by the island. The island only fills today's dates, so a
  quote, receipt, calculator or general invoice page never downloads them.

## 4. The island: `src/components/generators/`

- `DocumentGenerator.tsx` drives the invoice, the quote and the receipt. The
  differences between them are small enough to describe with conditionals.
- `DocumentPreview.tsx` is the document. It is the element that prints, so the
  preview and the printed page cannot disagree.
- `LineItemsEditor.tsx` is one card per line, not a five column table: the same
  markup works on a 360px phone.
- `useDocumentForm.ts` owns values, touched state, the error summary and the
  focus move. `useBusinessProfile.ts` owns the opt-in local profile.
- `useGeneratorReady()` marks `<html data-generator-ready>`, which the e2e and
  axe suites wait for.
- Use the shared `NumberField`, `TextField` and `SelectField` from
  `src/components/forms/` for every input.

### Never build a class list in a template literal

`prettier-plugin-tailwindcss` rewrites `class` template literals and joins the
parts. A list written as

```tsx
class={`field-input${prefix ? ' field-input--prefix' : ''}`}
```

comes back from `pnpm format` as `field-inputfield-input--prefix`, one class
that exists nowhere, and the field silently loses its styles. Compose the list
in a function and pass it as a value:

```tsx
class={fieldClasses(Boolean(prefix), Boolean(suffix))}
```

## 5. The page: `src/pages/generators/<tool>/`

Use `GeneratorPageLayout`, which marks everything around the island `no-print`.
The island's form carries `no-print` too, so a visitor who prints gets the
document and nothing else. The page template is:

```text
H1 + short explanation
[generator + live preview]
How to use it
Country / use-case information
Important notes
FAQ
Related generators
Every tool
```

Register the tool in `src/lib/tools.ts` and flip `live: true`.

## 6. Print

`global.css` owns the sheet (`.sheet`, drawn in millimetres) and the print
rules. Two things to know:

- The sheet is `210mm` wide on screen and fills the printable width in print,
  with `@page { margin: 0 }` and the sheet's own padding as the page margin. On
  A4 that makes the content column exactly the same width in both.
- **Never write a media query that mixes a media type with a feature**
  (`@media screen and (max-width: 1023px)`). The Tailwind parser drops
  everything after it, silently. Use a plain `max-width` query and put the
  print override in the print block.

## 7. Tests

- `tests/unit/generatorTotals.test.ts` covers rounding, allocation, tax groups
  and the "figures add up" invariant.
- `tests/unit/generatorDocument.test.ts` covers the draft resolver.
- `tests/unit/generatorValidation.test.ts` covers every message.
- `tests/unit/generatorContent.test.ts` covers the page copy and the examples.
- `tests/unit/countries.test.ts` covers the country configs, the source list,
  the country switch and the tax label helpers.
- `tests/unit/countryContent.test.ts` covers the seven guide pages.
- `tests/e2e/invoice-generator.spec.ts`, `generators.spec.ts` and
  `countries.spec.ts` cover the flows, with `window.print` and the clipboard
  stubbed before load.

## 8. Gate before moving on

```bash
pnpm verify && pnpm test:e2e
```

Then measure the page as it loads (gzip JS). A document generator is 35 KB
gzip against 25.5 KB for a calculator: the difference is the preview, the line
editor and the summary. Anything much above that means a library crept in.
