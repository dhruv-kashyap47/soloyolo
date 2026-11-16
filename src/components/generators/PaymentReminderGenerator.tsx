import { useMemo, useState } from 'preact/hooks';

import Decimal from 'decimal.js';

import NumberField from '@/components/forms/NumberField';
import SelectField from '@/components/forms/SelectField';
import TextField from '@/components/forms/TextField';
import { useGeneratorReady } from '@/components/generators/useGeneratorReady';
import { daysBetween, todayIso } from '@/lib/formatting/date';
import { CURRENCIES, currencySymbol } from '@/lib/formatting/currency';
import {
  buildReminder,
  REMINDER_TONES,
  REMINDER_TONE_LABELS,
  REMINDER_TONE_SUMMARIES,
  type ReminderTone,
} from '@/lib/generators/reminder';
import { parseAmountInput } from '@/lib/validation/amount';

interface ReminderFields {
  tone: ReminderTone;
  customerName: string;
  invoiceNumber: string;
  amountDue: string;
  currency: string;
  dueDate: string;
  paymentLink: string;
  businessName: string;
}

const INITIAL: ReminderFields = {
  tone: 'professional',
  customerName: 'Alex Morgan',
  invoiceNumber: 'INV-0042',
  amountDue: '1440.00',
  currency: 'GBP',
  dueDate: '',
  paymentLink: 'https://northwind.studio/pay/INV-0042',
  businessName: 'Northwind Studio',
};

/**
 * The payment reminder generator.
 *
 * The message is written by the reminder engine, not by this interface, so
 * the wording is the same every time and is covered by unit tests. The
 * preview is a real document, printed on the same paper as an invoice.
 */
export default function PaymentReminderGenerator() {
  const [fields, setFields] = useState<ReminderFields>(INITIAL);
  const [tab, setTab] = useState<'form' | 'preview'>('form');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useGeneratorReady();

  function update<K extends keyof ReminderFields>(key: K, value: ReminderFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setCopyState('idle');
  }

  const currency = (
    CURRENCIES.some((entry) => entry.code === fields.currency) ? fields.currency : 'USD'
  ) as (typeof CURRENCIES)[number]['code'];

  const amount = parseAmountInput(fields.amountDue);

  const reminder = useMemo(() => {
    const days = fields.dueDate ? (daysBetween(fields.dueDate, todayIso()) ?? 0) : 0;

    return buildReminder({
      tone: fields.tone,
      customerName: fields.customerName,
      invoiceNumber: fields.invoiceNumber,
      amountDue: amount ?? new Decimal(0),
      currency,
      dueDate: fields.dueDate,
      paymentLink: fields.paymentLink,
      businessName: fields.businessName,
      daysOverdue: days,
    });
  }, [fields, amount, currency]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    window.setTimeout(() => setCopyState('idle'), 2500);
  }

  const paragraphs = reminder.body.split('\n\n');

  return (
    <div class="generator">
      <div class="generator-tabs no-print" role="group" aria-label="Choose what to show">
        <button
          type="button"
          class="generator-tab"
          aria-pressed={tab === 'form'}
          onClick={() => setTab('form')}
        >
          Details
        </button>
        <button
          type="button"
          class="generator-tab"
          aria-pressed={tab === 'preview'}
          onClick={() => setTab('preview')}
        >
          Message
        </button>
      </div>

      <div class="generator-grid" data-tab={tab}>
        <form
          class="generator-form no-print"
          onSubmit={(event) => event.preventDefault()}
          noValidate
        >
          <fieldset class="border-0 p-0">
            <legend class="text-ink text-[0.9375rem] font-semibold">Tone</legend>
            <p class="text-muted mt-1 text-xs leading-relaxed">
              Pick the tone that matches the customer and how late the invoice is.
            </p>

            <div class="mt-3.5 grid gap-2.5 sm:grid-cols-2">
              {REMINDER_TONES.map((tone) => (
                <label
                  class={`border-line hover:border-line-strong flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                    fields.tone === tone ? 'border-accent bg-accent-soft' : 'bg-canvas/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    class="accent-accent mt-0.5 h-4 w-4 shrink-0"
                    value={tone}
                    checked={fields.tone === tone}
                    onChange={() => update('tone', tone)}
                  />
                  <span class="min-w-0">
                    <span class="text-ink block text-sm font-semibold">
                      {REMINDER_TONE_LABELS[tone]}
                    </span>
                    <span class="text-muted mt-0.5 block text-xs leading-relaxed">
                      {REMINDER_TONE_SUMMARIES[tone]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div class="border-line mt-6 border-t pt-6">
            <fieldset class="border-0 p-0">
              <legend class="text-ink text-[0.9375rem] font-semibold">The details</legend>

              <div class="mt-3.5 grid gap-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="customerName"
                    name="customerName"
                    label="Customer name"
                    hint="Who the reminder is for."
                    hintId="customerName-hint"
                    errorId="customerName-error"
                    value={fields.customerName}
                    placeholder="Alex Morgan"
                    onValue={(value) => update('customerName', value)}
                    onBlur={() => undefined}
                  />

                  <TextField
                    id="invoiceNumber"
                    name="invoiceNumber"
                    label="Invoice number"
                    hint="As it appears on the invoice."
                    hintId="invoiceNumber-hint"
                    errorId="invoiceNumber-error"
                    value={fields.invoiceNumber}
                    placeholder="INV-0042"
                    onValue={(value) => update('invoiceNumber', value)}
                    onBlur={() => undefined}
                  />
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="amountDue"
                    name="amountDue"
                    label="Amount due"
                    hint="The total still owed."
                    hintId="amountDue-hint"
                    errorId="amountDue-error"
                    value={fields.amountDue}
                    placeholder="1440.00"
                    prefix={currencySymbol(currency)}
                    decimals
                    onValue={(value) => update('amountDue', value)}
                    onBlur={() => undefined}
                  />

                  <TextField
                    id="dueDate"
                    name="dueDate"
                    label="Due date"
                    hint="The reminder says how late it is."
                    hintId="dueDate-hint"
                    errorId="dueDate-error"
                    value={fields.dueDate}
                    type="date"
                    onValue={(value) => update('dueDate', value)}
                    onBlur={() => undefined}
                  />
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="paymentLink"
                    name="paymentLink"
                    label="Payment link"
                    hint="Optional. Leave it empty to ask them to reply."
                    hintId="paymentLink-hint"
                    errorId="paymentLink-error"
                    value={fields.paymentLink}
                    placeholder="https://example.com/pay/INV-0042"
                    type="url"
                    onValue={(value) => update('paymentLink', value)}
                    onBlur={() => undefined}
                  />

                  <TextField
                    id="businessName"
                    name="businessName"
                    label="Your business name"
                    hint="How you sign off."
                    hintId="businessName-hint"
                    errorId="businessName-error"
                    value={fields.businessName}
                    placeholder="Northwind Studio"
                    onValue={(value) => update('businessName', value)}
                    onBlur={() => undefined}
                  />
                </div>

                <SelectField
                  id="currency"
                  name="currency"
                  label="Currency"
                  hint="This changes how the amount is written, not what it is."
                  hintId="currency-hint"
                  errorId="currency-error"
                  value={currency}
                  options={CURRENCIES.map((entry) => ({ value: entry.code, label: entry.label }))}
                  onValue={(value) => update('currency', value)}
                  onBlur={() => undefined}
                />
              </div>
            </fieldset>
          </div>

          <div class="border-line mt-6 flex flex-wrap items-center gap-3 border-t pt-6">
            <button type="button" class="btn btn-primary" onClick={() => copy(reminder.text)}>
              Copy the message
            </button>
            <button type="button" class="btn btn-secondary" onClick={() => copy(reminder.body)}>
              Copy without the subject
            </button>
          </div>

          <p role="status" aria-live="polite" class="text-accent-strong mt-3 text-sm">
            {copyState === 'copied' && 'Copied. Paste it into your email.'}
            {copyState === 'failed' && 'Copy unavailable, select the text instead.'}
          </p>
        </form>

        <div class="generator-preview">
          <div class="generator-toolbar no-print">
            <p class="text-muted text-xs leading-relaxed">
              The finished message, ready to paste into an email.
            </p>
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn-secondary" onClick={() => window.print()}>
                Print
              </button>
              <button type="button" class="btn btn-secondary" onClick={() => copy(reminder.text)}>
                Copy
              </button>
            </div>
          </div>

          <article class="sheet" aria-label="Payment reminder preview">
            {reminder.subject && <p class="sheet-subject">Subject: {reminder.subject}</p>}

            <div class="sheet-message">
              {paragraphs.map((paragraph) => (
                <p class="sheet-message-line">{paragraph}</p>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
