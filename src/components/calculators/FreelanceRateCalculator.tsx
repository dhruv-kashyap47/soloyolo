import type Decimal from 'decimal.js';
import { useRef, useState } from 'preact/hooks';

import CurrencySelect from '@/components/calculators/CurrencySelect';
import NumberField from '@/components/calculators/NumberField';
import { useCalculatorForm } from '@/components/calculators/useCalculatorForm';
import { useIslandReady } from '@/components/calculators/useIslandReady';
import { calculateFreelanceRate } from '@/lib/calculators/freelanceRate';
import {
  validateFreelanceRateForm,
  type FreelanceRateField,
  type FreelanceRateFormValues,
} from '@/lib/calculators/freelanceRate.schema';
import { currencySymbol, formatCurrency, type CurrencyCode } from '@/lib/formatting/currency';
import { formatNumber } from '@/lib/formatting/number';

const EXAMPLE_VALUES: FreelanceRateFormValues = {
  desiredIncome: '90,000',
  annualExpenses: '15,000',
  workingWeeks: '46',
  workingHoursPerWeek: '40',
  nonBillablePercent: '40',
  profitBufferPercent: '10',
};

const FIELD_ORDER: readonly FreelanceRateField[] = [
  'desiredIncome',
  'annualExpenses',
  'workingWeeks',
  'workingHoursPerWeek',
  'nonBillablePercent',
  'profitBufferPercent',
];

type FieldFormat = 'money' | 'percent' | 'count';

interface FieldConfig {
  id: FreelanceRateField;
  label: string;
  hint: string;
  format: FieldFormat;
  suffix?: string;
  placeholder: string;
}

const FIELDS: readonly FieldConfig[] = [
  {
    id: 'desiredIncome',
    label: 'Target annual income',
    hint: 'What you want to pay yourself before income tax.',
    format: 'money',
    placeholder: '90000',
  },
  {
    id: 'annualExpenses',
    label: 'Annual business expenses',
    hint: 'Software, insurance, accounting, workspace, equipment, marketing.',
    format: 'money',
    placeholder: '15000',
  },
  {
    id: 'workingWeeks',
    label: 'Working weeks per year',
    hint: 'Exclude holidays and time off. Between 1 and 52.',
    format: 'count',
    suffix: 'weeks',
    placeholder: '46',
  },
  {
    id: 'workingHoursPerWeek',
    label: 'Working hours per week',
    hint: 'Everything you work: client work, admin, sales and learning.',
    format: 'count',
    suffix: 'hrs',
    placeholder: '40',
  },
  {
    id: 'nonBillablePercent',
    label: 'Non-billable time',
    hint: 'Share of the week you cannot invoice. Between 0 and 99.',
    format: 'percent',
    suffix: '%',
    placeholder: '40',
  },
  {
    id: 'profitBufferPercent',
    label: 'Profit buffer',
    hint: 'Extra margin on top of income and costs, for slow months and reinvestment.',
    format: 'percent',
    suffix: '%',
    placeholder: '10',
  },
];

/** Hours read better with a decimal when the capacity math lands between two. */
function formatHours(value: Decimal): string {
  return formatNumber(value, { decimals: value.isInteger() ? 0 : 1 });
}

export default function FreelanceRateCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const form = useCalculatorForm({
    fields: FIELD_ORDER,
    initialValues: EXAMPLE_VALUES,
    validate: validateFreelanceRateForm,
    onValid: () => resultHeadingRef.current?.focus(),
  });

  const { values, validation, submitted, fieldError, inputRefs } = form;
  const parsedInput = validation.ok ? validation.input : null;
  const outcome = parsedInput ? calculateFreelanceRate(parsedInput) : null;
  const desiredIncomeLabel = parsedInput ? formatCurrency(parsedInput.desiredIncome, currency) : '';

  useIslandReady();

  function updateField(field: FreelanceRateField, value: string) {
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
      `Freelance rate: ${formatCurrency(value.hourlyRateRounded, currency)} per hour`,
      `Billable hours per year: ${formatHours(value.billableHoursPerYear)}`,
      `Revenue to bill: ${formatCurrency(value.requiredAnnualRevenue, currency)}`,
      `Profit buffer included: ${formatCurrency(value.bufferAmount, currency)}`,
      `Rate before the buffer: ${formatCurrency(value.baseHourlyRate, currency)}`,
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
            const hintId = `freelance-${field.id}-hint`;
            const errorId = `freelance-${field.id}-error`;

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
                prefix={field.format === 'money' ? currencySymbol(currency) : undefined}
                suffix={field.suffix}
                error={error}
                decimals={field.format !== 'count'}
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
            Your sustainable rate
          </p>

          {outcome?.ok ? (
            <>
              <p key={outcome?.ok ? outcome.value.hourlyRateRounded.toString() : 'empty'} class="result-reveal mt-2 flex flex-wrap items-baseline gap-x-2">
                <span class="text-accent-strong font-[450] tabular-nums text-[2.75rem] leading-none tracking-[-0.03em] sm:text-5xl">
                  {formatCurrency(outcome.value.hourlyRateRounded, currency)}
                </span>
                <span class="text-ink-soft text-sm font-medium">per hour</span>
              </p>

              <p class="text-ink-soft mt-3 text-sm leading-relaxed">
                Bill {formatCurrency(outcome.value.requiredAnnualRevenue, currency)} across{' '}
                {formatHours(outcome.value.billableHoursPerYear)} billable hours to pay yourself{' '}
                {desiredIncomeLabel} and hold {formatCurrency(outcome.value.bufferAmount, currency)}{' '}
                of buffer.
              </p>

              <dl class="border-accent-line mt-5 border-t">
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Billable hours a week</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatHours(outcome.value.billableHoursPerWeek)} h
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Billable hours a year</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatHours(outcome.value.billableHoursPerYear)} h
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Rate before the buffer</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.baseHourlyRate, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Revenue to bill</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.requiredAnnualRevenue, currency)}
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
                Capacity: {values.workingWeeks} weeks × {values.workingHoursPerWeek} hours ={' '}
                {formatHours(outcome.value.workingHoursPerYear)} working hours,{' '}
                {formatHours(outcome.value.billableHoursPerYear)} of them billable. Exact rate before
                rounding: {formatCurrency(outcome.value.hourlyRate, currency, { decimals: 4 })}.
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
                Enter your income target, costs, working hours and non-billable share to see the rate
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
