import { useRef, useState } from 'preact/hooks';

import CurrencySelect from '@/components/calculators/CurrencySelect';
import NumberField from '@/components/calculators/NumberField';
import { useCalculatorForm } from '@/components/calculators/useCalculatorForm';
import { useIslandReady } from '@/components/calculators/useIslandReady';
import { calculateRetainer } from '@/lib/calculators/retainer';
import {
  RETAINER_FIELDS,
  validateRetainerForm,
  type RetainerField,
  type RetainerFormValues,
} from '@/lib/calculators/retainer.schema';
import { currencySymbol, formatCurrency, type CurrencyCode } from '@/lib/formatting/currency';
import { formatPercent } from '@/lib/formatting/number';

const EXAMPLE_VALUES: RetainerFormValues = {
  monthlyHours: '20',
  hourlyRate: '90',
  monthlyExpenses: '600',
  desiredMarginPercent: '30',
  discountPercent: '0',
};

const FIELDS: readonly {
  id: RetainerField;
  label: string;
  hint: string;
  kind: 'money' | 'percent' | 'hours';
  suffix?: string;
  placeholder: string;
}[] = [
  {
    id: 'monthlyHours',
    label: 'Hours a month',
    hint: 'The hours you commit to this client each month.',
    kind: 'hours',
    suffix: 'hrs',
    placeholder: '20',
  },
  {
    id: 'hourlyRate',
    label: 'Your hourly rate',
    hint: 'The rate you cost your own hour at, before the retainer margin.',
    kind: 'money',
    placeholder: '90',
  },
  {
    id: 'monthlyExpenses',
    label: 'Monthly expenses',
    hint: 'Software, tools and costs this client’s work carries.',
    kind: 'money',
    placeholder: '600',
  },
  {
    id: 'desiredMarginPercent',
    label: 'Desired margin',
    hint: 'Profit you want to keep on the retainer. Below 100.',
    kind: 'percent',
    suffix: '%',
    placeholder: '30',
  },
  {
    id: 'discountPercent',
    label: 'Discount offered',
    hint: 'A concession to the client. It comes out of the margin.',
    kind: 'percent',
    suffix: '%',
    placeholder: '10',
  },
];

export default function RetainerCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const form = useCalculatorForm({
    fields: RETAINER_FIELDS,
    initialValues: EXAMPLE_VALUES,
    validate: validateRetainerForm,
    onValid: () => resultHeadingRef.current?.focus(),
  });

  const { values, validation, submitted, fieldError, inputRefs } = form;
  const parsedInput = validation.ok ? validation.input : null;
  const outcome = parsedInput ? calculateRetainer(parsedInput) : null;
  const hourlyRateLabel = parsedInput ? formatCurrency(parsedInput.hourlyRate, currency) : '';
  const expensesLabel = parsedInput ? formatCurrency(parsedInput.monthlyExpenses, currency) : '';

  useIslandReady();

  function updateField(field: RetainerField, value: string) {
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
      `Monthly retainer: ${formatCurrency(value.retainerRounded, currency)}`,
      `Base cost: ${formatCurrency(value.baseCost, currency)}`,
      `Quote before discount: ${formatCurrency(value.quote, currency)}`,
      `Discount: ${formatCurrency(value.discountAmount, currency)}`,
      `Monthly profit: ${formatCurrency(value.profitRounded, currency)}`,
      `Effective hourly: ${formatCurrency(value.effectiveHourlyRounded, currency)}`,
      `Annual revenue: ${formatCurrency(value.annualRounded, currency)}`,
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
      ? `Monthly retainer: ${formatCurrency(outcome.value.retainerRounded, currency)}.`
      : '';

  const isLoss = outcome?.ok === true && outcome.value.monthlyProfit.isNegative();

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
            Retainer terms
          </p>
          <CurrencySelect id="currency" value={currency} onValue={setCurrency} />
        </div>

        <p class="text-muted mt-2 text-sm">
          Example values are loaded. Change any field to match the client.
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
          {FIELDS.map((field) => {
            const error = fieldError(field.id);
            const hintId = `retainer-${field.id}-hint`;
            const errorId = `retainer-${field.id}-error`;

            return (
              <NumberField
                id={field.id}
                name={field.id}
                label={field.label}
                hint={field.hint}
                hintId={hintId}
                errorId={errorId}
                value={values[field.id]}
                placeholder={field.placeholder}
                prefix={field.kind === 'money' ? currencySymbol(currency) : undefined}
                suffix={field.suffix}
                error={error}
                decimals
                onValue={(next) => updateField(field.id, next)}
                onBlur={() => form.markTouched(field.id)}
                inputRef={(element) => {
                  inputRefs.current[field.id] = element;
                }}
              />
            );
          })}
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" class="btn btn-primary">
            Price the retainer
          </button>
          <button type="button" class="btn btn-secondary" onClick={resetExample}>
            Reset to example
          </button>
        </div>
      </form>

      <div class="lg:sticky lg:top-6">
        <section
          aria-labelledby="result-heading"
          class="border-accent-line bg-accent-soft rounded-xl border p-5 sm:p-6"
        >
          <p
            id="result-heading"
            ref={resultHeadingRef}
            tabindex={-1}
            class="eyebrow text-accent-strong outline-none"
          >
            Your monthly retainer
          </p>

          {outcome?.ok ? (
            <>
              <p key={outcome?.ok ? outcome.value.retainerRounded.toString() : 'empty'} class="result-reveal mt-2 flex flex-wrap items-baseline gap-x-2">
                <span
                  class={`${isLoss ? 'text-danger' : 'text-accent-strong'} font-[450] tabular-nums text-[2.75rem] leading-none tracking-[-0.03em] sm:text-5xl`}
                >
                  {formatCurrency(outcome.value.retainerRounded, currency)}
                </span>
                <span class="text-ink-soft text-sm font-medium">per month</span>
              </p>

              <p class="text-ink-soft mt-3 text-sm leading-relaxed">
                {values.monthlyHours} hours at {hourlyRateLabel} plus {expensesLabel} of costs, with a{' '}
                {values.desiredMarginPercent}% margin and a {values.discountPercent}% discount.
              </p>

              <dl class="border-accent-line mt-5 border-t">
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Base cost</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.baseCost, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Quote before discount</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.quote, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Discount</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.discountAmount, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Monthly profit</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.profitRounded, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Margin after discount</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {outcome.value.achievedMargin === null
                      ? '—'
                      : formatPercent(outcome.value.achievedMargin)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Effective hourly</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.effectiveHourlyRounded, currency)}
                  </dd>
                </div>
                <div class="flex items-baseline justify-between gap-4 py-2.5">
                  <dt class="text-ink-soft text-sm">Annual revenue</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.annualRounded, currency)}
                  </dd>
                </div>
              </dl>

              <p class="text-muted mt-3 text-xs leading-relaxed">
                Margin actually achieved after the discount:{' '}
                {outcome.value.achievedMargin === null
                  ? '—'
                  : formatPercent(outcome.value.achievedMargin)}
                . The discount comes out of the priced margin, so every point given away costs more
                than it looks.
              </p>

              {isLoss && (
                <p class="text-danger mt-4 rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-sm leading-relaxed">
                  At this discount the retainer no longer covers the base cost. Lower the discount,
                  raise the rate or accept a deliberate loss.
                </p>
              )}

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
                Set the hours, your rate and the margin you want to see the monthly retainer.
              </p>
            </div>
          )}

          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {liveMessage}
          </p>
        </section>

        <p class="text-muted mt-3 px-1 text-xs leading-relaxed">
          Informational estimate only. Income tax, VAT/GST and payment fees are not included.
        </p>
      </div>
    </div>
  );
}
