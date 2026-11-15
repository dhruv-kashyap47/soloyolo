# Adding a calculator (the vertical-slice pattern)

The Hourly Rate Calculator is the reference implementation. Every calculator
follows the same layers so the maths stays testable and the pages stay fast.

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
- Validation is intentionally hand-written for islands so Zod never reaches the
  browser bundle (currently ~80 KB of the payload).
- Keep messages lowercase-label based and consistent:
  - `Enter your <label>.`
  - `Enter <label> as a number, for example 80000.`
  - `<Label> cannot be negative.`
  - `<Label> must be between X and Y.`

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
- Use `aria-live="polite"` for a short result sentence, not the whole panel.
- Reserve space for error text (`min-h-4`) so the submit button does not shift
  under the pointer when an error appears.
- Associate every input with `label`, hint (`aria-describedby`) and error ids;
  set `aria-invalid` when invalid.
- Show the exact pre-rounded value alongside the rounded result for transparency.

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

Then update `task.md`, and only then start the next tool.
