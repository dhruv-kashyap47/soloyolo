# Ledgerly

Free, privacy-first business calculators and document generators for freelancers,
consultants and small service businesses in the US, UK, Canada and Australia.

Every calculation runs in the browser. There is no backend, no account, and no
upload of invoice or customer data.

## Stack

- [Astro](https://astro.build) — static site, one hydrated island per tool
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
│   ├── calculators/     Preact islands (interactive tools)
│   ├── layout/          BaseLayout, Header, Footer, ToolPageLayout, Breadcrumbs
│   ├── seo/             SEO metadata component
│   └── ui/              Section, FAQList, RelatedTools, Callout, ToolCard
├── config/              site identity and defaults
├── data/
│   ├── calculators/     page copy, FAQs, worked examples + Zod content schema
│   └── countries/       (Phase 4) country configuration
├── lib/
│   ├── calculators/     pure calculation functions + form validation
│   ├── finance/         decimal money helpers
│   ├── formatting/      Intl-based currency/number formatting
│   ├── generators/      (Phase 3) document and totals logic
│   ├── storage/         (Phase 3) opt-in local profile storage
│   └── tools.ts         single tool registry (pages, links, related tools)
├── pages/               routes
└── styles/global.css    Tailwind import, design tokens, component classes
```

## Architecture rules

1. **UI → validation → business logic → formatting.** Formulas never live in
   components; they live in `src/lib/` as pure functions with unit tests.
2. **Decimal, not float.** Money math uses decimal.js; rounding happens only for
   display (`roundMoney`, half-up).
3. **Islands only where needed.** Static content is HTML. Only the calculator
   form hydrates.
4. **Content is validated at build time.** Bad FAQ or example data fails the
   build instead of shipping.
5. **Worked examples are computed by the real engine.** The numbers printed on a
   page cannot drift from the numbers the tool produces.

See [`docs/calculator-slice.md`](docs/calculator-slice.md) for the repeatable
pattern used to add each tool.

## Configuration

Canonical URLs, the sitemap and structured data read the site URL from
`PUBLIC_SITE_URL`:

```bash
# .env (local) or Cloudflare Pages environment variables
PUBLIC_SITE_URL=https://your-domain.example
```

Without it, the build falls back to `https://ledgerly.example.com`.

## Product principles

Correctness > user experience > performance > SEO > maintainability > feature count.

Calculators are informational tools. They are not tax, accounting or legal advice,
and country-specific tax behaviour is documented with its official source rather
than hard-coded into components.
