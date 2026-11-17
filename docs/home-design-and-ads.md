# Home base: design rationale and ad-placement map

This is the Phase 3/4 record for the front page shipped in `src/pages/index.astro`.
Research and evidence live in [`home-research.md`](./home-research.md).

## Design system

### The squircle, everywhere

One continuous-curvature corner treatment is used on every button, card,
section panel, input, tag, modal, ad container, kbd and nav control. The radius
family lives in `:root`:

| Token | Value | Used on |
|---|---|---|
| `--radius-sm` | 10px | chips, kbd, tags, badges, ad dismiss |
| `--radius-md` | 16px | buttons, tool cards, tiles, inputs, ad boxes, nav controls |
| `--radius-lg` | 24px | Today panel, closing panel, raised cards, consent sheet |
| `--radius-xl` | 32px | reserved for future full-screen panels |

`@supports (corner-shape: squircle)` upgrades every one of those surfaces to a
true squircle. In the shipped browser this computes as
`corner-shape: superellipse(2)`, the continuous-curvature app-icon curve. Where
the property is unsupported the same `border-radius` renders as a graceful
rounded-square fallback. Rules are unlayered at the end of `global.css` so they
out-rank Tailwind's `rounded-*` utilities; the result is one shape, not a mix.

### Proportion and 8-pt grid

`--space-1` through `--space-8` are 8, 16, 24, 32, 40, 48 and 64px. The page
container is 1280px with equal 20/48/80px gutters. Quick-action tiles are 96px
minimum and near-square; tool cards are uniform 168px; dashboard tiles share
one 152px minimum. Container queries reflow the tiles and tool grid from the
component's own width, not the viewport, so edges stay aligned in every rail.

### macOS aesthetic and modern CSS

- Layered shadows, hairline borders, subtle translucency via `color-mix()`,
  system-style type (Outfit Variable + DM Mono), quiet hover lift and 1px press.
- Single theme: the dark palette is the product (decision 2026-11-17). Native
  date pickers, print sheets, ad creatives and every contrast pair share one
  tested token set; a light system preference changes nothing.
- Modern CSS showcase: `@layer`, container queries, `:has()` (running timer
  border, filled-ad placeholder), `clamp()`, cross-document view transitions,
  scroll-driven `view()` settle on the proof cards, `color-mix()`.
- Reduced motion, WCAG AA, visible focus, skip link, keyboard palette, 44px
  touch targets and a 320px overflow check are preserved from the existing
  design system.

### Information architecture and why

| Screen | Purpose | Why |
|---|---|---|
| 0. Command bar | One primary accent tile (New invoice) plus timer, client and search | Hick's Law: four choices, one click, no menu hunting. Fitts's Law: big targets at the top of the Z. |
| 1. Today | Real local hours, earnings estimate, documents, clients, streak, recents, region rules | A daily reason to return that is useful even without a paid invoice. Honest empty states; no fake urgency. |
| 2. Toolkit | Featured rate simulator, calculator grid, in-feed ad, generator grid, sticky rail | Tools are one palette keystroke away even though the full grid is lower on the page. |
| 3. Country shelf | Eight verified tax regimes, visitor's region first | Research showed tax/e-invoicing differences are the strongest regional differentiator. |
| 4. Precision proof | Three squircle cards, one worked example | One quiet "dealt" moment; no scroll-jacking or empty visual. |
| 5. Close | One action, three promises, then the end ad | The ad follows the primary action, never the other way round. |

### Habit loop (ethical)

- **Trigger:** Today card with the date, real logged hours and region guidance.
  No red badges, no "someone is waiting" copy.
- **Action:** start/stop timer, +1h, add a client, open a tool. All persist in
  localStorage.
- **Reward:** percentage ring, week dots and a gentle streak line. A fresh
  start is framed positively when the streak is zero.
- **Investment:** saved rate, pinned tools, recent tools, client names and
  region preference make the next visit measurably faster.

## Ad-placement map

All five slots are rendered by the same `AdSlot.astro` component and configured
in `src/config/ads.ts`. Every box reserves its exact height in CSS before any
script runs, so ad fill produces zero layout shift. Every unit carries a
visible "Advertisement" label, sits at least 12-24px from controls, and is
never styled to look like a tool card.

| Slot | Placement | Reserved box | Lazy | Purpose and expected value | Risk control |
|---|---|---|---|---|---|
| `leaderboard` | Full width at the bottom of screen one, after Today and before the toolkit | 96px mobile / 112px desktop | No: pushed on the first idle frame | Google's own data says just-above-the-fold is the most viewable position. Business/finance intent makes this the highest-RPM impression. | Primary actions and nav stay above it; one unit only; async loader after consent. |
| `infeed` | Inside the toolkit, between calculators and generators | 160px | Yes, 400px root margin | Mid-session attention when the visitor is comparing tools; native-style but labelled and not clickable-looking. | One in-feed unit only, separated from both grids by 24px. |
| `sidebar` | Sticky 300x600 rail beside the toolkit, 1200px and wider | 600px | Yes | High viewability over a long scroll on large screens; Tier-1 desktop traffic carries the best CPMs. | Hidden below 1200px; never on mobile; sticky, never intercepting scroll. |
| `anchor` | Fixed bottom strip on phones, after ad consent | 64px + safe area | Yes | Recovers viewability on small screens where CPMS are lower but sessions are long. | Appears only with ads consent, dismissible, and its 80px inset is reserved from first paint. It cannot cover the header or primary actions once consent is granted. |
| `end` | Below the closing promise rows | 250px | Yes | Captures readers who reached the end without competing with the primary CTA. | Always after the action, never above content. |

### Density and policy

Five possible slots, at most three visible in one viewport (leaderboard +
toolkit content + rail on desktop; leaderboard + in-feed + anchor on mobile,
with the anchor only after explicit consent). No auto-refresh, no interstitials,
no ads disguised as buttons, no full-screen takeovers. `ads.txt` is present and
must be updated with the real publisher ID before launch.

### Consent and law

- No network script is injected before a choice. The banner writes the choice
  to localStorage and emits `soloyolo:consent`.
- Consent Mode v2 defaults `ad_storage`, `ad_user_data`, `ad_personalization`
  and `analytics_storage` to `denied`, then updates them on choice.
- Choices: Accept all, Essential only, or granular Preferences (ads +
  measurement toggles).
- **Compliance gap, deliberately documented:** Google requires a Google-certified
  CMP integrated with IAB TCF 2.3 to serve personalised ads in the EEA, UK and
  Switzerland. The in-house banner is not certified. Replace it with a
  certified CMP before monetising those regions; the consent event contract
  (`{ ads, analytics, value }`) is the integration point.

### Measurement

`src/lib/analytics.ts` keeps a bounded local event buffer and emits
`soloyolo:event`. Events: `session_start` (with pages-per-session and returning
flag), `ad_request`, `ad_view` (50% pixels for 1 s), `ad_click`, `ad_dismiss`,
`quick_action`, `palette_open`, `tool_open`, `timer_started`, `timer_stopped`,
`hours_logged`, `client_added`, `rate_copied`, `region_changed`. Nothing leaves
the browser by default; forward the event to GA4 or Ad Manager in a separate,
consent-gated module. RPM is computed offline as revenue / 1,000 sessions and
reviewed alongside session length and return rate, so revenue is never
optimised against retention.

### Config and A/B

`AD_CONFIG` holds `enabled`, `network`, `envSlot`, `lazy`, `refresh` and
`safeGap` per slot. Network IDs come from `PUBLIC_ADSENSE_CLIENT` and the
`PUBLIC_ADSENSE_SLOT_*` variables; legacy `TOP`/`INARTICLE` names still work for
the other pages. `?adVariant=b` is exposed as `data-ad-variant` for density
experiments. Toggling one flag in `ads.ts` removes a slot's tag; the reserved
box stays until the CSS class is changed, preventing accidental CLS during a
test.
