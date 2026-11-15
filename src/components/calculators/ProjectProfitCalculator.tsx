import { useRef, useState } from 'preact/hooks';

import CurrencySelect from '@/components/calculators/CurrencySelect';
import NumberField from '@/components/calculators/NumberField';
import { useCalculatorForm } from '@/components/calculators/useCalculatorForm';
import { useIslandReady } from '@/components/calculators/useIslandReady';
import { calculateProjectProfit } from '@/lib/calculators/projectProfit';
import {
  validateProjectProfitForm,
  type ProjectProfitField,
  type ProjectProfitFormValues,
} from '@/lib/calculators/projectProfit.schema';
import { currencySymbol, formatCurrency, type CurrencyCode } from '@/lib/formatting/currency';
import { formatPercent } from '@/lib/formatting/number';

const EXAMPLE_VALUES: ProjectProfitFormValues = {
  revenue: '12,000',
  labor: '5,000',
  contractor: '1,500',
  software: '300',
  other: '200',
  overhead: '1,000',
};

interface FieldConfig {
  id: ProjectProfitField;
  label: string;
  hint: string;
  placeholder: string;
}

const FIELDS: readonly FieldConfig[] = [
  {
    id: 'revenue',
    label: 'Project revenue',
    hint: 'What the client pays, excluding tax you collect on their behalf.',
    placeholder: '12000',
  },
  {
    id: 'labor',
    label: 'Labor cost',
    hint: 'Your own hours at an internal cost rate, not your billing rate.',
    placeholder: '5000',
  },
  {
    id: 'contractor',
    label: 'Contractor cost',
    hint: 'Subcontractors and freelancers paid for this project.',
    placeholder: '1500',
  },
  {
    id: 'software',
    label: 'Software cost',
    hint: 'Licenses and subscriptions used only for this project.',
    placeholder: '300',
  },
  {
    id: 'other',
    label: 'Other direct costs',
    hint: 'Hardware, hosting, printing, travel or materials.',
    placeholder: '200',
  },
  {
    id: 'overhead',
    label: 'Allocated overhead',
    hint: 'The share of rent, insurance and admin this project should carry.',
    placeholder: '1000',
  },
];

export default function ProjectProfitCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const form = useCalculatorForm({
    fields: FIELDS.map((field) => field.id),
    initialValues: EXAMPLE_VALUES,
    validate: validateProjectProfitForm,
    onValid: () => resultHeadingRef.current?.focus(),
  });

  const { values, validation, submitted, fieldError, inputRefs } = form;
  const outcome = validation.ok ? calculateProjectProfit(validation.input) : null;

  useIslandReady();

  function updateField(field: ProjectProfitField, value: string) {
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
      `Revenue: ${formatCurrency(value.revenueRounded, currency)}`,
      `Direct costs: ${formatCurrency(value.directCosts, currency)}`,
      `Overhead: ${formatCurrency(value.overhead, currency)}`,
      `Total costs: ${formatCurrency(value.totalCosts, currency)}`,
      `Project profit: ${formatCurrency(value.profitRounded, currency)}`,
      `Margin: ${value.margin === null ? 'not defined' : formatPercent(value.margin)}`,
      `Markup: ${value.markup === null ? 'not defined' : formatPercent(value.markup)}`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    window.setTimeout(() => setCopyState('idle'), 2500);
  }

  const liveMessage = outcome?.ok
    ? `Project profit: ${formatCurrency(outcome.value.profitRounded, currency)}.`
    : '';

  const isLoss = outcome?.ok === true && outcome.value.profit.isNegative();

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
            Project numbers
          </p>
          <CurrencySelect id="currency" value={currency} onValue={setCurrency} />
        </div>

        <p class="text-muted mt-2 text-sm">
          Example values are loaded. Change any field to match the project.
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
            const hintId = `project-${field.id}-hint`;
            const errorId = `project-${field.id}-error`;

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
                prefix={currencySymbol(currency)}
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
            Calculate profit
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
          <p
            id="result-heading"
            ref={resultHeadingRef}
            tabindex={-1}
            class="eyebrow text-accent-strong outline-none"
          >
            {isLoss ? 'This project loses money' : 'What the project leaves you'}
          </p>

          {outcome?.ok ? (
            <>
              <p key={outcome?.ok ? outcome.value.profitRounded.toString() : 'empty'} class="result-reveal mt-2 flex flex-wrap items-baseline gap-x-2">
                <span
                  class={`${isLoss ? 'text-danger' : 'text-accent-strong'} font-[450] tabular-nums text-[2.75rem] leading-none tracking-[-0.03em] sm:text-5xl`}
                >
                  {formatCurrency(outcome.value.profitRounded, currency)}
                </span>
                <span class="text-ink-soft text-sm font-medium">
                  {isLoss ? 'loss' : 'profit'}
                </span>
              </p>

              <p class="text-ink-soft mt-3 text-sm leading-relaxed">
                {formatCurrency(outcome.value.revenueRounded, currency)} of revenue against{' '}
                {formatCurrency(outcome.value.totalCosts, currency)} of costs
                {outcome.value.margin === null
                  ? '.'
                  : `, a margin of ${formatPercent(outcome.value.margin)}.`}
              </p>

              <dl class="border-accent-line mt-5 border-t">
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Revenue</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.revenueRounded, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Direct costs</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.directCosts, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Total cost</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.totalCosts, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Gross profit before overhead</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.grossProfit, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Profit margin</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {outcome.value.margin === null ? '—' : formatPercent(outcome.value.margin)}
                  </dd>
                </div>
                <div class="flex items-baseline justify-between gap-4 py-2.5">
                  <dt class="text-ink-soft text-sm">Markup on cost</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {outcome.value.markup === null ? '—' : formatPercent(outcome.value.markup)}
                  </dd>
                </div>
              </dl>

              {isLoss && (
                <p class="text-danger mt-4 rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-sm leading-relaxed">
                  At these numbers the project costs{' '}
                  {formatCurrency(outcome.value.profit.abs(), currency)} more than it earns. Raise
                  the price, cut a cost, or walk away.
                </p>
              )}

              <p class="text-muted mt-3 text-xs leading-relaxed">
                Margin divides profit by revenue; markup divides profit by total cost. A 50% markup
                and a 33.3% margin are the same project. Percentages show one decimal place.
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
                Enter the price and every cost the project carries to see what it really leaves you.
              </p>
            </div>
          )}

          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {liveMessage}
          </p>
        </section>

        <p class="text-muted mt-3 px-1 text-xs leading-relaxed">
          Informational estimate only. Tax you collect for a client, income tax and payment
          processing fees are not included.
        </p>
      </div>
    </div>
  );
}
