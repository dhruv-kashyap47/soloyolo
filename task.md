# TASK TRACKER — Freelancer & Microbusiness Toolkit

Companion to [`plan.md`](./plan.md). This file is the **single source of truth for progress**.
`plan.md` says _what_ and _why_; this file says _what is done, what is next, and how it was verified_.

---

## How to use this file

**Status legend**

| Marker | Meaning                                                        |
| ------ | -------------------------------------------------------------- |
| `[ ]`  | Not started                                                    |
| `[~]`  | In progress / partially done (see note)                        |
| `[x]`  | Done **and** verified                                          |
| `[!]`  | Blocked / needs a decision from the user                       |
| `[-]`  | Intentionally deferred or out of MVP scope (see deferred list) |

**Rules**

1. A task is only `[x]` when its defined verification passed (typecheck/lint/test/build/e2e as applicable).
2. Every bug found gets a regression test before it is closed (plan §18).
3. No placeholders unless marked `TEMP` **and** listed in [Deferred / temp register](#deferred--temp-register).
4. Each phase ends with a **Gate**; a phase is not closed until the gate is green.
5. Never mark a phase done because it "builds" (plan §30).
6. Priority order is fixed: Correctness > UX > Performance > SEO > Maintainability > Feature count.

**Verification commands**

```bash
pnpm typecheck     # astro check (strict TS across .astro/.ts/.tsx)
pnpm lint          # eslint flat config
pnpm test          # vitest run (unit)
pnpm test:e2e      # playwright (builds + previews on :4321)
pnpm build         # astro build (static)
pnpm verify        # typecheck && lint && test && build
```

---

## Current status

| Field                                 | Value                                                                 |
| ------------------------------------- | --------------------------------------------------------------------- |
| Last updated                          | 2026-11-15                                                            |
| Current phase                         | **Phase 3: generators (Phase 2 complete, 8 of 8 calculators live)**   |
| Phase 0 gate                          | PASS (local: verify, e2e, axe, Lighthouse)                            |
| Phase 1 gate                          | PASS (design system, SEO, home)                                       |
| Phase 1.5 gate (first vertical slice) | PASS (Hourly Rate Calculator)                                         |
| Redesign gate (taste-skill)           | PASS: 22 warnings, 0 failures, no waivers                             |
| Phase 2 gate                          | **PASS: 8 calculators live, verify + 250 e2e green, axe clean, 25-26 KB gzip** |
| Phase 3 gate                          | NOT STARTED                                                           |
| Repo state                            | Git, remote `origin`; currently on `main` (work was on `redesign/soloyolo-premium`) |
| Toolchain                             | Node v24.21.0, pnpm 11.15.0, Astro 7.4.12, Tailwind 4.3.5              |

### Verified evidence (2026-11-15, Phase 2 gate)

| Check               | Result                                                                        |
| ------------------- | ----------------------------------------------------------------------------- |
| `pnpm verify`       | typecheck + lint + 310 unit tests + 15-page build, all green                  |
| `pnpm typecheck`    | 0 errors, 0 warnings, 1 pre-existing hint (static moment asset; 129 files)      |
| `pnpm lint`         | clean                                                                         |
| `pnpm test`         | 310 unit tests passed (28 files)                                              |
| `pnpm test:e2e`     | 250 passed = 125 flows x 2 engines (desktop Chromium + iPhone/WebKit)          |
| Accessibility       | axe: 0 serious or critical on all 14 routes; one h1 and unique title per route |
| Mobile              | 360 px and 390 px: no horizontal overflow on every calculator page            |
| Build               | 15 static routes + robots.txt + sitemap index/child                           |
| Console             | 0 console errors, 0 page errors on all 14 routes                              |
| JS payload          | **25.1-25.9 KB gzip per calculator page** (CSS-only reveal; no animation lib)   |
| Formula locality    | no arithmetic left in components or pages; `quoteWork` lives in the engine     |
| Lighthouse (mobile) | not re-run this pass; previous routes were 97-100 perf and payload is lower    |

### Verified evidence (2026-11-15, redesign)

| Check               | Result                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| Accessibility       | axe: 0 serious or critical violations on all 7 routes, keyboard walk clean          |
| Lighthouse (mobile) | home 100/100/100/100 (LCP 1.0 s, TBT 0 ms, CLS 0); calculator 100/100/100/100      |
| Lighthouse (desktop)| home 100/100/100/100 (LCP 0.3 s)                                                    |
| Design checker      | home: 0 failures, 23 warnings (motion, branding and type notes); built page same    |
| Motion              | reduced motion: nothing runs, the scroll moment is static, content readable         |

---

## Decision log

| #    | Decision                | Chosen                                                                 | Notes                                                                     |
| ---- | ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| D-01 | Package manager         | **pnpm 11**                                                            | Lockfile committed                                                        |
| D-02 | Git + commits           | **`git init` + commit per phase gate**                                 | Remote: `github.com/dhruv-kashyap47/soloyolo.git`; push not yet done      |
| D-03 | Product name & domain   | **Working placeholder: "Ledgerly" / `ledgerly.example.com`**           | Change `src/config/site.ts` + `PUBLIC_SITE_URL`; nothing else hardcoded   |
| D-04 | Framework versions      | **Astro 7.4 (Vite 8) + Tailwind 4.3 (CSS-first `@theme`)**             | TypeScript pinned to 5.9 — `@astrojs/check`/typescript-eslint reject TS 7 |
| D-05 | PDF export              | **Browser print → "Save as PDF" first; real PDF bytes only if needed** | Print CSS lands with the invoice generator (Phase 3)                      |
| D-06 | Contact mechanism       | _pending_ — rec. mailto address + copy fallback                        | Needed before Phase 5 legal pages                                         |
| D-07 | Default tax rates       | _pending_ — rec. UK 20% VAT, CA 5% GST / 13% HST, AU 10% GST, US 0%    | Each with official source URL + `verifiedOn` (Phase 4)                    |
| D-08 | Analytics               | _pending_ — rec. defer to Phase 7, aggregate-only                      | No PII, no amounts (plan §23)                                             |
| D-09 | Ad slots                | _pending_ — rec. layout-ready, disabled by flag                        | Never inside calculator workflows (plan §21)                              |
| D-10 | Locale scope            | _pending_ — rec. en-US/GB/CA/AU copy variants, no i18n framework       | Formatting already locale-aware per currency                              |
| D-11 | Deploy + CI             | **GitHub Actions CI written; Cloudflare Pages config in Phase 7**      | Workflow `.github/workflows/ci.yml`; first remote run on push             |
| D-12 | Legal operator identity | _pending_ — rec. real entity for About/Privacy/Terms                   | Required before launch, Phase 5                                           |
| D-13 | Currency conversion     | **None in MVP: the selector formats, never converts**                  | Live FX (e.g. Frankfurter) would add a third-party request, breaking the privacy line and P6-11; revisit post-launch behind a flag and a privacy review |

---

## Phase 0 — Bootstrap (repo + tooling)

Goal: a strict, reproducible skeleton with gates wired up before any product code.

- [x] **P0-01** `git init`, `.gitignore`, `.nvmrc`
- [x] **P0-02** `package.json` (private, ESM, dev/build/preview/typecheck/lint/format/test/test:e2e/verify)
- [x] **P0-03** Astro + TypeScript **strict** (`astro/tsconfigs/strict`, `noUncheckedIndexedAccess`), `@/*` alias
- [x] **P0-04** Preact island integration (`@astrojs/preact`), no React compat layer
- [x] **P0-05** Tailwind 4 via `@tailwindcss/vite`; tokens in `src/styles/global.css` (`@theme`)
- [x] **P0-06** ESLint 10 flat config (`typescript-eslint`, `eslint-plugin-astro`) + Prettier (astro + tailwind class sorting)
- [x] **P0-07** Vitest config (`node` env, `@` alias)
- [x] **P0-08** Playwright config: `desktop-chromium` + `mobile-safari` (iPhone 13 / WebKit), webServer = build + preview
- [x] **P0-09** `zod` + `decimal.js` installed; `src/lib/finance/money.ts`
- [x] **P0-10** `src/config/site.ts` (name, description, locale, default currency)
- [x] **P0-11** CI workflow (`.github/workflows/ci.yml`): install → typecheck → lint → unit → build → Playwright (Chromium+WebKit) → report artifact
- [x] **P0-12** `README.md` (setup, scripts, structure, architecture rules, configuration)

**Gate 0:** ✅ `pnpm verify` green; workflow file committed (remote execution pending first push).

---

## Phase 1 — Foundation, design system, SEO infrastructure

### 1.1 Layout & shell

- [x] **P1-01** `BaseLayout.astro` — lang, skip-link, header/main/footer, print hook, flex column so footer sits at the bottom
- [x] **P1-02** `Header.astro` — brand mark + wordmark, primary nav with `aria-current` (no JS, no hamburger needed yet)
- [x] **P1-03** `Footer.astro` — live tool links, principles, disclaimer line; filters `live` tools from the registry
- [x] **P1-04** `Breadcrumbs.astro` — visible breadcrumbs + generated `BreadcrumbList` JSON-LD
- [x] **P1-05** `ToolPageLayout.astro` — enforces plan §10/§11 page order, privacy line under the intro
- [x] **P1-06** `Section.astro`, `FAQList.astro` (details/summary, emits `FAQPage` JSON-LD)
- [x] **P1-07** `RelatedTools.astro` + typed tool registry (`src/lib/tools.ts`); excludes the current page, handles the empty state

### 1.2 Design system

- [x] **P1-08** Tokens: warm paper canvas, ink, single evergreen accent, lines, danger/warn pairs, serif display + system sans + mono
- [x] **P1-09** Buttons (`.btn`, primary/secondary/ghost, disabled, focus-visible)
- [x] **P1-10** Field primitives: label, hint, error, `aria-describedby` wiring, reserved error space
- [x] **P1-11** `NumberInput` behaviour inside the island: text + `inputMode="decimal"`, currency prefix/unit suffix, paste-safe parsing, no placeholder-only labels
- [x] **P1-12** Select (currency) + textarea primitives via shared field classes
- [x] **P1-13** `ResultPanel` implemented inside the calculator: headline figure, `dl` breakdown, copy action, `aria-live` summary
- [x] **P1-14** Tables: responsive card/`dl` pattern used for worked examples (stacked on mobile)
- [x] **P1-15** `Callout.astro` (info/warn/danger)
- [-] **P1-16** Tabs — skipped: no screen needs them; do not build speculative components
- [x] **P1-17** Reduced motion support (`prefers-reduced-motion` kills transitions/scroll behaviour)
- [~] **P1-18** Print stylesheet: minimal global print rules now (`.no-print`, white background); **full A4/Letter invoice print CSS moves to Phase 3** with the document engine

### 1.3 Finance & validation kernels

- [x] **P1-19** `money.ts` — Decimal config (precision 40, half-up), `roundMoney`, `sumDecimals`, `safeDivide`, `toDisplayNumber`, `MAX_MONEY`
- [-] **P1-20** `percent.ts` — deferred until a calculator needs percentages (Phase 2: markup/margin, fees, tax, retainer)
- [~] **P1-21** Validation: `parseAmountInput` (strict, accepts `$1,200.50`, `1 200,50`, `(250)`, rejects junk) + Zod **build-time** content schema. Shared Zod input schemas deliberately not used for islands (bundle size)
- [x] **P1-22** `Result`-style unions per calculator: `{ ok: true; value } | { ok: false; code; message }`; UI never sees `Infinity`/`NaN`
- [~] **P1-23** Formatting: currency + number done (Intl, locale per currency); date formatting deferred to generators (Phase 3)
- [x] **P1-24** Unit tests for money, parsing, formatting (float traps, rounding, zero, negative, huge)

### 1.4 SEO infrastructure

- [x] **P1-25** `SEO.astro` — title template, description, canonical, OG, Twitter, robots, absolute URLs from `Astro.site`
- [x] **P1-26** JSON-LD: `WebApplication` (calculator), `FAQPage` (FAQ list), `BreadcrumbList`, `Organization` + `WebSite` (home). Emitted by the component that owns the content
- [x] **P1-27** `@astrojs/sitemap` excluding 404; `sitemap-index.xml` + `sitemap-0.xml`
- [x] **P1-28** `robots.txt` endpoint referencing the sitemap
- [~] **P1-29** 404 page (noindex) + `trailingSlash: 'always'` + directory build output; redirect rules file deferred to deployment (Phase 7)
- [x] **P1-30** Home page — positioning, worked-example card, live tool, in-development list, principles, CTA band (no huge hero, no stock photos)

**Gate 1:** ✅ `pnpm verify` green; Lighthouse mobile `/` = 100/100/100/100; sitemap + robots reachable (e2e); zero hydration on static pages.

---

## Phase 1.5 — FIRST VERTICAL SLICE: Hourly Rate Calculator

- [x] **P1.5-01** `src/lib/calculators/hourlyRate.ts` — pure Decimal function; guards negative, zero capacity, weeks ∉ [1,52], hours ∉ [1,168], non-finite, > 1e9
- [x] **P1.5-02** Form validation with per-field messages, independent field errors, paste formats
- [x] **P1.5-03** Vitest suite: 15 cases incl. documented example ($92,000 ÷ 1,200 = $76.67), UK/AU examples, zero, decimals, 1e9, half-cent boundary, invalid, immutability
- [x] **P1.5-04** `HourlyRateCalculator.tsx` island — `client:load`, prefilled example, currency selector, live result, copy, reset, field errors, reserved error space, `aria-live`
- [x] **P1.5-05** Page follows template: H1 → tool → How it works → Formula → Worked examples → Assumptions → FAQ → Related tools
- [x] **P1.5-06** Content: 3 worked examples (US/UK/AU, different scenarios), 6 assumptions, 7 FAQs, 2,000+ words of genuinely useful copy
- [x] **P1.5-07** SEO: unique title/description, canonical, OG, `WebApplication` JSON-LD, breadcrumbs, FAQ schema, internal links
- [x] **P1.5-08** E2E: load, compute, change input, invalid field, invalid submit + focus, currency, reset, keyboard, FAQ, mobile 390/360, 404 (× 2 engines)
- [x] **P1.5-09** Review: no `any`, no formulas in UI, no duplicated math, component ≈ 330 lines incl. markup
- [x] **P1.5-10** Pattern documented in `docs/calculator-slice.md`

**Gate 1.5:** ✅ `pnpm verify` + 52 e2e green; Lighthouse calculator = 97/100/100/100; axe 0 serious/critical; 360 px verified; screen-reader result announced via polite live region.

### Bugs found and fixed in this phase

| Bug                                                                    | Fix                                                                | Regression test                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| Inline error on blur shifted the submit button, so the click missed    | Reserve error space (`min-h-4`), always render the error paragraph | `blocks submission… focuses first invalid field` |
| Scrollable formula `<pre>` was not keyboard-focusable on WebKit/mobile | `tabindex="0"` + `role="region"` + accessible label                | axe scan on mobile-safari                        |
| Related-tools empty state linked the page to itself                    | Filter the current pathname out of related + fallback lists        | Manual review; link-audit e2e                    |
| Worked-example prose rendered "1200hours" (Astro whitespace collapse)  | Build the sentence in frontmatter with `formatNumber`              | Visual review + content drift tests              |

---

## Phase 2 — Calculators (complete)

Same architecture as P1.5: pure logic → validation → island → SEO page → tests.

- [x] **P2-01** Freelance Rate Calculator — desired income, expenses, working weeks, hours, non-billable %, desired buffer/profit; explain assumptions on-page; guard ≥100% non-billable
- [x] **P2-02** Project Profit Calculator — revenue, labor, contractor, software, other, overhead → total cost, gross profit, margin, markup (losses are a valid result; margin/markup nullable when the denominator is zero)
- [x] **P2-03** Markup vs Margin Calculator — cost, price, markup, margin; solve for the missing value; explicit "markup ≠ margin" comparison table (four modes; the table is generated from the engine at build time)
- [x] **P2-04** Payment Processing Fee Calculator — amount, % fee, fixed fee → % fee, fixed fee, total fee, net, effective %; no hard-coded processor rates (effective rate makes small-payment costs visible)
- [x] **P2-05** VAT/GST/Sales Tax Calculator — exclusive→inclusive, inclusive→exclusive, tax amount, configurable rate; country terminology (US/UK/CA/AU labels, no bundled rates); not-tax-advice banner
- [x] **P2-06** Retainer Pricing Calculator — monthly hours, hourly rate, expenses, desired margin, discount → retainer, annual revenue, effective hourly, profit, margin achieved after the discount
- [x] **P2-07** Break-even Calculator — fixed costs, variable cost/project, price, unit mode (per project or per hour) → BE revenue, units, hours; refuses a price at or below variable cost
- [x] **P2-08** Unit tests per calculator (same matrix as P1.5-03), independent files/fixtures — 8 of 8, each with engine + schema tests; also losses, null denominators, mode-dependent validation and rounding boundaries
- [x] **P2-09** Page per calculator with formula, worked examples, assumptions, FAQs, related links — 8 of 8
- [x] **P2-10** `/calculators/` index with all live tools + one-line value props — reads `liveTools('calculator')`; the page now leads into Phase 3 generators
- [x] **P2-11** E2E happy path + one invalid case per calculator — 8 of 8 specs, both engines
- [x] **P2-12** Content/code drift guard for every worked example (extend P1.5 pattern) — 8 of 8; markup vs margin also guards the comparison table
- [x] **P2-13** Add `percent.ts` helpers once the first percentage calculator needs them — `percentToFraction` and `percentOf`, used by freelance, markup, fee, tax and retainer
- [x] **P2-14** Refactor repeated island pieces only when the **second** calculator proves the duplication — `useCalculatorForm` owns values, touched/submitted state, first-error focus, reset and example replacement for all 8 islands; shared `CurrencySelect`, `useIslandReady`, `currencySymbol`, `isUsableDecimal`

**Gate 2: PASS.** All 8 calculators live and tested; `pnpm verify` + 250 e2e green; no formula outside `lib/` (the last two derivations moved into the engines as `fixedFee`, `overhead` and `quoteWork`); every page has formula, assumptions and FAQ; **bundle is 25.1–25.9 KB gzip per calculator page**, down from 37 KB once the animation library was replaced with CSS keyframes.

### Bugs found and fixed in Phase 2

| Bug                                                                 | Fix                                                                 | Regression test                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| Tax: displayed net + tax could miss the displayed gross by a cent (remove mode, e.g. 2.01 at 100%) | Round once, then derive the third displayed figure from the other two | `keeps the displayed net and tax adding up…` + 60-case matrix |
| Payment fee: displayed net + fee could miss the amount (e.g. 0.02 with a 0.005 fixed fee) | Derive the displayed net from the rounded amount and fee            | `keeps the displayed fee and net adding up…` + 60-case matrix |
| Break-even hour mode: footnote read “a fraction of a hour cannot be sold” and justified rounding with project logic | “Rounded up to the next whole hour, so the target is achievable”     | e2e hour-mode assertion                                       |
| Worked examples wrote A$/C$ while Intl prints “$” for CAD/AUD        | Copy normalised across all eight calculators                        | `currencyCopy.test.ts` scans every example                    |
| Retainer: “hourly rate” hint implied a billing rate, not a cost rate | Hint now says the rate you cost your own hour at                    | Manual review of the rendered page                            |
| e2e reused a preview server across rebuilds; on Windows it served 404s for files the new build had just written | `reuseExistingServer: false` — a busy port now fails fast            | Harness change; full 250-flow run green twice                 |

---

## Phase 3 — Generators (shared document engine first)

- [ ] **P3-01** `lib/generators/document.ts` — typed document model shared by all four generators
- [ ] **P3-02** `lib/generators/totals.ts` — subtotal, line/total discounts, per-line taxes, grouped tax summary, total, amount due; Decimal-only; unit-tested
- [ ] **P3-03** `lib/generators/numbering.ts` — invoice/quote/receipt number formatting + next-number helper (local only)
- [ ] **P3-04** `lib/storage/profile.ts` — versioned, Zod-validated localStorage profile; clear-data action; honest copy
- [ ] **P3-05** `components/invoice/DocumentPreview.tsx` — professional A4/Letter preview (logo, addresses, meta, line items, totals, notes, tax IDs)
- [ ] **P3-06** Print flow: `window.print()` + full print CSS (`@page`, page breaks, no clipping); preview == print
- [ ] **P3-07** Logo upload: client-side data URL, type/size validation, never uploaded
- [ ] **P3-08** Invoice Generator — full field set from plan §6.1, live preview, print/PDF, reset, profile persistence
- [ ] **P3-09** Quote Generator — quote number, expiry, terms, same engine
- [ ] **P3-10** Receipt Generator — transaction date, receipt number, payment method/status, compact layout
- [ ] **P3-11** Payment Reminder Generator — 4 tones, placeholders, copy-to-clipboard
- [ ] **P3-12** Generator index + page templates
- [ ] **P3-13** E2E: create, totals correct, preview renders, print invoked (stubbed), country switch, mobile
- [ ] **P3-14** Long-form a11y: error summary, focus management

**Gate 3:** all 4 generators work; printed invoice is genuinely sendable; totals tests green.

---

## Phase 4 — Country localization (US · UK · CA · AU)

- [ ] **P4-01** `lib/countries/types.ts` — `CountryConfig` shape
- [ ] **P4-02** US config — USD, sales tax, configurable-only, US defaults
- [ ] **P4-03** UK config — GBP, VAT 20%, VAT invoice mode, VAT number, GOV.UK sources
- [ ] **P4-04** CA config — CAD, GST 5% / HST 13%, business number, CRA sources
- [ ] **P4-05** AU config — AUD, GST 10%, ABN, "Tax invoice", ATO sources
- [ ] **P4-06** Registry + Zod-validated shape + `verifiedOn` + `sources[]` on every tax claim
- [ ] **P4-07** Verification pass against official sources; record changes + date
- [ ] **P4-08** Generator integration: country drives currency, labels, required fields, title
- [ ] **P4-09** Country pages (7 routes from plan §2)
- [ ] **P4-10** Genuinely different fields/examples/requirements/FAQ/sources per country
- [ ] **P4-11** Country hubs/internal linking without thin duplication
- [ ] **P4-12** Tests: config schema, required fields, currency snapshots, tax labels, E2E switch

**Gate 4:** 4 countries functional; zero hard-coded tax strings in components; every tax claim sourced.

---

## Phase 5 — Content, legal & SEO

- [x] **P5-01** `/about/` — who operates the site
- [~] **P5-02** `/contact/` — page shipped at `/contact/`; real channel pending (T-15, placeholder address in place)
- [x] **P5-03** `/privacy-policy/` — shipped at `/privacy/` (data collected, localStorage, analytics, processors)
- [x] **P5-04** `/terms/`
- [~] **P5-05** `/disclaimer/` — no separate route; the not-advice disclaimer lives on every calculator page and in the footer
- [ ] **P5-06** `/resources/` — curated index only if it supports the tools
- [ ] **P5-07** Content QA on all calculators: formula, assumptions, example, limitations, FAQ quality
- [ ] **P5-08** Related-tool matrix: 3–5 genuinely related links per page, no orphans
- [ ] **P5-09** Unique title/description + heading hierarchy audit across all routes
- [~] **P5-10** OG images (static per page family), favicon set, web manifest — OG image + 32/48/apple-touch icons shipped; **web manifest still missing**
- [~] **P5-11** Extend content/code drift checks to every worked example — 2 of 8 calculators covered

**Gate 5:** legal pages real (no placeholders); link audit 0 orphans/broken; unique metadata on all routes.

---

## Phase 6 — Testing, accessibility, performance

- [ ] **P6-01** Unit coverage: every calculator/generator module ≥ 90% branches
- [ ] **P6-02** Full plan §18 E2E matrix
- [ ] **P6-03** Playwright projects: desktop Chromium, mobile WebKit, tablet
- [x] **P6-04** axe scan on every route (0 serious/critical) — **in place**, extend to new routes
- [x] **P6-05** Keyboard pass on the calculator — **in place**, extend to forms/generators
- [~] **P6-06** Screen-reader-friendly result updates implemented (polite live region); manual SR spot check still to do
- [~] **P6-07** Lighthouse budget met on current routes (100/97 perf); needs CI automation
- [x] **P6-08** Bundle audit: only the calculator hydrates; JS 27.6 KB gzip
- [x] **P6-09** Mobile usability: 360/390 px verified, touch targets ≥ 44 px on primary actions
- [ ] **P6-10** Print/PDF review across Chromium + WebKit (Phase 3 output)
- [x] **P6-11** Console/network audit: 0 errors, no third-party requests
- [ ] **P6-12** Cross-browser smoke: Chrome, Firefox, Safari, Edge
- [x] **P6-13** Regression tests seeded from every bug found so far

**Gate 6:** all plan §18 flows green; axe clean; Lighthouse budgets met on throttled mobile; print review signed off.

---

## Phase 7 — Production

- [ ] **P7-01** Cloudflare Pages project config, pinned build command + output dir
- [ ] **P7-02** `PUBLIC_SITE_URL` per environment; canonical/OG/sitemap correct in production
- [ ] **P7-03** Headers: cache policy, CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- [ ] **P7-04** Redirect rules for trailing slashes/legacy paths
- [x] **P7-05** GitHub Actions CI (PR checks) written; **deploy job + branch protection still to add**
- [ ] **P7-06** Analytics (D-08): aggregate-only events; no amounts/names/invoice contents
- [ ] **P7-07** Consent posture: no banner if no cookies; otherwise compliant
- [ ] **P7-08** Search Console: verify domain, submit sitemap
- [ ] **P7-09** Uptime/error monitoring + rollback procedure
- [ ] **P7-10** Post-launch checklist
- [ ] **P7-11** Ad slot readiness (D-09), disabled by default

**Gate 7:** production URL live; sitemap discoverable; Lighthouse production scores met; rollback documented.

---

## Definition of Done (plan §30)

- [x] All eight calculators work
- [ ] All four generators work
- [ ] Invoice generation works
- [ ] PDF/print output is professional
- [ ] US/UK/Canada/Australia configurations work
- [x] Financial calculations have automated tests
- [x] Critical flows have Playwright tests
- [x] Mobile UX is good (360 px verified)
- [x] Accessibility is acceptable (axe clean, keyboard pass)
- [x] SEO metadata exists on every route
- [x] Sitemap works
- [x] `robots.txt` works
- [x] Legal pages exist
- [x] No obvious console errors
- [x] No TypeScript errors
- [x] Production build succeeds
- [x] Lighthouse performance is strong
- [ ] Cloudflare deployment works
- [ ] Search Console can discover the sitemap

---

## Deferred / temp register

| ID   | Item                                         | Why deferred                                          | Revisit                        |
| ---- | -------------------------------------------- | ----------------------------------------------------- | ------------------------------ |
| T-01 | Real PDF byte generation (pdf-lib etc.)      | Print-to-PDF meets §6.1 with zero deps                | If print fidelity fails        |
| T-02 | Saved invoices, client list, history         | Premium scope (plan §22)                              | After launch + demand          |
| T-03 | Auth, DB, subscriptions                      | Explicitly excluded (plan §3, §29)                    | Not MVP                        |
| T-04 | State/local US sales tax lookup              | Plan §7 says no automatic calc in MVP                 | Post-launch                    |
| T-05 | Affiliate modules                            | Needs real partnerships                               | After traffic                  |
| T-06 | i18n framework                               | Country copy variants suffice                         | If multi-language demanded     |
| T-07 | Programmatic/profession pages                | Plan §13 forbids thin pages                           | After Search Console data      |
| T-08 | ~~`percent.ts` helpers~~                     | Done 2026-11-15: `percentToFraction`, `percentOf` + tests, used by the freelance rate buffer | n/a |
| T-09 | Full print stylesheet                        | Belongs with the invoice document engine              | Phase 3                        |
| T-10 | ~~OG images + per-page social cards~~        | Done 2026-11-15: `public/og.jpg` from the client logo | n/a                            |
| T-11 | ~~Legal pages (about/privacy/terms)~~        | Done 2026-11-15: about, contact, privacy, terms       | n/a                            |
| T-15 | Real contact address                         | The pages print `hello@soloyolo.example` until the client gives one | Before launch |
| T-16 | Real AdSense client and slot ids             | Only the consent gate and reserved slots are wired    | Before launch                  |
| T-17 | Google-certified CMP for EEA/UK              | The built-in consent card gates ads but is not a certified CMP | Before launch         |
| T-12 | Analytics + Search Console                   | Ship after the tools exist                            | Phase 7                        |
| T-13 | Tabs component                               | No screen needs it                                    | Only on real need              |
| T-14 | Full country configuration layer             | Placeholder-free localization starts after generators | Phase 4                        |
| T-18 | Live FX rates (Frankfurter or similar)       | Currency selector is format-only by design; a live rate is a third-party request and a privacy decision (D-13) | Post-launch, flagged, with a privacy review |
| T-19 | Home tool grid at 8 cards                    | The “Free tools” band now exceeds one screen; a compact list or a featured-four layout is a design decision, not a bug | Phase 5 content/design pass |

---

## Changelog

| Date       | Change                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| 2026-11-14 | Tracker created from `plan.md`                                                                                       |
| 2026-11-14 | Decisions D-01…D-05 recorded; Phase 0 + 1 + 1.5 scope agreed                                                         |
| 2026-11-14 | Phase 0 complete: Astro 7 / TS strict / Preact / Tailwind 4 / Vitest / Playwright / ESLint / CI / README             |
| 2026-11-14 | Phase 1 complete: layout, design system, Decimal finance kernel, parser, SEO/sitemap/robots/JSON-LD, home            |
| 2026-11-14 | Phase 1.5 complete: Hourly Rate Calculator slice, 48 unit tests, 52 e2e checks, axe clean, Lighthouse 97/100/100/100 |
| 2026-11-14 | Zod removed from the client bundle (123 KB → 44 KB island) and moved to build-time content validation                |
| 2026-11-14 | Fixed layout-shift submit bug + WebKit scroll-region a11y issue; regression tests added                              |
| 2026-11-15 | SoloYolo redesign shipped: new brand and logo, dark navy system, one screen per section, dealt scroll moment, AdSlot and consent gate, trust pages, ad map. Design gate PASS, Lighthouse 100s, 52 unit and 68 e2e tests green |
| 2026-11-15 | Bug pass: dev toolbar off, formula wraps on phones, shared NumberField fixes (class list, column sizing, currency insets, grouped input, reserved error space), callout as a left rule, calculator index rebuilt in two columns with a closing action, page title names the tool and its audience, design language written in `docs/design.md` |
| 2026-11-15 | **P2-01 shipped: Freelance Rate Calculator** (income, expenses, weeks, total hours, non-billable %, profit buffer → rate with and without the buffer). New `percent.ts` kernel, 3 worked examples computed at build time, 8 FAQs, drift test, 13 e2e flows. Shared island pieces extracted (`CurrencySelect`, `useIslandReady`, `currencySymbol`, `isUsableDecimal`). 100 unit tests, 96 e2e, axe clean, 9 routes build |
| 2026-11-15 | Tracker hygiene: removed the duplicated stale status/evidence tables and corrected stale checkboxes (P5-01…P5-05, P5-10, P5-11, T-08) against the shipped trust pages |
| 2026-11-15 | **P2-02 shipped: Project Profit Calculator** (revenue, labor, contractor, software, other, overhead → direct/total cost, gross profit before overhead, profit, margin, markup; losses handled explicitly; null margin/markup when the denominator is zero). 3 worked examples including a loss, 7 FAQs, drift guard on margin + markup, 12 e2e flows |
| 2026-11-15 | **P2-14 closed**: `useCalculatorForm` extracted from the three islands (values, touched/submitted, first-error focus, reset) after the third calculator proved the shape. D-13 records format-only currency; T-18 records live FX as deferred |
| 2026-11-15 | **P2-03 shipped: Markup vs Margin Calculator** (four modes: work out margin, markup, price or cost; any two numbers determine the rest). The markup≠margin comparison table is generated from the engine at build time and drift-guarded. New `replaceValues` on the form hook. 49 unit tests added, 16 e2e flows, axe clean, 11 routes build |
| 2026-11-15 | **P2-04 + P2-05 shipped**: Payment Fee Calculator (percentage + fixed fee → fee, net, effective rate; no bundled processor rates) and VAT/GST/Sales Tax Calculator (add/remove modes, US/UK/CA/AU terminology, no bundled rates). Both with 3 worked examples, drift guards on net/effective and tax/gross |
| 2026-11-15 | **P2-06 + P2-07 shipped**: Retainer Pricing Calculator (hours, rate, expenses, margin, discount → retainer, effective hourly, profit, achieved margin) and Break-even Calculator (per project or per hour, contribution, rounded units, revenue, hours; refuses price ≤ variable cost). Every calculator page now live |
| 2026-11-15 | **Gate 2 PASS**: 8 calculators, 310 unit tests, 250 e2e flows, axe clean on 14 routes, 15-page build. Result reveal moved from animejs to CSS keyframes (`result-reveal`), dropping per-page JS from ~37 KB to **25.1–25.9 KB gzip**; animejs dependency removed. Index and home now lead into the Phase 3 generators |
| 2026-11-15 | **Phase 2 bug pass**: display reconciliation in tax and payment fee (rounded parts must add to the total), break-even hour-mode copy corrected, A$/C$ copy aligned with the formatter across all eight calculators, retainer hint clarified, and Playwright no longer reuses a stale preview server. 4 new regression tests (314 unit total) |
