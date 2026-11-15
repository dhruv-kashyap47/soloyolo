import { useRef, useState } from 'preact/hooks';

import CurrencySelect from '@/components/calculators/CurrencySelect';
import NumberField from '@/components/calculators/NumberField';
import { useCalculatorForm } from '@/components/calculators/useCalculatorForm';
import { useIslandReady } from '@/components/calculators/useIslandReady';
import { calculatePaymentFee } from '@/lib/calculators/paymentFee';
import {
  PAYMENT_FEE_FIELDS,
  validatePaymentFeeForm,
  type PaymentFeeField,
  type PaymentFeeFormValues,
} from '@/lib/calculators/paymentFee.schema';
import { currencySymbol, formatCurrency, type CurrencyCode } from '@/lib/formatting/currency';
import { formatPercent } from '@/lib/formatting/number';

const EXAMPLE_VALUES: PaymentFeeFormValues = {
  amount: '1,000',
  percentFee: '2.9',
  fixedFee: '0.30',
};

const FIELDS: readonly {
  id: PaymentFeeField;
  label: string;
  hint: string;
  kind: 'money' | 'percent';
  suffix?: string;
  placeholder: string;
}[] = [
  {
    id: 'amount',
    label: 'Payment amount',
    hint: 'What the client pays before the processor takes its cut.',
    kind: 'money',
    placeholder: '1000',
  },
  {
    id: 'percentFee',
    label: 'Percentage fee',
    hint: 'The processor’s percentage. Enter it exactly as charged.',
    kind: 'percent',
    suffix: '%',
    placeholder: '2.9',
  },
  {
    id: 'fixedFee',
    label: 'Fixed fee per payment',
    hint: 'The flat part, usually a few cents or pence per transaction.',
    kind: 'money',
    placeholder: '0.30',
  },
];

export default function PaymentFeeCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const form = useCalculatorForm({
    fields: PAYMENT_FEE_FIELDS,
    initialValues: EXAMPLE_VALUES,
    validate: validatePaymentFeeForm,
    onValid: () => resultHeadingRef.current?.focus(),
  });

  const { values, validation, submitted, fieldError, inputRefs } = form;
  const outcome = validation.ok ? calculatePaymentFee(validation.input) : null;

  useIslandReady();

  function updateField(field: PaymentFeeField, value: string) {
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
      `Payment amount: ${formatCurrency(value.amountRounded, currency)}`,
      `Total fee: ${formatCurrency(value.totalFeeRounded, currency)}`,
      `Net received: ${formatCurrency(value.netRounded, currency)}`,
      `Effective rate: ${value.effectivePercent === null ? 'not defined' : formatPercent(value.effectivePercent)}`,
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
      ? `Net received: ${formatCurrency(outcome.value.netRounded, currency)}.`
      : '';

  const effectiveLabel =
    outcome?.ok === true && outcome.value.effectivePercent !== null
      ? formatPercent(outcome.value.effectivePercent)
      : '—';

  const isLoss = outcome?.ok === true && outcome.value.netAmount.isNegative();

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
            Payment and fees
          </p>
          <CurrencySelect id="currency" value={currency} onValue={setCurrency} />
        </div>

        <p class="text-muted mt-2 text-sm">
          Example values are loaded. Use the rates your processor charges you.
        </p>

        {submitted && !validation.ok && (
          <div
            role="alert"
            class="bg-danger-soft text-danger mt-4 rounded-md border border-danger-line px-3 py-2.5 text-sm"
          >
            Check the highlighted fields and try again.
          </div>
        )}

        <div class="mt-5 grid gap-4">
          {FIELDS.map((field) => {
            const error = fieldError(field.id);
            const hintId = `fee-${field.id}-hint`;
            const errorId = `fee-${field.id}-error`;

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
            Calculate fees
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
            What lands in your account
          </p>

          {outcome?.ok ? (
            <>
              <p key={outcome?.ok ? outcome.value.netRounded.toString() : 'empty'} class="result-reveal mt-2 flex flex-wrap items-baseline gap-x-2">
                <span
                  class={`${isLoss ? 'text-danger' : 'text-accent-strong'} font-[450] text-[2.75rem] leading-none tracking-[-0.03em] sm:text-5xl`}
                >
                  {formatCurrency(outcome.value.netRounded, currency)}
                </span>
                <span class="text-ink-soft text-sm font-medium">net</span>
              </p>

              <p class="text-ink-soft mt-3 text-sm leading-relaxed">
                A {formatCurrency(outcome.value.amountRounded, currency)} payment costs{' '}
                {formatCurrency(outcome.value.totalFeeRounded, currency)} in fees, an effective rate
                of {effectiveLabel}.
              </p>

              <dl class="border-accent-line mt-5 border-t">
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Payment amount</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.amountRounded, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Percentage part</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.percentFeeAmount, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Fixed part</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.fixedFee, currency)}
                  </dd>
                </div>
                <div class="border-accent-line flex items-baseline justify-between gap-4 border-b py-2.5">
                  <dt class="text-ink-soft text-sm">Total fee</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {formatCurrency(outcome.value.totalFeeRounded, currency)}
                  </dd>
                </div>
                <div class="flex items-baseline justify-between gap-4 py-2.5">
                  <dt class="text-ink-soft text-sm">Effective rate</dt>
                  <dd class="text-sm font-semibold tabular-nums">
                    {outcome.value.effectivePercent === null
                      ? '—'
                      : formatPercent(outcome.value.effectivePercent)}
                  </dd>
                </div>
              </dl>

              {isLoss && (
                <p class="text-danger mt-4 rounded-md border border-danger-line bg-danger-soft px-3 py-2 text-sm leading-relaxed">
                  The fees are larger than the payment itself. On small transactions the fixed fee
                  dominates: set a minimum payment or absorb the difference deliberately.
                </p>
              )}

              <p class="text-muted mt-3 text-xs leading-relaxed">
                The effective rate includes the fixed fee, which is why it is always higher than the
                headline percentage on small payments.
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
                Enter the payment amount and the rates your processor charges to see what you keep.
              </p>
            </div>
          )}

          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {liveMessage}
          </p>
        </section>

        <p class="text-muted mt-3 px-1 text-xs leading-relaxed">
          Informational estimate only. Chargebacks, refunds, currency conversion and monthly
          processor fees are not included.
        </p>
      </div>
    </div>
  );
}
