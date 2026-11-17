# SoloYolo redesign plan (Phase 2)

> **Status: shipped 2026-11-15.** The redesign passes the design gate (22
> warnings, no failures, no waivers). At ship time `pnpm verify` and 68
> end-to-end tests were green, and Lighthouse was 100 across the board on mobile
> and desktop. Those figures describe the redesign, not today's eight-calculator
> site: see [`../task.md`](../task.md) for current evidence. The design language
> that came out of this plan is written down in [`design.md`](./design.md); this
> file keeps the brief, the deal and the ad map.

## Line 1: kind
**software** (site-kind: software, page type: software). A free, privacy-first suite of
finance calculators/document tools for freelancers and micro-businesses (US/UK/CA/AU/DE/CH/IN/AE).
Primary action: **Calculate your hourly rate**. Transaction: none (free tools; monetization is
AdSense, policy-safe and content-first).

## Line 2: deal (from tasteskill, `start.mjs deal` fintech/software + `brand`)
- Palette: **blue-black-cornflower** (dealt) aligned with the client's own soloyolo logo colours
  via `start.mjs brand`: bg `#0a0d14`, surface `#131824`, ink `#e9edf3`, accent `#2b7fff`,
  accent-ink `#0a0d14`, muted `#82868d`. Fits the trade: near-black fintech ground reads as a
  serious money tool, and the sky-blue accent is literally the logo's orbit colour.
- Type: **outfit** (Outfit variable + DM Mono), display weight 400, tracking −3%/−4% at hero size.
- Radius: **round** (consumer app). Buttons: **tonal**. Nav: **nav-mega** (grouped tools panel).
  Footer: **columns**. Rhythm: **space**. Close: **close-word**. Mark: **dots**.
- One hero entrance on load (`data-enter`, animejs on the calculator page, CSS on static pages),
  one dealt moment per page (result reveal on tool pages; close-word statement on home).
- Hover layer: cards lift 2px, buttons step on hover / press on click, links underline-draw.
  No scroll-reveal fade-ins, no tilt, no parallax, no violet anywhere.

## Layout system
- Site wrapper `max-width: 1200px` (75rem), consistent 20/32px gutters; backgrounds full-bleed,
  content never. Reading pages keep a ~44rem (704px) text column; tool pages add a desktop-only
  sticky sidebar rail (for the sticky ad unit).
- Mobile-first, fluid type via clamp, `dvh` units, ≥44px touch targets, no horizontal scroll.

## Component inventory
BaseLayout (tokens/meta/ads/consent), Header (mega nav + mobile sheet), Footer (columns),
ToolPageLayout (intro + content + sidebar), Breadcrumbs, Section, FAQList, RelatedTools, Callout,
ToolCard, **AdSlot** (new), **ConsentBanner** (new), Preact island: HourlyRateCalculator (kept,
result reveal moment added).

## React Bits / shadcn decision
shadcn registry components are React; this project ships **Preact** islands by design
(25KB total JS). Adding the React runtime would ~3x JS and break the performance mandate, so the
closest working alternative is chosen: hand-built equivalents (accordion already exists via
native `<details>`, hover/press effects via CSS, entrance/moments via animejs). `shadcn init`
is skipped for the same reason; components are authored to the same standard (audit checklist
still applied).

## Animation strategy
- animejs v4 (tree-shaken, imported only in the calculator island + a tiny deferred module for
  hero entrances). Transform/opacity only; `prefers-reduced-motion` disables everything.
- Dealt moment: calculator result value reveal (opacity/translate) + copy feedback.

## Ad placement map (policy-safe, content-first)
| Slot | Page(s) | Where | Why |
|---|---|---|---|
| `top` | home | full width, at the foot of the tools section, after both cards | in the reading flow, never above the fold, content first |
| `end` | home | full width, at the foot of the closing statement | end of content, after the promise rows |
| `top` | calculators index | under 36rem, after the intro and the calculator list | content first, inside the page column |
| `end` | calculators index | under 36rem, after the rows | end of content |
| `top` | hourly rate calculator | after the calculator, before "How it works" | below the tool itself |
| `inarticle` | hourly rate calculator | between "How it works" and "The formula" | mid-content viewability |
| `sidebar` | hourly rate calculator | sticky rail, desktop 1024 and wider only | high viewability, zero mobile intrusion |
| `end` | hourly rate calculator | after related tools | end of content |
- Never on the 404 or the legal pages (privacy, terms, about, contact). Every slot reserves space
  (fixed min-heights per format) so it adds no CLS. Lazy-load via IntersectionObserver;
  consent-gated; one `adsbygoogle.push` per slot.

## Performance budget
Tool page ≤ 60KB JS (25KB island + animejs ~12KB + consent ~1KB + menu ~1KB); home ≤ 16KB.
Fonts self-hosted (Outfit variable latin + DM Mono 400/500), `font-display: swap`, preload 2 files.
Images: only optimized logos/OG (≤10KB each; never the 1-2MB originals). AdSense script async,
consent-gated, never render-blocking. LCP stays the H1 (text). Targets: Perf ≥95 mobile,
LCP <2.0s, CLS <0.05, INP <200ms.

## File changes
- `src/styles/global.css`: new tokens (navy/blue, Outfit/DM Mono, round), hover layer, focus.
- `src/config/site.ts`: rebrand SoloYolo; `src/components/layout/*`: rebrand + mega nav + sheet.
- `src/components/ads/AdSlot.astro`, `src/components/ads/ConsentBanner.astro`: new.
- `src/components/layout/BaseLayout.astro`: consent + adsense loader + og:image.
- `src/pages/{about,contact,privacy,terms}/index.astro`: new trust pages.
- `public/ads.txt` (placeholder publisher id), `public/favicon-32.png`, `apple-touch-icon.png`,
  `public/og.png`: new optimized brand assets.
- Preact island: result-reveal moment (animejs), styling to new tokens.
- e2e tests updated: brand assertions Ledgerly → SoloYolo.
- `.env.example`: AdSense env vars with clear placeholders.

Branch: `redesign/soloyolo-premium` (checkpoint committed).
