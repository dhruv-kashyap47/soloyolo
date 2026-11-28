# Checkpoint 2: bento v2 home, demos and tool convenience

Branch `redesign/bento-v2`, opened 2026-11-19 and closed 2026-11-20 at `96fae29`
plus the Day Ledger pass. Phase 1 of the new scope is complete, and so is
Phase 2: the home bento, the seven demos, the ad map, the tool convenience pass,
the all-tools index and the light theme. Measurements live in
[`results.md`](./results.md).

## What shipped

| Area                    | Result                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ground and tokens       | AMOLED `#000`; one vivid family colour: calculators blue to green, generators orange to red, countries violet. Family tokens follow every page through `data-family`.                                                                       |
| Home                    | Hero with a 12-tool dock in the first screens. Hourly rate and invoice are the two large tiles; the other ten tools are one tap. Search/command bar under the H1, no eyebrow, no decorative labels.                                         |
| Hero lede               | Answers what the site does and who it is for: rate the work, price the job, send the invoice, for freelancers, consultants and small studios.                                                                                               |
| Hero demo               | Rate pass: rate rolls, quote, invoice, print, New resets. Real engine figures: `$76.67/h`, `$3,066.80` quote, `$3,319.81` invoice.                                                                                                          |
| Large demos             | Invoice country switch (UK/US/DE/IN, title, tax name, currency, total), project profit (45% to 55%), payment fees (`$970.70` to `$982.25`), tax (UK 20%, Germany 19%, remove), quote/receipt, reminder (four tones, sent), desk.            |
| Demo runtime            | Every demo in view animates at the same time, each on its own loop. Off-screen demos pause individually; a hidden tab pauses all of them; `prefers-reduced-motion` leaves the poster; the pause control stops and restarts the whole page.  |
| Desk                    | Real `TodayDashboard` compact tile with week hours, timer, region and a light `<details>` disclosure for clients, weekly goal and recents.                                                                                                  |
| Toolkit                 | Four window tiles (Rates, Margin, Send, Chase) with the real engine figures, seven CSS loops that share one clock, and a `Tool 1`–`Tool 12` index on every row. The index is dropped below 480px so long tool names stop breaking mid-word. |
| All tools               | `/tools/` lists all 12 live tools from the registry, grouped into Calculators and Generators, with counts. Linked from the third hero action, which carries a live `12` badge.                                                              |
| Light theme             | **Day Ledger**, D-1: a warm paper ground with darker family colours, chosen from a three-state footer switch (Auto / Dark / Light), remembered in `localStorage` and resolved in the head before first paint. Dark stays the default.       |
| Ads                     | 7 home instances: two leaderboards, two infeed, one static side rail, end, anchor. None above the dock, none in a tile, at most two in view. The rail and every slot turn into reserved light boxes on paper.                               |
| Tool pages              | Structure and copy kept. Mobile live result, remembered inputs and currency, 44px targets, sticky generator tabs, share, reset, keyboard hints. Native date pickers follow the page theme.                                                  |
| Hubs, about, legal, 404 | Tokens only. No structural change.                                                                                                                                                                                                          |

## Numbers

| Metric                          | Result                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Home JS, module graph gzip      | **49.6KB** (baseline 51.5KB; cap 111.5KB). Demo controller 2.6KB.                                                             |
| CSS, one file                   | **24.7KB gzip** (target 12KB; waiver: the demo styles, the light token set and the one-file rule).                            |
| Home LCP, 390, 4x CPU + 1.6Mbps | 1.14s (budget < 2.0s); Lighthouse 13 mobile and desktop in `results.md`.                                                      |
| Home CLS                        | 0 with no ads, with filled mock creatives, and while scrolling through them.                                                  |
| Axe                             | 0 violations (WCAG 2.0/2.1/2.2 AA) on 11 routes in dark and in light.                                                         |
| Widths                          | 320, 375, 390, 768, 1024, 1280, 1440, 1920, 2560: no horizontal overflow on home, `/tools/` or the rate tool, in both themes. |
| Unit and e2e                    | 550 unit tests; the full Playwright suite on desktop Chromium and mobile Safari.                                              |

## Evidence files

- Measurements and commands: [`results.md`](./results.md).
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

## Files changed

- `src/styles/global.css`: AMOLED tokens, family tokens, home v2, demos, ad
  containers, tool convenience styles, the Day Ledger light token set and its
  surface overrides, and the footer switch control.
- `src/components/layout/BaseLayout.astro`: family attribute, one Organization
  and WebSite JSON-LD, Outfit-only preload, black theme colour, and the
  blocking-free theme bootstrap in the head.
- `src/components/layout/Footer.astro`: the three-state theme switch and its
  storage, plus the legal row that hosts it.
- `src/components/layout/Header.astro`: visible Find your rate at 390.
- `src/components/layout/ToolPageLayout.astro`, `GeneratorPageLayout.astro`,
  `SharePage.astro`: page share, 48px rail gap.
- `src/components/calculators/*`: mobile result, stored values and currency,
  keyboard hints, 44px mode chips.
- `src/components/generators/*`: share, reminder reset and remembered fields,
  sticky tabs on mobile.
- `src/pages/index.astro` and `src/components/home/*`: the new home, dock,
  demo components, the `Tool N` index and the shared controller.
- `src/pages/tools/index.astro`: the all-tools index, built from `liveTools()`.
- `src/scripts/home-demos.ts`: concurrent per-demo loops, pause, off-screen,
  reduced-motion poster, film query.
- `tests/e2e/accessibility.spec.ts`, `tests/e2e/invoice-generator.spec.ts`,
  `tests/e2e/theme.spec.ts`: the theme contract replaces the single-theme
  assertions.

## Follow-ups before launch

- A Google-certified CMP is required for personalised ads in the EEA/UK/CH. The
  custom card is unchanged and no GDPR/TCF compliance is claimed.
- `ads.txt` and the AdSense publisher ID remain placeholders.
- The domain and contact email remain placeholders.
- CSS is 12.7KB over the 12KB target; the demo styles, the light token set and
  the one-file rule are the trade-off recorded in the waiver.
