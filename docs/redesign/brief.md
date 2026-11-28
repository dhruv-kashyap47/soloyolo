# SoloYolo redesign brief, Phases 1 to 3

Status: **Approved 2026-11-19 with amendments.** Branch `redesign/bento-v2` created
from `main` at `7d957e0`. A production build and baseline audits were run to collect
evidence. This file moved from the plan folder to `docs/redesign/brief.md` on approval.

---

## 1. Phase 1: what the codebase actually is

### 1.1 Stack, hosting and build

| Item            | Finding                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Astro `7.4.12`, static MPA, `output` default (static), no adapter                                                                                           |
| UI islands      | Preact `11.2.0` via `@astrojs/preact` `6.1.6`; currently `compat` is **not** enabled                                                                        |
| Styling         | Tailwind CSS `4.3.5` through `@tailwindcss/vite`; tokens in `src/styles/global.css` (`@theme`)                                                              |
| Type safety     | TypeScript strict, `@astrojs/check`, ESLint 10, Prettier                                                                                                    |
| Maths           | `decimal.js` 10.6, Zod 4.6 for build-time content validation                                                                                                |
| Routing         | File routes in `src/pages`; `trailingSlash: 'always'`; `build.format: 'directory'`                                                                          |
| SEO plumbing    | `@astrojs/sitemap` 3.7.5, generated `robots.txt.ts`, custom `SEO.astro`                                                                                     |
| Hosting         | No adapter, no `wrangler.toml`, no `_redirects`, no `vercel.json`, no `netlify.toml`. Docs refer to Cloudflare Pages; treat static hosting as an assumption |
| Package manager | pnpm 11.15.0, Node 24.21.0 in this environment (`engines` says `>=22.23.4`)                                                                                 |
| Content model   | **No Astro content collections.** Typed data modules live in `src/data/*` and `src/lib/*`; pages import them directly                                       |
| Build output    | 36 pages (35 indexable + 404), `dist/`, one CSS file, 41 JS chunks, 3 font files                                                                            |

### 1.2 Routes that must not change

All 35 sitemap URLs plus the 404:

- `/`
- `/calculators/` and 8 calculator pages:
  `/calculators/hourly-rate-calculator/`, `/freelance-rate-calculator/`, `/project-profit-calculator/`, `/markup-vs-margin-calculator/`, `/payment-processing-fee-calculator/`, `/vat-gst-sales-tax-calculator/`, `/retainer-pricing-calculator/`, `/break-even-calculator/`
- `/generators/` and 4 generator pages:
  `/generators/invoice-generator/`, `/quote-generator/`, `/receipt-generator/`, `/payment-reminder-generator/`
- `/countries/` and 15 country pages:
  `/us/invoice-generator/`
  `/uk/invoice-generator/`, `/uk/vat-invoice-generator/`
  `/ca/invoice-generator/`, `/ca/gst-hst-invoice-generator/`
  `/au/invoice-generator/`, `/au/tax-invoice-generator/`
  `/de/invoice-generator/`, `/de/vat-invoice-generator/`
  `/ch/invoice-generator/`, `/ch/vat-invoice-generator/`
  `/in/invoice-generator/`, `/in/gst-invoice-generator/`
  `/ae/invoice-generator/`, `/ae/vat-invoice-generator/`
- `/about/`, `/contact/`, `/privacy/`, `/terms/`
- `/404` (`noindex`)

There is no redirect file today. The redesign will not remove or rename any route, so no 301s are required. If a future change removes a route, add a 301 in a host-level redirects file before launch.

### 1.3 Layouts, components and islands

Shell and layout:

- `src/components/layout/BaseLayout.astro`: `<html data-page="home|tool">`, fonts preloaded, SEO, AdSense loader gated by consent, header, main, footer, `CommandPalette client:idle`, palette hotkey bridge, reveal observer.
- `src/components/layout/Header.astro`: fixed 64px header, wordmark, desktop search trigger, `Tools` mega menu, About/Countries/Contact, mobile search and full-screen menu.
- `src/components/layout/Footer.astro`: four link columns, oversized 1442x425 wordmark image (`wordmark-footer-hd.webp`, 63.6KB; the non-HD file is 96.4KB and unused), legal line.
- `src/components/layout/ToolPageLayout.astro`: breadcrumbs, eyebrow, H1, intro, privacy line, optional desktop sticky sidebar.
- `src/components/layout/GeneratorPageLayout.astro`: breadcrumbs, eyebrow, H1, intro, privacy line, main slot, `after` slot.
- `src/components/layout/Breadcrumbs.astro`: visible breadcrumbs plus `BreadcrumbList` JSON-LD.
- `src/components/seo/SEO.astro`: title template, description, canonical, robots, Open Graph, Twitter, JSON-LD blocks.
- `src/components/ui/*`: `Section`, `FAQList` (native `<details>`, `FAQPage` JSON-LD), `RelatedTools`, `Callout`, `ToolCard`.
- `src/components/ads/AdSlot.astro`: all ad slots; consent-gated push, lazy IntersectionObserver, viewability events, anchor dismiss, visible label, reserved boxes.
- `src/components/ads/ConsentBanner.astro`: custom consent UI, Consent Mode v2 defaults, granular preferences, `soloyolo:consent` event.

Preact islands:

- Home: `TodayDashboard` (`client:idle`), `QuickEstimator` (`client:idle`), `CommandPalette` (`client:idle`, sitewide).
- Calculators: 8 separate islands, all `client:load`.
- Generators: `InvoiceGenerator`, `QuoteGenerator`, `ReceiptGenerator`, `PaymentReminderGenerator`, all `client:load`; the first three share `DocumentGenerator`.
- Country pages: `CountryInvoiceGenerator` (`client:load`) wrapping `DocumentGenerator`.
- Shared islands: form fields (`NumberField`, `TextField`, `SelectField`, `CurrencySelect`), `LineItemsEditor`, `DocumentPreview`, `LogoUpload`, hooks for form state, generator readiness, calculator form state, business profile and preferences.

### 1.4 CSS, fonts, images and current visual system

- One global stylesheet: `src/styles/global.css`, 68.6KB raw, **14.2KB gzip**. It contains tokens, base styles, buttons, fields, cards, prose, the home hero, today dashboard, tools grid, country tiles, proof steps, closing panel, ad boxes, squircle rules and consent styles.
- Existing tokens: canvas `#0a0d14`, surface `#131824`, ink `#e9edf3`, accent `#2b7fff`, band `#04060e`, radius family 10/16/24/32px, container 1280px, 20/48/80px gutters.
- Fonts: Outfit Variable latin (32.3KB) and DM Mono 400 (14.8KB), both preloaded. `dm-mono-latin-500-normal.woff2` (15KB) is present but **not declared in any `@font-face`**, so it is dead weight.
- Images: header wordmark 18.8KB webp, footer wordmark 63.6KB webp (HD) and 96.4KB webp (unused), OG 30.8KB jpg, favicons. There is no `astro:assets` usage and no `<Image>` component today; all images are plain `<img>` with `src` imports.
- No LCP image: the home LCP is the H1 text. No hero photograph exists.
- Motion: CSS hero entrance (`data-enter`), card reveal observer, result rise, view-transition, reduced-motion kill switch.
- Accessibility baseline: skip link, one H1, landmarks, 44px targets mostly, focus-visible, AA contrast. One serious axe violation is present (see 1.7).

### 1.5 Where client JavaScript is used today

| Page pattern            | Directive                                                                                | Why                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Home                    | `TodayDashboard client:idle`, `QuickEstimator client:idle`, `CommandPalette client:idle` | Local desk data and live estimate after first paint |
| Calculators             | `client:load` on the calculator island                                                   | Tool must be interactive immediately                |
| Generators              | `client:load` on the generator island                                                    | Form and preview need state                         |
| Country generators      | `client:load` on `CountryInvoiceGenerator`                                               | Same engine, preset country                         |
| Every page              | `CommandPalette client:idle` in `BaseLayout`                                             | Cmd/Ctrl+K and header search                        |
| Legal and About/Contact | `CommandPalette client:idle` only                                                        | Full palette JS on pages with no tool               |

### 1.6 Baseline JavaScript per page (module graph, gzip)

Measured from the production build by walking every `<script src>`, `component-url` and `renderer-url` and every static import in `dist/_astro`.

| Page                                                   |    JS gzip | Main contributors                                                                                                                           |
| ------------------------------------------------------ | ---------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                    | **51.5KB** | TodayDashboard, QuickEstimator, CommandPalette, Preact, Decimal.js (`currency` chunk 13.5KB), profile/country data 11.3KB, prefs, analytics |
| `/calculators/`                                        | **18.1KB** | CommandPalette, Preact, palette, prefs, analytics                                                                                           |
| `/generators/`                                         | **18.1KB** | same as calculators hub                                                                                                                     |
| `/countries/`                                          | **18.1KB** | same as calculators hub                                                                                                                     |
| `/calculators/hourly-rate-calculator/`                 | **37.6KB** | calculator island, Decimal.js, NumberField, currency formatting, CommandPalette, Preact                                                     |
| `/calculators/markup-vs-margin-calculator/`            |     37.8KB | same pattern                                                                                                                                |
| `/generators/invoice-generator/`                       | **59.5KB** | DocumentGenerator 12.6KB, Decimal.js 13.5KB, country config 11.3KB, profile, preview, CommandPalette, Preact                                |
| `/generators/payment-reminder-generator/`              |     38.7KB | reminder island plus shared data                                                                                                            |
| `/us/invoice-generator/` and country pages             |     58.8KB | DocumentGenerator plus country data                                                                                                         |
| `/about/`, `/contact/`, `/privacy/`, `/terms/`, `/404` | **17.4KB** | CommandPalette and shared runtime, despite no interactive tool                                                                              |

Lighthouse reports a home JS transfer of 61.7KB (it includes runtime and cache policy differences); the module graph number above is the reproducible build measure.

Other shipped weight:

- CSS: 14.2KB gzip, one file, shared and cached.
- Fonts: 47.1KB for the two declared files, 60.6KB including the unused DM Mono 500.
- Footer wordmark: 63.6KB; header wordmark: 18.8KB; OG image: 30.8KB (not page weight unless shared).
- Total home transfer at baseline: 154KB.

### 1.7 Baseline Lighthouse and axe

Production build, `pnpm preview`, Lighthouse 13, mobile simulated unless noted.

| Page                                   | Performance | Accessibility | Best practices | SEO |  LCP |   CLS |       TBT | Total |
| -------------------------------------- | ----------: | ------------: | -------------: | --: | ---: | ----: | --------: | ----: |
| `/` mobile                             |         100 |           100 |            100 | 100 | 1.7s | 0.001 |      10ms | 154KB |
| `/` desktop                            |         100 |           100 |            100 | 100 | 0.4s |     0 |      20ms | 154KB |
| `/calculators/hourly-rate-calculator/` |         100 |           100 |            100 | 100 | 1.0s |     0 |      20ms | 141KB |
| `/generators/invoice-generator/`       |      **97** |           100 |            100 | 100 | 1.2s |     0 | **200ms** | 166KB |
| `/calculators/`                        |         100 |           100 |            100 | 100 | 0.9s |     0 |      50ms | 114KB |
| `/countries/`                          |         100 |           100 |            100 | 100 | 0.9s |     0 |       0ms | 116KB |
| `/about/`                              |         100 |           100 |            100 | 100 | 0.9s |     0 |      20ms | 175KB |

Axe (Chromium, desktop viewport, 12 routes including all page types):

- **1 serious violation on every route:** `label-content-name-mismatch` at `#header-search-trigger`. The visible text is `Search ⌘K`, the `aria-label` is `Search tools (Press Cmd+K or Ctrl+K)`, and the visible `⌘K` is not part of the accessible name.
- No critical violations. No other serious violations.
- The existing docs claim a clean axe run, but the current `@axe-core/playwright` version reports this mismatch. Fix in Phase 5 by hiding the `kbd` from the accessible name and using a plain `aria-label="Search tools"`.

Baseline summary: the site is already fast and accessible, but it is not structurally simple. The invoice generator is the one page with a real TBT problem (200ms), the home hero is text-only and the page carries three competing dashboards, and every legal page ships the full command palette.

### 1.8 Ad slot map (sacred: keep IDs, props, logic)

All slots render through `src/components/ads/AdSlot.astro` and are configured in `src/config/ads.ts`. Slots accept `name`, `slot` or the legacy `format` prop. The `data-slot` value, `data-network`, lazy trigger, consent gate, `adsbygoogle.push` once logic, viewability events and anchor dismiss logic must stay intact. Only the surrounding containers and CSS may change.

| Slot ID       | Config                                                                       | Reserved box                                                   |                           Lazy | Current pages and positions                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- | -----------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `leaderboard` | `AD_CONFIG.leaderboard`, env `PUBLIC_ADSENSE_SLOT_LEADERBOARD`, legacy `TOP` | 96px mobile / 112px desktop on home; 100px / 120px on non-home | No, pushed on first idle frame | Home `src/pages/index.astro:142`, full-width band after Today and before toolkit. Calculators index `src/pages/calculators/index.astro:65`, after hero list. Generator index `src/pages/generators/index.astro:61`, after hero list. Each calculator page `.../index.astro` at `top` slot (see below). Each generator page at `top` slot. Each country page via `CountryInvoicePage.astro:84` |
| `infeed`      | `AD_CONFIG.infeed`, env `PUBLIC_ADSENSE_SLOT_INFEED`, legacy `INARTICLE`     | 160px home; 280px non-home                                     |         Yes, 400px root margin | Home `src/pages/index.astro:174`, between calculator grid and generator grid. Each calculator page at `inarticle` (see below)                                                                                                                                                                                                                                                                 |
| `sidebar`     | `AD_CONFIG.sidebar`, env `PUBLIC_ADSENSE_SLOT_SIDEBAR`                       | 600px                                                          |                            Yes | Home `src/pages/index.astro:187`, sticky 300px rail beside toolkit, hidden below 1200px. Each calculator page `sidebar` slot, sticky desktop rail                                                                                                                                                                                                                                             |
| `anchor`      | `AD_CONFIG.anchor`, env `PUBLIC_ADSENSE_SLOT_ANCHOR`                         | 64px plus safe area                                            |                            Yes | Home only `src/pages/index.astro:282`; fixed bottom strip only after ads consent, dismissible; home reserves an 80px bottom inset                                                                                                                                                                                                                                                             |
| `end`         | `AD_CONFIG.end`, env `PUBLIC_ADSENSE_SLOT_END`                               | 250px                                                          |                            Yes | Home `src/pages/index.astro:278`, after closing promises. Calculators index `:144`. Generator index `:239`. Each calculator page `end` after related tools. Each generator page `end` after FAQ/related. Countries index `src/pages/countries/index.astro:195`. Each country page `CountryInvoicePage.astro:185` after FAQ                                                                    |

Exact per-page instances:

| Page group        | File                                                                  | Lines and slot                                                |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| Home              | `src/pages/index.astro`                                               | 142 leaderboard, 174 infeed, 187 sidebar, 278 end, 282 anchor |
| Calculators index | `src/pages/calculators/index.astro`                                   | 65 top (leaderboard), 144 end                                 |
| Break-even        | `src/pages/calculators/break-even-calculator/index.astro`             | 78 top, 109 inarticle, 243 end, 249 sidebar                   |
| Freelance rate    | `src/pages/calculators/freelance-rate-calculator/index.astro`         | 98 top, 136 inarticle, 263 end, 269 sidebar                   |
| Hourly rate       | `src/pages/calculators/hourly-rate-calculator/index.astro`            | 94 top, 125 inarticle, 243 end, 249 sidebar                   |
| Markup vs margin  | `src/pages/calculators/markup-vs-margin-calculator/index.astro`       | 107 top, 138 inarticle, 316 end, 322 sidebar                  |
| Payment fee       | `src/pages/calculators/payment-processing-fee-calculator/index.astro` | 83 top, 113 inarticle, 226 end, 232 sidebar                   |
| Project profit    | `src/pages/calculators/project-profit-calculator/index.astro`         | 96 top, 128 inarticle, 267 end, 273 sidebar                   |
| Retainer          | `src/pages/calculators/retainer-pricing-calculator/index.astro`       | 85 top, 117 inarticle, 242 end, 248 sidebar                   |
| VAT/GST           | `src/pages/calculators/vat-gst-sales-tax-calculator/index.astro`      | 78 top, 110 inarticle, 262 end, 268 sidebar                   |
| Generators index  | `src/pages/generators/index.astro`                                    | 61 top, 239 end                                               |
| Invoice generator | `src/pages/generators/invoice-generator/index.astro`                  | 64 top, 154 end                                               |
| Quote generator   | `src/pages/generators/quote-generator/index.astro`                    | 63 top, 125 end                                               |
| Receipt generator | `src/pages/generators/receipt-generator/index.astro`                  | 63 top, 124 end                                               |
| Payment reminder  | `src/pages/generators/payment-reminder-generator/index.astro`         | 68 top, 137 end                                               |
| Countries index   | `src/pages/countries/index.astro`                                     | 195 end                                                       |
| Country pages     | `src/components/countries/CountryInvoicePage.astro`                   | 84 top, 185 end                                               |

Total rendered ad instances: **80** across 36 pages. No slots on `/about/`, `/contact/`, `/privacy/`, `/terms/`, `/404`.

Ad facts:

- Every slot has a visible `Advertisement` label (11px uppercase) and a neutral placeholder when no publisher ID is configured.
- Every slot reserves height in CSS (`ad-slot-*` classes). The anchor is `display:none` until `data-active="true"` after ad consent.
- The AdSense loader in `BaseLayout` is injected only after consent, on idle, and only on pages that contain a live slot.
- `public/ads.txt` still contains `pub-0000000000000000`, a placeholder. Do not treat it as live.
- Consent is a custom banner, not a Google-certified CMP. The code documents the EEA/UK/CH personalised-ads gap. Keep the behavior and copy; replacing with a certified CMP is a follow-up, not part of this redesign.

### 1.9 SEO and URL contract

- `SEO.astro` generates `<title>`, description, canonical, `robots` only when `noindex`, Open Graph (`og:type`, `site_name`, title, description, url, locale, image, image width/height/alt), Twitter (`summary_large_image`, title, description, image, alt) and injects JSON-LD.
- Title template appends `| SoloYolo` unless the title already contains `SoloYolo`.
- Canonical host comes from `Astro.site` (`PUBLIC_SITE_URL` in the environment; default `https://soloyolo.example.com`). The actual domain is a placeholder.
- JSON-LD currently emitted:
  - Home: `Organization`, `WebSite`.
  - Every non-home page with breadcrumbs: `BreadcrumbList`.
  - Calculator and generator pages: `WebApplication` with `Offer` price 0.
  - Country pages: `WebApplication`.
  - Countries hub: `CollectionPage` with `hasPart`.
  - Pages with FAQ: `FAQPage`.
- Sitemap: `sitemap-index.xml` plus `sitemap-0.xml`; 404 excluded.
- `robots.txt` is generated at build time and points to the sitemap.
- `public/ads.txt` exists with a placeholder publisher line.
- Consent banner is a custom dialog, not a TCF-certified CMP. Keep the `soloyolo-consent` key and the `{ ads, analytics, value }` event contract.
- No `_redirects`, no host config, no canonical-host redirect. URLs must not change.
- Placeholders that must not be mistaken for real business facts: domain `soloyolo.example.com`, email `hello@soloyolo.example`, ads publisher `pub-0000000000000000`, legal operator identity pending.

---

## 2. Phase 2: the business

### 2.1 What SoloYolo does

SoloYolo is a free, privacy-first toolkit of business calculators and document generators for independent professionals and micro-businesses. It runs entirely in the browser, uses exact decimal arithmetic, requires no account, uploads nothing, and covers eight invoice/tax markets: US, UK, Canada, Australia, Germany, Switzerland, India and UAE.

Two product families:

1. **Calculators:** hourly rate, freelance rate, project profit, markup vs margin, payment processing fee, VAT/GST/sales tax, retainer pricing, break-even.
2. **Document generators:** invoice, quote, receipt, payment reminder, plus country-preset invoice and tax invoice pages.

Differentiators that are true in the code:

- Exact decimal maths, unit-tested formulas, build-time worked examples.
- Local-only data and no backend.
- Country-aware invoice fields, tax names, registration labels and rates, each with an official source and verified date.
- Print-first documents: the preview is the printed sheet.
- Free, no sign-up, no email gate, no dark patterns.

### 2.2 Customers

Primary: solo freelancers, consultants, contractors, creators and small service businesses in the eight supported markets. They are comfortable with a browser, often on a phone, and are price-sensitive. They arrive from search with a specific job ("hourly rate calculator", "invoice generator UK", "GST invoice format India"). They care about privacy and about not being forced into an account.

Secondary: micro-business owners who need one document quickly and do not want accounting software.

### 2.3 Jobs to be done

Ranked by the current product and the page order:

1. "What should I charge?" (hourly rate, freelance rate, retainer).
2. "Will this project actually make money?" (project profit, markup vs margin, break-even).
3. "What do I keep after fees and tax?" (payment fee, VAT/GST/sales tax).
4. "Make an invoice that fits my country" (invoice generator, 15 country pages).
5. "Send a quote, receipt or a polite late-payment reminder."
6. "Get back to the tool I used last time" (local recents, palette, saved profile).

### 2.4 Conversion goals

There is no checkout. The meaningful conversions are:

- **Primary:** open and use the hourly rate calculator (the top job, and the current primary CTA on the home and calculators hub).
- **Secondary:** open and use the invoice generator, then print or save a document.
- **Retention:** return to the local desk, a pinned tool or a recent tool.
- **Ad revenue:** a consenting visitor views a labelled ad without the ad interfering with the tool.

The redesign should make the primary job reachable in one click from the home hero, one click from the header CTA, and one click from every hub. The invoice generator should be the clear second action, not a competing primary.

### 2.5 How it earns

Display advertising through Google AdSense, consent-gated, with five slot types and a floor of policy-safe placements. There is no subscription, affiliate link, sponsored post or paid placement. The site is free. Ads must never be required to use a tool, and "essential only" consent must load no ad script.

### 2.6 Brand tone

Precise, calm, plain, confident. Second person. Real numbers. Says what a tool does and what it does not do. No urgency, no hype, no fake testimonials, no dark patterns, no em dashes. The logo is client art and must not be redrawn or typeset. The current dark, blue-black, cornflower identity already fits the trade; the redesign should sharpen it, not replace it with a generic SaaS look.

### 2.7 Current UX pain points (evidence, not guesses)

1. **The first screen has three competing systems:** hero quick actions, `TodayDashboard`, and `QuickEstimator`. The tools themselves start below the fold and below a leaderboard ad.
2. **The home page is long and section-heavy:** hero, Today, leaderboard, toolkit with estimator + 12 tool cards + in-feed ad + sidebar, countries, three proof cards, closing, end ad, anchor. The hierarchy is flat.
3. **Navigation hides the two main jobs behind a mega menu.** The header has Search, Tools, About, Countries, Contact. The primary action is not in the header.
4. **Every legal page ships the command palette and shared runtime (17.4KB gzip)** although there is nothing to search on the page.
5. **Generator pages are the only real performance outlier:** 59.5KB gzip initial JS and 200ms TBT on mobile; the invoice generator is `client:load`.
6. **The home hero has no product visual.** It is text plus quick-action buttons; the actual UI is lower down or on another page.
7. **Ad slots are safe but visually generic:** dashed reserved boxes, five on home, and the leaderboard sits between the first two content blocks.
8. **One real axe bug:** the header search button's accessible name does not contain its visible `⌘K`.
9. **Heavy footer:** a 63.6KB wordmark at 86% width, plus a 96.4KB unused variant.
10. **Unused font weight:** DM Mono 500 ships but is never declared.
11. **No light theme.** The current dark-only decision is deliberate, but the brief asks for light/dark tokens; this is a decision to confirm.
12. **Mobile is a long single column with a fixed header and a consent sheet.** It works, but the primary action is not persistent and the mega menu is two taps deep.

### 2.8 Assumptions (explicit, to correct before build)

1. The audience reads English. The site is not localized; local tax terms are used inside English copy. Do not add an i18n framework.
2. Traffic is mostly search landing on a specific tool, not the home page. The home redesign should still sell the whole toolkit, but tool pages must remain task-first.
3. AdSense is the only revenue. No affiliate, sponsorship or paid placement will be added.
4. The brand name, domain, contact email and legal entity are placeholders. Do not invent a company address, registration number, phone number or real testimonial.
5. The eight markets and their tax claims are current as of the dates in `src/lib/countries/*`; the redesign does not re-verify tax law. Keep the existing sources and `verifiedOn` dates.
6. "12 tools" means 8 calculators plus 4 generators. "8 markets" means the 8 country configs. "0 uploads" is a product promise, not a measured statistic. No user counts, revenue figures or ratings exist, so none will be shown.
7. The `TodayDashboard` local desk (timer, hours, clients, recents) is a real feature, not a placeholder. Keep it, but do not let it dominate the first screen.
8. The custom consent banner is not a certified CMP. Keep the current consent behavior and the documented EEA/UK/CH limitation. Do not claim GDPR/TCF compliance.
9. Static hosting with no server. No edge functions, no API routes, no database.
10. The design should stay dark-first, because the brand and the existing ad/print system are built for it. A light theme will be added as a tested token set only if approved (see decision D-1).

---

## 3. Phase 3: the design plan

### 3.1 Creative concept: Night Ledger

A well-kept ledger for independent work. Not a generic dark SaaS page, and not a mood piece.

- **The ground is a desk, not a void.** Deep ink-blue canvas with a faint ruled grid, hairlines that line up across sections, and one continuous 12-column measure.
- **Paper is a real material.** A small number of warm off-white tiles carry invoices, worked examples and country rules. They are the only light surfaces in dark mode, so the eye goes to the document, the number and the result.
- **The numbers are the ornament.** Oversized tabular figures, mono micro-labels, a single cornflower thread that marks the primary action and the one number that matters. No gradient text, no violet, no glassmorphism, no floating 3D blobs.
- **One instrument, one action.** The hero shows the rate calculator working. The rest of the page is a shelf of jobs, not a feature list.
- **Quiet motion with a cause.** One hero demo, one result roll, one paper-document action. Tiles lift 2px on hover; buttons step and press. No scroll-reveal on every card, no parallax, no tilt.

Why it fits: SoloYolo sells precision, privacy and documents. A ledger is precise, private, paper-based and calm. It is also visually distinct from the rounded-gradient SaaS template, and it gives the bento grid a reason to exist: a ledger is a grid of entries, not a pile of cards.

### 3.2 Design tokens

Two self-hosted families only:

- **Outfit Variable** (400 to 700, latin subset): display, headings and body.
- **DM Mono 400** (latin subset): figures, micro-labels, formulas and mock readouts. Drop the undeclared 500 weight.

No third family. No Google Fonts request. `font-display: swap`. Preload Outfit only; let DM Mono load with the page and verify the hero figure does not cause a visible swap. If it does, subset DM Mono to digits and the punctuation used on the page and preload that smaller file.

Color, dark (default):

| Token             | Value     | Use                                       |
| ----------------- | --------- | ----------------------------------------- |
| `--bg`            | `#080b12` | page ground                               |
| `--bg-band`       | `#05070c` | footer, closing band                      |
| `--surface`       | `#10151f` | tiles, panels                             |
| `--surface-2`     | `#161e2b` | hover, raised control                     |
| `--ink`           | `#edf0f4` | headings, body (17.2:1 on bg)             |
| `--ink-soft`      | `#b6bfcc` | supporting copy (10.6:1)                  |
| `--muted`         | `#8a93a1` | micro-labels (6.3:1)                      |
| `--line`          | `#222b3a` | hairlines, tile borders                   |
| `--line-strong`   | `#34415a` | field borders, focus support              |
| `--accent`        | `#2b7fff` | primary fill (5.07:1 with `--accent-ink`) |
| `--accent-strong` | `#6aa4ff` | accent text, links (7.8:1)                |
| `--accent-ink`    | `#06101f` | text on accent                            |
| `--paper`         | `#f3efe4` | invoice, worked example                   |
| `--paper-ink`     | `#16191f` | text on paper (15.3:1)                    |
| `--paper-muted`   | `#5f5b52` | meta on paper (5.9:1)                     |
| `--warn`          | `#e8b25c` | caveats                                   |
| `--danger`        | `#f27272` | errors                                    |

Color, light (`[data-theme="light"]` or `prefers-color-scheme: light` when the theme is set to auto):

| Token             | Value     | Use                              |
| ----------------- | --------- | -------------------------------- |
| `--bg`            | `#f4f1e8` | warm paper ground                |
| `--bg-band`       | `#ece7da` | band                             |
| `--surface`       | `#fffdf7` | tiles                            |
| `--surface-2`     | `#f8f4e9` | hover                            |
| `--ink`           | `#15181e` | body (15.7:1)                    |
| `--ink-soft`      | `#4b505a` | supporting copy (7.2:1)          |
| `--muted`         | `#666b75` | micro-labels (4.74:1)            |
| `--line`          | `#ded7c7` | hairlines                        |
| `--line-strong`   | `#c4baa5` | fields                           |
| `--accent`        | `#1f5fce` | primary fill (5.86:1 with white) |
| `--accent-strong` | `#164da8` | links (6.99:1)                   |
| `--accent-ink`    | `#ffffff` | text on accent                   |
| `--paper`         | `#fffdf7` | document                         |
| `--paper-ink`     | `#15181e` | text on document                 |
| `--paper-muted`   | `#5f5b52` | meta on document                 |

Type scale:

| Role        | Size                                     | Weight  | Notes                                 |
| ----------- | ---------------------------------------- | ------- | ------------------------------------- |
| Hero H1     | `clamp(2.6rem, 1.2rem + 5.2vw, 5.25rem)` | 500     | tracking `-0.045em`, leading `0.98`   |
| Page H1     | `clamp(2.2rem, 1.4rem + 3.4vw, 3.75rem)` | 500     | tracking `-0.035em`, leading `1.02`   |
| Section H2  | `clamp(1.8rem, 1.3rem + 2.2vw, 2.75rem)` | 500     | tracking `-0.03em`                    |
| Tile H3     | `1rem` to `1.25rem`                      | 600     | one size per tile family              |
| Body        | `1rem` to `1.0625rem`                    | 400     | leading `1.65`                        |
| Lede        | `1.0625rem` to `1.1875rem`               | 400     | `ink-soft`                            |
| Micro-label | `0.6875rem`                              | 500     | DM Mono, uppercase, tracking `0.12em` |
| Figure      | `1.25rem` to `4.5rem`                    | 400/500 | DM Mono, `tabular-nums`               |

Spacing: 4px base, steps 4/8/12/16/24/32/48/64/96/128. Section padding `clamp(56px, 7vw, 112px)`. Container max 1320px at 1440, 1280px default, gutters 20/32/48/64.

Radii: one family, 10px controls, 14px cards, 18px tiles, 999px pills, 24px full panels. Keep the squircle upgrade behind `@supports (corner-shape: squircle)`.

Elevation: no floating cards. Tiles use a 1px hairline and a 1px inset highlight; shadow only on hover, one soft shadow. Paper tiles use a 1px darker edge and a subtle grain via CSS, no image.

Motion: 160ms for color, 220ms for transform, 420ms for the hero entrance, `cubic-bezier(0.22, 1, 0.36, 1)`. Transform and opacity only. Reduced motion sets duration to 0.01ms and shows the final frame.

### 3.3 The bento system

Grid:

- 12 columns, `gap: 12px` at 1440, `gap: 10px` at 1024, `gap: 8px` at 768.
- Row unit: `minmax(88px, auto)` at desktop, `minmax(76px, auto)` at tablet, auto at phone.
- Spans: `span 12`, `span 8`, `span 7`, `span 6`, `span 5`, `span 4`, `span 3`, `span 2`; row spans 1, 2, 3.
- Breakpoints: 1200, 1024, 768, 640, 480. At <=1024 the grid becomes 6 columns; at <=640 it becomes 1 column, every tile `grid-column: 1 / -1`, and the order follows DOM order.
- No `grid-auto-flow: dense`; DOM order is the reading order. Spans are explicit per breakpoint so there are no holes.
- Tiles are flush to the container edges. The section heading sits on the same 12-column measure.
- A faint vertical rule is drawn in the gutters at >=1024 using a background gradient, so the grid reads as a ledger. No rule over text.

Tile kinds (used to avoid a wall of identical cards):

1. **Type tile:** a big statement or number, no border or a single rule.
2. **UI tile:** a cropped product interface, one window chrome at most on the page.
3. **Paper object:** an invoice, receipt or worked example on warm paper.
4. **Stat:** a real count or promise with a mono label, no fake numbers.
5. **Diagram:** a CSS/SVG flow, formula or document pipeline.
6. **Link tile:** a whole tile is one `<a>`, with an arrow and a one-line job.
7. **Panel tile:** an interactive panel (the local desk) that is not wrapped in a link.

Rules:

- Only one third to one half of the tiles show UI. On the home bento, 4 of 12 tiles are UI or interactive; the rest are type, paper, stat, diagram.
- Window chrome appears once, in the hero demo. Bento UI crops have no chrome.
- No two neighboring UI tiles. Arrange UI next to type, paper or diagram.
- One clear link per link tile. No nested links or buttons inside a link. Panel tiles are not links.
- Every decorative visual is `aria-hidden`. Every tile has a readable heading (h3) unless it is a pure stat.
- Tiles never contain ads. Ads are separate bands or a separate rail.

Home bento map (desktop, 12 columns):

| Tile                     |  Span | Kind           | Content                                                                                  |
| ------------------------ | ----: | -------------- | ---------------------------------------------------------------------------------------- |
| A. Hero copy             | 7 x 3 | Type           | Eyebrow, H1, lede, primary CTA "Find your rate", secondary "Make an invoice", trust line |
| B. Hero demo             | 5 x 3 | UI (Stageshow) | Rate calculator window, four inputs, result `$76.67/h`; poster is the result             |
| C. Invoice quick start   | 4 x 1 | Paper object   | A cropped invoice with a real example total; one link                                    |
| D. Countries quick start | 4 x 1 | Stat/object    | "8 markets, one document engine"; one link                                               |
| E. All tools             | 4 x 1 | Diagram/link   | "12 tools, one desk"; a small grid diagram; one link                                     |

Leaderboard ad band after the hero bento, full width, outside the grid.

Toolkit, calculator half:

| Tile                |  Span | Kind           | Content                                              |
| ------------------- | ----: | -------------- | ---------------------------------------------------- |
| F. Hourly rate      | 5 x 2 | UI (Stageshow) | The featured calculator, result roll; one link       |
| G. Invoice          | 4 x 2 | Paper object   | Invoice document, print action; one link             |
| H. Your desk today  | 3 x 2 | Panel          | Compact TodayDashboard, real local state, not a link |
| I. Project profit   | 3 x 1 | Link/stat      | Margin figure, one line                              |
| J. Markup vs margin | 3 x 1 | Diagram        | The two formulas, a comparison line                  |
| K. Payment fees     | 3 x 1 | Stat           | "What lands after fees" with a real example          |
| L. Tax              | 3 x 1 | Link/stat      | VAT/GST/sales tax, country terms                     |
| M. All calculators  | 3 x 1 | Link           | 8 calculators                                        |
| N. All generators   | 3 x 1 | Link           | 4 generators                                         |
| O. Formula          | 3 x 1 | Diagram        | income + costs / billable hours                      |
| P. Privacy          | 3 x 1 | Stat           | "0 uploads" (a promise, not a metric)                |

In-feed ad band after the calculator bento, before the generator half. A small generator bento follows:

| Tile        |  Span | Kind         | Content                                        |
| ----------- | ----: | ------------ | ---------------------------------------------- |
| Q. Quote    | 4 x 1 | Paper object | Quote document                                 |
| R. Receipt  | 4 x 1 | Paper object | Receipt document                               |
| S. Reminder | 4 x 1 | Type/link    | A polite late-payment message, no fake urgency |

Countries section:

| Tile                      |   Span | Kind         | Content                                                |
| ------------------------- | -----: | ------------ | ------------------------------------------------------ |
| T. Featured country       |  5 x 2 | Paper object | Visitor's region first; tax name, rate, document title |
| U. Seven country links    |  7 x 2 | Link tiles   | 7 tiles at 2x1 or 3x1 each; one link per country       |
| V. How country rules work | 12 x 1 | Diagram      | Config to currency, tax label, registration, fields    |

Proof and trust section:

| Tile                |   Span | Kind  | Content                                                                  |
| ------------------- | -----: | ----- | ------------------------------------------------------------------------ |
| W. Worked example 1 |  4 x 2 | Paper | Inputs, result, "nothing uploaded"                                       |
| X. Worked example 2 |  4 x 2 | Paper | Revenue needed                                                           |
| Y. Worked example 3 |  4 x 2 | Paper | 40-hour quote                                                            |
| Z. Ledger promise   | 12 x 1 | Type  | Three real promises: private by design, exact decimals, no dark patterns |

Closing panel, then end ad band. Mobile collapsed order: A, B, C, D, E, F, G, H, I... The hero demo is after the copy and CTA, never before the H1. The ad bands keep their order but lose the side rail.

Hub pages:

- `/calculators/`: hero bento with intro (7x2), featured rate tile (5x2, static UI poster), then 8 calculator tiles in varied spans (one 5x2 featured, others 3x1/4x1), a "how the maths works" diagram, a closing CTA. Leaderboard after the hero, end after the closing.
- `/generators/`: hero bento with intro and an invoice paper object, then 4 generator tiles (one 6x2 featured, three 2x1/3x1), a document pipeline diagram, closing CTA. Top and end ads.
- `/countries/`: hero bento with intro and a featured country, then 8 country tiles + a rules diagram, then the compare table in a simple readable block. End ad only, preserving the current single slot.
- Tool, generator and country pages: **no bento.** One reading column. The tool is the hero. A thin trust strip (browser-only, exact decimals, no account) may sit under the tool. Sections stay simple, 44rem measure. This is deliberate: bento is for choosing, not for reading.

### 3.4 Navigation and calls to action

Desktop header:

`SoloYolo wordmark | Calculators | Generators | Countries | [Search icon] [Find your rate]`

- Remove the `Tools` mega menu and the separate About link from the primary nav. About, Contact, Privacy and Terms stay in the footer, where they are now.
- Search remains a compact icon plus `⌘K` hint. It opens the palette. The visible `⌘K` is `aria-hidden`; the button's accessible name is "Search tools".
- Primary CTA: **Find your rate** to `/calculators/hourly-rate-calculator/`, on every page. It is the top job and the current primary CTA. On the calculator page it can point to itself; on generator pages it remains a secondary option in the header while the generator is the page action.
- Active state: a 2px accent underline or a filled pill, not both.

Mobile:

- Header: wordmark, search icon, menu button. No hamburger label hidden.
- Menu sheet: one column, CTA first ("Find your rate"), then Calculators (8), Generators (4), Countries (8), then About, Contact, Privacy, Terms. 44px rows, focus trap, Escape, restore focus, background `inert`.
- Do not add a second fixed bottom bar. The home anchor ad already owns the bottom edge. Content reserves 80px on home so the anchor never covers a CTA.

Page-level CTA rules:

- Home: hero primary "Find your rate", secondary "Make an invoice"; closing repeats the primary once.
- Calculators hub: "Find your rate" in the hero and closing.
- Generators hub: "Make an invoice" in the hero and closing.
- Calculator pages: the tool itself is the action; the closing CTA is "Open the full calculator" only if the tool is below the fold, otherwise no duplicate.
- Generator pages: the generator is the action; the closing CTA is "Print your document" (the real print action) or "Open the invoice generator", not both.
- Country pages: "Open the country invoice generator" and "Check the rules"; the generator is above the fold.
- Legal pages: a single "Back to the tools" link, no sales CTA.

Every page has exactly one primary filled button in the first screen and one clear next step. Secondary actions are outline or text links.

### 3.5 Ad placement plan (containers only)

Principles:

- Keep every slot ID, prop, `data-slot`, lazy trigger, consent gate, push-once and analytics logic exactly as is.
- Ads are **bands or a separate rail**, never bento tiles, never inside a tile, never styled as a tool.
- Every ad has a visible "Advertisement" label, a 1px separator, and a neutral ground. No dashed "placeholder" look that reads as a UI element.
- Reserved dimensions are fixed per slot (`min-height` plus `aspect-ratio` where appropriate). Add `overflow-anchor: none` and `contain: layout` to the container so any fill change cannot shift content above it. Test with filled mock creatives.
- Separation: at least 48px from the nearest bento or section, at least 64px from a primary CTA row, at least 24px from any link list. No ad shares a row with a CTA.
- No animation, no reveal, no Stageshow, no sticky hover near an ad.
- No auto-refresh, no interstitial, no anchor on tool pages, no ad on legal pages.
- Max three units visible in one viewport. Home keeps five total but only three can be in view at once.

Placement map after the redesign:

| Slot          | Page(s)                                                                       | New position                                                                                                       | Reserved box                                             | Separation and notes                                                                                          |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `leaderboard` | Home, calculators hub, generators hub, all calculator/generator/country pages | Full-width band after the hero bento or after the tool, before the first long content section                      | Home 96px mobile / 112px desktop; non-home 100px / 120px | 48px below the hero/tool, 64px above the next CTA; never above the H1                                         |
| `infeed`      | Home, all calculator pages                                                    | Home: between the calculator bento and the generator bento. Calculator: after "How it works", before "The formula" | 160px home; 280px tool                                   | 32px from each bento; one unit only; label visible; no UI demo adjacent                                       |
| `sidebar`     | Home, all calculator pages                                                    | Separate 300px rail at >=1200px, sticky below the header; hidden below 1200                                        | 600px                                                    | 24px from the main column; never inside the bento; the rail is its own landmark with `aria-label="Sponsored"` |
| `anchor`      | Home only                                                                     | Fixed bottom strip on phones after ad consent                                                                      | 64px + safe area                                         | Dismissible; home body reserves 80px; never covers the header or CTA; no animation                            |
| `end`         | Home, hubs, calculator pages, generator pages, country pages                  | After the closing CTA or after related links, before the footer                                                    | 250px                                                    | Always after the action; 64px below the CTA; no ad between the CTA and the footer without the closing panel   |

Exact slot retention:

- Do not change `name`, `slot`, `format`, `label`, `className`, `data-slot`, `data-network`, `data-lazy`, `data-ad-variant`, the `ins.adsbygoogle` attributes or the `AdSlot` script.
- You may change the wrapper element, grid placement, spacing and CSS classes.
- Do not add a new slot. Do not remove an existing instance. If a page layout moves, the slot moves with it.
- The anchor remains home-only and consent-gated. The legal pages and 404 remain ad-free.

Ad-safe CSS plan:

- `.ad-band` full-width, `padding-block: 32px`, `border-block: 1px solid var(--line)`, no shadow.
- `.ad-rail` sticky, `width: 300px`, `align-self: start`.
- `.ad-slot` fixed box, `display: grid`, label in the top-left, `background: var(--surface)`, `overflow: clip`, `overflow-anchor: none`, `contain: layout`.
- A filled ad must not change the container height. If AdSense returns a taller responsive creative, the extra height is clipped by the reserved box. This is a policy risk; Phase 6 will test with mock creatives and, if clipping is unacceptable, the box will grow with `min-height` only and the layout will use a fixed-height wrapper below the fold so no content above shifts. Decide from the measured result, not by guess.

### 3.6 Stageshow plan

Scope: install the skill in Phase 4, read `SKILL.md` and the references (`framing.md`, `craft.md`, `motion.md`, `kit.md`, `bento.md`, `rehearse.md`), copy the kit into the project, and build the home demos first. Do not put a demo on a tool page.

Demos:

1. **Hero: "Rate pass"** (Stageshow, `client:idle`).
   - A compact calculator window, the only window chrome on the page.
   - Four real example inputs: income `$80,000`, expenses `$12,000`, weeks `48`, billable hours `25`.
   - Cursor moves to Calculate, the result rolls to `$76.67/h`, an annotation says "covers costs, then pays you".
   - 8 second loop. Poster is the result state, server-rendered.
   - The numbers come from `calculateHourlyRate` at build time, not typed by hand.
2. **Bento F: "Rate to quote"** (Stageshow, `client:visible`).
   - A cropped calculator + quote pair, no window chrome.
   - The rate `$76.67/h` becomes a 40-hour quote `$3,066.80`; a small line shows the same engine.
   - 7 second loop. Poster is the quote.
3. **Bento G: "Document"** (Stageshow, `client:visible`).
   - A warm paper invoice, not a window. The cursor presses Print; the sheet lifts 2px and the browser print dialog is implied, not faked.
   - Real line items from `src/data/generators/examples.ts`.
   - 6 second loop. Poster is the finished invoice.
4. **Bento H: "Your desk today"** is the real `TodayDashboard` island, `client:idle`, not a Stageshow demo. It is the only tile with multiple controls.

Optional hub demos:

- Calculators hub: reuse the hero "Rate pass" as a static poster inside a featured tile, no second hydration.
- Generators hub: reuse the "Document" poster, no hydration.
- Countries hub: a static poster of the country switch, no hydration.
- If Phase 4 measures a hub demo under the budget and it does not hurt LCP/INP, one may hydrate on `client:visible`; otherwise hubs stay static. The default is static.

Grid rule check for the home bento:

- UI/interactive tiles: B (hero demo), F (rate demo), G (document demo), H (desk panel) = 4 of 12 = one third. The rest are type, paper, stat, diagram, link.
- Window chrome: only B.
- Neighbors: B is next to A (type); F is next to G (paper) and I (stat); G is next to F (UI) and H (panel) — G is a paper object, not a UI window, so F and H are not adjacent UI. If the art director reads G as UI, swap G and I so the order is F (UI), I (stat), G (paper), H (panel). Plan the order with that swap available.
- No invented products, stats or testimonials. Every number is either a real count (12 tools, 8 markets), a product promise (0 uploads), or a build-time engine result.

Hydration and motion rules:

- Hero: `client:idle`. SSR the poster state so LCP is text or a static poster. Do not animate before hydration.
- Bento demos: `client:visible`. Only one animates at a time; pause off-screen and on `visibilitychange`.
- `prefers-reduced-motion: reduce`: render the poster only, no cursor, no loop, no auto-play. The static final frame is the full result.
- No Stageshow inside or adjacent to an ad band. The nearest demo is at least 48px from the leaderboard and never in the same grid as the ad.
- `compat: true` in `@astrojs/preact` for the demo islands. Test all existing islands (calculators, generators, palette, desk) after enabling it. If compat changes behavior or adds more than ~5KB gzip sitewide, scope it to the demo entry points or fall back to static posters for every demo.
- If the kit's `lucide-react` dependency is used, import only the icons needed and measure. If it costs too much, replace those two or three icons with local SVG paths.
- Film every demo with the skill's `film.mjs`, at the shown width and at 390, and run `--gate`. Keep the contact sheets in `docs/redesign/stageshow/`.

JS weight check (Phase 4 gate):

- Build twice: demos off and demos on. Measure the same per-page module graph, gzip.
- Budget: demos add at most **60KB gzip** on any page. Home baseline 51.5KB, so the demo build must stay at or below 111.5KB.
- Mobile throttled Lighthouse on home: LCP < 2.0s, INP < 150ms (lab proxy: TBT well under 150ms), CLS < 0.05.
- If any demo exceeds the budget or the metrics, switch that demo to a static fallback: pre-rendered HTML/CSS/SVG poster, or a short muted loop (WebP/MP4) with a poster and explicit width/height, no hydration. Record which demos fell back and the before/after JS.
- If compat breaks any component or the kit cannot run under Preact, use the static fallback for all demos and say why.

### 3.7 Performance plan

Budgets:

- LCP < 2.0s, CLS < 0.05, INP < 150ms on throttled mobile.
- Lighthouse Performance, Accessibility, Best Practices and SEO >= 95; target 100 where the baseline is already 100.
- Home initial JS: baseline 51.5KB gzip; demo build <= 111.5KB gzip. Hubs: stay near 18.1KB gzip; do not add hydrated demos by default. Legal pages: reduce from 17.4KB by removing the palette or lazy-loading it.
- No single page above 60KB gzip initial JS except the generator pages, which are already 59.5KB and are the tool itself. Do not add demos there.
- CSS: keep one shared file, target <= 12KB gzip after removing unused home styles. Inline a small critical block (tokens, body, header, hero) in `BaseLayout`; keep the main stylesheet as a normal cached link. Do not delay the main stylesheet behind `media="print"`.

Tactics:

- **LCP:** the home H1 is the LCP. Keep it server-rendered, no entry animation that starts it at opacity 0 for longer than 200ms, and do not put the hero demo before it. The demo poster is static HTML/CSS/SVG. If a poster image is used, preload only that image with `fetchpriority="high"` and explicit dimensions.
- **CLS:** every tile, demo, ad and image has reserved dimensions. The hero demo has a fixed aspect ratio (5:4 desktop, 4:3 mobile). The desk panel has a min-height. Ads use the reserved boxes.
- **INP:** no long tasks on hydration. Hero demo `client:idle`, bento `client:visible`, generator `client:idle` (not `client:load`), calculator stays `client:load` because it is the primary tool and already 37.6KB. Break the generator's initial hydration into the form first, then the preview.
- **Images:** convert header/footer wordmarks to `astro:assets` `<Image>` or `<Picture>` with AVIF/WebP, explicit dimensions, `loading="lazy"` below the fold, `decoding="async"`. Replace the 63.6KB footer wordmark with a 480px-wide optimized asset (target <= 12KB). Do not preload the wordmark.
- **Fonts:** two families, drop DM Mono 500. Preload Outfit only; test DM Mono swap. Subset DM Mono to digits and punctuation if the swap is visible.
- **CSS:** remove dead `.today-*` styles that the new home no longer uses, consolidate duplicate radius rules, and keep the single stylesheet layered. Target 12KB gzip.
- **Third-party:** AdSense stays async, deferred, consent-gated, idle. Do not use Partytown; it would break the ad/consent contract. No GA, no tag manager, no CWA.
- **Prefetch:** keep hover prefetch on internal links, but audit that it does not prefetch ad or consent URLs. Do not prefetch on viewport.
- **Command palette:** keep it on home, hubs and tool pages. On legal pages, either omit it or lazy-load its module on first click. This is the main opportunity to cut the 17.4KB legal-page baseline.
- **Country data:** the generic generator imports all eight country configs (11.3KB gzip). Split the default country from the rest and lazy-load a config when the user switches country. This is a Phase 5 optimization; measure it, do not assume it.

### 3.8 Accessibility plan (WCAG 2.2 AA)

- One H1 per page, one main landmark, header/nav/footer landmarks, section `aria-labelledby` where a heading exists.
- Skip link first in the tab order, visible on focus, never under the fixed header.
- Heading order: h1, h2 per section, h3 per tile. No heading level skipped; no heading used for a label.
- Link tiles: exactly one `<a>` per tile, no nested interactive. The link's accessible name includes the tile heading and the one-line job. Decorative figures are `aria-hidden`.
- Panel tiles (the desk) are not links; their controls are labelled, 44px, and grouped with a fieldset or a labelled region.
- Focus visible: 2px accent ring, 2px offset, on both themes. `scroll-padding-top` clears the fixed header.
- Mobile menu and palette: focus trap, initial focus, Escape to close, focus restored to the trigger, background `inert`.
- Consent: 44px buttons on mobile, `aria-expanded` on Preferences, non-modal dialog, no focus trap that blocks the page.
- Contrast: all pairs in 3.2 measured at 4.5:1 or better for text; muted is only for micro-labels. Re-check paper tiles and accent-on-accent.
- Touch targets: 44px minimum for every link and control outside running prose. Bento link tiles are large.
- Reduced motion: no entrance, no demo loop, static final frame, no smooth scroll.
- Forms: visible labels, errors under the field, `aria-describedby`, reserved error space. Keep the existing calculator and generator field behavior.
- Fix the header search `label-content-name-mismatch` before any visual review.
- Test keyboard-only: skip link, header, search, menu, every tile link, every form control, print action, consent, footer. Test at 320, 375, 768, 1024, 1440, 1920 and 2560. Test with reduced motion and with a forced light theme.

### 3.9 SEO plan

- Keep every URL and the trailing-slash convention. No redirects.
- Unique title and description per page; audit length and duplicate wording. Keep the existing title template.
- Canonical on every page, from `Astro.site`.
- Open Graph and Twitter on every page. Add `og:image:type` and keep the 1200x630 OG. If a page has a better image, use it; otherwise keep the shared OG.
- JSON-LD:
  - `Organization` and `WebSite` once, in `BaseLayout`, with stable `@id`s. Remove the duplicate from the home page.
  - `BreadcrumbList` on every non-home page.
  - `WebApplication` on calculator, generator and country pages, with `isPartOf` pointing to the WebSite `@id`.
  - `FAQPage` only where the FAQ is visible.
  - `CollectionPage` on the three hubs, with `hasPart`.
  - No fake ratings, reviews, prices, addresses or phone numbers.
- Sitemap: keep `@astrojs/sitemap`, exclude 404. Add `lastmod` from a single build date if it is accurate; do not fake per-page dates.
- Robots: allow all, point to the sitemap. Keep 404 noindex.
- ads.txt: keep the file and the placeholder until the real publisher ID is supplied. Never invent a publisher ID.
- Internal linking: every tool linked from its hub and footer; every country page linked from the countries hub; related tools on tool pages; breadcrumbs on all non-home pages. No orphan pages.
- Static HTML: all copy and headings server-rendered. Demos are enhancements, not the content.
- One H1, keyword-led but plain: e.g. "Freelance business tools that keep your numbers private", "Business calculators for independent work", "Invoice rules by country".
- Meta descriptions: lead with the job and the market, state free/no sign-up/no upload, 140 to 160 characters.

### 3.10 File and component plan

New or heavily changed:

- `src/styles/global.css`: new tokens, light/dark, bento system, ad bands, remove dead home styles.
- `src/components/layout/BaseLayout.astro`: sitewide Organization/WebSite JSON-LD, critical CSS, theme bootstrap, palette policy.
- `src/components/layout/Header.astro`: simplified nav, primary CTA, accessible search trigger, mobile sheet focus trap.
- `src/components/layout/Footer.astro`: smaller optimized wordmark, 4 columns, legal links.
- `src/components/layout/ToolPageLayout.astro`, `GeneratorPageLayout.astro`: restyle, keep structure.
- New `src/components/bento/BentoTile.astro`, `BentoGrid.astro`, `StatTile.astro`, `PaperTile.astro`, `DiagramTile.astro`, `LinkTile.astro`.
- New `src/components/home/HeroBento.astro`, `ToolkitBento.astro`, `CountriesBento.astro`, `ProofBento.astro`.
- New `src/components/stageshow/*` only for the demos, plus the copied kit.
- `src/components/ads/AdSlot.astro`: **markup unchanged**; only wrapper classes if needed. Prefer no change at all.
- `src/components/ads/ConsentBanner.astro`: accessibility polish only; keep the storage key, event contract and consent semantics.
- `src/pages/index.astro`: rebuild the home from bento sections; keep all five ad instances and the existing real data.
- `src/pages/calculators/index.astro`, `src/pages/generators/index.astro`, `src/pages/countries/index.astro`: bento hub layouts.
- Tool, generator and country pages: simplify wrappers, keep content and JSON-LD, keep ad instances, move ads only as the plan allows.
- `src/pages/about`, `contact`, `privacy`, `terms`, `404`: restyle to the new prose shell; no ads; no palette if it can be avoided.
- `astro.config.mjs`: `preact({ compat: true })` only if Phase 4 passes; maybe `build.inlineStylesheets`.
- `src/config/site.ts`: no name/domain change; token-level metadata only.
- `public/ads.txt`: do not change except a real publisher ID supplied by the owner.
- `docs/redesign/results.md`: after Phase 6.

Reuse, do not rebuild:

- The calculator and generator islands and their engines. Redesign their shells, not their maths.
- The ad component logic.
- The consent storage and event contract.
- The country data and sources.
- The tool registry (`src/lib/tools.ts`).
- The existing print sheet and document preview.

### 3.11 Implementation order (after approval)

1. Commit baseline and branch checkpoint.
2. Tokens, theme bootstrap, global CSS, bento primitives, header/footer.
3. Home hero bento and toolkit bento, static first.
4. Hub bentos.
5. Tool, generator, country and legal page shells.
6. SEO/JSON-LD consolidation, metadata audit.
7. Ad container restyle and placement verification.
8. Accessibility fixes, including the header search name.
9. Phase 4 Stageshow install, demos, weigh, fallback if needed.
10. Phase 5 full build and page-by-page QA.
11. Phase 6 Lighthouse, axe, keyboard, reduced motion, widths, link and schema checks, `docs/redesign/results.md`.

### 3.12 Decisions needed from you before the build

**D-1. Light theme.** The brief asks for light/dark tokens, but the current site has a deliberate dark-only decision (D-35). My recommendation: ship dark as the default and add a tested light "paper" theme with a small footer theme switch (auto/dark/light), no hydration. This costs one extra token set and one axe/contrast pass. If you want to keep dark-only, say so and I will drop the light tokens.

**D-2. Stageshow weight.** My plan is home-only demos: hero plus two bento tiles, hydrated after paint, with static posters for hubs. If you want animated demos on the hub pages too, I will add one per hub and hold them to the same 60KB budget. Default: home only.

**D-3. Hero primary action.** My recommendation is "Find your rate" as the single primary CTA, with "Make an invoice" as the secondary. This matches the current top job and the strongest search intent. If invoice is the higher-value action for you, swap them.

**D-4. TodayDashboard.** My recommendation is to keep the local desk as a compact panel tile, not the first screen, so the tools lead. If you want the desk to remain the first screen, say so.

**D-5. Ad density.** I will keep all 80 existing instances and five home slots. If you want fewer units on home (for example drop the sidebar or the anchor), that is a business call and I will not remove them without your instruction.

**D-6. Brand assets.** The header and footer wordmarks are the only real brand art. I will optimize them with Astro's image pipeline but not redraw them. If you have a vector or a higher-resolution mark, supply it before Phase 5.

---

## 3.13 Approval record (2026-11-19)

Approved with the changes below. These amend sections 3.3, 3.5 and 3.6 where they
conflict.

**Changes**

1. **Home bento trimmed to 14-16 tiles.** Drop M, N, O and P (the redundant
   link/diagram tiles) and condense the proof section. Drop the C/D/E quick-start
   row as well; the hero CTAs and the section links already carry those jobs. The
   shipped home should land at 16 tiles: A, B, F, I, G, H, J, K, L, Q, R, S, T,
   U, W, Z.
2. **Ad boxes never clip a creative.** Use `min-height` only (no fixed height, no
   `overflow: clip` on the slot), `contain: layout paint`, and
   `overflow-anchor: none`. Any extra height from a taller responsive creative
   goes below the fold; nothing above it moves. Verify with filled mock
   creatives, not placeholders.
3. **Stageshow scope: hero demo only.** Only the hero demo animates. Bento F
   (hourly rate) and G (invoice) stay static posters unless the Phase 4
   measurements show clear headroom. Demo JavaScript is capped at **30KB gzip on
   any page** (replacing the 60KB demo allowance in 3.6), and LCP must stay
   < 2.0s on throttled mobile. If either fails, the hero demo falls back to its
   poster.
4. **Swapped bento order:** F (UI), I (stat), G (paper), H (panel). This is the
   DOM order; the grid places H in the second row so the three-row block has no
   holes.
5. **Generators on `client:idle` get a reserved-size shell.** The form stays
   server-rendered (so there is no empty first paint), the wrapper reserves its
   height, and a hydration-pending state keeps the first tap from feeling dead.
   Verify CLS remains 0 and the first control responds.

**Decisions**

| ID  | Decision                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------- |
| D-1 | Yes to a light theme, built last. Drop it if it risks the schedule; dark stays the default.              |
| D-2 | Home only. Hub pages and tool pages keep static posters; no demos there.                                 |
| D-3 | Keep **Find your rate** as the primary action and "Make an invoice" as the secondary.                    |
| D-4 | Keep the compact desk tile (bento H).                                                                    |
| D-5 | Keep all ad slots, including the sidebar and the mobile anchor.                                          |
| D-6 | No vector available. Keep the existing wordmark raster assets and optimize them; do not redraw the mark. |

**Open facts that must not be invented:** hosting is assumed static (Cloudflare
Pages); the domain, AdSense publisher ID and contact email stay placeholders
until the owner supplies them. No host config is added in this pass.

**Checkpoint 2** is the stop after Phase 4 (home bento built, ad boxes verified
with filled creatives, hero demo measured and either shipped or fallen back).
No Phase 5 page-by-page QA, hub restyle or light theme before that checkpoint.

---

## 4. What was run for this brief

- `git checkout -b redesign/bento-v2`
- `pnpm build` (36 pages, success)
- Lighthouse 13 mobile and desktop on `/`, `/calculators/`, `/calculators/hourly-rate-calculator/`, `/generators/invoice-generator/`, `/countries/`, `/about/`
- Axe via `@axe-core/playwright` on 12 routes including all page types
- Per-page JS module graph measured from `dist` with gzip
- No site source files changed. Build output and audit JSON are ignored artifacts.

## 5. Checkpoint 1

Approved 2026-11-19 with the amendments recorded in 3.13. The brief covers Phases
1 to 3, and Phase 4 now starts from the home bento. The next stop is Checkpoint 2
at the end of Phase 4.
