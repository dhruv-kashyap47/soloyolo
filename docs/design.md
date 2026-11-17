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

| Token                                    | Hex                               | Use                                                  |
| ---------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `canvas`                                 | `#0a0d14`                         | the page ground                                      |
| `band`                                   | `#04060e`                         | a section on its own darker ground (closing, footer) |
| `surface`                                | `#131824`                         | cards, fields, chips                                 |
| `surface-2`                              | `#1a2234`                         | hover on a quiet control                             |
| `ink`                                    | `#e9edf3`                         | headings and body at full strength                   |
| `ink-soft`                               | `#b8c0cc`                         | supporting paragraphs, values in rows                |
| `muted`                                  | `#82868d`                         | captions, labels, meta lines                         |
| `line`                                   | `#232c3f`                         | hairlines, card borders, dividers inside a card      |
| `line-strong`                            | `#33415e`                         | field borders, the dashed ad frame                   |
| `accent`                                 | `#2b7fff`                         | primary buttons, the current step, links on hover    |
| `accent-strong`                          | `#5294ff`                         | accent text on dark ground, focus rings              |
| `accent-soft`                            | `#101c30`                         | the tinted panel (result card, chips)                |
| `accent-line`                            | `#1d3557`                         | borders on accent-tinted panels                      |
| `accent-ink`                             | `#0a0d14`                         | text on an accent fill                               |
| `warn` / `warn-soft` / `warn-line`       | `#e8b25c` / `#241d10` / `#4a3a1c` | limits and caveats                                   |
| `danger` / `danger-soft` / `danger-line` | `#f27272` / `#241318` / `#4d2126` | field errors, alerts                                 |

Measured contrast (WCAG 2.1):

| Pair                    | Ratio  | Verdict                                   |
| ----------------------- | ------ | ----------------------------------------- |
| ink on canvas           | 16.5:1 | body and headings                         |
| ink-soft on canvas      | 10.6:1 | body                                      |
| muted on canvas         | 5.3:1  | captions and meta only, never a paragraph |
| accent-strong on canvas | 6.5:1  | accent text, links                        |
| accent-ink on accent    | 5.2:1  | primary button label                      |
| ink on surface          | 15.1:1 | card headings                             |
| ink-soft on surface     | 9.7:1  | card copy                                 |
| muted on surface        | 4.9:1  | card meta only                            |

Rules:

- One accent per screen. It marks the primary action, the current step and the
  one number that matters. Everything else is ink, line or muted.
- Body copy is `ink` or `ink-soft`. `muted` is for labels, units, captions and
  secondary meta, at 13px or smaller.
- No violet, no gradient text, no coloured card fills except `accent-soft`.
- A section owns one ground. Do not place a second tinted band inside a
  section.

## 3. Type

Self-hosted `Outfit Variable` (400 to 700) for everything, `DM Mono` (400) for
figures, formulas and mock readouts. Both are preloaded in `BaseLayout.astro`;
no second mono weight ships, so a page never fetches a font it only uses for
one line.

| Role                         | Size                                       | Weight     | Notes                                       |
| ---------------------------- | ------------------------------------------ | ---------- | ------------------------------------------- |
| Hero h1                      | `clamp(2.25rem, 1.4rem + 3.4vw, 4.25rem)`  | 500        | tracking `-0.04em`, leading `1.04`          |
| Page h1 (tool and doc pages) | `clamp(2.1rem, 1.4rem + 3.4vw, 3.4rem)`    | 500        | tracking `-0.03em`, leading `1.05`          |
| Section h2                   | `clamp(1.75rem, 1.4rem + 2.2vw, 2.625rem)` | 500        | home sections                               |
| Doc h2 (long pages)          | `clamp(1.6rem, 1.3rem + 1.5vw, 2rem)`      | 500        | `Section.astro`                             |
| Card title h3                | 1rem                                       | 600        | one size for every card title               |
| Body                         | 1rem to 1.0625rem                          | 400        | leading `1.6` to `1.7`                      |
| Lead paragraph               | 1.0625rem to 1.125rem                      | 400        | `ink-soft`                                  |
| Label / eyebrow              | 0.75rem                                    | 600        | uppercase, tracking `0.14em`, accent-strong |
| Caption, hint                | 0.75rem to 0.8125rem                       | 400 to 500 | `muted`                                     |
| Figures (money, mocks)       | 1rem to 2.75rem                            | 400 to 500 | `tabular-nums`, `DM Mono` for mock readouts |

Rules:

- One size per heading level per page. Card labels are not headings: use a
  `<p>` (with `id` and `aria-labelledby` if the panel needs a name).
- Figures stay below the page heading sizes. One exception: the calculator's
  result figure, which is the page's content, and may run up to 48px on a
  phone so the number reads at a glance.
- Money and counts always carry `tabular-nums`; currency and number formatting
  goes through `formatCurrency` / `formatNumber`, never ad hoc strings.
- Text finds its own measure: prose columns cap at 44rem (`.prose-ledger`),
  supporting paragraphs at 32rem to 40rem.

## 4. Layout and rhythm

- **Container:** `--container: 1280px`, side gutters `--gut`: 20px (phone),
  48px (640+), 80px (1024+). `.wrap` is the only content container.
- **Natural section height:** sections are as tall as their content, with
  `--padt` 40px (48 at 640+, 64 at 1024+) and `--padb` 40px (48 at 640+, 72 at
  1024+). The hero adds the 64px fixed header on top of its padding.
- **12-column grid:** `grid-cols-12`, `gap-6` (24px). Cells start and end on
  the column lines: full width, half (6/6), 5+6 with the split at column 7,
  or thirds. Nothing floats off the lines.
- **Boxes:** a bordered or tinted box 640px wide or more spans the container
  from edge to edge (or stays under 36rem). A box may not stop mid-container.
- **Touch targets:** 44px minimum on every link and control.
- **Phone:** single column, buttons full width, no horizontal scroll from
  360px up. Long figures and formulas wrap instead of scrolling.
- **Landing pages** (`/`) flow in natural-height sections. **Document pages**
  (calculator, trust pages) keep a left 44rem reading column and a sticky rail,
  and are allowed to be longer than one screen per section.

Sections on the landing page, in order:

1. Hero: the words at the left (5 columns), a worked example at the right
   (6 columns, column 7 to 12), the trust strip at the foot.
2. Tools: heading, the live tool card and the roadmap card, the top ad at the
   foot.
3. How a calculation runs: three steps, all visible in normal flow.
4. Closing: statement, the promises as plain rows, the end ad at the foot.

## 5. Components

All live in `src/components` and `src/styles/global.css`.

| Component                            | Look                                                                                                              | Notes                                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `Header` (`header.nav`)              | fixed, 64px tall, canvas fill, bottom hairline                                                                    | one `Tools` mega menu with calculators and generators in two columns each, full-sheet menu on phone, skip link first |
| `Footer` (`footer.closing`)          | band ground, description and three link columns, then the brand wordmark at 86% with one line under it, legal row | the mark is decorative (`aria-hidden`) and blends with the band: no plate, no fade                                   |
| `ConsentBanner`                      | fixed corner card, 36rem max, 24px off the floor; a slim bottom strip under 640px                                 | primary and secondary buttons, same copy on every screen                                                             |
| `AdSlot`                             | dashed frame, label at the top left, no fill                                                                      | reserved height per format, full width or under 36rem                                                                |
| `ToolCard`                           | card, label, name, summary, arrow                                                                                 | the whole card is the link                                                                                           |
| `Callout`                            | a left rule, no box                                                                                               | for caveats and notes in the reading flow                                                                            |
| `Section`                            | doc section with an h2 and a prose column                                                                         | used on long pages                                                                                                   |
| `Breadcrumbs`                        | small, muted, current page in `ink-soft`                                                                          | every non-home page                                                                                                  |
| `NumberField` (island)               | label, field, hint, error line                                                                                    | prefix and suffix insets, locale grouping, reserved error space                                                      |
| `TextField` / `SelectField` (island) | the same field rules, for words and choices                                                                       | `type="date"` gives the native picker                                                                                |
| `CurrencySelect` (island)            | currency picker                                                                                                   | formats only, never converts                                                                                         |
| `useCalculatorForm` (island hook)    | values, errors, submit, reset                                                                                     | one implementation for all eight calculators                                                                         |
| `*Calculator` islands                | form card and result panel                                                                                        | eight hydrated tools, one per calculator page                                                                        |
| `DocumentGenerator` (island)         | form on the left, the document on the right                                                                       | drives the invoice, quote and receipt; a two button switch shows one pane at a time under 1024px                     |
| `DocumentPreview` (island)           | the sheet: white paper, 210mm, 12mm padding                                                                       | it is the element that prints, so preview and print share one geometry                                               |
| `LineItemsEditor` (island)           | one card per line                                                                                                 | four number fields and an optional HSN/SAC field in a container query, two columns on a phone                         |
| `PaymentReminderGenerator` (island)  | tone cards, details, the written message on the sheet                                                             | the wording comes from the engine, not the component                                                                 |
| `CountryInvoicePage`                 | the country guide shell: generator, requirements, changes, rates, notes, FAQ, sources                             | one page per market route; the copy is validated at build time                                                       |

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

### The document sheet

A generator prints a document, so the sheet is the one light surface in the
product: white paper on the dark canvas. It is not a theme break; it is the
artefact, and a preview that hid that would be a lie.

- Type is smaller than the interface: 13px body, 9px labels, 20px title. The
  paper is doing the work, not the type.
- The palette is its own (`--sheet-ink`, `--sheet-soft`, `--sheet-muted`,
  `--sheet-line`, `--sheet-accent`), tuned for contrast on white: the muted
  grey is 5.4:1, not the interface's 5.3:1-on-near-black value.
- One accent, and only on the amount due. Everything else is ink or a hairline.
- The totals block never spans the sheet: it sits under the amount column, where
  the eye already is.
- Tax appears twice on purpose: a short note under each line, and a summary
  table when a document carries more than one rate.

## 6. Motion

Three motions, nothing else:

1. **Hero entrance:** `[data-enter]` elements rise 14px and fade in over
   560ms, staggered 90ms each, on load only.
2. **Result reveal:** on the calculator, the required rate rises and fades
   whenever a valid result appears. CSS keyframes only (`result-reveal`), so the
   tool ships no animation library.
3. **Card reveal:** tool cards fade and rise 12px once when they enter the
   viewport (480ms). One IntersectionObserver adds `is-revealed`, and the
   hidden state exists only after that observer is live, so the cards stay
   visible without JavaScript, under reduced motion and in print. The footer
   wordmark uses the same observer with a longer, softer entrance (720ms, 18px,
   a 0.99 scale).

Rules: transform and opacity only, 200 to 900ms, cards move only on their one
reveal and their hover lift, no parallax, no scroll-jacking, no sticky scroll
sections, no auto-playing loops. Everything honours
`prefers-reduced-motion: reduce`.

The generator preview does not animate. A document that jumps while it is being
typed into is harder to read, not easier, so the sheet only changes its figures.

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
- The consent card is a fixed corner card on desktop and a slim bottom strip
  under 640px, so it covers less of a phone's form.
- Density is deliberate: two units on the home and calculator-index pages, and
  three in-flow units plus the desktop rail on a calculator page, each at a
  real content break. No further slots while that holds.

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
src/styles/global.css        tokens, rhythm, buttons, cards, fields, ads, sheet, print
src/components/layout/       BaseLayout, Header, Footer, ToolPageLayout, GeneratorPageLayout, Breadcrumbs
src/components/ads/          AdSlot, ConsentBanner
src/components/ui/           Section, ToolCard, Callout, FAQList, RelatedTools
src/components/forms/        NumberField, TextField, SelectField, CurrencySelect
src/components/calculators/  useCalculatorForm, useIslandReady, 8 calculator islands
src/components/generators/   DocumentGenerator, DocumentPreview, LineItemsEditor, LogoUpload,
                             PaymentReminderGenerator, useDocumentForm, useBusinessProfile
src/components/countries/    CountryInvoicePage, the shell for the fifteen country guides
src/components/seo/          SEO (title, canonical, OG, JSON-LD)
src/assets/brand/            wordmark-header.webp (300px), wordmark-footer-hd.webp (transparent)
public/                      ads.txt, og.jpg, favicons, fonts, assets/moments
docs/                        design.md (this file), redesign-plan.md, calculator-slice.md, generator-slice.md
```

Design decisions, the ad map and the verification history are in
[`redesign-plan.md`](./redesign-plan.md); progress and gates are in
[`../task.md`](../task.md).
