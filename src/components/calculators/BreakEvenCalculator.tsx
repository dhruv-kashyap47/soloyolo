import { useMemo, useRef, useState } from 'preact/hooks';

import CurrencySelect from '@/components/forms/CurrencySelect';
import NumberField from '@/components/forms/NumberField';
import { useCalculatorForm } from '@/components/calculators/useCalculatorForm';
import { useIslandReady } from '@/components/calculators/useIslandReady';
import { calculateBreakEven, type BreakEvenMode } from '@/lib/calculators/breakEven';
import {
  BREAK_EVEN_FIELDS,
  breakEvenFieldsForMode,
  validateBreakEvenForm,
  type BreakEvenField,
  type BreakEvenFormValues,
} from '@/lib/calculators/breakEven.schema';
import {
  currencyLocale,
  currencySymbol,
  formatCurrency,
  type CurrencyCode,
} from '@/lib/formatting/currency';
import { formatNumber } from '@/lib/formatting/number';

const EXAMPLE_VALUES: BreakEvenFormValues = {
  fixedCosts: '4,000',
  pricePerUnit: '1,500',
  variableCostPerUnit: '500',
  hoursPerUnit: '20',
};

const MODES: readonly { id: BreakEvenMode; label: string }[] = [
  { id: 'project', label: 'Per project' },
  { id: 'hour', label: 'Per hour' },
];

export default function BreakEvenCalculator() {
  const [mode, setMode] = useState<BreakEvenMode>('project');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const validate = useMemo(
    () => (values: BreakEvenFormValues) => validateBreakEvenForm(mode, values),
    [mode],
  );

  const form = useCalculatorForm({
    fields: BREAK_EVEN_FIELDS,
    initialValues: EXAMPLE_VALUES,
    validate,
    onValid: () => resultHeadingRef.current?.focus(),
  });

  const { values, validation, submitted, fieldError, inputRefs } = form;
  const parsedInput = validation.ok ? validation.input : null;
  const outcome = parsedInput ? calculateBreakEven(parsedInput) : null;

  useIslandReady();

  const noun = mode === 'project' ? 'project' : 'hour';
  const nounPlural = mode === 'project' ? 'projects' : 'hours';

  function selectMode(next: BreakEvenMode) {
    setMode(next);
    setCopyState('idle');
  }

  function updateField(field: BreakEvenField, value: string) {
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
    const units = value.unitsRoundedUp.toNumber();
    const lines = [
      `Break-even: ${units} ${units === 1 ? noun : nounPlural}`,
      `Contribution per ${noun}: ${formatCurrency(value.contributionPerUnit, currency)}`,
      `Break-even revenue: ${formatCurrency(value.revenueRounded, currency)}`,
    ];
    if (value.breakEvenHours !== null && mode === 'project') {
      lines.push(`Hours needed: ${formatNumber(Math.ceil(value.breakEvenHours.toNumber()))}`);
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    window.setTimeout(() => setCopyState('idle'), 2500);
  }

  const unitsValue = outcome?.ok === true ? outcome.value.unitsRoundedUp.toNumber() : 0;
  const liveMessage =
    outcome?.ok === true
      ? `Break-even: ${unitsValue} ${unitsValue === 1 ? noun : nounPlural}.`
      : outcome?.ok === false
        ? outcome.message
        : '';

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
            Costs and prices
          </p>
          <CurrencySelect id="currency" value={currency} onValue={setCurrency} />
        </div>

        <div role="group" aria-label="Selling unit" class="mt-4 flex flex-wrap gap-2">
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

        <p class="text-muted mt-3 text-sm">
          Fixed costs are monthly. Everything else is per {noun}.
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
          {breakEvenFieldsForMode(mode).map((field) => {
            const isHours = field === 'hoursPerUnit';
            const label =
              field === 'fixedCosts'
                ? 'Fixed costs per month'
                : field === 'pricePerUnit'
                  ? `Price per ${noun}`
                  : field === 'variableCostPerUnit'
                    ? `Variable cost per ${noun}`
                    : 'Hours per project';
            const hint =
              field === 'fixedCosts'
                ? 'Rent, software, insurance, admin: costs that exist with no sales.'
                : field === 'pricePerUnit'
                  ? 'What one sale brings in before variable cost.'
                  : field === 'variableCostPerUnit'
                    ? 'Materials, delivery or contractor cost for one sale.'
                    : 'How long one project takes to deliver.';
            const error = fieldError(field);
            const hintId = `break-even-${field}-hint`;
            const errorId = `break-even-${field}-error`;

            return (
              <NumberField
                locale={currencyLocale(currency)}
                id={field}
                name={field}
                label={label}
                hint={hint}
                hintId={hintId}
                errorId={errorId}
                value={values[field]}
                placeholder={isHours ? '20' : field === 'fixedCosts' ? '4000' : '1500'}
                prefix={isHours ? undefined : currencySymbol(currency)}
                suffix={isHours ? 'hrs' : undefined}
                error={error}
                decimals
                onValue={(next) => updateField(field, next)}
                onBlur={() => form.markTouched(field)}
                inputRef={(element) => {
                  inputRefs.current[field] = element;
                }}
              />
            );
          })}
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" class="btn btn-primary">
            Find break-even
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
            Break-even point
          </h2>

          {outcome?.ok ? (
            <>
              <p key={outcome?.ok ? outcome.value.unitsRoundedUp.toString() : 'empty'} class="result-reveal mt-2 flex flex-wrap items-baseline gap-x-2">
                <span class="text-accent-strong font-[450] tabular-nums text-[2.75rem] leading-none tracking-[-0.03em] sm:text-5xl">
                  {formatNumber(outcome.value.unitsRoundedUp)}
                </span>
                <span class="text-ink-soft text-sm font-medium">
                  {unitsValue === 1 ? noun : nounPlural}
                </span>
              </p>

              <p class="text-ink-soft mt-3 text-sm leading-relaxed">
                Each {noun} contributes{' '}
                {formatCurrency(outcome.value.contributionPerUnit, currency)} towards fixed costs.
                At that rate the month is covered after {formatNumber(outcome.value.unitsRoundedUp)}{' '}
                {nounPlural} of work.
              </p>

              <dl class="border-accent-line mt-5 border-t">
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Contribution per {noun}</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.contributionPerUnit, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Break-even revenue</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.revenueRounded, currency)}
                  </dd>
                </div>
                {mode === 'project' && outcome.value.breakEvenHours !== null && (
                  <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                    <dt class="text-ink-soft text-sm">Hours at break-even</dt>
                    <dd class="text-sm font-semibold tabular-nums">
                      {formatNumber(Math.ceil(outcome.value.breakEvenHours.toNumber()))} h
                    </dd>
                  </div>
                )}
                <div class="flex items-baseline justify-between gap-4 py-2.5">
                  <dt class="text-ink-soft text-sm">Fixed costs per month</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(parsedInput?.fixedCosts ?? 0, currency)}
                  </dd>
                </div>
              </dl>

              <p class="text-muted mt-3 text-xs leading-relaxed">
                Rounded up to the next whole {noun}, so the target is achievable. Revenue uses the
                exact break-even point above.
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
                {outcome && !outcome.ok
                  ? outcome.message
                  : 'Enter your fixed costs, price and variable cost to find the break-even point.'}
              </p>
            </div>
          )}

          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {liveMessage}
          </p>
        </section>

        <p class="text-muted mt-3 px-1 text-xs leading-relaxed">
          Informational estimate only. Fixed costs are treated as monthly and do not include income
          tax or payment fees.
        </p>
      </div>
    </div>
  );
}
