import { useMemo, useRef, useState } from 'preact/hooks';

import CurrencySelect from '@/components/forms/CurrencySelect';
import NumberField from '@/components/forms/NumberField';
import { useCalculatorForm } from '@/components/calculators/useCalculatorForm';
import { useIslandReady } from '@/components/calculators/useIslandReady';
import { calculateTax, type TaxMode } from '@/lib/calculators/tax';
import {
  TAX_FIELDS,
  validateTaxForm,
  type TaxField,
  type TaxFormValues,
} from '@/lib/calculators/tax.schema';
import type { CountryCode } from '@/lib/countries';
import { COUNTRY_TAX_TERMS } from '@/lib/countries/taxTerms';
import { currencyLocale, currencySymbol, formatCurrency, type CurrencyCode } from '@/lib/formatting/currency';

const EXAMPLE_VALUES: TaxFormValues = { amount: '1,200', ratePercent: '8.25' };

const MODES: readonly { id: TaxMode; label: string }[] = [
  { id: 'add', label: 'Add tax' },
  { id: 'remove', label: 'Remove tax' },
];

const COUNTRIES = COUNTRY_TAX_TERMS;

function isCountryId(value: string): value is CountryCode {
  return COUNTRIES.some((country) => country.code === value);
}

export default function TaxCalculator() {
  const [mode, setMode] = useState<TaxMode>('add');
  const [country, setCountry] = useState<CountryCode>('US');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const validate = useMemo(
    () => (values: TaxFormValues) => validateTaxForm(mode, values),
    [mode],
  );

  const form = useCalculatorForm({
    fields: TAX_FIELDS,
    initialValues: EXAMPLE_VALUES,
    validate,
    onValid: () => resultHeadingRef.current?.focus(),
  });

  const { values, validation, submitted, fieldError, inputRefs } = form;
  const outcome = validation.ok ? calculateTax(validation.input) : null;

  useIslandReady();

  const term = COUNTRIES.find((entry) => entry.code === country)?.term ?? 'Sales tax';

  function selectMode(next: TaxMode) {
    setMode(next);
    setCopyState('idle');
  }

  function updateField(field: TaxField, value: string) {
    form.setValue(field, value);
    setCopyState('idle');
  }

  function resetExample() {
    form.reset();
    setCopyState('idle');
  }

  async function copyResult() {
    if (!outcome?.ok) return;

    const { value } = outcome;
    const lines = [
      `Net amount: ${formatCurrency(value.netRounded, currency)}`,
      `${term}: ${formatCurrency(value.taxRounded, currency)}`,
      `Gross amount: ${formatCurrency(value.grossRounded, currency)}`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    window.setTimeout(() => setCopyState('idle'), 2500);
  }

  const liveMessage =
    outcome?.ok === true
      ? `${term}: ${formatCurrency(outcome.value.taxRounded, currency)}.`
      : '';

  const amountLabel = mode === 'add' ? 'Amount before tax' : 'Amount including tax';
  const amountHint =
    mode === 'add'
      ? 'The price you quote before tax is added.'
      : 'The total the client paid, with tax already inside it.';
  const rateLabel = `${term} rate`;
  const rateHint =
    term === 'Sales tax'
      ? 'Your state or local rate. It is not bundled with the tool.'
      : 'Your country’s current rate. It is not bundled with the tool.';

  return (
    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)]">
      <form
        class="card card-raised p-5 sm:p-6"
        onSubmit={form.handleSubmit}
        noValidate
        aria-labelledby="calculator-heading"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p id="calculator-heading" class="text-ink text-base font-semibold">
            Amount and tax
          </p>
          <CurrencySelect id="currency" value={currency} onValue={setCurrency} />
        </div>

        <div role="group" aria-label="Tax direction" class="mt-4 flex flex-wrap gap-2">
          {MODES.map((option) => (
            <button
              type="button"
              aria-pressed={mode === option.id}
              class={`min-h-9 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                mode === option.id
                  ? 'border-accent-line bg-accent-soft text-accent-strong'
                  : 'border-line text-ink-soft hover:border-line-strong hover:text-ink'
              }`}
              onClick={() => selectMode(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div class="mt-4 flex items-center gap-2">
          <label for="country" class="text-muted text-xs font-medium">
            Country
          </label>
          <select
            id="country"
            class="border-line-strong bg-canvas text-ink rounded-lg border px-2 py-1.5 text-sm"
            value={country}
            onChange={(event) => {
              const next = event.currentTarget.value;
              if (isCountryId(next)) setCountry(next);
            }}
          >
            {COUNTRIES.map((option) => (
              <option value={option.code}>{option.label}</option>
            ))}
          </select>
        </div>

        <p class="text-muted mt-3 text-sm">
          Country changes the wording, not the maths. Enter the rate that applies to you.
        </p>

        {submitted && !validation.ok && (
          <div
            role="alert"
            class="bg-danger-soft text-danger mt-4 rounded-lg border border-danger-line px-3 py-2.5 text-sm"
          >
            Check the highlighted fields and try again.
          </div>
        )}

        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <NumberField
            id="amount"
            name="amount"
            label={amountLabel}
            hint={amountHint}
            hintId="tax-amount-hint"
            errorId="tax-amount-error"
            value={values.amount}
            locale={currencyLocale(currency)}
            placeholder="1200"
            prefix={currencySymbol(currency)}
            error={fieldError('amount')}
            decimals
            onValue={(next) => updateField('amount', next)}
            onBlur={() => form.markTouched('amount')}
            inputRef={(element) => {
              inputRefs.current.amount = element;
            }}
          />
          <NumberField
            id="ratePercent"
            name="ratePercent"
            label={rateLabel}
            hint={rateHint}
            hintId="tax-ratePercent-hint"
            errorId="tax-ratePercent-error"
            value={values.ratePercent}
            placeholder="20"
            suffix="%"
            error={fieldError('ratePercent')}
            decimals
            onValue={(next) => updateField('ratePercent', next)}
            onBlur={() => form.markTouched('ratePercent')}
            inputRef={(element) => {
              inputRefs.current.ratePercent = element;
            }}
          />
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" class="btn btn-primary">
            Calculate tax
          </button>
          <button type="button" class="btn btn-secondary" onClick={resetExample}>
            Reset to example
          </button>
        </div>
      </form>

      <div class="lg:sticky lg:top-20">
        <section
          aria-labelledby="result-heading"
          class="border-accent-line bg-accent-soft rounded-xl border p-5 sm:p-6"
        >
          <h2
            id="result-heading"
            ref={resultHeadingRef}
            tabindex={-1}
            class="eyebrow text-accent-strong outline-none focus-visible:ring-2 focus-visible:ring-accent-line focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-sm"
          >
            {term}
          </h2>

          {outcome?.ok ? (
            <>
              <p key={outcome?.ok ? outcome.value.taxRounded.toString() : 'empty'} class="result-reveal mt-2 flex flex-wrap items-baseline gap-x-2">
                <span class="text-accent-strong font-[450] tabular-nums text-[2.75rem] leading-none tracking-[-0.03em] sm:text-5xl">
                  {formatCurrency(outcome.value.taxRounded, currency)}
                </span>
                <span class="text-ink-soft text-sm font-medium">
                  {mode === 'add' ? 'added' : 'included'}
                </span>
              </p>

              <p class="text-ink-soft mt-3 text-sm leading-relaxed">
                {mode === 'add'
                  ? `${formatCurrency(outcome.value.netRounded, currency)} plus ${formatCurrency(outcome.value.taxRounded, currency)} of ${term.toLowerCase()} is ${formatCurrency(outcome.value.grossRounded, currency)}.`
                  : `${formatCurrency(outcome.value.grossRounded, currency)} includes ${formatCurrency(outcome.value.taxRounded, currency)} of ${term.toLowerCase()}, leaving ${formatCurrency(outcome.value.netRounded, currency)} before tax.`}
              </p>

              <dl class="border-accent-line mt-5 border-t">
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Net amount</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.netRounded, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">{term}</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.taxRounded, currency)}
                  </dd>
                </div>
                <div class="flex items-baseline justify-between gap-4 py-2.5">
                  <dt class="text-ink-soft text-sm">Gross amount</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.grossRounded, currency)}
                  </dd>
                </div>
              </dl>

              <p class="text-muted mt-3 text-xs leading-relaxed">
                Removing tax divides by 1 + the rate; it does not subtract the rate from the total.
                Rates are not bundled: they vary by country, state and date.
              </p>

              <div class="mt-5 flex items-center gap-3">
                <button type="button" class="btn btn-secondary" onClick={copyResult}>
                  Copy result
                </button>
                <span role="status" aria-live="polite" class="text-accent-strong text-sm">
                  {copyState === 'copied' && 'Copied.'}
                  {copyState === 'failed' && 'Copy unavailable, select the text instead.'}
                </span>
              </div>
            </>
          ) : (
            <div class="border-accent-line bg-surface/60 mt-3 rounded-lg border border-dashed p-6">
              <p class="text-ink-soft text-sm leading-relaxed">
                Enter an amount and your tax rate to see the tax, the net and the total.
              </p>
            </div>
          )}

          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {liveMessage}
          </p>
        </section>

        <p class="text-muted mt-3 px-1 text-xs leading-relaxed">
          Informational estimate only, not tax advice. Check the rate and the rules with the tax
          authority in your country.
        </p>
      </div>
    </div>
  );
}
