# Home page audit and polish pass

Date: 2026-11-17. Companion to [`home-design-and-ads.md`](./home-design-and-ads.md)
(design) and [`home-performance.md`](./home-performance.md) (performance record).
This file records the post-redesign audit: what was verified, what was broken,
and what was fixed. Every claim below was re-measured on the built site.

## Method

- Built with `pnpm build` and served with `pnpm preview` (static output, no
  AdSense publisher IDs, so slots render their reserved placeholders exactly as
  in production without a live account).
- Layout and tap targets measured with Playwright at 320, 375, 768, 1024, 1440
  and 1920 px, on a touch-emulated iPhone (WebKit) for the coarse-pointer rules.
- Every interactive path walked in the browser; keyboard-only flows driven with
  real key events; axe (`wcag2a`, `wcag2aa`) in light and dark themes;
  Lighthouse 13.6 mobile + desktop, including a build with every ad slot filled
  by a local creative.

## Verification against the brief

| Item                                                                     | Status                         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Command palette: Cmd/Ctrl+K, smart search, recents, pins, quick actions  | **Done**                       | Palette is mounted once in `BaseLayout` so the advertised shortcut works on all 36 routes (before: home only). Fuzzy multi-word search (`src/lib/palette-search.ts`) turns `hrr` into Hourly Rate and `new invoice` into the invoice tool. Recents are recorded from real tool page visits, not just palette use. Pins persist and rise to the top. Start timer / Add client run in place. Opens in 22–30 ms warm (100 ms cold) and traps focus. |
| Most-used tools one click/keystroke away, research-ordered               | **Done**                       | Four quick actions in the hero (New invoice, Start timer, Add client, Find a tool), keys 1/2/3, Cmd/Ctrl+K, header search on every page. Grid order stays the documented registry order (no analytics exist to rank usage); personal usage drives recents and palette ordering.                                                                                                                                                                  |
| "Today" dashboard and "continue where you left off"                      | **Done**                       | Real local state: hours, editable weekly goal, timer, saved clients, printed-document count, streak, recents, region rules. Honest empty states for a new visitor.                                                                                                                                                                                                                                                                               |
| Ethical return habits (streak, goal progress, weekly summary, triggers)  | **Done**                       | Streak + week dots, editable goal with a percentage ring, a real weekly summary line ("3 active days · 2 documents printed"), dated Today card. No guilt copy, no fake urgency.                                                                                                                                                                                                                                                                  |
| macOS squircle language on every surface, one radius family              | **Done**                       | `--radius-sm/md/lg/xl` in `global.css`, `@supports (corner-shape: squircle)` upgrade, every button/card/input/tag/modal/ad container included.                                                                                                                                                                                                                                                                                                   |
| 8-pt grid, even spacing, uniform tile sizes                              | **Done**                       | `--space-1..8`; quick actions 295×117 identical; each tool grid now uses `grid-auto-rows: 1fr` so every card in a group is exactly as tall as its neighbours.                                                                                                                                                                                                                                                                                    |
| Light/dark mode                                                          | **Done (single theme)**        | One dark theme by decision 2026-11-17; `color-scheme: dark` on the root, no light variant to drift. A light OS preference is a no-op, guarded by a permanent test.                                                                                                                                                                                                                                                                               |
| Regional adaptation (currency, payments, language)                       | **Partial (by decision D-10)** | Region select switches currency, payment hint, compliance note, country ordering and palette weighting. Language is English-only and there is no RTL locale in scope; no i18n framework ships by documented decision.                                                                                                                                                                                                                            |
| Config-driven ads: reserved boxes, labels, lazy load, consent, analytics | **Done**                       | `src/config/ads.ts` drives five slots; every box reserves its exact height; visible "Advertisement" label (11 px); IntersectionObserver lazy push now **gated on ads consent**; `ad_request`/`ad_view`/`ad_click`/`ad_dismiss` events; anchor is dismissible and mobile-only.                                                                                                                                                                    |
| Performance: Lighthouse 95+, LCP < 1.5 s, CLS/INP good with ads          | **Done**                       | 100/100/100/100 mobile and desktop; LCP 0.9 s mobile, 0.3 s desktop; CLS 0; TBT 0 ms with ads filled.                                                                                                                                                                                                                                                                                                                                            |

## Fake or hardcoded data found and replaced

| Found                                                                                                                              | Where                            | Replaced with                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `soloyolo-docs-created` was only ever read — the "Documents made" stat could never leave 0                                         | `TodayDashboard.tsx`             | `src/lib/documents-log.ts`; invoice/quote/receipt (`useDocumentForm.submit`) and reminder print flows record a real, timestamped print. Stat renamed "Documents printed", links to the generators. |
| Recents were written only when the palette was used                                                                                | `CommandPalette.tsx`             | The palette records the current route on mount, so any route into a tool (quick action, card, footer, direct link) counts. Unit-tested in `deskData.test.ts`.                                      |
| QuickEstimator printed hardcoded fallbacks (`$76.67`, `$613.36`, `$92,000`, `$3,066.80`, `1,200`) if the engine refused its inputs | `QuickEstimator.tsx`             | The panel shows `—` with "Move the sliders to a workable week" instead of inventing numbers.                                                                                                       |
| QuickEstimator re-pushed the default rate on every load, silently overwriting the saved rate                                       | `QuickEstimator.tsx`, `prefs.ts` | Inputs persist (`soloyolo-estimator`) and restore; the rate is pushed only after a real interaction. `DEFAULT_RATE` is pinned to the engine by a unit test.                                        |
| Home worked-example numbers had hardcoded fallbacks that could drift                                                               | `index.astro`                    | Build fails loudly if the engine rejects the example; the page prints engine output only.                                                                                                          |
| Weekly goal fixed at 25 h with no way to set it                                                                                    | `TodayDashboard.tsx`             | Editable inline goal (1–80 h), persisted, announced in the ring's label.                                                                                                                           |
| Client names were inert text                                                                                                       | `TodayDashboard.tsx`             | Each client links to a new invoice with the name prefilled (`?client=`); remove control added. Palette exposes saved clients as searchable actions.                                                |
| "Documents made"/"Clients saved" numbers were not actionable                                                                       | `TodayDashboard.tsx`             | Both are links to their records (generators hub, client list).                                                                                                                                     |

Development seed data that is intentionally kept and clearly framed as an
example: the generator worked examples (`data/generators/examples.ts`), the
calculator example inputs, and the three simulator presets. They are labelled
examples inside tools, never dashboard figures.

## Tool access report

| Path                        | Before                                              | After                                                                      |
| --------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| New invoice                 | 1 click (hero)                                      | 1 click, or `2`, or Cmd/Ctrl+K → "new invoice"                             |
| Start timer                 | 1 click (hero; lost if the island had not hydrated) | 1 click (queued by the intent bridge), or palette action                   |
| Add client                  | 1 click (hero; same hydration gap)                  | 1 click/focus, or palette action                                           |
| Any calculator or generator | 2 clicks via Tools menu; palette home-only          | 1 keystroke (Cmd/Ctrl+K) on **every** page, or 2 clicks via the Tools menu |
| Saved client → invoice      | not possible                                        | 1 click from the client list, 2 clicks from the palette                    |
| Pinned tool                 | palette only                                        | always first in the palette; one Enter to open                             |

Tap targets: every control in the main content is ≥44 px tall on a
coarse-pointer device (was 13 controls between 6 and 40 px: preset pills, both
sliders, Copy, the currency select, quiet links, stat numbers).

## Performance

Lighthouse 13.6, built site, no publisher IDs. "Before" is the redesign as
recorded in `home-performance.md`/`.tmp-audit/perf-final-*.json`; "after" was
measured on this build (`.tmp-audit/perf-polish-*.json`).

| Metric                               | Before, mobile | After, mobile | After, mobile + ads | After, desktop |
| ------------------------------------ | -------------- | ------------- | ------------------- | -------------- |
| Performance                          | 100            | 100           | 100                 | 100            |
| Accessibility / Best practices / SEO | 100            | 100           | 100                 | 100            |
| LCP                                  | 0.9 s          | 0.9 s         | 0.9 s               | 0.3 s          |
| TBT                                  | 0 ms           | 0 ms          | 0 ms                | 0 ms           |
| CLS                                  | 0              | 0             | 0                   | 0              |
| Transfer                             | 149 KB         | 154 KB        | 154 KB              | 154 KB         |

The +5 KB is the site-wide command palette (3.6 KB gzip) plus its Preact client
on pages that previously shipped no island (1.5 KB), and the tiny eager bridge
in the base script (~0.2 KB). Removing the light token swap took ~1 KB back.
Remaining totals stay inside the documented budgets: home 49.8 KB JS gzip,
calculator 35.9 KB, generators 57.3 KB (budget 60 KB), CSS 15.2 KB.

## Remaining issues for a decision

1. **CMP for personalised ads in EEA/UK/CH** — unchanged from D-14/D-34: the
   in-house consent UI is a safe gate but not a Google-certified TCF 2.3 CMP.
   Do not enable personalised ads in those markets until it is replaced.
2. **Theme scope — decided 2026-11-17: dark only.** The light token swap was
   removed; `color-scheme: dark` is set on the root and a light OS preference is
   a no-op (guarded by a test). Extending light mode later is a separate,
   testable change.
3. **iOS focus restore** — Safari refuses programmatic focus on buttons, so
   focus returns to the trigger only where the platform allows it. The palette
   still tries; a screen-reader user on iOS lands on the document body.
4. **Language/RTL** — the product is English-only with local tax vocabulary by
   documented decision. A real i18n layer is outside this brief.
