# SoloYolo

Free, privacy-first business calculators for freelancers, consultants and small
service businesses. Built for the US, UK, Canada and Australia.

Every calculation runs in the browser. There is no backend, no account, and no
upload of invoice or customer data.

The look, the tokens and the rules behind them are documented in
[`docs/design.md`](docs/design.md). Read that before adding a page or a
component.

## What's live

Eight calculators and four generators, all running in the browser:

| Calculator              | Path                                                 |
| ----------------------- | ---------------------------------------------------- |
| Hourly Rate             | `/calculators/hourly-rate-calculator/`               |
| Freelance Rate          | `/calculators/freelance-rate-calculator/`            |
| Project Profit          | `/calculators/project-profit-calculator/`            |
| Markup vs Margin        | `/calculators/markup-vs-margin-calculator/`          |
| Payment Fee             | `/calculators/payment-processing-fee-calculator/`    |
| VAT / GST / Sales Tax   | `/calculators/vat-gst-sales-tax-calculator/`         |
| Retainer Pricing        | `/calculators/retainer-pricing-calculator/`          |
| Break-even              | `/calculators/break-even-calculator/`                |

| Generator               | Path                                                 |
| ----------------------- | ---------------------------------------------------- |
| Invoice                 | `/generators/invoice-generator/`                     |
| Quote                   | `/generators/quote-generator/`                       |
| Receipt                 | `/generators/receipt-generator/`                     |
| Payment Reminder        | `/generators/payment-reminder-generator/`            |

The generators share one document engine: line items, discounts, per-line tax,
a grouped tax summary and a live A4 preview that is also the printed page.
Next up is Phase 4: the country layer that drives currency, tax words and
required fields from one place. Progress and gate evidence live in
[`task.md`](task.md).

## Stack

- [Astro](https://astro.build) — static site, one hydrated island per tool
- A dealt scroll moment (`pinned-chapters`) on the home page, its kit files
  copied verbatim into `public/assets/moments/`
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
│   └── countries/       (Phase 4) country configuration
├── lib/
│   ├── calculators/     pure calculation functions + form validation
│   ├── finance/         decimal money helpers and the percent kernel
│   ├── formatting/      Intl-based currency, number and date formatting
│   ├── generators/      document model, totals engine, numbering, reminders, validation
│   ├── storage/         opt-in local profile storage + logo downscaling
│   └── tools.ts         single tool registry (pages, links, related tools)
├── pages/               routes
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

See [`docs/calculator-slice.md`](docs/calculator-slice.md) and
[`docs/generator-slice.md`](docs/generator-slice.md) for the repeatable patterns.

## Configuration

Canonical URLs, the sitemap and structured data read the site URL from
`PUBLIC_SITE_URL`:

```bash
# .env (local) or Cloudflare Pages environment variables
PUBLIC_SITE_URL=https://your-domain.example
```

Without it, the build falls back to `https://soloyolo.example.com`.

## Ads and consent

AdSense is wired only when `PUBLIC_ADSENSE_CLIENT` is set, and the script is
injected only after a visitor chooses "Accept all" (the choice is stored in
`localStorage` under `soloyolo-consent`). Every slot reserves its height, so
the page adds no layout shift. Real slot ids go in each `<AdSlot>` call, and
the publisher line in `public/ads.txt` must match the AdSense account. The
placement map is in [`docs/redesign-plan.md`](docs/redesign-plan.md).

## Product principles

Correctness > user experience > performance > SEO > maintainability > feature count.

Calculators are informational tools. They are not tax, accounting or legal advice,
and country-specific tax behaviour is documented with its official source rather
than hard-coded into components.
