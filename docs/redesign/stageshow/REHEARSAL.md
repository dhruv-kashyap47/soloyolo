# Rehearsal: SoloYolo home demos

Skill read: `stageshow/SKILL.md` and every reference in `stageshow/references/`
(framing, craft, motion, kit, bento, choreography, verify, rehearse, review, looks,
teaching, annotations, backgrounds, brands, products). Gold examples studied:
`hero-demo`, `payout-flow`, `static-card`, `story`, `dark-bento`, `choreography`.

The demos are authored Preact-free HTML/CSS with one shared controller, not the
React kit. The kit's React runtime would add a second renderer to a Preact site and
break the JS budget; the staging, framing, restraint and motion rules are the ones
kept. Numbers are build-time engine output.

## Demos

| Demo | Gold | Beats | Captured |
|---|---|---|---|
| Rate pass (hero) | `hero-demo` | rate rolls, use rate, quote, invoice, print, New resets | 1440, 390, still, reduced motion |
| Invoice markets | `story` | UK, US, Germany, India; title, tax name, currency and total change | 1440, 390 |
| Project profit | `payout-flow` | contractor toggled off, margin 45 to 55, profit rolls, bars move | 1440, 390 |
| Payment fees | `choreography` | plan 2.9%+30c to 1.75%+25c, fee and net roll | 1440, 390 |
| Tax | `choreography` | UK 20% to Germany 19%, remove tax, add tax, back to UK | 1440, 390 |
| Quote and receipt | `static-card` | quote to receipt, title, dates and total | 1440, 390 |
| Reminder | `story` | friendly, professional, firm, send, sent, New | 1440, 390 |

Contact sheets: `rate-pass-*.png`, `invoice-countries-*.png`,
`project-profit-*.png`, `payment-fee-*.png`, `tax-*.png`, `reminder-*.png`,
`documents-*.png`. `hero-still.png` is the 1440 poster.

## Gate results

Run with `script/film.mjs ... --gate` from the stageshow skill, at 1440 and 390.

- `invoice-countries` 1440: **rehearsal passed**.
- `payment-fee` 1440: **rehearsal passed**.
- `tax` 1440 and 390: **rehearsal passed**.
- `documents` 1440 and 390: **rehearsal passed**.
- `rate-pass` 390: **rehearsal passed**; 1440 reports five lines about the nested
  rate column and paper sheet (below).
- `project-profit`: only the two nested gutters below; motion has no unfixed line.
- `reminder`: only the nested mail card and the centred sent overlay; no motion line
  after the sign was pinned and the message switched by opacity.
- `invoice-countries` 390: two handoff-shift notes on the tab label, not the sheet;
  the sheet itself passes with no cut words.

### Lines that stand, and why

- `uneven gutters: div.rp-rate-side` and `div.pp-chart` / `dl.pp-rows` /
  `div.pf-flow` / `div.rm-mail`: these are columns or panels inside the tile, not
  floating hero windows. The tile is the frame; the nested column is at its own
  inset. The checker cannot see the parent grid.
- `framing: div.rp-rate-side ends 1px short`: the rate column runs into the stage's
  bottom crop by design; the button stays whole.
- `uneven gutters: div.rp-paper`: a paper document centred in an app window. Its
  side margins are the document's page margins, not a plate.
- `loose stack: One rate, priced ... / Print ...`: a short supporting line above its
  action in a control column. The action is not a caption under a title.
- `handoff shift` on the invoice tabs: the tab label is replaced by an identical
  label at the same box; the 5px reading is the active pill's background moving.
  The document sheet is opacity-only and does not move.
- `incomplete: sampling gaps`: film samples geometry at up to 21ms; the virtual
  clock cannot judge every frame. Playback was watched at 1x in a normal browser,
  plus reduced motion, pause, resume and off-screen return.

## What was watched by hand

- Fresh load at 1440 and 390, reduced motion (poster), pause and resume, scroll
  away and back, tab hidden and restored.
- The loop seam on every demo: each reset has a visible cause (New, a tab click, a
  plan click, a tone click).
- The hero's print step: the sheet lifts, the print state appears, no fake dialog.
- One demo animates at a time; the pause control stops the active demo; a second
  demo takes over when the first leaves the viewport.

## Not checked

- Real mobile Safari performance; Phase 2 runs the throttled Lighthouse and INP
  pass on Chromium.
- Contact sheets cannot prove a one-frame flash; the live playback was watched but
  not recorded at 60fps.
- The design-taste gate is a separate tool; its open findings are recorded in
  `docs/redesign/waivers.md`.
