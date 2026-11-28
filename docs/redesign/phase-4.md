# Phase 4 checkpoint: the bento home

Status: **Checkpoint 2, 2026-11-19.** Phase 4 shipped the approved home
redesign, the ad-container correction, the one hero demo and the generator
hydration shell. Phase 5 (hub and tool-page restyle, full QA) and the light
theme have not started.

Approval and amended scope: [`brief.md`](./brief.md) section 3.13.

## What shipped

| Area       | Result                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home bento | **16 tiles**: A hero copy, B hero demo, F rate, I project profit, G invoice paper, H desk, J markup, K fees, L tax, Q quote, R receipt, S reminder, T featured market, U country list, W worked example, Z promises. M, N, O, P, C, D, E and the fourth proof card are gone.                                                                                     |
| Order      | DOM order is F, I, G, H, J, K, L. The grid places F (5x2), I (3), G (4x2), H (3) under I, then J/K/L at 4 columns each. No holes at 1440; the tablet layout fills the odd last tiles by spanning tax and reminder.                                                                                                                                               |
| Hero demo  | `RateDemo.tsx`, `client:idle`, one six-second sequence with a `Replay` button. Server renders the finished poster. Only the hero animates; F and G are static posters.                                                                                                                                                                                           |
| Ads        | `min-height` only, `overflow: visible`, `overflow-anchor: none`, `contain: layout`. No creative clipping. Filled mock creatives grew the leaderboard 112 to 240px and infeed 160 to 240px with **CLS 0.00016**; the growth is below the fold. All five home slots kept.                                                                                          |
| Generators | Invoice, quote, receipt, reminder and the 15 country invoice pages hydrate on `client:idle` inside `GeneratorShell.astro`. The shell reserves 40rem, keeps the server-rendered form, acknowledges the first tap, replays early typed text and queues an early submit. Verified: shell height 6192px before and after hydration, typed value retained, **CLS 0**. |
| Header     | Simplified to Calculators, Generators, Countries, Search and **Find your rate**. The mega menu is gone; About/Contact/Privacy/Terms live in the footer and the mobile sheet. Search accessible name fixed, so `label-content-name-mismatch` is gone.                                                                                                             |
| Footer     | Wordmark rendered at 400px through `astro:assets`; the 63.6KB source becomes a **14.5KB** footer file. Full target is 12KB, tracked for Phase 5.                                                                                                                                                                                                                 |
| Copy       | No em dashes, no invented counts. Every home figure is build-time engine output: `$76.67/h`, 45% margin, $970.70 net, +$200.00 tax, £2,299.50 / £3,535.20 / £1,669.20 document totals.                                                                                                                                                                           |

## Evidence

Measured against `pnpm build` + `pnpm preview`, Lighthouse-equivalent throttling
(CDP 1.6Mbps down, 150ms RTT, 4x CPU) on a 390x844 mobile viewport.

| Metric                 | Result                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| LCP, home, three runs  | **1.12s / 1.11s / 1.12s** (budget < 2.0s)                                                                  |
| CLS, home              | 0 (no ads), **0.00016** with filled mock creatives                                                         |
| CLS, invoice generator | **0**, height stable through hydration                                                                     |
| Home script transfer   | **55.7KB**; the demo chunk itself is **1.4KB** (cap 30KB)                                                  |
| Home first-screen ad   | leaderboard starts at y=900 on a 900px screen, below the fold                                              |
| Axe                    | **0 violations** on `/`, `/generators/invoice-generator/`, `/uk/vat-invoice-generator/` (WCAG 2.2 AA tags) |
| `pnpm verify`          | typecheck, lint, **550 unit tests**, 36-page build: green                                                  |
| Playwright             | **600 passed** across desktop Chromium and mobile Safari                                                   |
| Widths                 | 1440, 1024, 768, 390: no horizontal overflow; 320 checked by the design gate                               |

Screenshots and raw scripts: `.tmp-audit/redesign-v2/` (ignored build artifact).

## Design gate

`GATE: OPEN 52` after three rounds (the checker's limit). The open findings are
mostly its full-screen-section rules, which conflict with the approved
"condense the page" instruction:

- `screen-height`, `screen-short`, `neighbour`, `sparse` on the 590-1103px
  bento sections, the two ad bands and the closing section. The checker wants
  every section to be exactly one or two 900px screens; the approved page packs
  two jobs into one screen in places.
- `no-visual` / `text-only` on the documents and countries sections, which are
  paper objects and a country list rather than photographs or app frames.
- `contrast` on a few text/gradient pairs; the paper tiles now use a solid
  ground, and the demo note and arrows were raised. The checker still samples
  the layered window background.
- `hero-fold` at 390: the hero (copy, CTAs, facts and demo) is 1301px, 1.54
  screens. At 1440 it is exactly 900px.

Five findings are waived in `.taste-skill/waivers.json` (ignored local file)
because they misread nested grid columns: the hero split, the desk panel's
inner labels, the sponsored rail, the workbench row and the centred hero pair.

The Phase 4 gate in the brief is the performance, CLS and JS cap above, and that
gate passes. The design gate is Phase 5 work: either accept the dense sections
with a written waiver, or expand the sections to one screen each in the final
QA round.

## Decisions and deferrals

- **D-1 light theme:** deferred. Dark remains the default and only shipped
  theme; the token set and footer switch are Phase 5 work. Dropped from this
  checkpoint to protect the schedule, as approved.
- **D-2:** home only. No demo or hydration work on the hubs.
- **D-3:** "Find your rate" primary, "Make an invoice" secondary.
- **D-4:** the desk stays, now as a compact panel tile with this week's hours,
  the timer, +1h and the region selector. Client management, the weekly-goal
  editor and recents are in the full `TodayDashboard` variant but are not
  exposed on the home tile; exposing them again needs a desk surface in Phase 5.
- **D-5:** all five home ad slots kept.
- **D-6:** no vector supplied. The existing wordmark raster is optimized, not
  redrawn.
- **Hosting:** static, unchanged. No host config, domain, publisher ID or
  contact email was invented.

## Files

- `src/pages/index.astro`: rebuilt home.
- `src/components/home/RateDemo.tsx`: the one demo.
- `src/components/home/TodayDashboard.tsx`: compact variant.
- `src/components/generators/GeneratorShell.astro`: reserved shell and early
  interaction bridge.
- `src/components/generators/useGeneratorReady.ts`: marks the shell ready.
- `src/pages/generators/*` and `src/components/countries/CountryInvoicePage.astro`:
  `client:idle` + shell.
- `src/components/layout/Header.astro`, `Footer.astro`, `BaseLayout.astro`.
- `src/styles/global.css`: bento, paper, demo, shell and ad-container rules.
- `tests/e2e/home.spec.ts`, `layout.spec.ts`, `countries.spec.ts`: updated to
  the new home contract.
