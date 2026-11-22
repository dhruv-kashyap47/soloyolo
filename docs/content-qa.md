# Content QA — calculators, generators and trust pages

Date: 2026-11-22
Scope: P5-07 and the content half of Gate 5. Phase 5, after the 2026-11-20
bento v2 close.

## What was checked

Every calculator and generator page was read against the four things a reader
needs in order to trust the answer:

1. **The formula is stated and tested.** Each page names the arithmetic, and a
   unit test recomputes every worked example with the same engine the page uses.
2. **The assumptions are explicit.** What the input includes, what it excludes,
   and which real-world costs the model deliberately leaves out.
3. **The example matches the output.** Published figures in the prose are the
   figures the engine returns, not hand-written numbers.
4. **The FAQ answers a question the page cannot answer itself.** No duplicated
   questions, no filler, and no claim that crosses into tax or legal advice.

The legal and trust pages were checked against the code: the operator name, the
public email, the storage keys the tools actually write, and the claim that no
server receives tool inputs.

## Automated evidence

| Check                                                                        | Where                                 |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| Hourly-rate examples, FAQ and schema                                         | `tests/unit/content.test.ts`          |
| Seven further calculator content suites (examples, FAQ, assumptions, schema) | `tests/unit/*Content.test.ts`         |
| Generator copy, steps, notes and FAQ validation                              | `tests/unit/generatorContent.test.ts` |
| Related lists are live, distinct and cross-kind                              | `tests/unit/relatedMatrix.test.ts`    |
| Every route: unique metadata, one h1, no skipped heading level               | `tests/e2e/audit.spec.ts`             |
| Every internal link resolves; no route is an orphan                          | `tests/e2e/audit.spec.ts`             |
| Placeholder scan for `example.com` and old contact addresses                 | manual `rg`, 2026-11-22               |

## Calculators

| Tool                  | Formula and examples | Assumptions | FAQ                                               | Sourced country claims                 |
| --------------------- | -------------------- | ----------- | ------------------------------------------------- | -------------------------------------- |
| Hourly rate           | Pass                 | Pass        | 7 questions, no duplicates                        | n/a                                    |
| Freelance rate        | Pass                 | Pass        | 8 questions, no duplicates                        | n/a                                    |
| Project profit        | Pass                 | Pass        | 7 questions, margin vs markup explained           | n/a                                    |
| Markup vs margin      | Pass                 | Pass        | 8 questions, impossible-input rules stated        | n/a                                    |
| Payment fee           | Pass                 | Pass        | 6 questions, effective-rate maths shown           | n/a                                    |
| VAT / GST / sales tax | Pass                 | Pass        | 6 questions, terminology and no bundled rates     | Tax terms match the 8 `CountryConfig`s |
| Retainer pricing      | Pass                 | Pass        | 6 questions, discount effect shown                | n/a                                    |
| Break-even            | Pass                 | Pass        | 6 questions, rounding and per-hour mode explained | n/a                                    |

All eight pages state that rates are entered by hand, that income tax is not
modelled, and that the tool is not tax, legal or financial advice.

## Issues found and fixed

| Page                                       | Issue                                                                                                                                                                                        | Fix                                                                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| VAT / GST / sales tax FAQ                  | "Are the tax rates included?" described the country selector as changing only "sales tax, VAT, GST or HST", which omitted the German, Swiss, Indian and UAE terms the selector actually uses | The answer now names sales tax, VAT, GST, HST, Umsatzsteuer, MWST / TVA / IVA and federal VAT, matching the assumptions list      |
| Payment reminder generator FAQ             | "nothing is stored unless you choose to keep your own business details" was wrong: the reminder keeps its message fields locally so a reload does not lose the draft                         | The answer now says the message fields stay in the browser, business details are opt-in, and both are local                       |
| Privacy policy                             | Claimed the tools stored nothing, while the calculators, generators, theme switch, desk and session counters all write local storage                                                         | Rewritten 2026-11-22 to list every category of local data and the keys readers can inspect; still states that nothing is uploaded |
| Contact, about, privacy, terms, disclaimer | Placeholder `hello@soloyolo.example` and no named operator                                                                                                                                   | Replaced with `foundersoffice@proton.me` and `SoloYolo Tools, sole operator`, read from `src/config/site.ts`                      |

## Deliberate omissions (not bugs)

- No bundled tax rates. Rates change and a stale default is worse than asking
  the reader to enter the rate that applies today.
- No currency conversion. The selector formats only, so a result can never be
  read as an exchange-rate quote.
- No income-tax modelling. Each page says so and points to the reader's tax
  authority or accountant.
- No legal-advice claims on the reminder page. It writes a message, not a
  statutory notice, and the final-notice copy avoids inventing fees or threats.
- The `/resources/` index links only official government and tax-authority
  sources already recorded in the country configs, with the date each claim was
  checked. There are no affiliate links or paid placements.
- `/resources/e-invoicing-and-record-keeping/` states no period for India and no
  single period for the United States, because the authority does not give one
  or the rule was not confirmed. The omission is explained on the page.
- The cross-border control in the generator records a treatment the reader has
  already chosen. It does not decide place of supply, and the copy says so.

## Verification

- `pnpm test`: 583 unit tests pass.
- `pnpm test:e2e -- tests/e2e/audit.spec.ts`: metadata and link audits pass on
  all 39 routes.
- Full `pnpm verify` and the complete Playwright suite (660 checks) are run
  before each commit; the numbers are recorded in `task.md`.
