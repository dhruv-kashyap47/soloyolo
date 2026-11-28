# Home ad placement map (bento v2)

Date: 2026-11-19. The ad component logic, `src/config/ads.ts`, slot names,
`data-*` attributes, consent gate, lazy push and viewability events are unchanged.
Only wrappers and CSS moved.

## Instances

|   # | Slot          | Position on `/`                                                      |          Reserved min-height | In view with                    |
| --: | ------------- | -------------------------------------------------------------------- | ---------------------------: | ------------------------------- |
|   1 | `leaderboard` | Full-width band after the 12-tool dock, before the numbers section   | 112px desktop / 100px mobile | Only this band                  |
|   2 | `infeed`      | Full-width band after the numbers bento (invoice, profit, fees, tax) |                180px / 160px | Only this band                  |
|   3 | `sidebar`     | Static 300px desktop rail beside the documents section, at >=1200px  |                        600px | The neighbouring infeed at most |
|   4 | `infeed`      | Full-width band after the documents/desk section                     |                180px / 160px | The rail at most                |
|   5 | `leaderboard` | Full-width band after the country cards, before the closing panel    |                112px / 100px | Only this band                  |
|   6 | `end`         | Below the closing action, 48px away                                  |                        250px | Only this unit                  |
|   7 | `anchor`      | Existing dismissible mobile anchor, home only, after ad consent      |             64px + safe area | One band at most                |

Seven instances. The brief targets 7 to 8. The five existing instances
(`leaderboard`, `infeed`, `sidebar`, `end`, `anchor`) are all kept. The two added
instances reuse the existing `leaderboard` and `infeed` slot types; no new slot ID
or environment variable exists.

## Rules checked

- No ad above the first tool tiles. The dock starts at y=692, the first unit at
  y=1394 at 1440.
- No ad inside a tile, no ad sharing a grid with a demo. Bands are outside the
  12-column grids; the rail is a sibling of the main column.
- At most two units in view at once. The closest pair is the first `infeed` and
  the rail; the rail starts 159px below the band's bottom, so a 900px viewport can
  hold both but never three.
- 48px minimum from CTAs, buttons, links and the search bar. Bands use 48px
  block margins plus section padding; the closing `end` unit is 48px below the
  closing CTA.
- No sticky ad on home except the existing dismissible anchor. The home rail is
  static; only the tool-page rail remains sticky.
- Neutral ground (`#050507` / `#08080b`), visible `Advertisement` label, 1px
  separators, `contain: layout`, `overflow-anchor: none`, `min-height` only, no
  clipping.
- Legal pages and 404 stay ad-free. No anchor on tool pages.

## Filled-creative CLS test

Phase 4 measured a filled leaderboard growing 112 to 240px and an infeed growing
160 to 240px, with **CLS 0.00016**. The bento v2 containers keep the same
`min-height`-only rule, so a taller responsive creative grows the band below the
fold and cannot move content above it. The Phase 2 pass repeats this with filled
mock creatives after the new placement.

## Consent and policy

- `ads.txt` still contains the placeholder `pub-0000000000000000`.
- Consent key: `soloyolo-consent`; event: `soloyolo:consent` with
  `{ ads, analytics, value }`. Unchanged.
- The custom consent card is not a Google-certified CMP. No GDPR/TCF compliance is
  claimed. Before serving personalised ads to EEA/UK/CH visitors, a Google-certified
  CMP is required. This is a launch follow-up, not a redesign task.
