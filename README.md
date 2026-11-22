# soloyolo

Free, privacy-first business calculators for freelancers, consultants and small
service businesses. Built for the US, UK, Canada, Australia, Germany,
Switzerland, India and the UAE.

Every calculation runs in the browser. There is no backend, no account, and no
upload of invoice or customer data.

The look, the tokens and the rules behind them are documented in
[`docs/design.md`](docs/design.md). Read that before adding a page or a
component.

## What's live

Eight calculators and four generators, all running in the browser:

| Calculator            | Path                                              |
| --------------------- | ------------------------------------------------- |
| Hourly Rate           | `/calculators/hourly-rate-calculator/`            |
| Freelance Rate        | `/calculators/freelance-rate-calculator/`         |
| Project Profit        | `/calculators/project-profit-calculator/`         |
| Markup vs Margin      | `/calculators/markup-vs-margin-calculator/`       |
| Payment Fee           | `/calculators/payment-processing-fee-calculator/` |
| VAT / GST / Sales Tax | `/calculators/vat-gst-sales-tax-calculator/`      |
| Retainer Pricing      | `/calculators/retainer-pricing-calculator/`       |
| Break-even            | `/calculators/break-even-calculator/`             |

| Generator        | Path                                      |
| ---------------- | ----------------------------------------- |
| Invoice          | `/generators/invoice-generator/`          |
| Quote            | `/generators/quote-generator/`            |
| Receipt          | `/generators/receipt-generator/`          |
| Payment Reminder | `/generators/payment-reminder-generator/` |

The generators share one document engine: line items, discounts, per-line tax,
a grouped tax summary and a live A4 preview that is also the printed page.

The country layer drives currency, tax words, registration labels, rates and
the fields a tax invoice needs from one configuration per market. Fifteen
country guides open the invoice generator already set to the right market:

| Country guide           | Path                             |
| ----------------------- | -------------------------------- |
| US invoice              | `/us/invoice-generator/`         |
| UK invoice              | `/uk/invoice-generator/`         |
| UK VAT invoice          | `/uk/vat-invoice-generator/`     |
| Canada invoice          | `/ca/invoice-generator/`         |
| Canada GST/HST invoice  | `/ca/gst-hst-invoice-generator/` |
| Australia invoice       | `/au/invoice-generator/`         |
| Australia tax invoice   | `/au/tax-invoice-generator/`     |
| Germany invoice         | `/de/invoice-generator/`         |
| Germany VAT invoice     | `/de/vat-invoice-generator/`     |
| Switzerland invoice     | `/ch/invoice-generator/`         |
| Switzerland VAT invoice | `/ch/vat-invoice-generator/`     |
| India invoice           | `/in/invoice-generator/`         |
| India GST invoice       | `/in/gst-invoice-generator/`     |
| UAE invoice             | `/ae/invoice-generator/`         |
| UAE VAT invoice         | `/ae/vat-invoice-generator/`     |

India computes one GST total and then splits it into CGST + SGST or IGST for
display, so the printed parts always add back. Germany, India and the UAE
pages disclose that print/PDF is not an e-invoice. Switzerland records the
29 November 2026 ballot as a rate watch.

The comparison hub is at `/countries/`. Every tax claim on a country page is
sourced and dated. The launch build is complete and verified: 596 unit tests,
662 end-to-end checks (desktop and mobile), axe-clean on 39 routes. The latest
polish and bug evidence is in [`docs/site-polish-audit.md`](docs/site-polish-audit.md);
remaining launch-blocking work (publisher id, certified CMP) is tracked in
[`task.md`](task.md).

`/resources/e-invoicing-and-record-keeping/` compares the eight markets'
e-invoicing deadlines and retention periods, one row per claim, each linked to
the authority that publishes it. Germany, India and the UAE forms also offer
the cross-border wording those markets expect: EU reverse charge, export under
LUT and export of services. The arithmetic stays out: no income tax or
take-home estimator ships, by decision D-40.

## Stack

- [Astro](https://astro.build) — static site, one hydrated island per tool
- A quiet CSS scroll-reveal layer on the home page (no external moment kit)
- TypeScript (strict)
- Preact — interactive calculators and generators only
- Tailwind CSS v4 — design tokens via `@theme`
- decimal.js — all financial arithmetic
- Zod — build-time content/config validation (never shipped to the browser)
- Vitest — unit tests for every formula
- Playwright — critical user flows, accessibility and mobile checks

## Requirements

- Node.js `>=22.23.4` (see `.nvmrc`)
- pnpm `11.x`

## Commands

```bash
pnpm install
pnpm dev            # local dev server
pnpm build          # static production build → dist/
pnpm preview        # serve the production build

pnpm typecheck      # astro check (strict TS over .astro and .ts/.tsx)
pnpm lint           # eslint (flat config)
pnpm format         # prettier (astro + tailwind class sorting)
pnpm test           # vitest unit tests
pnpm test:e2e       # playwright (builds, then serves on :4321)
pnpm verify         # typecheck + lint + unit tests + build
```

## Structure

```text
src/
├── components/
│   ├── ads/             AdSlot (reserved space, consent-gated) + ConsentBanner
│   ├── calculators/     Preact islands + useCalculatorForm
│   ├── countries/       the shared country invoice page
│   ├── forms/           Shared NumberField, TextField, SelectField, CurrencySelect
│   ├── generators/      Document engine UI: form, line items, live A4 preview, 4 islands
│   ├── layout/          BaseLayout, Header, Footer, ToolPageLayout, GeneratorPageLayout
│   ├── seo/             SEO metadata component
│   └── ui/              Section, FAQList, RelatedTools, Callout, ToolCard
│
├── assets/brand/        the client's wordmark, derived to transparent webp
├── config/              site identity and defaults
├── data/
│   ├── calculators/     page copy, FAQs, worked examples + Zod content schema
│   ├── generators/      page copy + example documents (examples.ts stays bundle-safe)
│   ├── countries/       country page copy, sources and build-time schema
│   └── records.ts       e-invoicing and retention facts for the resources page
├── lib/
│   ├── calculators/     pure calculation functions + form validation
│   ├── countries/       one config per market, guide links, draft rules, Zod schema
│   ├── finance/         decimal money helpers and the percent kernel
│   ├── formatting/      Intl-based currency, number and date formatting
│   ├── generators/      document model, totals engine, numbering, reminders, validation
│   ├── storage/         opt-in local profile storage + logo downscaling
│   └── tools.ts         single tool registry (pages, links, related tools)
├── pages/               routes, including guides for all eight markets
└── styles/global.css    Tailwind import, design tokens, component classes, print CSS
```

## Architecture rules

1. **UI → validation → business logic → formatting.** Formulas never live in
   components; they live in `src/lib/` as pure functions with unit tests.
2. **Decimal, not float.** Money math uses decimal.js; rounding happens only for
   display (`roundMoney`, half-up).
3. **Islands only where needed.** Static content is HTML. Only the calculator
   form and the generator islands hydrate.
4. **Content is validated at build time.** Bad FAQ or example data fails the
   build instead of shipping. Zod never reaches the browser: the islands use
   hand-written parsers, and `examples.ts` keeps the page copy out of the bundle.
5. **Worked examples are computed by the real engine.** The numbers printed on a
   page cannot drift from the numbers the tool produces.
6. **Rounded displays add up.** Round the figures a reader sees and derive the
   remaining one from them, so a net, a tax and a total never disagree by a
   cent. Percentages come from `src/lib/finance/percent.ts`, never from ad-hoc
   division.
7. **Copy matches the formatter.** Prose uses the same currency symbol the
   interface prints, including the plain `$` for CAD and AUD.
8. **The preview is the document.** A generator prints the element it shows, so
   the printed page and the preview share one geometry and one set of numbers.
9. **Tax is charged on the discounted base.** A document-level discount is
   allocated across lines by largest remainder before tax is calculated, so the
   parts always add back up to the whole.
10. **Country rules are data.** One configuration per market drives the
    currency, tax words, rates, registration label and required fields. Every
    tax claim carries an official source and the day it was checked.

See [`docs/calculator-slice.md`](docs/calculator-slice.md),
[`docs/generator-slice.md`](docs/generator-slice.md),
[`docs/country-slice.md`](docs/country-slice.md) and
[`docs/tax-slice.md`](docs/tax-slice.md) for the repeatable patterns and the
line between a sourced fact and a tax calculation.

## Configuration

Canonical URLs, the sitemap and structured data read the site URL from
`PUBLIC_SITE_URL`:

```bash
# .env (local) or Cloudflare Pages environment variables
PUBLIC_SITE_URL=https://your-domain.example
```

Without it, the build falls back to `https://soloyolotools.com`.

## Ads and consent

AdSense is wired only when `PUBLIC_ADSENSE_CLIENT` is set, and the script is
injected only after a visitor chooses "Accept all" (the choice is stored in
`localStorage` under `soloyolo-consent`). The loader also waits for a page that
actually carries a live slot. Every slot reserves a box in CSS, so a creative
of the configured size does not shift the page. Slot ids come from the
`PUBLIC_ADSENSE_SLOT_*` environment variables, and the publisher line in
`public/ads.txt` must match the AdSense account. The placement map is in
[`docs/redesign-plan.md`](docs/redesign-plan.md).

## Only eight markets

The site names only the markets it supports: the United States, United Kingdom,
Canada, Australia, Germany, Switzerland, India and the United Arab Emirates.
The region preference, palette hints, country tiles and locale guessing all
follow the same list, with a neutral "International" fallback for other
browsers.

## Product principles

Correctness > user experience > performance > SEO > maintainability > feature count.

Calculators are informational tools. They are not tax, accounting or legal advice,
and country-specific tax behaviour is documented with its official source rather
than hard-coded into components.
