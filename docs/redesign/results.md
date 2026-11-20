# Results: Phase 2 verification

Run on 2026-11-20 against commit `96fae29` plus the Day Ledger pass
(`redesign/bento-v2`). Production build, served locally by `astro preview`.
Every number below comes from a local run; the same suite runs in CI on push.

Machine: Windows 11, Node 24, Astro 7.4.12, Playwright 1.65.1 (Chromium and
WebKit), Lighthouse 13.6.0.

## Lighthouse 13

Five routes, mobile (Lighthouse's 4x CPU + slow 4G simulation) and desktop.
All four categories score 100 in both presets.

| Route | Preset | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 100 | 100 | 100 | 100 | 0.91s | 0 | 72ms |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.25s | 0 | 0ms |
| `/tools/` | mobile | 100 | 100 | 100 | 100 | 0.91s | 0 | 0ms |
| `/tools/` | desktop | 100 | 100 | 100 | 100 | 0.25s | 0 | 0ms |
| `/calculators/hourly-rate-calculator/` | mobile | 100 | 100 | 100 | 100 | 1.21s | 0 | 0ms |
| `/calculators/hourly-rate-calculator/` | desktop | 100 | 100 | 100 | 100 | 0.29s | 0 | 0ms |
| `/generators/invoice-generator/` | mobile | 100 | 100 | 100 | 100 | 0.91s | 0 | 9ms |
| `/generators/invoice-generator/` | desktop | 100 | 100 | 100 | 100 | 0.25s | 0 | 0ms |
| `/countries/` | mobile | 100 | 100 | 100 | 100 | 0.91s | 0 | 0ms |
| `/countries/` | desktop | 100 | 100 | 100 | 100 | 0.26s | 0 | 0ms |

Home LCP on mobile stays inside the 2.0s budget, and the initial long task that
used to be 270ms is now 72ms, under the 150ms proxy.

Commands (one run per route and preset, output in `.lh/`):

```
npx lighthouse http://localhost:4321/ --quiet --chrome-flags="--headless=new" \
  --output=json --output-path=.lh/home-mobile.json \
  --only-categories=performance,accessibility,best-practices,seo
```

## Axe

11 routes, run twice: once with the dark theme, once with the light theme
(`localStorage soloyolo-theme`), tagged `wcag2a`, `wcag2aa`, `wcag21aa`,
`wcag22aa`. **0 violations in every run.**

Routes: `/`, `/tools/`, `/calculators/hourly-rate-calculator/`,
`/generators/invoice-generator/`, `/uk/vat-invoice-generator/`, `/calculators/`,
`/generators/`, `/countries/`, `/about/`, `/privacy/`, `/404`.

## Playwright

608 tests across `desktop-chromium` (1280x900) and `mobile-safari` (iPhone 13),
all passing. The suite covers the calculators, every generator, the country
pages, the palette, keyboard focus, print, storage and the theme contract.

New this pass:

- `tests/e2e/theme.spec.ts`: Auto follows the OS, an explicit choice survives a
  reload, an explicit dark choice ignores a light system preference.
- The old "single dark theme" assertion is replaced by "auto follows a light
  system preference and stays accessible".
- The invoice date-picker test now checks both themes: the native picker takes
  `color-scheme` from the page, so a light page gets a light calendar.

## Ads and CLS with filled creatives

Method: seven home slots, mock creatives inserted (180px and 250px tall, taller
than the reserved boxes), then the whole page scrolled to the bottom.

| Theme | CLS | Toolkit anchor above the first ad | Slot growth |
|---|---|---|---|
| dark | **0.000** | did not move | +106, +108, 0 (rail, fixed 600px), +108, +106, +38, 0 (anchor) |
| light | **0.000** | did not move | same |

Every slot grows downward from its reserved `min-height`; nothing above an ad
moves, and the sticky rail keeps its fixed 300x600 box.

## Widths

9 widths x 3 routes x 2 themes: **0 horizontal overflow**.

Widths: 320, 375, 390, 768, 1024, 1280, 1440, 1920, 2560.
Routes: `/`, `/tools/`, `/calculators/hourly-rate-calculator/`.

## Weight

| Asset | Size |
|---|---|
| Home JS module graph, gzip | 49.6KB |
| Demo controller, gzip | 2.6KB |
| CSS, one file, gzip | 24.7KB |

CSS is 12.7KB over the 12KB target: the seven demo scenes and the light token
set share one cached file, which is the trade recorded in `waivers.md`.

## Theme

- Resolved in a synchronous head script before first paint; no flash, no
  hydration, no theme-dependent layout.
- Three states: Auto (default, follows `prefers-color-scheme`), Dark, Light.
  Stored as `soloyolo-theme`; failures fall back to dark.
- `meta[name="theme-color"]` follows the resolved theme (`#000000` / `#f6f3ec`).
- Native date pickers and scrollbars follow through `color-scheme`.
- The product mocks (demos, toolkit window, large bento tiles) stay dark in both
  themes; the page chrome, cards, forms, ads and footer follow the tokens.

## What is not covered

- No real ad creative was loaded. The reserved-box behaviour is proven with mock
  creatives of two heights, not with a live AdSense fill.
- Lighthouse runs are lab numbers on one machine, not field data.
- The custom consent card is not a certified CMP; see the launch follow-ups in
  `checkpoint-2.md`.
