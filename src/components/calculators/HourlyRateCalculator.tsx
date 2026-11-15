import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { animate } from 'animejs';

import NumberField from '@/components/calculators/NumberField';
import { calculateHourlyRate } from '@/lib/calculators/hourlyRate';
import {
  validateHourlyRateForm,
  type HourlyRateField,
  type HourlyRateFormValues,
} from '@/lib/calculators/hourlyRate.schema';
import {
  CURRENCIES,
  formatCurrency,
  isCurrencyCode,
  type CurrencyCode,
} from '@/lib/formatting/currency';
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

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  USD: '$',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
};

export default function HourlyRateCalculator() {
  const [values, setValues] = useState<HourlyRateFormValues>(EXAMPLE_VALUES);
  const [touched, setTouched] = useState<Partial<Record<HourlyRateField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const inputRefs = useRef<Partial<Record<HourlyRateField, HTMLInputElement | null>>>({});
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const validation = useMemo(() => validateHourlyRateForm(values), [values]);
  const outcome = validation.ok ? calculateHourlyRate(validation.input) : null;

  // Tells the page (and the end-to-end tests) that the island is interactive:
  // before hydration a typed value would not reach the form state.
  useEffect(() => {
    document.documentElement.dataset.calculatorReady = 'true';
    return () => {
      delete document.documentElement.dataset.calculatorReady;
    };
  }, []);

  const errors = validation.ok ? {} : validation.errors;

  function updateField(field: HourlyRateField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setCopyState('idle');
  }

  function markTouched(field: HourlyRateField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function fieldError(field: HourlyRateField): string | undefined {
    if (validation.ok) return undefined;
    if (submitted || touched[field]) return errors[field];
    return undefined;
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    setSubmitted(true);

    if (validation.ok) {
      resultHeadingRef.current?.focus();
      return;
    }

    for (const field of FIELD_ORDER) {
      if (validation.errors[field]) {
        inputRefs.current[field]?.focus();
        break;
      }
    }
  }

  function resetExample() {
    setValues(EXAMPLE_VALUES);
    setTouched({});
    setSubmitted(false);
    setCopyState('idle');
  }

  async function copyResult() {
    if (!outcome?.ok) return;

    const { value } = outcome;
    const lines = [
      `Required hourly rate: ${formatCurrency(value.hourlyRateRounded, currency)}`,
      `Annual revenue to bill: ${formatCurrency(value.requiredAnnualRevenue, currency)}`,
      `Billable hours per year: ${formatNumber(value.billableHoursPerYear)}`,
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

  // Dealt moment: the required rate reveals with a small rise-and-fade whenever
  // a valid result appears. Transform and opacity only; disabled for
  // prefers-reduced-motion.
  const rateValueRef = useRef<HTMLParagraphElement>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!outcome?.ok || !rateValueRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    animate(rateValueRef.current, {
      opacity: [0, 1],
      y: [8, 0],
      duration: isFirstRun.current ? 620 : 380,
      ease: 'out(3)',
    });
    isFirstRun.current = false;
  }, [outcome?.ok, outcome?.ok ? outcome.value.hourlyRateRounded.toString() : '']);

  return (
    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)]">
      <form
        class="card card-raised p-5 sm:p-6"
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="calculator-heading"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p id="calculator-heading" class="text-ink text-base font-semibold">
            Your inputs
          </p>
          <div class="flex items-center gap-2">
            <label for="currency" class="text-muted text-xs font-medium">
              Currency
            </label>
            <select
              id="currency"
              class="border-line-strong bg-canvas text-ink rounded-md border px-2 py-1.5 text-sm"
              value={currency}
              onChange={(event) => {
                const next = event.currentTarget.value;
                if (isCurrencyCode(next)) setCurrency(next);
              }}
            >
              {CURRENCIES.map((option) => (
                <option value={option.code}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <p class="text-muted mt-2 text-sm">
          Example values are loaded. Change any field to match your business.
        </p>

        {submitted && !validation.ok && (
          <div
            role="alert"
            class="bg-danger-soft text-danger mt-4 rounded-md border border-danger-line px-3 py-2.5 text-sm"
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
                prefix={field.prefix ? CURRENCY_SYMBOL[currency] : undefined}
                suffix={field.suffix}
                error={error}
                decimals={field.prefix === true}
                onValue={(next) => updateField(field.id, next)}
                onBlur={() => markTouched(field.id)}
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
            Your required rate
          </p>

          {outcome?.ok ? (
            <>
              <p
                ref={rateValueRef}
                class="mt-2 flex flex-wrap items-baseline gap-x-2"
              >
                <span class="text-accent-strong font-[450] text-[2.75rem] leading-none tracking-[-0.03em] sm:text-5xl">
                  {formatCurrency(outcome.value.hourlyRateRounded, currency)}
                </span>
                <span class="text-ink-soft text-sm font-medium">per hour</span>
              </p>

              <p class="text-ink-soft mt-3 text-sm leading-relaxed">
                Bill {formatCurrency(outcome.value.requiredAnnualRevenue, currency)} over{' '}
                {formatNumber(outcome.value.billableHoursPerYear)} billable hours to reach your
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
                    {formatNumber(outcome.value.billableHoursPerYear)}
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
