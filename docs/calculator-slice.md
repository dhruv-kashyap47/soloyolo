# Adding a calculator (the vertical-slice pattern)

Eight calculators now follow this pattern. The Hourly Rate Calculator is the
minimal reference; the mode-driven tools (markup vs margin, tax, break-even)
show the discriminated-union variant. Every calculator uses the same layers so
the maths stays testable and the pages stay fast.

Shared finance kernels live in `src/lib/finance/`: `money.ts` (Decimal config,
rounding, guards) and `percent.ts` (`percentToFraction`, `percentOf`). A
calculator never converts a percentage by hand.

## 1. Pure calculation function: `src/lib/calculators/<tool>.ts`

- Accept a typed input object of `Decimal` values.
- Return a discriminated union: `{ ok: true; value } | { ok: false; code; message }`.
- Guard every impossible case explicitly: zero capacity, negative values,
  non-finite values, values above the supported maximum.
- Never return `Infinity` or `NaN`.
- Do not import UI, Preact, or formatting code.

## 2. Form validation: `src/lib/calculators/<tool>.schema.ts`

- Parse raw strings with `parseAmountInput` (`src/lib/validation/amount.ts`).
- Return field-level messages in `{ ok: false; errors }`; the UI decides when to
  show them (on blur or on submit).
- Validation is hand-written for islands so Zod never reaches the browser
  bundle; Zod runs only in page frontmatter, at build time.
- Keep messages lowercase-label based and consistent:
  - `Enter your <label>.`
  - `Enter <label> as a number, for example 80000.`
  - `<Label> cannot be negative.`
  - `<Label> must be between X and Y.`

When one tool answers several questions, model the input as a **discriminated
union** and let the validator return only the pair that mode needs (see
`markupMargin.ts` / `markupMargin.schema.ts`). Never accept every field and
silently ignore the ones that contradict each other.

## 3. Unit tests: `tests/unit/<tool>.test.ts`

Cover, at minimum:

- the documented worked example
- zero and empty values
- negative values (rejected)
- decimal inputs
- very large inputs
- rounding boundaries
- invalid/non-finite inputs
- boundary values (min/max)
- input immutability

Schema tests (`<tool>.schema.test.ts`) cover messages, independent field errors
and pasted formats like `$80,000`.

## 4. Preact island: `src/components/calculators/<Tool>.tsx`

- Default-export the component; hydrate with `client:load` (the tool is above the
  fold).
- Prefill a worked example so the tool is useful immediately.
- Use the shared pieces rather than rebuilding them:
  - `NumberField.tsx` for every numeric input (grouping, caret, prefix/suffix,
    reserved error space);
  - `CurrencySelect.tsx` for the currency picker, with `currencySymbol()` for the
    in-field prefix;
  - `useIslandReady()` to mark `<html data-calculator-ready>`, which the e2e and
    axe suites wait for;
  - `useCalculatorForm()` for values, touched/submitted state, field errors,
    focus on the first invalid field and reset. It takes `fields`,
    `initialValues`, `validate` and an optional `onValid` (used to focus the
    result heading).
- Use `aria-live="polite"` for a short result sentence, not the whole panel.
- The result headline reveals with the shared `.result-reveal` CSS class: give
  the element a `key` of the rounded result so Preact remounts it and the
  keyframe replays. Do not add an animation library back for this.
- Reserve space for error text (`min-h-4`) so the submit button does not shift
  under the pointer when an error appears.
- Associate every input with `label`, hint (`aria-describedby`) and error ids;
  set `aria-invalid` when invalid.
- Show the exact pre-rounded value alongside the rounded result for transparency.
- The form shell is shared now (`useCalculatorForm`). The result panel, copy
  text and formatting stay in the island: they are what makes each tool
  different.
- Allow results the naive version would reject: a project can lose money, and a
  percentage can be undefined when its denominator is zero. Return `null` rather
  than `Infinity`, and say why in the UI.
- Reconcile the rounded display: round the figures a reader sees and derive the
  remaining one from them (for example tax = gross − net, or net = amount − fee),
  so the parts always add up to the total. Rounding every part independently is
  how a panel ends up a cent off its own sum.
- Copy must match the formatter. Intl prints `$` for CAD and AUD, so example
  prose says `$`, not `C$` or `A$`; `currencyCopy.test.ts` enforces it.

## 5. Page: `src/pages/calculators/<tool>/index.astro`

Use `ToolPageLayout` and follow the template order:

```
H1 + description
[calculator]
result (inside the island)
How it works
Formula
Worked examples
Assumptions / limitations
FAQ (FAQList, emits FAQPage JSON-LD)
Related calculators (RelatedTools)
```

- Worked examples must be calculated with the real function at build time.
- Add `WebApplication` JSON-LD through `BaseLayout`'s `jsonLd` prop.
- Register the tool in `src/lib/tools.ts` and flip `live: true`.

## 6. Content: `src/data/calculators/<tool>.ts`

- Keep copy, FAQs, assumptions and examples as typed data.
- Validate it with a Zod schema at build time (see `hourly-rate.schema.ts`).
- Add a drift test asserting the published figures match the engine.

## 7. E2E: `tests/e2e/<tool>.spec.ts`

- Loads, prefilled result is correct.
- Changing an input recalculates.
- Invalid input shows a field error and `aria-invalid`.
- Submitting an invalid form announces the summary and focuses the first field.
- Currency or unit switching reformats without converting.
- Reset restores the example.
- Keyboard input works.
- No horizontal overflow on mobile.

## 8. Gate before moving on

```bash
pnpm verify && pnpm test:e2e
```

Then measure one calculator page as it actually loads (module graph, gzip). The
Phase 2 pages are 25–26 KB; anything approaching 35 KB means a dependency crept
into the island. Update `task.md` (task, evidence, changelog, deferred items),
and only then start the next tool.
