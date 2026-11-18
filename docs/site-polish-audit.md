# Site polish audit (post home redesign)

Scope: every page except `/`, compared against the redesigned front page's
system (tokens in `global.css`, squircle radius family, 8-pt rhythm, pill
buttons, reserved ad boxes, command palette). Structure, routes, features and
logic are out of scope: this audit only records deviations from the system.

Baseline (`pnpm build` + preview, Lighthouse mobile, local throttling):
hourly-rate calculator 99/100/100/100, LCP 1.76 s, CLS 0, TBT 88 ms;
invoice generator 97/100/100/100, LCP 1.78 s, CLS 0, TBT 159 ms;
countries index 97/100/100/100, LCP 1.98 s, CLS 0, TBT 79 ms.

## Systemic (fix once in shared code, propagates everywhere)

| # | Finding | Where | Fix |
|---|---|---|---|
| S1 | **Radius drift.** Two radius systems coexist. The squircle family (`--radius-sm` 10 / `md` 16 / `lg` 24) is applied via unlayered rules to `.sq`, `.btn`, `.card`, `.field-input` etc., but islands and page markup still carry Tailwind utilities from before the system: `rounded-xl` (12px) on calculator result panels, line-item cards and palette rows; `rounded-lg` (8px) on form alerts, selects, worked-example tables, mega-menu items and generator cards; `rounded-2xl` (16px) in QuickEstimator. Corners are 8/12/16px depending on which file a surface lives in. | all calculator islands, DocumentGenerator, LineItemsEditor, PaymentReminderGenerator, CommandPalette, Header, hub pages | One unlayered snap rule mapping the legacy utilities onto the family (`lg`→`sm`, `xl`→`md`, `2xl`→`md`) plus squircle `corner-shape`, so every legacy corner lands in the family without touching 40 files. |
| S2 | **Off-token colours.** `bg-emerald-400` / `text-emerald-400` (QuickEstimator pulse dot + copy success) and `text-amber-400` (palette pin star) are not in the palette. Success feedback elsewhere (`Copied.` on calculator islands) uses `accent-strong`. | QuickEstimator.tsx, CommandPalette.tsx | Use `accent` / `accent-strong` tokens. |
| S3 | **Dead CSS.** The `pinned-chapters` moment block (~250 lines), `.dashboard-card`, `.tool-matrix:has(...)`, `.hotkey-pill`, `.country-badge` and `.text-gradient` are defined in `global.css` and referenced by no page, island or test. `public/assets/moments/` ships 4 files no route loads. | global.css, public/assets/moments | Delete both. |
| S4 | **No prefetch.** `astro.config.mjs` has no `prefetch` config; every navigation is a cold fetch even though the site is fully static. | astro.config.mjs | Enable Astro prefetch for internal links (hover strategy). |

## Page by page

| Page | Deviations | Notes |
|---|---|---|
| `/calculators/` (index) | Closing block is a bare two-column row, not the `.closing-panel sq` treatment home S5 uses for the same "Ready when you are" moment. | Rest of page conforms: tokens, ToolCard, ads (top + end, below the fold), 12-col grid. |
| `/generators/` (index) | Same closing-block deviation. Country guide cards conform. | Same fix as above. |
| 8 calculator pages | Result panel `rounded-xl`, form alert `rounded-lg`, worked-example `dl rounded-lg` (S1, systemic). Ads per placement map (top, in-article, sticky sidebar, end). Forms use the shared NumberField (44px targets, reserved error space). | No other deviation. |
| 4 generator pages + 15 country pages | Guide cards and generator sub-cards carry `rounded-lg`/`rounded-xl` (S1, systemic). Ads: top + end only, after the tool and after the FAQ, never near the print/clear toolbar. Print path (`no-print` shell) intact. | No other deviation. |
| `/countries/` (index) | Comparison table is `min-w-[52rem]` inside `overflow-x-auto`: on a phone it is a horizontal-scroll sheet with no sticky leading column. One ad (end). | Table redesign (card list on mobile or sticky column) is a structure change: flagged, not done. |
| `/about/`, `/contact/`, `/privacy/`, `/terms/` | None. Tokens, prose-ledger, breadcrumbs, no ads. | Clean. |
| `/404` | None. No ads by policy. | Clean. |
| Header / Footer / ConsentBanner / AdSlot | Mega-menu items and mobile-sheet cards carry `rounded-lg`/`rounded-xl` (S1, systemic). Everything else identical on every route (palette trigger, ⌘K hint, consent copy). | Shared header/footer already uniform. |
| Command palette | `rounded-lg` close button, `rounded-xl` rows (S1, systemic); amber pin star (S2). Search, recents, pins, keyboard model all conform. | Color + radius only. |
| Home islands (TodayDashboard, QuickEstimator) | QuickEstimator: emerald/line-colour classes (S2), `rounded-2xl`/`rounded-lg` (S1). Inputs persist and restore (already). | These render on `/` only; fixing keeps the desk consistent with its own rules. |

## Ease-of-access gaps worth a decision (flagged, not built)

1. **Quick actions outside home.** "New invoice / Start timer / Add client" exist
   only on the desk. Every page already reaches them through the palette
   (⌘K, `1`/`2`/`3`, `/`) and the header search button, so a second global
   quick-action bar would duplicate chrome. Flag: add a compact quick row to
   the header mega-menu footer if usage data shows palette-only reach is slow.
2. **Countries comparison table on phones** (above).
3. **Calculator autosave.** QuickEstimator persists inputs; the eight
   calculator islands deliberately do not (privacy copy says inputs
   "disappear when you close the tab"). Persisting would be a product decision,
   not polish: flagged.
4. **RTL / i18n.** The site is English-only with logical properties used
   inconsistently with physical ones in islands; full RTL-readiness is a
   project, not a pass. Flagged.

## Research notes (Phase 2)

Web search returned no results in this environment (four queries attempted), so
the findings are anchored on the repo's own researched docs
(`docs/home-design-and-ads.md`, `docs/redesign-plan.md`) and established
guidance:

- **AdSense program policies / better-ads guidance:** ads must not sit next to
  controls a visitor might click by accident, must be clearly labelled, must
  not push content (zero CLS), and load only after consent. The current slot
  map already satisfies this on inner pages: every ad is after the tool or
  after a content section, never beside the print/clear buttons, and every box
  is reserved in CSS. Fix list adds nothing here beyond keeping it.
- **Inner-page density (Stripe/Notion-style tool pages, Linear-style hubs):**
  monetised content pages sustain 2-4 units when each sits at a real content
  break; tool controls stay above the first ad. Current: calculators 4
  (map-mandated), generators 2, country pages 2, indexes 2, countries index 1.
  No density change.
- **Forms/tables/settings best practice:** inline validation with reserved
  error space (shared fields already do), 44px targets (chip and pointer
  rules already do), horizontal-scroll tables get a sticky first column or a
  mobile card list (flagged above).

## Post-change verification

- `pnpm verify` (astro check, eslint, 544 unit tests, build 36 pages): all
  green. Full e2e: 608 passed, including axe accessibility, no-JS,
  no-third-party-network, print, and mobile-overflow suites.
- **Design-consistency gate** (`consistency.mjs`, from the frontend design
  skill): run against `/calculators/` after the changes — 32 FAIL / 13 WARN.
  Calibrated by running the same gate against the already-redesigned home
  page: 69 FAIL / 26 WARN, and every FAIL class raised on the inner pages
  (scroll-reveal, no-visual, card-visual, flush, cta, button-styles,
  container-edges, section-height, one-section, one-heading, off-grid) is
  raised on the home page too. The gate is built for marketing/company
  sites and its heuristics (every section needs a photo, closing section
  needs a CTA, no reveal animations) contradict this product's
  design system (`docs/design.md`), which intentionally keeps tool hubs
  text-dense with quiet reveal moments. Treated as design-intent, not
  regressions. Reports saved to `.tmp-audit/consistency-*.txt`.
- **Lighthouse before/after** (2nd run for "after" to control TBT noise;
  CLI v13.6.0, headless):

  | Page | Perf | A11y | BP | SEO | LCP | CLS | TBT | Transfer |
  |---|---|---|---|---|---|---|---|---|
  | calculators/hourly-rate | 99 → 99 | 100 | 100 | 100 | 1.76 → 1.69s | 0 | 88 → 90ms | 140 → 141KB |
  | generators/invoice | 97 → 97 | 100 | 100 | 100 | 1.78 → 1.70s | 0 | 159 → 158ms | 165 → 166KB |
  | countries/ | 97 → 97 | 100 | 100 | 100 | 1.98 → 2.00s | 0 | 79 → 93ms | 115 → 116KB |

  The ~1KB transfer growth is the Astro prefetch module (2.5KB min-gzip,
  offsets the deleted moments CSS). TBT at parity: the added prefetch
  script costs nothing measurable on load. All reports in
  `.tmp-audit/perf-{baseline,after,after2}-*.json`.

## Bug check and fix session (18 November 2026)

A frontend-only pass over every page, island, shared form helper and
calculation module. 550 unit tests now cover the regressions below; the
full 608-test e2e suite (desktop + mobile) is green.

### Input and math

- **Decimal point caret** — typing `1,200.50` no longer inserts the `5`
  before the point (the shared number field keeps a caret that sat after a
  decimal separator). Decimal commas (`7,5`) are preserved and read as
  7.5 instead of being regrouped to 75.
- **Negative zero** — money and percentages that round to zero print
  `$0.00` / `0.0%`, not `-$0.00` / `-0.0%`; loss banners now follow the
  rounded figure actually shown.
- **Signed input** — `--5`, `(-250)` and `(+250)` are rejected instead of
  being silently flipped; `-$5` and `$-5` still parse.
- **Printed price drives the amount** — a document line rounds quantity and
  unit price to two decimals before multiplying, so `1.005 × 100` prints
  `1.01 × $100.00 = $101.00` rather than an invisible `$100.50`.
- **Break-even** — fractional break-even is rounded up in the sentence and
  hours row, matching the headline; the “no break-even” message is now
  announced by the live region.
- **Hourly rate** — fractional billable hours are shown to one decimal and
  the hours fields accept decimals on mobile.
- **Result panels** — the result title is an `h2` with a visible
  `:focus-visible` ring instead of a paragraph with `outline-none`.
- **Currency locale** — every calculator groups typed digits in the chosen
  currency’s locale (INR lakhs, CHF apostrophes), not always `en-US`.

### Generators

- **Tax label on a no-VAT invoice** — switching MwSt → VAT on a German §19
  invoice (or MWST → TVA in Switzerland) no longer applies 19% / 8.1% to
  lines that deliberately carried no tax. New rows inherit the current
  default rate instead.
- **Document numbering** — “Use the next number” preserves the prefix and
  padding the visitor typed (`RE-2026-014` → `RE-2026-015`), and falls back
  to the country’s prefix when the field has no prefix.
- **Receipts** — a blank “Amount received” on a paid receipt means paid in
  full, so the sheet no longer says `PAID` and `Balance due` together.
- **Payment reminder** — required fields, amount, date and link are
  validated; copy and print are blocked (with an alert and focus) until the
  message is usable.
- **Dates** — hydration writes the live example dates back into the date
  inputs, so the form and the sheet agree after a rebuild; due/expiry dates
  must not precede the issue date; customer email is validated.
- **Line items** — adding focuses the new description, removing keeps focus
  on the neighbouring row, Remove buttons name their row, and the error
  summary says which item a field belongs to.
- **Business profile** — an unreadable saved profile is kept (not deleted)
  with a Clear button; a full storage quota no longer disables a checked
  box; Reset no longer overwrites saved details with the example.
- **Logo** — the JPEG fallback fills white instead of turning transparent
  pixels black; removing a logo clears a previous error.
- **Documents this week** — Monday 00:00 is computed in local time, so
  Monday-morning prints count in UTC+ zones.

### Shell, palette and ads

- **Palette** — Enter on its own Pin/Close buttons no longer opens the
  highlighted tool; IME composition is respected; the scroll lock restores
  the previous value; opening it from the mobile menu closes the menu; the
  timer/client actions only appear on the home desk; “Add client” keeps
  focus; pins are capped visibly at eight; `localStorage` reads in the
  dashboard are guarded and malformed tracker/client data falls back safely.
- **Greeting** — the dashboard renders a neutral greeting on the server and
  sets the time-of-day greeting after mount.
- **Region** — the estimator follows the region event payload, so the
  dashboard and estimator agree even when storage is blocked.
- **Quick estimator** — Copy reports failure instead of a false “Copied!”.
- **Ads** — a placeholder never becomes a fixed anchor bar when no ad
  network is configured; the anchor sits below the header/menu; the
  viewability timer is cancelled below 50% visibility; clicks are counted
  only on a live creative; empty env slot vars fall back to the legacy
  names; Consent Mode sends the stored choice as an update on return.

### Copy and identity

- Removed shipped design-process HTML comments (`S0`–`S5` notes and similar)
  and the non-standard `<meta name="page-type">` tag.
- Removed AI-flavoured UI metadata: the pulsing dot, “Live Math” badge,
  “Interactive Rate Simulator” label, dot-joined count labels (“12 live
  tools”), stacked hero badges and hype eyebrows (“Under the hood”, “Ready
  when you are”).
- Replaced dot-separated metadata (example names, weekly goal, document
  notes) with plain separators, and rewrote the therapy-style streak copy.
- Removed every mention of a non-target country from shipped content. The
  region preference now contains only the eight supported markets (United
  States, United Kingdom, Canada, Australia, Germany, Switzerland, India,
  United Arab Emirates) plus a neutral International fallback; locale
  guessing, palette hints and the country tiles follow the same list.

### Deliberately left

- Ad boxes reserve a minimum height; a taller live creative can still shift
  content (needs a product decision on fixed creative heights).
- Canonicals/sitemap/robots and `ads.txt` still fall back to placeholder
  values until `PUBLIC_SITE_URL` and a real publisher id are configured.
- The seven-day streak resets with the ISO week; a true multi-week streak
  needs its own persisted counter.
- “Anonymous measurement” remains a forwarding contract: no event leaves
  the browser by default, so the choice has no visible effect yet.

