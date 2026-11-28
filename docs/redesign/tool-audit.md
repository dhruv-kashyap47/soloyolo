# Tool page convenience audit

Date: 2026-11-19. Scope: 8 calculators, 4 generators and the 15 country invoice pages
(the country pages share `CountryInvoicePage.astro`). Structure and content were not
redesigned. This is the friction list, what was fixed, and what remains.

## Method

- Playwright, Chromium, at 390 x 844 and 1440 x 1000, every route, with the consent
  card dismissed.
- Measured the first field, the full result panel, the number of inputs, missing
  labels, missing `inputmode` / `enterkeyhint`, targets under 44px, horizontal
  overflow, ad positions and the generator tab behaviour.
- Read every page as a user would: land, find the tool, enter a value, read the
  result, copy or print, reset, return later.
- `axe` and the keyboard pass are part of Phase 2; this page records the
  interaction audit and the fixes made in Phase 1.

## Friction found and fixed

| #   | Friction                                                                                                                                          | Evidence                                                                                                              | Fix                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | On a phone the result was 1.3 to 2.1 screens below the inputs. The visitor had to scroll past the whole form to see whether the number was right. | Hourly rate: first field at y=491, full result at y=1621 on 390. Freelance: 528 to 2045. Project profit: 556 to 2054. | A compact live result sits inside the form card on screens under 1024, with the headline figure and a `Full result` link. It is `role="status"` and updates as the inputs change.                                                                                                    |
| 2   | The last inputs were forgotten on reload; every calculator reopened with the worked example.                                                      | Reload after changing target income returned `80,000`.                                                                | `useCalculatorForm` now remembers the last valid values per calculator in `soloyolo:calculator:<id>`, and `useCurrency` remembers the currency in `soloyolo:currency:<id>`. Invalid or malformed storage falls back to the example. The reminder generator remembers its fields too. |
| 3   | Phone keyboards: number fields had `inputmode` but no action key; generator email, phone and website fields had no `autocomplete`.                | 0 `enterkeyhint` on calculator inputs; 3 contact fields without `autocomplete`.                                       | Number and text fields now accept `enterKeyHint` (default `done`). Generator email, phone and website fields use `autocomplete="email                                                                                                                                                | tel | url"`. |
| 4   | Several controls were under 44px: mode chips 36px, generator tabs 40px, skip link 41px, some selects 34px, `Use the next number` 36px.            | Measured at 390 and 1440.                                                                                             | Mode chips, tabs, skip link, selects and the number helper are now at least 44px. The post-fix audit reports no sub-44px target outside prose.                                                                                                                                       |
| 5   | The generator Details/Preview switch scrolled away above a long form, so the document was not reachable from the middle of the form.              | Invoice form is ~3.8 screens at 390.                                                                                  | The tab bar is sticky under the fixed header at <=1023, so Preview is one tap from any field.                                                                                                                                                                                        |
| 6   | The reminder generator had no Reset and no Share.                                                                                                 | Buttons: Print, Copy, Copy without the subject only.                                                                  | Reset restores the worked example. Share uses the system share sheet and falls back to copying the message.                                                                                                                                                                          |
| 7   | Calculators had Copy but no page-level share.                                                                                                     | Copy only in the result panel.                                                                                        | `SharePage` in both tool layouts shares the page URL, or copies it. Result copying stays in each tool.                                                                                                                                                                               |
| 8   | The generator preview was one tap away on a phone but there was no signal that the tap had been registered before hydration.                      | Generator islands hydrate on idle.                                                                                    | The existing `GeneratorShell` keeps the server form, reserves height, acknowledges the first tap, replays early typed text and queues an early submit. Verified CLS 0 in Phase 4.                                                                                                    |

## What was already good and was kept

- Every calculator opens with a real worked example, so the first result is visible
  before typing. Every generator opens with a complete example document.
- Inputs are labelled, errors are announced and the error line has reserved space:
  showing an error never moves the buttons.
- The result panel is sticky beside the form from 1024px up.
- Copy result is one tap; generators Print and Copy from the preview toolbar.
- The business profile can be kept on the device, explicitly opt-in, with a clear
  control to remove it.
- The tool is the first content block: calculators start at y=434-499 and generators
  at y=434-486 on a 390 screen. The first field is at y=491-688, inside the first
  screen.
- No horizontal overflow at 390 or 1440 on any route.

## After numbers

All routes, 390px, consent dismissed, `node scripts/tool-audit.mjs`:

| Page              | Tool top | First field | Full result | Sub-44px targets | Overflow |
| ----------------- | -------: | ----------: | ----------: | ---------------: | -------- |
| Hourly rate       |      434 |         491 |        1621 |                0 | no       |
| Freelance rate    |      471 |         528 |        2045 |                0 | no       |
| Project profit    |      499 |         556 |        2054 |                0 | no       |
| Markup vs margin  |      499 |         556 |        1336 |                0 | no       |
| Payment fee       |      471 |         528 |        1502 |                0 | no       |
| VAT/GST/sales tax |      471 |         528 |        1377 |                0 | no       |
| Retainer          |      499 |         556 |        1841 |                0 | no       |
| Break-even        |      434 |         491 |        1658 |                0 | no       |
| Invoice generator |      434 |         636 | preview tab |                0 | no       |
| Quote generator   |      434 |         636 | preview tab |                0 | no       |
| Receipt generator |      434 |         636 | preview tab |                0 | no       |
| Payment reminder  |      471 |         620 | message tab |                0 | no       |
| UK VAT invoice    |      486 |         688 | preview tab |                0 | no       |

The `Full result`/`Preview` number is the panel itself; the compact summary is
inside the form and is not counted in this column.

## Remaining choices and limits

- **Generator drafts are not persisted across reloads.** The business profile is
  opt-in and remembered; customer names, line items and dates are deliberately not
  restored so a returning visitor never prints last week's client by accident. This
  is a product decision, recorded here rather than silently added.
- **Calculators do not print.** They copy the result and share the page. Printing a
  calculator page is not a document action; the generators are the print path.
- **The country pages keep a fixed market.** The country is locked so the copy,
  the tax labels and the printed sheet cannot disagree; the visitor can still edit
  every other field.
- **No new dependencies.** The convenience work uses browser APIs already in the
  project: `localStorage`, `navigator.clipboard`, `navigator.share` and the
  existing print flow.
