# Checkpoint 2: bento v2 home, demos and tool convenience

Branch `redesign/bento-v2`, 2026-11-19. Phase 1 of the new scope is complete:
tokens, the macOS-style bento home, seven choreographed demos, the ad map, and the
tool-page convenience pass. Phase 2 (full Lighthouse, Playwright, axe, filled-ad
CLS, widths and `results.md`) has not started.

## What shipped

| Area | Result |
|---|---|
| Ground and tokens | AMOLED `#000`; one vivid family colour: calculators blue to green, generators orange to red, countries violet. Family tokens follow every page through `data-family`. |
| Home | Hero with a 12-tool dock in the first screens. Hourly rate and invoice are the two large tiles; the other ten tools are one tap. Search/command bar under the H1, no eyebrow, no decorative labels. |
| Hero demo | Rate pass: rate rolls, quote, invoice, print, New resets. Real engine figures: `$76.67/h`, `$3,066.80` quote, `$3,319.81` invoice. |
| Large demos | Invoice country switch (UK/US/DE/IN, title, tax name, currency, total), project profit (45% to 55%), payment fees (`$970.70` to `$982.25`), tax (UK 20%, Germany 19%, remove), quote/receipt, reminder (four tones, sent), desk. |
| Desk | Real `TodayDashboard` compact tile with week hours, timer, region and a light `<details>` disclosure for clients, weekly goal and recents. |
| Ads | 7 home instances: two leaderboards, two infeed, one static side rail, end, anchor. None above the dock, none in a tile, at most two in view. |
| Tool pages | Structure and copy kept. Mobile live result, remembered inputs and currency, 44px targets, sticky generator tabs, share, reset, keyboard hints. |
| Hubs, about, legal, 404 | Tokens only. No structural change. |

## Numbers

| Metric | Result |
|---|---|
| Home JS, module graph gzip | **49.5KB** (baseline 51.5KB; cap 111.5KB). Demo controller 2.6KB. |
| CSS, one file | **19.9KB gzip** (target 12KB; waiver). |
| Home LCP, 390, 4x CPU + 1.6Mbps | **1.14s** (budget < 2.0s). |
| Home CLS | **0** with no ads and with filled mock creatives below the fold. |
| Tool LCP | 0.97s to 1.02s on the measured calculator, generator and country page. |
| TBT, 4x CPU | 0.27s initial long task on home; tool pages 0.02 to 0.05s. This is the one lab number over the 150ms proxy; it is initial parse/render, and calculator INP is 48ms. |
| INP proxy | Calculator typing and Calculate: 48ms. Home search palette open: 160ms at 4x CPU (about 40ms at 1x). |
| Axe | **0 violations** (WCAG 2.0/2.1/2.2 AA tags) on home, calculator, generator, country, both hubs, about, privacy, 404. |
| Keyboard | Skip link first and visible at 16px, 2px ring; mobile menu opens with focus on Find your rate, Escape closes and restores the menu button; Ctrl/Cmd+K opens the palette with focus in the search field. |
| Widths | 320, 375, 768, 1024, 1440, 1920, 2560: no horizontal overflow on home or the rate tool. |
| Ads | 7 home instances; first at y=1394 after the dock at y=692; filled mock creatives grow slots without moving content above them. |

## Evidence files

- Home screenshots: `docs/redesign/evidence/home-1440.png`,
  `home-390.png`, `home-320.png`, `home-1440-full.png`, `home-390-full.png`.
- Tool before/after: `docs/redesign/evidence/tool-rate-before-1440.png`,
  `tool-rate-after-1440.png`, `tool-rate-before-390.png`, `tool-rate-after-390.png`;
  the invoice pair follows the same naming.
- Demo contact sheets: `docs/redesign/stageshow/*.png`, notes in
  `stageshow/REHEARSAL.md`.
- Tool audit: `docs/redesign/tool-audit.md`.
- Ad map: `docs/redesign/ad-map-v2.md`.
- Waivers: `docs/redesign/waivers.md`.
- Raw scripts: `scripts/shoot.mjs`, `scripts/tool-audit.mjs`, `scripts/perf.mjs`,
  `scripts/axe-check.mjs`, `scripts/js-weight.mjs`, `scripts/ad-cls.mjs`,
  `scripts/keyboard-check.mjs`, `scripts/width-check.mjs`, `scripts/inp-tool.mjs`.

## Files changed

- `src/styles/global.css`: AMOLED tokens, family tokens, home v2, demos, ad
  containers, tool convenience styles.
- `src/components/layout/BaseLayout.astro`: family attribute, one Organization
  and WebSite JSON-LD, Outfit-only preload, black theme colour.
- `src/components/layout/Header.astro`: visible Find your rate at 390.
- `src/components/layout/ToolPageLayout.astro`, `GeneratorPageLayout.astro`,
  `SharePage.astro`: page share, 48px rail gap.
- `src/components/calculators/*`: mobile result, stored values and currency,
  keyboard hints, 44px mode chips.
- `src/components/generators/*`: share, reminder reset and remembered fields,
  sticky tabs on mobile.
- `src/pages/index.astro` and `src/components/home/*`: the new home, dock,
  demo components and the shared controller.
- `src/scripts/home-demos.ts`: one-at-a-time choreography, pause, off-screen,
  reduced-motion poster, film query.

## Follow-ups before launch

- A Google-certified CMP is required for personalised ads in the EEA/UK/CH. The
  custom card is unchanged and no GDPR/TCF compliance is claimed.
- `ads.txt` and the AdSense publisher ID remain placeholders.
- The domain and contact email remain placeholders.
- Phase 2 runs Lighthouse 13 mobile and desktop, Playwright, the filled-ad CLS
  test while scrolled, and writes `results.md`.
- CSS is 7.9KB over the 12KB target; the demo styles and the one-file rule are the
  trade-off recorded in the waiver.
