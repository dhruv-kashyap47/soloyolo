# Home polish pass — Mercury direction

Date: 2026-11-24
Scope: the front page, plus the shared design tokens it reads from.

## Design source

- Chosen from the OpenDesignMD library: **mercury.com**
  (`https://opendesignmd.com/designs/mercury/DESIGN.md`).
- The downloaded reference is stored at [`mercury-DESIGN.md`](./mercury-DESIGN.md).
- Why this one: Mercury is the only strong match that ships a native dark world
  _and_ a native light world, separates cards by tone rather than heavy borders,
  uses one saturated action colour, and keeps generous gutters. The site is a
  finance utility, so the trust posture matters more than novelty.

## What changed

### Palette and depth

- Dark canvas moves from pure `#000` to deep ink `#0b0c12`; cards step to
  `#12131b` and `#1a1c27`. Pure black is now reserved for the deliberate night
  footer. This is the fix for the AMOLED "premium but invisible edges" problem.
- Body text and muted text were lifted (`#f3f4f8` / `#c4c8d4` / `#9aa0b2`) so
  small labels and demo copy keep AA contrast on the new ground.
- One indigo action colour (`#5266eb` dark, `#4457d8` light) replaces the
  per-family chrome accents. Tool-family colours survive only inside demos,
  icons and badges.
- Light mode keeps the existing warm Day Ledger paper (`#f6f3ec`) rather than
  Mercury's cooler white; the structure and indigo accent are Mercury's.

### Light-mode bentos

- The showcase tiles, hero rate window, invoice/fee/reminder demos and the desk
  strip now follow the light theme. They are no longer dark screenshots pasted
  onto paper.
- Document sheets stay cream (`#f3efe4`) in both themes, because a printed
  invoice is paper.
- Mock surfaces use a small token set (`--mock-*`), so a future theme can flip
  the mocks without rewriting component geometry.

### Structure

The home is now five jobs:

1. Hero with plain-language copy that says who the tools are for, how they fit
   into a working day, and what the visitor can do, plus a live rate demo
   (hidden under 1100px; the tools take its place).
2. A grouped directory of all 12 tools (8 calculators, 4 generators) with the
   category links at the foot of each group.
3. The slim local desk strip.
4. Three proof demos: invoice markets, payment fees, polite reminder.
5. Eight invoice markets, closing CTA and the night footer.

The macOS "toolkit" window and the project-profit, tax and two-document demos
were removed from the home. Those tools remain in the directory and on their own
pages.

### Copy

- The hero lede now names the audience (freelancers, consultants, creators,
  contractors, small businesses), the daily jobs (rates, project earnings, tax,
  quotes/invoices, payment reminders), the form factor (desktop or mobile), and
  the no-account/no-upload promise in one plain paragraph.
- The three section meta lines were removed: "Eight calculators and four
  document generators…", "Built with the same engines as the tools." and
  "Same work, local rules, local tax names."
- Tool summaries were lifted from 12px to 13px so the directory is comfortable
  for non-technical readers.

### Spacing

- `--tile-gap` is now 16px phone / 20px tablet / 22px desktop.
- `--tile-pad` is 20px / 24px / 28px.
- The proof grid, country grid and directory all share that gutter.
- The old toolkit tiles that shared 1px borders are gone; every card has its own
  gutter and edge.

### Ads

- All placements are kept (two leaderboards, two in-feeds, one rail, one end,
  one mobile anchor).
- The black band behind light-mode ads is gone (`background: var(--color-canvas)`).
- Unfilled slots are quiet surfaces with a hairline and a small label, not
  dashed boxes or black voids. Reserved heights still match the measured boxes.

### Navigation

- Header gains a one-tap sun/moon theme toggle; the footer keeps the full
  Auto / Dark / Light switch.
- The mobile menu gains an Appearance row with the current mode.
- The redundant full-width "Find your rate" button was removed from the mobile
  menu because the header CTA is always visible.

## Files touched

- `src/pages/index.astro` — condensed five-section home.
- `src/components/home/ToolDirectory.astro` — new grouped directory.
- `src/components/home/TodayDashboard.tsx` — "Your desk" kicker in compact mode.
- `src/components/layout/Header.astro` — theme toggle, mobile appearance row.
- `src/components/layout/Footer.astro` — night footer class, theme sync for the
  header toggle.
- `src/components/layout/BaseLayout.astro` — new theme-color values.
- `src/styles/global.css` — palette, mock tokens, gutters, directory, desk strip,
  proof grid, ad surfaces, light-theme removal of the forced-dark mocks.
- `tests/e2e/home.spec.ts`, `layout.spec.ts`, `theme.spec.ts`,
  `accessibility.spec.ts` — assertions moved to the new structure and the new
  deep-ink canvas.

## Verification (2026-11-24)

| Check           | Result                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify`   | typecheck, lint, 620 unit tests and 40-page build green                                                                                                                          |
| `pnpm test:e2e` | 824 passed + 4 Chromium-only print skips                                                                                               |
| Axe             | 0 serious/critical on all 39 routes, desktop/mobile/tablet, dark and light; homepage and 3 sampled routes in both themes                                                         |
| Lighthouse      | 100/100/100/100 on `/`, `/tools/`, the rate calculator, the invoice generator and `/countries/`, mobile (median of 3) and desktop; home mobile LCP 1.08 s, desktop 0.46 s, CLS 0 |
| Widths          | 320 / 360 / 390 / 768 / 1024 checked: no horizontal page overflow; header fits at 320                                                                                            |
| Third-party     | 0 third-party origins on the network suite                                                                                                                                       |

## Bug-fix pass (same day)

- The header theme toggle now keeps its visible `title` and its screen-reader
  label in sync with the resolved theme.
- Tool summaries moved from 12px to 13px so non-technical readers can scan the
  directory comfortably.
- Ads, the ad rail, the mobile anchor and the “Pause motion” control are hidden
  in print; the home prints as content, not reserved ad boxes.
- Added regressions for the who-it’s-for hero copy, the removed meta headings
  and the header theme toggle (desktop and mobile menu paths).

## Deliberately unchanged

- Consent banner behaviour, wording and button order.
- The number and placement _counts_ of ad slots (D-15 / D-34).
- The dark night footer on both themes, as the closing anchor.
- Every product claim, privacy statement and tax disclosure.
