import { useMemo, useRef, useState } from 'preact/hooks';

import CurrencySelect from '@/components/forms/CurrencySelect';
import NumberField from '@/components/forms/NumberField';
import { useCalculatorForm } from '@/components/calculators/useCalculatorForm';
import { useIslandReady } from '@/components/calculators/useIslandReady';
import {
  calculateMarkupMargin,
  type MarkupMarginMode,
} from '@/lib/calculators/markupMargin';
import {
  MARKUP_MARGIN_FIELDS,
  markupMarginFieldsForMode,
  validateMarkupMarginForm,
  type MarkupMarginField,
  type MarkupMarginFormValues,
} from '@/lib/calculators/markupMargin.schema';
import {
  currencyLocale,
  currencySymbol,
  formatCurrency,
  type CurrencyCode,
} from '@/lib/formatting/currency';
import { formatPercent } from '@/lib/formatting/number';
import type Decimal from 'decimal.js';

const EXAMPLE_VALUES: MarkupMarginFormValues = {
  cost: '2,500',
  price: '5,000',
  markupPercent: '100',
  marginPercent: '50',
};

const MODES: readonly { id: MarkupMarginMode; label: string }[] = [
  { id: 'margin', label: 'Margin' },
  { id: 'markup', label: 'Markup' },
  { id: 'price', label: 'Price' },
  { id: 'cost', label: 'Cost' },
];

const SOLVED_LABEL: Record<MarkupMarginMode, string> = {
  margin: 'margin',
  markup: 'markup',
  price: 'price',
  cost: 'cost',
};

interface FieldConfig {
  id: MarkupMarginField;
  label: string;
  hint: string;
  kind: 'money' | 'percent';
  suffix?: string;
  placeholder: string;
}

const FIELDS: Record<MarkupMarginField, FieldConfig> = {
  cost: {
    id: 'cost',
    label: 'Cost',
    hint: 'What the item or project costs you, before any markup.',
    kind: 'money',
    placeholder: '2500',
  },
  price: {
    id: 'price',
    label: 'Price',
    hint: 'What the client pays, excluding tax you collect on their behalf.',
    kind: 'money',
    placeholder: '5000',
  },
  markupPercent: {
    id: 'markupPercent',
    label: 'Markup',
    hint: 'Percent added on top of cost. 100% markup doubles the cost.',
    kind: 'percent',
    suffix: '%',
    placeholder: '100',
  },
  marginPercent: {
    id: 'marginPercent',
    label: 'Margin',
    hint: 'Percent of the price you keep. Must stay below 100.',
    kind: 'percent',
    suffix: '%',
    placeholder: '50',
  },
};

function percentOrDash(value: Decimal | null): string {
  return value === null ? '—' : formatPercent(value);
}

export default function MarkupMarginCalculator() {
  const [mode, setMode] = useState<MarkupMarginMode>('margin');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  // One validator per mode: the pair of required fields changes with the mode.
  const validate = useMemo(
    () => (values: MarkupMarginFormValues) => validateMarkupMarginForm(mode, values),
    [mode],
  );

  const form = useCalculatorForm({
    fields: MARKUP_MARGIN_FIELDS,
    initialValues: EXAMPLE_VALUES,
    validate,
    onValid: () => resultHeadingRef.current?.focus(),
  });

  const { values, validation, submitted, fieldError } = form;
  const outcome = validation.ok ? calculateMarkupMargin(validation.input) : null;

  useIslandReady();

  function selectMode(next: MarkupMarginMode) {
    setMode(next);
    setCopyState('idle');
  }

  function updateField(field: MarkupMarginField, value: string) {
    form.setValue(field, value);
    setCopyState('idle');
  }

  function resetExample() {
    form.replaceValues(EXAMPLE_VALUES);
    setCopyState('idle');
  }

  async function copyResult() {
    if (!outcome?.ok) return;

    const { value } = outcome;
    const lines = [
      `Cost: ${formatCurrency(value.costRounded, currency)}`,
      `Price: ${formatCurrency(value.priceRounded, currency)}`,
      `Profit: ${formatCurrency(value.profitRounded, currency)}`,
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

  const solvedValue =
    outcome?.ok === true
      ? mode === 'margin'
        ? percentOrDash(outcome.value.margin)
        : mode === 'markup'
          ? percentOrDash(outcome.value.markup)
          : mode === 'price'
            ? formatCurrency(outcome.value.priceRounded, currency)
            : formatCurrency(outcome.value.costRounded, currency)
      : '';

  const solvedNoun = SOLVED_LABEL[mode];

  const liveMessage =
    outcome?.ok === true ? `Your ${solvedNoun}: ${solvedValue}.` : '';

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
            What do you want to work out?
          </p>
          <CurrencySelect id="currency" value={currency} onValue={setCurrency} />
        </div>

        <div role="group" aria-label="Value to work out" class="mt-4 flex flex-wrap gap-2">
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
          Enter two numbers; the other two are worked out. Example values are loaded.
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
          {markupMarginFieldsForMode(mode).map((field) => {
            const config = FIELDS[field];
            const error = fieldError(field);
            const hintId = `markup-${field}-hint`;
            const errorId = `markup-${field}-error`;

            return (
              <NumberField
                locale={currencyLocale(currency)}
                id={field}
                name={field}
                label={config.label}
                hint={config.hint}
                hintId={hintId}
                errorId={errorId}
                value={values[field]}
                placeholder={config.placeholder}
                prefix={config.kind === 'money' ? currencySymbol(currency) : undefined}
                suffix={config.suffix}
                error={error}
                decimals
                onValue={(next) => updateField(field, next)}
                onBlur={() => form.markTouched(field)}
                inputRef={(element) => {
                  form.inputRefs.current[field] = element;
                }}
              />
            );
          })}
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" class="btn btn-primary">
            Work it out
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
            Your {solvedNoun}
          </h2>

          {outcome?.ok ? (
            <>
              <p key={solvedValue} class="result-reveal mt-2 flex flex-wrap items-baseline gap-x-2">
                <span class="text-accent-strong font-[450] tabular-nums text-[2.75rem] leading-none tracking-[-0.03em] sm:text-5xl">
                  {solvedValue}
                </span>
                <span class="text-ink-soft text-sm font-medium">
                  {mode === 'margin' || mode === 'markup' ? solvedNoun : ''}
                </span>
              </p>

              <p class="text-ink-soft mt-3 text-sm leading-relaxed">
                Cost {formatCurrency(outcome.value.costRounded, currency)}, price{' '}
                {formatCurrency(outcome.value.priceRounded, currency)}, profit{' '}
                {formatCurrency(outcome.value.profitRounded, currency)}.
              </p>

              <dl class="border-accent-line mt-5 border-t">
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Cost</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.costRounded, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Price</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.priceRounded, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Profit</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.profitRounded, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Markup on cost</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {outcome.value.markup === null ? '—' : formatPercent(outcome.value.markup)}
                  </dd>
                </div>
                <div class="flex items-baseline justify-between gap-4 py-2.5">
                  <dt class="text-ink-soft text-sm">Margin on price</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {outcome.value.margin === null ? '—' : formatPercent(outcome.value.margin)}
                  </dd>
                </div>
              </dl>

              <p class="text-muted mt-3 text-xs leading-relaxed">
                {outcome.value.markup !== null && outcome.value.margin !== null
                  ? `${formatPercent(outcome.value.markup)} markup is a ${formatPercent(outcome.value.margin)} margin. They describe the same profit from different denominators.`
                  : 'A percentage is undefined when its denominator is zero: margin needs a price, markup needs a cost.'}
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
                Enter the two numbers this mode needs to see the rest of the calculation.
              </p>
            </div>
          )}

          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {liveMessage}
          </p>
        </section>

        <p class="text-muted mt-3 px-1 text-xs leading-relaxed">
          Informational estimate only. Tax you collect, income tax and payment fees are not
          included.
        </p>
      </div>
    </div>
  );
}
