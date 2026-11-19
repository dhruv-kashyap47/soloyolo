import { useRef, useState } from 'preact/hooks';
import type Decimal from 'decimal.js';

import CurrencySelect from '@/components/forms/CurrencySelect';
import MobileResult from '@/components/calculators/MobileResult';
import NumberField from '@/components/forms/NumberField';
import { useCalculatorForm } from '@/components/calculators/useCalculatorForm';
import { useCurrency } from '@/components/calculators/useCurrency';
import { useIslandReady } from '@/components/calculators/useIslandReady';
import { calculateHourlyRate } from '@/lib/calculators/hourlyRate';
import {
  validateHourlyRateForm,
  type HourlyRateField,
  type HourlyRateFormValues,
} from '@/lib/calculators/hourlyRate.schema';
import { currencyLocale, currencySymbol, formatCurrency } from '@/lib/formatting/currency';
import { formatNumber } from '@/lib/formatting/number';

const EXAMPLE_VALUES: HourlyRateFormValues = {
  targetIncome: '80,000',
  annualExpenses: '12,000',
  workingWeeks: '48',
  billableHoursPerWeek: '25',
};

const FIELD_ORDER: readonly HourlyRateField[] = [
  'targetIncome',
  'annualExpenses',
  'workingWeeks',
  'billableHoursPerWeek',
];

interface FieldConfig {
  id: HourlyRateField;
  label: string;
  hint: string;
  prefix?: boolean;
  suffix?: string;
  placeholder: string;
}

function formatHours(value: Decimal): string {
  return formatNumber(value, { decimals: value.isInteger() ? 0 : 1 });
}

const FIELDS: readonly FieldConfig[] = [
  {
    id: 'targetIncome',
    label: 'Target annual income',
    hint: 'What you want to pay yourself before income tax.',
    prefix: true,
    placeholder: '80000',
  },
  {
    id: 'annualExpenses',
    label: 'Annual business expenses',
    hint: 'Software, insurance, accounting, workspace, equipment, marketing.',
    prefix: true,
    placeholder: '12000',
  },
  {
    id: 'workingWeeks',
    label: 'Working weeks per year',
    hint: 'Exclude holidays and time off. Between 1 and 52.',
    suffix: 'weeks',
    placeholder: '48',
  },
  {
    id: 'billableHoursPerWeek',
    label: 'Billable hours per week',
    hint: 'Only hours you can invoice, not admin, sales or learning.',
    suffix: 'hrs',
    placeholder: '25',
  },
];

export default function HourlyRateCalculator() {
  const [currency, setCurrency] = useCurrency('hourly-rate');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const form = useCalculatorForm({
    fields: FIELD_ORDER,
    initialValues: EXAMPLE_VALUES,
    storageKey: 'hourly-rate',
    validate: validateHourlyRateForm,
    onValid: () => resultHeadingRef.current?.focus(),
  });

  const { values, validation, submitted, fieldError, inputRefs } = form;
  const outcome = validation.ok ? calculateHourlyRate(validation.input) : null;

  useIslandReady();

  function updateField(field: HourlyRateField, value: string) {
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
      `Required hourly rate: ${formatCurrency(value.hourlyRateRounded, currency)}`,
      `Annual revenue to bill: ${formatCurrency(value.requiredAnnualRevenue, currency)}`,
      `Billable hours per year: ${formatHours(value.billableHoursPerYear)}`,
      `Average revenue per week: ${formatCurrency(value.requiredWeeklyRevenue, currency)}`,
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
    ? `Required rate: ${formatCurrency(outcome.value.hourlyRateRounded, currency)} per hour.`
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
            Your inputs
          </p>
          <CurrencySelect id="currency" value={currency} onValue={setCurrency} />
        </div>

        <p class="text-muted mt-2 text-sm">
          Example values are loaded. Change any field to match your business.
        </p>

        {outcome?.ok && (
          <MobileResult
            label="Your required rate"
            value={`${formatCurrency(outcome.value.hourlyRateRounded, currency)} / hour`}
            detail={`${formatCurrency(outcome.value.requiredAnnualRevenue, currency)} to bill this year`}
          />
        )}

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
            const hintId = `hourly-${field.id}-hint`;
            const errorId = `hourly-${field.id}-error`;

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
                prefix={field.prefix ? currencySymbol(currency) : undefined}
                suffix={field.suffix}
                error={error}
                locale={currencyLocale(currency)}
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
            Calculate rate
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
            Your required rate
          </h2>

          {outcome?.ok ? (
            <>
              <p
                key={outcome?.ok ? outcome.value.hourlyRateRounded.toString() : 'empty'}
                class="result-reveal mt-2 flex flex-wrap items-baseline gap-x-2"
              >
                <span class="text-accent-strong font-[450] tabular-nums text-[2.75rem] leading-none tracking-[-0.03em] sm:text-5xl">
                  {formatCurrency(outcome.value.hourlyRateRounded, currency)}
                </span>
                <span class="text-ink-soft text-sm font-medium">per hour</span>
              </p>

              <p class="text-ink-soft mt-3 text-sm leading-relaxed">
                Bill {formatCurrency(outcome.value.requiredAnnualRevenue, currency)} over{' '}
                {formatHours(outcome.value.billableHoursPerYear)} billable hours to reach your
                target and cover your costs.
              </p>

              <dl class="border-accent-line mt-5 border-t">
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Annual revenue to bill</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.requiredAnnualRevenue, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Billable hours per year</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatHours(outcome.value.billableHoursPerYear)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Average per working week</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.requiredWeeklyRevenue, currency)}
                  </dd>
                </div>
                <div class="flex items-baseline justify-between gap-4 py-2.5">
                  <dt class="text-ink-soft text-sm">Average per month</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.requiredMonthlyRevenue, currency)}
                  </dd>
                </div>
              </dl>

              <p class="text-muted mt-3 text-xs leading-relaxed">
                Capacity: {values.workingWeeks} weeks × {values.billableHoursPerWeek} billable hours
                a week. Exact rate before rounding:{' '}
                {formatCurrency(outcome.value.hourlyRate, currency, { decimals: 4 })}.
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
                Enter your income target, expenses, working weeks and billable hours to see the rate
                you need.
              </p>
            </div>
          )}

          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {liveMessage}
          </p>
        </section>

        <p class="text-muted mt-3 px-1 text-xs leading-relaxed">
          Informational estimate only. Excludes income tax, VAT/GST, pension contributions and
          unpaid leave beyond the weeks you entered.
        </p>
      </div>
    </div>
  );
}



