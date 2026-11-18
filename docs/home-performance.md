# Home page performance: before / after

> **Superseded for the current home (2026-11-19).** The bento home's Phase 4
> measurements are in [`redesign/phase-4.md`](./redesign/phase-4.md). This file
> remains the pre-redesign baseline record.

Measured locally against `pnpm build` + `pnpm preview` with Lighthouse 13.6
(Chrome headless, simulated mobile and desktop throttling). Raw reports are in
`.tmp-audit/perf-before-*.json` and `.tmp-audit/perf-final-*.json`.

## Method

- **Before:** the working tree as found at the start of the task (existing
  dark SoloYolo hero, TodayDashboard, QuickEstimator, CommandPalette, two ad
  placeholders).
- **After:** the new home base described in
  [`home-design-and-ads.md`](./home-design-and-ads.md).
- **With ads:** no publisher IDs are configured, so a test-only copy of the
  built page fills every reserved slot with a realistic local creative
  (`.tmp-audit/mock-ads.mjs`). This measures the layout/viewability cost of
  *filled* slots. The real AdSense library is not included in the numbers
  below: it is injected async, deferred and on idle only after ad consent, so
  its network and CPU cost must be re-measured with a live publisher ID.
- Each configuration was run at least twice; the table reports the steady
  result and notes outliers.

## Results

| Metric (home page) | Before, mobile | After, mobile | After + ads, mobile | Before, desktop | After, desktop |
|---|---|---|---|---|---|
| Performance | 100 | 100 | 100 | 100 | 100 |
| Accessibility | 100 | 100 | 100 | 100 | 100 |
| Best practices | 100 | 100 | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 | 100 | 100 |
| FCP | 0.9 s | 0.9 s | 0.9 s | 0.3 s | 0.3 s |
| LCP | 0.9 s | 0.9 s (one 1.8 s outlier) | 0.9 s | 0.3 s | 0.3 s |
| TBT | 0 ms | 0-60 ms | 60 ms | 0 ms | 0 ms |
| CLS | 0 | 0 | 0 | 0 | 0 |
| Speed index | 0.9 s | 0.9 s | 0.9 s | 0.3 s | 0.3 s |
| Transfer, total | 144 KB | 149 KB | 150 KB | 144 KB | 149 KB |
| Transfer, script | 49 KB | 54 KB | 54 KB | 49 KB | 54 KB |
| Fonts / images / CSS | 47 / 19 / 15 KB | 47 / 19 / 15 KB | 47 / 19 / 15 KB | same | same |

### What changed and why

- **+5 KB script:** a real timer, local client list, region preferences,
  preference sync across islands and the analytics event buffer. Three islands
  now hydrate on idle instead of `QuickEstimator` at `client:load`.
- **Zero CLS with ads:** every slot has a fixed reserved box; the leaderboard
  inset is reserved on mobile from first paint, and the anchor is a fixed
  overlay dismissed by the visitor. Filling the slots moves nothing.
- **LCP stays text-first:** the h1 is server-rendered. The 1.8 s outlier came
  from a mobile consent-banner paragraph being selected as the LCP element
  after a font swap; subsequent runs recorded the h1 at 0.9 s. Reducing that
  text or switching the consent UI to a certified CMP with its own loading
  strategy removes the outlier.
- **Removed:** a 7 KB `moment.css` that was linked on the home page while its
  script never mounted; the proof section is now three plain squircle cards.
- **Still flagged by Lighthouse (non-scoring insights):** `image-delivery-insight`
  (only the small local wordmark/OG images), render-blocking insight for the
  self-hosted font preloads, and the network-dependency insight. None affects
  the category scores; font preloads are intentional so the h1 paints in the
  brand face.
- With ads filled, TBT rose from 0 to 60 ms on mobile (the mock creative and
  view observers), still well inside the "good" INP budget. CLS remained 0.

## Functional verification

- `pnpm verify` (typecheck, lint, unit tests, build): green; one pre-existing
  hint in `public/assets/moments/pinned-chapters/moment.js`.
- Playwright end-to-end: 576 passed across desktop Chromium and mobile Safari,
  including axe accessibility checks, no-JS rendering, route validity, the
  new quick actions, five ad slots and region/currency switching.
- Visual checks at 1440, 1024, 768 and 390: no horizontal overflow, all tiles
  and ad boxes render, consistent 16px squircle corners, and `corner-shape`
  computes as `superellipse(2)` in the test browser.
