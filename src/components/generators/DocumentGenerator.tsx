import { useMemo, useState } from 'preact/hooks';

import NumberField from '@/components/forms/NumberField';
import SelectField from '@/components/forms/SelectField';
import TextField from '@/components/forms/TextField';
import DocumentPreview from '@/components/generators/DocumentPreview';
import LineItemsEditor from '@/components/generators/LineItemsEditor';
import LogoUpload from '@/components/generators/LogoUpload';
import { useBusinessProfile } from '@/components/generators/useBusinessProfile';
import { useDocumentForm } from '@/components/generators/useDocumentForm';
import { useGeneratorReady } from '@/components/generators/useGeneratorReady';
import {
  COUNTRIES,
  getCountryConfig,
  lineTaxForLabel,
  taxIdLabelFor,
  type CountryCode,
} from '@/lib/countries';
import { applyCountryToDraft, relabelLineTax } from '@/lib/countries/draft';
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  resolveDocument,
  type DocumentDraft,
  type DocumentKind,
  type TaxLabel,
} from '@/lib/generators/document';
import { nextDocumentNumber } from '@/lib/generators/numbering';
import { documentSummary } from '@/lib/generators/summary';
import { fieldLabel } from '@/lib/generators/validation';
import { CURRENCIES, currencyLocale, currencySymbol, formatCurrency } from '@/lib/formatting/currency';

export interface DocumentGeneratorProps {
  kind: DocumentKind;
  initialValues: DocumentDraft;
  /** The word used for the document in the action button. */
  actionLabel: string;
  /** A country page keeps its market fixed so the copy and the sheet agree. */
  countryLocked?: boolean;
  /** A dedicated tax invoice page keeps the mode on, so the title cannot drift. */
  taxInvoiceLocked?: boolean;
}

interface FieldsetProps {
  title: string;
  hint?: string;
  children: preact.ComponentChildren;
}

/** A group of fields. The legend is the group's name for assistive technology. */
function Fieldset({ title, hint, children }: FieldsetProps) {
  return (
    <fieldset class="border-0 p-0">
      <legend class="text-ink text-[0.9375rem] font-semibold">{title}</legend>
      {hint && <p class="text-muted mt-1 text-xs leading-relaxed">{hint}</p>}
      <div class="mt-3.5">{children}</div>
    </fieldset>
  );
}

/**
 * The document generator.
 *
 * One component drives all three documents. The differences between an
 * invoice, a quote and a receipt are small enough to describe with a few
 * conditionals, and sharing the shell means the totals, the preview, the
 * print flow and the accessibility work are identical on all three.
 *
 * The layout is a form on the left and the document itself on the right.
 * On a narrow screen the two swap places through a two button switch, so a
 * phone shows one thing at a time instead of a squashed document under a
 * long form.
 */
export default function DocumentGenerator({
  kind,
  initialValues,
  actionLabel,
  countryLocked = false,
  taxInvoiceLocked = false,
}: DocumentGeneratorProps) {
  const [tab, setTab] = useState<'form' | 'preview'>('form');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [logoError, setLogoError] = useState('');

  const form = useDocumentForm({ kind, initialValues });
  const {
    values,
    setValue,
    setValues,
    setItemValue,
    markTouched,
    errorFor,
    validation,
    submitted,
  } = form;

  const countryConfig = getCountryConfig(values.country);

  const profile = useBusinessProfile(values, setValue, setValues, {
    lockedCountry: countryLocked ? values.country : undefined,
  });

  useGeneratorReady();

  const { model, totals } = useMemo(() => resolveDocument(values, kind), [values, kind]);

  const currency = values.currency;

  const series = kind === 'quote' ? 'quote' : kind === 'receipt' ? 'receipt' : 'invoice';

  function suggestNextNumber() {
    const next = nextDocumentNumber(series, values.number);
    setValue('number', next);
  }

  /**
   * One country change moves the currency, the tax name, the registration
   * label and every line's rate together. A US invoice must never keep a 20%
   * VAT line because the visitor changed the country after typing.
   */
  function selectCountry(next: CountryCode) {
    setValues((current) => applyCountryToDraft(current, next));
  }

  function selectTaxLabel(next: TaxLabel) {
    setValues((current) => {
      const config = getCountryConfig(current.country);
      const previousRate = lineTaxForLabel(config, current.taxLabel);
      const nextRate = lineTaxForLabel(config, next);

      return {
        ...current,
        taxLabel: next,
        businessTaxIdLabel: taxIdLabelFor(config, next),
        items: relabelLineTax(current.items, previousRate, nextRate),
      };
    });
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(documentSummary(model, totals));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    window.setTimeout(() => setCopyState('idle'), 2500);
  }

  /**
   * Prints from the preview toolbar.
   *
   * It validates like the form's own button, and brings the details back into
   * view first so the error summary has somewhere to be seen on a phone.
   */
  function printFromToolbar() {
    if (!validation.ok) setTab('form');
    form.submit();
  }

  const liveMessage = `Total ${formatCurrency(totals.total, currency)}.`;

  // The first line item is where a "line items" problem is fixed, so the
  // error summary links there rather than at a container that cannot take
  // focus.
  const firstItemId = values.items[0]?.id;

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
          Preview
        </button>
      </div>

      {/* Outside the panes: a live region inside a hidden pane is silent. */}
      <span role="status" aria-live="polite" class="sr-only">
        {liveMessage}
      </span>

      <div class="generator-grid" data-tab={tab}>
        <form
          class="generator-form no-print"
          onSubmit={form.handleSubmit}
          noValidate
          aria-labelledby="generator-form-heading"
        >
          <h2 id="generator-form-heading" class="sr-only">
            Document details
          </h2>

          {submitted && !validation.ok && (
            <div
              ref={form.summaryRef}
              tabIndex={-1}
              role="alert"
              class="bg-danger-soft border-danger-line rounded-lg border px-4 py-3 outline-none"
            >
              <p class="text-danger text-sm font-semibold">
                There{' '}
                {validation.invalidFields.length === 1
                  ? 'is 1 thing'
                  : `are ${validation.invalidFields.length} things`}{' '}
                to fix before this document can be printed.
              </p>
              <ul class="mt-2 grid gap-1.5">
                {validation.invalidFields.map((field) => (
                  <li>
                    <a
                      href={`#${fieldId(field, firstItemId)}`}
                      class="text-danger hover:text-danger/80 text-sm underline underline-offset-2"
                      onClick={(event) => {
                        event.preventDefault();
                        focusField(field, firstItemId);
                      }}
                    >
                      {fieldLabel(field)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div class="border-line border-t pt-6">
            <Fieldset
              title="Country and tax"
              hint={
                countryLocked
                  ? `This page follows the ${countryConfig.name} invoice rules. Use the general invoice generator to change country.`
                  : 'Country sets the currency, the tax name, the registration label and the line tax rate.'
              }
            >
              <div class="grid gap-4">
                <SelectField
                  id="country"
                  name="country"
                  label="Country"
                  hint="The market whose invoice rules this document follows."
                  hintId="country-hint"
                  errorId="country-error"
                  value={values.country}
                  options={COUNTRIES.map((country) => ({
                    value: country.code,
                    label: country.name,
                  }))}
                  disabled={countryLocked}
                  onValue={(value) => {
                    if (!countryLocked) selectCountry(value as CountryCode);
                  }}
                  onBlur={() => markTouched('country')}
                />

                <div class="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    id="currency"
                    name="currency"
                    label="Currency"
                    hint="This changes how the amounts are written, not what they are."
                    hintId="currency-hint"
                    errorId="currency-error"
                    value={currency}
                    options={CURRENCIES.map((entry) => ({ value: entry.code, label: entry.label }))}
                    onValue={(value) => setValue('currency', value as typeof currency)}
                    onBlur={() => markTouched('currency')}
                  />

                  <SelectField
                    id="taxLabel"
                    name="taxLabel"
                    label="Tax name"
                    hint="How you call tax where you work."
                    hintId="taxLabel-hint"
                    errorId="taxLabel-error"
                    value={values.taxLabel}
                    options={countryConfig.tax.labels.map((label) => ({ value: label, label }))}
                    onValue={(value) => selectTaxLabel(value as TaxLabel)}
                    onBlur={() => markTouched('taxLabel')}
                  />
                </div>

                {kind === 'invoice' && countryConfig.invoice.taxSplit && (
                  <SelectField
                    id="taxSplitMode"
                    name="taxSplitMode"
                    label={countryConfig.invoice.taxSplit.label}
                    hint={countryConfig.invoice.taxSplit.hint}
                    hintId="taxSplitMode-hint"
                    errorId="taxSplitMode-error"
                    value={values.taxSplitMode}
                    options={countryConfig.invoice.taxSplit.modes.map((mode) => ({
                      value: mode.id,
                      label: mode.label,
                    }))}
                    onValue={(value) =>
                      setValue('taxSplitMode', value as typeof values.taxSplitMode)
                    }
                    onBlur={() => markTouched('taxSplitMode')}
                  />
                )}

                {kind === 'invoice' && countryConfig.invoice.placeOfSupply && (
                  <SelectField
                    id="placeOfSupply"
                    name="placeOfSupply"
                    label={countryConfig.invoice.placeOfSupply.label}
                    hint={countryConfig.invoice.placeOfSupply.hint}
                    hintId="placeOfSupply-hint"
                    errorId="placeOfSupply-error"
                    value={values.placeOfSupply}
                    options={[
                      { value: '', label: 'Choose a state or union territory' },
                      ...countryConfig.invoice.placeOfSupply.options,
                    ]}
                    onValue={(value) => setValue('placeOfSupply', value)}
                    onBlur={() => markTouched('placeOfSupply')}
                  />
                )}

                {kind === 'invoice' && countryConfig.tax.supportsTaxInvoice && (
                  <div class="border-line bg-surface/60 rounded-lg border p-3.5">
                    <label class="flex min-h-11 cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        class="accent-accent mt-0.5 h-4 w-4 shrink-0"
                        checked={values.taxInvoice}
                        disabled={taxInvoiceLocked}
                        onChange={(event) => setValue('taxInvoice', event.currentTarget.checked)}
                      />
                      <span class="text-ink-soft text-sm leading-relaxed">
                        {countryConfig.tax.taxInvoiceLabel}
                        <span class="text-muted block text-xs">
                          {countryConfig.tax.taxInvoiceHint}
                        </span>
                      </span>
                    </label>
                  </div>
                )}

                <p class="text-muted text-xs leading-relaxed">{countryConfig.tax.rateHint}</p>
              </div>
            </Fieldset>
          </div>

          <div class="border-line mt-6 border-t pt-6">
            <Fieldset
              title="Your business"
              hint="These details go at the top of the document. They are never uploaded."
            >
              <div class="grid gap-4">
                <TextField
                  id="businessName"
                  name="businessName"
                  label="Business name"
                  hint="The name your customer knows you by."
                  hintId="businessName-hint"
                  errorId="businessName-error"
                  value={values.businessName}
                  placeholder="Northwind Studio"
                  error={errorFor('businessName')}
                  autocomplete="organization"
                  onValue={(value) => setValue('businessName', value)}
                  onBlur={() => markTouched('businessName')}
                />

                <TextField
                  id="businessAddress"
                  name="businessAddress"
                  label="Address"
                  hint="One line per line of the address."
                  hintId="businessAddress-hint"
                  errorId="businessAddress-error"
                  value={values.businessAddress}
                  placeholder={countryConfig.invoice.businessAddressPlaceholder}
                  multiline
                  rows={3}
                  error={errorFor('businessAddress')}
                  onValue={(value) => setValue('businessAddress', value)}
                  onBlur={() => markTouched('businessAddress')}
                />

                <div class="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="businessEmail"
                    name="businessEmail"
                    label="Email"
                    hintId="businessEmail-hint"
                    errorId="businessEmail-error"
                    value={values.businessEmail}
                    placeholder="hello@northwind.test"
                    type="email"
                    error={errorFor('businessEmail')}
                    onValue={(value) => setValue('businessEmail', value)}
                    onBlur={() => markTouched('businessEmail')}
                  />

                  <TextField
                    id="businessPhone"
                    name="businessPhone"
                    label="Phone"
                    hintId="businessPhone-hint"
                    errorId="businessPhone-error"
                    value={values.businessPhone}
                    placeholder="0117 000 0000"
                    type="tel"
                    error={errorFor('businessPhone')}
                    onValue={(value) => setValue('businessPhone', value)}
                    onBlur={() => markTouched('businessPhone')}
                  />
                </div>

                <TextField
                  id="businessWebsite"
                  name="businessWebsite"
                  label="Website"
                  hintId="businessWebsite-hint"
                  errorId="businessWebsite-error"
                  value={values.businessWebsite}
                  placeholder="northwind.test"
                  type="url"
                  error={errorFor('businessWebsite')}
                  onValue={(value) => setValue('businessWebsite', value)}
                  onBlur={() => markTouched('businessWebsite')}
                />

                <div class="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    id="businessTaxIdLabel"
                    name="businessTaxIdLabel"
                    label="Registration number type"
                    hint="What your number is called in your country."
                    hintId="businessTaxIdLabel-hint"
                    errorId="businessTaxIdLabel-error"
                    value={values.businessTaxIdLabel}
                    options={countryConfig.tax.registrationLabels.map((label) => ({
                      value: label,
                      label,
                    }))}
                    onValue={(value) =>
                      setValue('businessTaxIdLabel', value as typeof values.businessTaxIdLabel)
                    }
                    onBlur={() => markTouched('businessTaxIdLabel')}
                  />

                  <TextField
                    id="businessTaxId"
                    name="businessTaxId"
                    label={values.businessTaxIdLabel}
                    hint={countryConfig.tax.registrationFormatNote}
                    hintId="businessTaxId-hint"
                    errorId="businessTaxId-error"
                    value={values.businessTaxId}
                    placeholder={countryConfig.invoice.taxIdPlaceholder}
                    error={errorFor('businessTaxId')}
                    onValue={(value) => setValue('businessTaxId', value)}
                    onBlur={() => markTouched('businessTaxId')}
                  />
                </div>

                <LogoUpload
                  logoDataUrl={values.logoDataUrl}
                  onChange={(dataUrl) => setValue('logoDataUrl', dataUrl)}
                  onError={setLogoError}
                />
                {logoError && (
                  <p class="text-danger -mt-2 text-xs" role="alert">
                    {logoError}
                  </p>
                )}

                <div class="border-line bg-surface/60 rounded-lg border p-3.5">
                  <label class="flex min-h-11 cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      class="accent-accent mt-0.5 h-4 w-4 shrink-0"
                      checked={profile.enabled}
                      disabled={!profile.available}
                      onChange={(event) => profile.setEnabled(event.currentTarget.checked)}
                    />
                    <span class="text-ink-soft text-sm leading-relaxed">
                      Keep these details in this browser
                      <span class="text-muted block text-xs">
                        Optional. Stored on this device only, never sent anywhere. Clearing your
                        browser data removes it.
                      </span>
                    </span>
                  </label>

                  {profile.notice && (
                    <p class="text-muted mt-2 text-xs leading-relaxed" role="status">
                      {profile.notice}
                    </p>
                  )}

                  {profile.stored && (
                    <button
                      type="button"
                      class="text-muted hover:text-danger mt-2 min-h-9 text-xs transition-colors"
                      onClick={profile.clear}
                    >
                      Clear the saved details
                    </button>
                  )}
                </div>
              </div>
            </Fieldset>
          </div>

          <div class="border-line mt-6 border-t pt-6">
            <Fieldset title={kind === 'receipt' ? 'Customer' : 'Customer details'}>
              <div class="grid gap-4">
                <TextField
                  id="customerName"
                  name="customerName"
                  label="Customer name"
                  hint="The person the document is for."
                  hintId="customerName-hint"
                  errorId="customerName-error"
                  value={values.customerName}
                  placeholder="Alex Morgan"
                  error={errorFor('customerName')}
                  onValue={(value) => setValue('customerName', value)}
                  onBlur={() => markTouched('customerName')}
                />

                <TextField
                  id="customerCompany"
                  name="customerCompany"
                  label="Company"
                  hint="Optional."
                  hintId="customerCompany-hint"
                  errorId="customerCompany-error"
                  value={values.customerCompany}
                  placeholder="Bright Coffee"
                  error={errorFor('customerCompany')}
                  onValue={(value) => setValue('customerCompany', value)}
                  onBlur={() => markTouched('customerCompany')}
                />

                <TextField
                  id="customerAddress"
                  name="customerAddress"
                  label="Address"
                  hint="One line per line of the address."
                  hintId="customerAddress-hint"
                  errorId="customerAddress-error"
                  value={values.customerAddress}
                  placeholder={countryConfig.invoice.customerAddressPlaceholder}
                  multiline
                  rows={3}
                  error={errorFor('customerAddress')}
                  onValue={(value) => setValue('customerAddress', value)}
                  onBlur={() => markTouched('customerAddress')}
                />

                <TextField
                  id="customerEmail"
                  name="customerEmail"
                  label="Customer email"
                  hint="Optional."
                  hintId="customerEmail-hint"
                  errorId="customerEmail-error"
                  value={values.customerEmail}
                  placeholder="alex@brightcoffee.test"
                  type="email"
                  error={errorFor('customerEmail')}
                  onValue={(value) => setValue('customerEmail', value)}
                  onBlur={() => markTouched('customerEmail')}
                />

                {kind === 'invoice' && countryConfig.invoice.customerTaxId && (
                  <TextField
                    id="customerTaxId"
                    name="customerTaxId"
                    label={countryConfig.invoice.customerTaxId.label}
                    hint={countryConfig.invoice.customerTaxId.hint}
                    hintId="customerTaxId-hint"
                    errorId="customerTaxId-error"
                    value={values.customerTaxId}
                    placeholder={countryConfig.invoice.customerTaxId.placeholder}
                    error={errorFor('customerTaxId')}
                    onValue={(value) => setValue('customerTaxId', value)}
                    onBlur={() => markTouched('customerTaxId')}
                  />
                )}
              </div>
            </Fieldset>
          </div>

          <div class="border-line mt-6 border-t pt-6">
            <Fieldset title={kind === 'receipt' ? 'Receipt details' : 'Document details'}>
              <div class="grid gap-4">
                <div>
                  <TextField
                    id="number"
                    name="number"
                    label={
                      kind === 'quote'
                        ? 'Quote number'
                        : kind === 'receipt'
                          ? 'Receipt number'
                          : 'Invoice number'
                    }
                    hint="Any format you like. The next button counts on from it."
                    hintId="number-hint"
                    errorId="number-error"
                    value={values.number}
                    placeholder={
                      kind === 'quote' ? 'QUO-0001' : kind === 'receipt' ? 'RCT-0001' : 'INV-0001'
                    }
                    error={errorFor('number')}
                    onValue={(value) => setValue('number', value)}
                    onBlur={() => markTouched('number')}
                  />
                  <button
                    type="button"
                    class="text-accent-strong hover:text-accent mt-1 min-h-9 text-xs font-semibold"
                    onClick={suggestNextNumber}
                  >
                    Use the next number
                  </button>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  {kind === 'receipt' ? (
                    <TextField
                      id="transactionDate"
                      name="transactionDate"
                      label="Transaction date"
                      hint="The day the payment was taken."
                      hintId="transactionDate-hint"
                      errorId="transactionDate-error"
                      value={values.transactionDate}
                      type="date"
                      error={errorFor('transactionDate')}
                      onValue={(value) => setValue('transactionDate', value)}
                      onBlur={() => markTouched('transactionDate')}
                    />
                  ) : (
                    <TextField
                      id="issueDate"
                      name="issueDate"
                      label="Issue date"
                      hint="The day you are sending it."
                      hintId="issueDate-hint"
                      errorId="issueDate-error"
                      value={values.issueDate}
                      type="date"
                      error={errorFor('issueDate')}
                      onValue={(value) => setValue('issueDate', value)}
                      onBlur={() => markTouched('issueDate')}
                    />
                  )}

                  {kind === 'invoice' && (
                    <TextField
                      id="dueDate"
                      name="dueDate"
                      label="Due date"
                      hint="When the payment is expected."
                      hintId="dueDate-hint"
                      errorId="dueDate-error"
                      value={values.dueDate}
                      type="date"
                      error={errorFor('dueDate')}
                      onValue={(value) => setValue('dueDate', value)}
                      onBlur={() => markTouched('dueDate')}
                    />
                  )}

                  {kind === 'invoice' && countryConfig.tax.supplyDateField && (
                    <TextField
                      id="supplyDate"
                      name="supplyDate"
                      label="Supply date"
                      hint="The date the work was supplied. It is usually the issue date."
                      hintId="supplyDate-hint"
                      errorId="supplyDate-error"
                      value={values.supplyDate}
                      type="date"
                      error={errorFor('supplyDate')}
                      onValue={(value) => setValue('supplyDate', value)}
                      onBlur={() => markTouched('supplyDate')}
                    />
                  )}

                  {kind === 'quote' && (
                    <TextField
                      id="expiryDate"
                      name="expiryDate"
                      label="Valid until"
                      hint="The date the quote stops being an offer."
                      hintId="expiryDate-hint"
                      errorId="expiryDate-error"
                      value={values.expiryDate}
                      type="date"
                      error={errorFor('expiryDate')}
                      onValue={(value) => setValue('expiryDate', value)}
                      onBlur={() => markTouched('expiryDate')}
                    />
                  )}
                </div>

                <NumberField
                  id="discountPercent"
                  name="discountPercent"
                  label="Discount on the whole document"
                  hint="Applied across the line items before tax."
                  hintId="discountPercent-hint"
                  errorId="discountPercent-error"
                  value={values.discountPercent}
                  locale={currencyLocale(currency)}
                  placeholder="0"
                  suffix="%"
                  error={errorFor('discountPercent')}
                  decimals
                  onValue={(value) => setValue('discountPercent', value)}
                  onBlur={() => markTouched('discountPercent')}
                />

                {kind === 'receipt' && (
                  <>
                    <div class="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        id="paymentMethod"
                        name="paymentMethod"
                        label="Payment method"
                        hint="How the customer paid."
                        hintId="paymentMethod-hint"
                        errorId="paymentMethod-error"
                        value={values.paymentMethod}
                        options={PAYMENT_METHODS.map((method) => ({
                          value: method,
                          label: method,
                        }))}
                        onValue={(value) => setValue('paymentMethod', value)}
                        onBlur={() => markTouched('paymentMethod')}
                      />

                      <SelectField
                        id="paymentStatus"
                        name="paymentStatus"
                        label="Payment status"
                        hint="Shown on the receipt."
                        hintId="paymentStatus-hint"
                        errorId="paymentStatus-error"
                        value={values.paymentStatus}
                        options={PAYMENT_STATUSES.map((status) => ({
                          value: status,
                          label: status,
                        }))}
                        onValue={(value) =>
                          setValue('paymentStatus', value as typeof values.paymentStatus)
                        }
                        onBlur={() => markTouched('paymentStatus')}
                      />
                    </div>

                    <NumberField
                      id="amountPaid"
                      name="amountPaid"
                      label="Amount received"
                      hint="Leave it empty if the customer paid everything."
                      hintId="amountPaid-hint"
                      errorId="amountPaid-error"
                      value={values.amountPaid}
                      locale={currencyLocale(currency)}
                      placeholder="0"
                      prefix={currencySymbol(currency)}
                      error={errorFor('amountPaid')}
                      decimals
                      onValue={(value) => setValue('amountPaid', value)}
                      onBlur={() => markTouched('amountPaid')}
                    />
                  </>
                )}

                {kind !== 'receipt' && (
                  <TextField
                    id="paymentTerms"
                    name="paymentTerms"
                    label="Payment terms"
                    hint="For example: due within 14 days, 50% on deposit."
                    hintId="paymentTerms-hint"
                    errorId="paymentTerms-error"
                    value={values.paymentTerms}
                    placeholder={countryConfig.invoice.paymentTerms}
                    error={errorFor('paymentTerms')}
                    onValue={(value) => setValue('paymentTerms', value)}
                    onBlur={() => markTouched('paymentTerms')}
                  />
                )}
              </div>
            </Fieldset>
          </div>

          <div class="border-line mt-6 border-t pt-6">
            <Fieldset
              title="Line items"
              hint="Each line is a charge. A discount or tax rate on a line is optional."
            >
              <LineItemsEditor
                items={values.items}
                currencySymbol={currencySymbol(currency)}
                locale={currencyLocale(currency)}
                hsn={kind === 'invoice' ? countryConfig.invoice.hsnCode : undefined}
                errorFor={errorFor}
                markTouched={markTouched}
                onItemValue={setItemValue}
                onRemove={form.removeItem}
                onAdd={form.addItem}
              />
            </Fieldset>
          </div>

          <div class="border-line mt-6 border-t pt-6">
            <Fieldset title="Notes and payment details">
              <div class="grid gap-4">
                <TextField
                  id="notes"
                  name="notes"
                  label="Notes"
                  hint="A thank you, a reference, or anything else worth printing."
                  hintId="notes-hint"
                  errorId="notes-error"
                  value={values.notes}
                  placeholder="Thank you for your business."
                  multiline
                  rows={3}
                  error={errorFor('notes')}
                  onValue={(value) => setValue('notes', value)}
                  onBlur={() => markTouched('notes')}
                />

                <TextField
                  id="paymentDetails"
                  name="paymentDetails"
                  label="Payment details"
                  hint="Bank details, a payment link, or where to send the money."
                  hintId="paymentDetails-hint"
                  errorId="paymentDetails-error"
                  value={values.paymentDetails}
                  placeholder={countryConfig.invoice.paymentDetailsPlaceholder}
                  multiline
                  rows={3}
                  error={errorFor('paymentDetails')}
                  onValue={(value) => setValue('paymentDetails', value)}
                  onBlur={() => markTouched('paymentDetails')}
                />
              </div>
            </Fieldset>
          </div>

          <div class="border-line mt-6 flex flex-wrap items-center gap-3 border-t pt-6">
            <button type="submit" class="btn btn-primary">
              {actionLabel}
            </button>
            <button type="button" class="btn btn-secondary" onClick={form.reset}>
              Reset
            </button>
          </div>
        </form>

        <div class="generator-preview">
          <div class="generator-toolbar no-print">
            <p class="text-muted text-xs leading-relaxed">
              This is the document. It prints exactly as it looks here.
            </p>
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn-secondary" onClick={printFromToolbar}>
                Print
              </button>
              <button type="button" class="btn btn-secondary" onClick={copySummary}>
                Copy
              </button>
            </div>
          </div>

          <DocumentPreview model={model} totals={totals} />

          <p role="status" aria-live="polite" class="text-accent-strong no-print mt-3 text-sm">
            {copyState === 'copied' && 'Copied as text.'}
            {copyState === 'failed' && 'Copy unavailable, select the text instead.'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The id of the field a summary link points at.
 *
 * `items` is the "no line item has a description" error: it has no field of
 * its own, so the link goes to the first line's description, which is where
 * the visitor fixes it.
 */
function fieldId(field: string, firstItemId: string | undefined): string {
  if (field === 'items') return firstItemId ? `${firstItemId}-description` : 'item-1-description';

  if (field.startsWith('item.')) {
    const [, itemId, name] = field.split('.');
    if (name === 'description') return `${itemId}-description`;
    if (name === 'unitPrice') return `${itemId}-unit-price`;
    if (name === 'discountPercent') return `${itemId}-discount`;
    if (name === 'taxPercent') return `${itemId}-tax`;
    if (name === 'hsnCode') return `${itemId}-hsn`;
    return `${itemId}-${name}`;
  }

  return field;
}

/** Moves the focus to a field, the way a link to it would. */
function focusField(field: string, firstItemId: string | undefined): void {
  const element = document.getElementById(fieldId(field, firstItemId));
  if (!element) return;
  element.focus();
  element.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
