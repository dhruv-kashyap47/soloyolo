# SoloYolo design language

The reference for every screen on this site: the palette, the type, the rhythm,
the components, the motion and the rules that keep new pages looking like the
ones already shipped. Read this before adding a page or a component.

The short version: near-black canvas, one quiet ground per section, one screen
per section on the landing page, content on a centred 1280 container, one
accent (cornflower), outline cards, pill buttons, no decorative rules, no
gradients behind words.

---

## 1. Brand

**SoloYolo** is a free, privacy-first toolkit of business calculators for
freelancers, consultants and small service businesses. Every calculation runs
in the browser, with no account and no upload.

- **Personality:** precise, calm, confident. An instrument, not a pitch.
- **Voice:** plain sentences, second person, real numbers. Say what a tool does
  and what it does not do. No urgency, no hype, no dark patterns.
- **Rule:** no em dashes anywhere (copy, labels, comments). Use commas, full
  stops, parentheses or colons instead.
- **The logo is the client's art:** the white wordmark from
  `assets/logo/img-1-logo.png`, derived to a transparent webp and used in the
  header and footer. Do not redraw it, recolour it or set the wordmark in type.

## 2. Colour

Tokens live in `src/styles/global.css` (`@theme`), used as Tailwind classes
(`bg-canvas`, `text-ink-soft`) or CSS variables (`var(--color-accent)`).

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#0a0d14` | the page ground |
| `band` | `#04060e` | a section on its own darker ground (closing, footer) |
| `surface` | `#131824` | cards, fields, chips |
| `surface-2` | `#1a2234` | hover on a quiet control |
| `ink` | `#e9edf3` | headings and body at full strength |
| `ink-soft` | `#b8c0cc` | supporting paragraphs, values in rows |
| `muted` | `#82868d` | captions, labels, meta lines |
| `line` | `#232c3f` | hairlines, card borders, dividers inside a card |
| `line-strong` | `#33415e` | field borders, the dashed ad frame |
| `accent` | `#2b7fff` | primary buttons, the current step, links on hover |
| `accent-strong` | `#5294ff` | accent text on dark ground, focus rings |
| `accent-soft` | `#101c30` | the tinted panel (result card, chips) |
| `accent-line` | `#1d3557` | borders on accent-tinted panels |
| `accent-ink` | `#0a0d14` | text on an accent fill |
| `warn` / `warn-soft` / `warn-line` | `#e8b25c` / `#241d10` / `#4a3a1c` | limits and caveats |
| `danger` / `danger-soft` / `danger-line` | `#f27272` / `#241318` / `#4d2126` | field errors, alerts |

Measured contrast (WCAG 2.1):

| Pair | Ratio | Verdict |
|---|---|---|
| ink on canvas | 16.5:1 | body and headings |
| ink-soft on canvas | 10.6:1 | body |
| muted on canvas | 5.3:1 | captions and meta only, never a paragraph |
| accent-strong on canvas | 6.5:1 | accent text, links |
| accent-ink on accent | 5.2:1 | primary button label |
| ink on surface | 15.1:1 | card headings |
| ink-soft on surface | 9.7:1 | card copy |
| muted on surface | 4.9:1 | card meta only |

Rules:

- One accent per screen. It marks the primary action, the current step and the
  one number that matters. Everything else is ink, line or muted.
- Body copy is `ink` or `ink-soft`. `muted` is for labels, units, captions and
  secondary meta, at 13px or smaller.
- No violet, no gradient text, no coloured card fills except `accent-soft`.
- A section owns one ground. Do not place a second tinted band inside a
  section.

## 3. Type

Self-hosted `Outfit Variable` (400 to 700) for everything, `DM Mono` (400,
500) for figures, formulas and mock readouts. Both are preloaded in
`BaseLayout.astro`.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Hero h1 | `clamp(2.25rem, 1.4rem + 3.4vw, 4.25rem)` | 500 | tracking `-0.04em`, leading `1.04` |
| Page h1 (tool and doc pages) | `clamp(2.1rem, 1.4rem + 3.4vw, 3.4rem)` | 500 | tracking `-0.03em`, leading `1.05` |
| Section h2 | `clamp(1.75rem, 1.4rem + 2.2vw, 2.625rem)` | 500 | home sections |
| Doc h2 (long pages) | `clamp(1.6rem, 1.3rem + 1.5vw, 2rem)` | 500 | `Section.astro` |
| Card title h3 | 1rem | 600 | one size for every card title |
| Body | 1rem to 1.0625rem | 400 | leading `1.6` to `1.7` |
| Lead paragraph | 1.0625rem to 1.125rem | 400 | `ink-soft` |
| Label / eyebrow | 0.75rem | 600 | uppercase, tracking `0.14em`, accent-strong |
| Caption, hint | 0.75rem to 0.8125rem | 400 to 500 | `muted` |
| Figures (money, mocks) | 1rem to 2.75rem | 400 to 500 | `tabular-nums`, `DM Mono` for mock readouts |

Rules:

- One size per heading level per page. Card labels are not headings: use a
  `<p>` (with `id` and `aria-labelledby` if the panel needs a name).
- Never set a figure larger than the page h1.
- Money and counts always carry `tabular-nums`; currency and number formatting
  goes through `formatCurrency` / `formatNumber`, never ad hoc strings.
- Text finds its own measure: prose columns cap at 44rem (`.prose-ledger`),
  supporting paragraphs at 32rem to 40rem.

## 4. Layout and rhythm

- **Container:** `--container: 1280px`, side gutters `--gut`: 20px (phone),
  48px (640+), 80px (1024+). `.wrap` is the only content container.
- **One screen per section:** `--padt` 80px (96 at 1024+) and `--padb` 48px
  (72 at 1024+) around a `min-height: 100svh` section. The content of one
  section ends at `padb`, so neighbouring sections keep 128px or more of air.
- **12-column grid:** `grid-cols-12`, `gap-6` (24px). Cells start and end on
  the column lines: full width, half (6/6), 5+6 with the split at column 7,
  or thirds. Nothing floats off the lines.
- **Boxes:** a bordered or tinted box 640px wide or more spans the container
  from edge to edge (or stays under 36rem). A box may not stop mid-container.
- **Touch targets:** 44px minimum on every link and control.
- **Phone:** single column, buttons full width, no horizontal scroll from
  360px up. Long figures and formulas wrap instead of scrolling.
- **Landing pages** (`/`) run one section per screen. **Document pages**
  (calculator, trust pages) keep a left 44rem reading column and a sticky rail,
  and are allowed to be longer than one screen per section.

Sections on the landing page, in order, each exactly one screen except the
moment:

1. Hero: the words at the left (5 columns), a worked example at the right
   (6 columns, column 7 to 12), the trust strip at the foot.
2. Tools: heading, the live tool card and the roadmap card, the top ad at the
   foot.
3. The dealt moment (two screens, see Motion).
4. Closing: statement, the promises as plain rows, the end ad at the foot.

## 5. Components

All live in `src/components` and `src/styles/global.css`.

| Component | Look | Notes |
|---|---|---|
| `Header` (`header.nav`) | fixed, 64px tall, canvas fill, bottom hairline | mega menu on desktop, full-sheet menu on phone, skip link first |
| `Footer` (`footer.closing`) | band ground, three columns, the wordmark large at the foot, legal row | exactly two children in its wrap |
| `ConsentBanner` | fixed corner card, 36rem max, 24px off the floor | primary and secondary buttons, never a full-width bar |
| `AdSlot` | dashed frame, label at the top left, no fill | reserved height per format, full width or under 36rem |
| `ToolCard` | card, label, name, summary, arrow | the whole card is the link |
| `Callout` | a left rule, no box | for caveats and notes in the reading flow |
| `Section` | doc section with an h2 and a prose column | used on long pages |
| `Breadcrumbs` | small, muted, current page in `ink-soft` | every non-home page |
| `NumberField` (island) | label, field, hint, error line | prefix and suffix insets, locale grouping, reserved error space |
| `HourlyRateCalculator` (island) | form card and result panel | the only hydrated tool so far |

Buttons: one pill shape, one height (44px), one label size (0.9375rem,
600, no wrap).

- `btn-primary`: accent fill, ink-dark label. One per screen, at most two in a
  page.
- `btn-secondary`: surface fill, strong hairline, ink label.
- `link-draw`: text link with an underline that draws left to right on hover
  and stays on keyboard focus.
- Never a third button look. The consent card uses the same pair.

Cards: `card` (surface, hairline, 1.25rem radius) and `card-hover` (a 2px lift
and a stronger border). Panels that hold the result use `accent-soft` with
`accent-line`.

Fields: 1px `line-strong` border, `radius-input` 0.75rem, canvas fill, 44px
tall, 3px accent glow on focus (never a border that grows the box). Errors
reserve two lines so the layout never jumps.

## 6. Motion

Three motions, nothing else:

1. **Hero entrance:** `[data-enter]` elements rise 14px and fade in over
   560ms, staggered 90ms each, on load only.
2. **Result reveal:** on the calculator, the required rate rises and fades
   (animejs) whenever a valid result appears.
3. **The dealt moment** (`pinned-chapters`): on the home page, a stage holds
   for one screen of scroll while three steps open in turn beside a product
   screen. On phones, at reduced motion and without script it is static, with
   every step and screen readable.

Rules: transform and opacity only, 200 to 900ms, nothing moves on a card, no
parallax, no scroll-jacking, no auto-playing loops. Everything honours
`prefers-reduced-motion: reduce`.

## 7. Accessibility

- Skip link is the first Tab stop; every focus stop leaves a visible ring
  (2px accent-strong, 2px offset) and never lands under the fixed header or the
  consent card (`scroll-padding` on `html`).
- One h1 per page, no skipped heading levels, one size per level.
- Landmarks: `header.nav`, `main`, `footer.closing`; every section has an
  accessible name (`aria-labelledby`) or an h2.
- Forms: visible labels, hints tied by `aria-describedby`, `aria-invalid` and
  an error line with `aria-live`, a summary alert on submit, focus moved to the
  first invalid field.
- Contrast: body 7:1 or better on plain grounds, 4.5:1 for captions and for
  text over a picture or a gradient.
- No information by colour alone.

## 8. Ads and consent

- AdSense loads only after "Accept all"; no ad script runs otherwise.
- Every slot reserves its height (zero CLS), draws as a dashed frame with its
  label at the top left, and is either full container width or under 36rem.
- No ads on the 404 or the legal pages, never above the fold, never inside a
  card or between a heading and its content.
- The consent card is a fixed corner card, not a bar, so it never reads as an
  action bar or covers a page's closing action.

## 9. Adding a page

1. Start from `BaseLayout` (title, description, path, optional jsonLd).
2. Use `.wrap` for the content; keep every box on the container lines; cap
   prose at 44rem.
3. Landing-style page: sections of one screen each, content ending at `padb`,
   one accent per screen, one primary action.
4. Document page: `ToolPageLayout` (breadcrumbs, hero, optional sticky rail),
   `Section` for each part, `prose-ledger` for the words.
5. Words: name the thing in the h1 and every h2, one hard fact on the first
   screen, button labels start with a verb, no em dashes.
6. Check it: `pnpm verify`, `pnpm test:e2e`, screenshots at 360, 390, 768,
   1024, 1280 and 1440, then the design gate
   (`node .agents/skills/design-taste-frontend/scripts/gate.mjs`).

Do not:

- add a divider rule between blocks (air and ground do that job),
- put a gradient or picture behind body text,
- nest a band inside a section,
- set a card label as a heading,
- add a third button style,
- use `text-muted` for a paragraph.

## 10. File map

```
src/styles/global.css        tokens, rhythm, buttons, cards, fields, ads, moment
src/components/layout/       BaseLayout, Header, Footer, ToolPageLayout, Breadcrumbs
src/components/ads/          AdSlot, ConsentBanner
src/components/ui/           Section, ToolCard, Callout, FAQList, RelatedTools
src/components/calculators/  NumberField, HourlyRateCalculator
src/components/seo/          SEO (title, canonical, OG, JSON-LD)
src/assets/brand/            wordmark-header.webp, wordmark-footer.webp
public/                      ads.txt, og.jpg, favicons, fonts, assets/moments
docs/                        design.md (this file), redesign-plan.md, calculator-slice.md
```

Design decisions, the ad map and the verification history are in
[`redesign-plan.md`](./redesign-plan.md); progress and gates are in
[`../task.md`](../task.md).
