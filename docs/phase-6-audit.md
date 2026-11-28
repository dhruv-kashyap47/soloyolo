# Phase 6 audit — testing, accessibility and performance

Run 2026-11-24 against the launch build. Machine: Windows 11, Node 24.21.0,
pnpm 11.15.0, Astro 7.4.12, Playwright 1.65.1, Lighthouse 13.6.0.

Phase 6 is the verification phase, so this file records the evidence behind
every checkbox: the coverage rule, the plan §18 matrix, the browser projects,
the print review, the screen-reader contract, the network rule and the
Lighthouse baseline. The three items that need a human or a Phase 7 asset are
listed at the end, with the exact handoff.

## Plan §18 matrix (P6-02)

| Plan §18 flow                           | Where it is proved                                                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage loads                          | `home.spec.ts` — "homepage loads with the primary call to action"; every `smoke.spec.ts` engine                                                                                    |
| Calculator loads                        | `hourly-rate.spec.ts`, `freelance-rate.spec.ts`, `project-profit.spec.ts`, `markup-margin.spec.ts`, `payment-fee.spec.ts`, `tax.spec.ts`, `retainer.spec.ts`, `break-even.spec.ts` |
| Calculator accepts input                | The same eight specs; every input change is a real typing or fill action                                                                                                           |
| Calculator produces expected result     | The same eight specs assert the worked-example figure and at least one changed figure                                                                                              |
| Invoice can be created                  | `invoice-generator.spec.ts` — "opens with a worked example and the totals that go with it"                                                                                         |
| Invoice totals are correct              | `invoice-generator.spec.ts` — totals after a price change; `generatorTotals.test.ts` — the "figures add up" invariant                                                              |
| Invoice preview renders                 | `invoice-generator.spec.ts` — `.sheet` content; `generators.spec.ts` covers quote and receipt previews                                                                             |
| PDF/print flow works                    | `print.spec.ts` — real `page.pdf()` at A4 for invoice, quote and receipt; long invoice spans pages; `invoice-generator.spec.ts` stubs and verifies `window.print()`                |
| Country selection changes configuration | `invoice-generator.spec.ts` — "uses the tax name and rate of the selected country"; `countries.spec.ts` — all 15 guides and the switch                                             |
| Mobile layout works                     | `layout.spec.ts`, every spec's 360/390 px check, `mobile-safari` project, `tablet-webkit` subset                                                                                   |

## Unit coverage (P6-01)

`pnpm test:coverage` runs Vitest with V8 coverage over
`src/lib/calculators/**/*.ts` and `src/lib/generators/**/*.ts`, and enforces
**90% branches per file**. The threshold is in `vitest.config.ts`, so a new
untested calculator or generator rule fails the gate instead of lowering the
average. CI runs `pnpm test:coverage`.

Result: **620 tests in 45 files**, 96.23% statements, **94.24% branches**,
98.27% functions and 96.21% lines across the two engine directories.

| Module                    | Branches | Module          | Branches |
| ------------------------- | -------- | --------------- | -------- |
| `breakEven.schema.ts`     | 90.24    | `document.ts`   | 98.52    |
| `breakEven.ts`            | 95.65    | `numbering.ts`  | 92.40    |
| `freelanceRate.schema.ts` | 96.15    | `reminder.ts`   | 94.73    |
| `freelanceRate.ts`        | 92.85    | `summary.ts`    | 98.78    |
| `hourlyRate.schema.ts`    | 95.83    | `taxSplit.ts`   | 100.00   |
| `hourlyRate.ts`           | 90.90    | `totals.ts`     | 100.00   |
| `markupMargin.schema.ts`  | 93.75    | `validation.ts` | 90.00    |
| `markupMargin.ts`         | 97.82    |                 |          |
| `paymentFee.schema.ts`    | 90.32    |                 |          |
| `paymentFee.ts`           | 100.00   |                 |          |
| `projectProfit.schema.ts` | 95.00    |                 |          |
| `projectProfit.ts`        | 100.00   |                 |          |
| `retainer.schema.ts`      | 96.55    |                 |          |
| `retainer.ts`             | 95.23    |                 |          |
| `tax.schema.ts`           | 95.45    |                 |          |
| `tax.ts`                  | 100.00   |                 |          |

The pass also removed four unreachable defensive fallbacks in `totals.ts` and
`taxSplit.ts` and added `generatorSummary.test.ts`, which walks every block of
the plain-text copy: both parties, all three document kinds, discounts, the
Indian GST split, HSN codes, cross-border wording and the blank document.

## Browser projects (P6-02, P6-03, P6-12)

| Project                 | Engine / device                   | Scope                                                                                                       |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `desktop-chromium`      | Chromium, 1280 × 900              | Whole suite                                                                                                 |
| `mobile-safari`         | iPhone 13 / WebKit                | Whole suite                                                                                                 |
| `tablet-webkit`         | iPad Pro 11 / WebKit              | Defined subset: accessibility, audit/SEO, home, layout, one calculator, one generator, screen-reader, theme |
| `cross-browser-chrome`  | Google Chrome stable              | `smoke.spec.ts`                                                                                             |
| `cross-browser-edge`    | Microsoft Edge stable             | `smoke.spec.ts`                                                                                             |
| `cross-browser-firefox` | Playwright Firefox                | `smoke.spec.ts`                                                                                             |
| `cross-browser-webkit`  | Playwright WebKit (Safari engine) | `smoke.spec.ts`                                                                                             |

The tablet project exists to prove the desktop-to-tablet breakpoints without
tripling the suite; it runs 114 tests. The cross-browser smoke runs five flows
in each browser: home, calculator input and result, invoice preview and total,
horizontal overflow at the project viewport, and the no-third-party rule.
All **20** smoke tests pass on Chrome, Edge, Firefox and WebKit.

Full suite on 2026-11-24: **818 passed, 4 skipped, 822 total**. The four skips
are the Chromium-only PDF checks deliberately skipped in the WebKit projects.
Axe runs on all 39 routes in `desktop-chromium`, `mobile-safari` and
`tablet-webkit` with 0 serious or critical violations in the default theme;
the light theme has its own home-page axe scan.

## Print and PDF (P6-10)

`tests/e2e/print.spec.ts` is the real print review, not a mock:

- The invoice, quote and receipt each print as **one A4 page** from the
  default worked example. The PDF MediaBox is A4 (about 595 × 842 pt), the file
  starts with `%PDF-`, and the sheet is the only visible element in print
  media (form and header `display: none`).
- The sheet is normal flow on paper: `scrollHeight - clientHeight` is at most
  1 px, so nothing beyond the first screen is silently dropped.
- A 14-line invoice produces **more than one A4 page** and still prints every
  line and its total.
- `layout.spec.ts` and `invoice-generator.spec.ts` cover the WebKit screen
  sheet and the print media rules. Playwright has no PDF writer in WebKit, so
  the final iOS AirPrint check remains the manual P3-15 gate.

## Screen readers (P6-06)

`tests/e2e/screen-reader.spec.ts` locks the contract that makes a spoken
result possible:

- The hourly-rate calculator has exactly one
  `role="status" aria-live="polite" aria-atomic="true"` region, and its text
  changes from "Required rate: $76.67 per hour." to "$93.33" and then to
  "£93.33" as the input and currency change.
- The phone result (`.mobile-result`) shows the headline figure but is not a
  second live region: the result panel's single polite region is what speaks,
  so a keystroke is announced once rather than twice.
- The generator's visually hidden status line announces "Total £2,299.50."
  and updates to "Total £3,259.50." after a price change.
- The generator error summary is an alert that takes focus, and the named
  field points at the error text through `aria-describedby`.

**Manual spot check (handoff):** the structural contract is automated, but a
human still needs to hear it. Run VoiceOver (Safari/iOS) and NVDA (Firefox)
through one calculator and one generator: type an amount, hear the polite
result, submit an incomplete generator, hear the alert, follow its link and
hear the field error. Record the date and the result here when done.

## Network and consent (P6-11a)

`network.spec.ts` visits all 39 routes on desktop Chromium and mobile Safari
(78 flows) with the default build, where `PUBLIC_ADSENSE_CLIENT` is empty.
Every observed request stays on the site origin: **0 third-party origins**.
The cross-browser smoke repeats the home-page check in Chrome, Edge, Firefox
and WebKit. `console.spec.ts` separately proves 0 console and page errors on
all 39 routes.

P6-11b–f are not runnable until Phase 7 has a real publisher id and a
configured CMP. The allowlists must come from the P7-14 capture; inventing
them here would test a fiction. They stay open in `task.md` and block Gate 7.

## Lighthouse, no-ad baseline (P6-07, D-24)

Method: `pnpm perf:lighthouse` builds, serves the static preview and runs
Lighthouse 13.6 on five representative routes. Mobile is the **median of three
runs**; desktop is one confirmatory run. JSON reports and the summary are in
`.lighthouse/` (not committed). Ads are off in this build: this is the
baseline, not the launch threshold. D-24 puts the ad-enabled threshold at
P7-18.

| Route                                  | Preset  | Perf | A11y | Best practices | SEO | LCP   | TBT  | CLS | Transfer |
| -------------------------------------- | ------- | ---- | ---- | -------------- | --- | ----- | ---- | --- | -------- |
| `/`                                    | mobile  | 100  | 100  | 100            | 100 | 1.10s | 17ms | 0   | 186 KB   |
| `/tools/`                              | mobile  | 100  | 100  | 100            | 100 | 0.91s | 0ms  | 0   | 143 KB   |
| `/calculators/hourly-rate-calculator/` | mobile  | 100  | 100  | 100            | 100 | 1.21s | 0ms  | 0   | 170 KB   |
| `/generators/invoice-generator/`       | mobile  | 100  | 100  | 100            | 100 | 0.91s | 10ms | 0   | 184 KB   |
| `/countries/`                          | mobile  | 100  | 100  | 100            | 100 | 0.91s | 0ms  | 0   | 132 KB   |
| `/`                                    | desktop | 100  | 100  | 100            | 100 | 0.32s | 0ms  | 0   | 186 KB   |
| `/tools/`                              | desktop | 100  | 100  | 100            | 100 | 0.26s | 0ms  | 0   | 157 KB   |
| `/calculators/hourly-rate-calculator/` | desktop | 100  | 100  | 100            | 100 | 0.31s | 0ms  | 0   | 170 KB   |
| `/generators/invoice-generator/`       | desktop | 100  | 100  | 100            | 100 | 0.25s | 0ms  | 0   | 199 KB   |
| `/countries/`                          | desktop | 100  | 100  | 100            | 100 | 0.26s | 0ms  | 0   | 132 KB   |

Every route scores 100/100/100/100 in both presets. Home LCP on a throttled
phone is 1.10 s and the worst TBT is 17 ms, both inside the "good" band. CLS is
0 everywhere. Home transfer is 186 KB with the bento home; the JS and CSS
budgets are recorded in `docs/redesign/checkpoint-2.md`. These are lab numbers
on one machine, not field data.

## Handoffs (not closable in this pass)

| Item     | Why                                                                                            | Closes with                             |
| -------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| P6-11b–f | Needs the real AdSense client and a configured CMP; the allowlists come from the P7-14 capture | P7-11…P7-14, then Gate 7                |
| P6-06    | A human must hear the automation above with VoiceOver/NVDA                                     | Manual spot check recorded in this file |
| P6-10    | Playwright cannot print from WebKit; AirPrint on a real iPhone is a hardware check             | Manual P3-15 gate (T-01 stays deferred) |

## Gate 6 checklist

- Plan §18 flows green: yes (matrix above; full suite result above).
- Axe clean: 0 serious/critical on 39 routes in the default theme across
  desktop, mobile and tablet, plus the light-theme home scan.
- Print review signed off: A4, one page for each default document, long
  invoice spans pages, no clipping. iOS AirPrint remains manual.
- P6-11a green on the default build: 0 third-party origins on 39 routes × 2
  engines.
- Lighthouse no-ad baseline recorded: table above.
- P6-11b–f and the ad-enabled Lighthouse threshold are explicitly gated by
  Phase 7, as the task file says; they do not block Gate 6.

## Re-verification 2026-11-28 (after the Mercury home redesign)

The Phase 6 gate was recorded before the front page was rebuilt. The whole
gate was re-run against the current tree:

- `pnpm verify`: typecheck and lint clean; **620 unit tests in 45 files**
  passed; 40-page production build succeeded. The Phase 7 work since then adds
  11 unit tests (631 total) and does not touch a calculator or generator.
- `pnpm test:e2e`: **824 passed, 14 skipped** across `desktop-chromium`,
  `mobile-safari`, `tablet-webkit` and the four cross-browser smoke projects.
  Four skips are the Chromium-only PDF checks in WebKit, unchanged. The other
  ten are the new P6-11b–f consent-state cases, which wait for `STAGING_URL`
  and the P7-14 capture.
- No Phase 6 regression was found. The home redesign did not change the
  calculator, generator, print, accessibility or network contracts.
- P6-06, P6-10 and P6-11b–f remain the same handoffs: a human VoiceOver/NVDA
  pass, the iOS AirPrint check, and the real ad/CMP account setup. The P6-11b–f
  harness now exists in `tests/e2e/network-consent.spec.ts`; it skips until
  `STAGING_URL` and the P7-14 capture are present.
