import type { DocumentDraft, LineItemDraft } from '@/lib/generators/document';

import { defaultLineTax, getCountryConfig, type CountryCode } from '@/lib/countries';
import { addDays } from '@/lib/formatting/date';

/**
 * Applies a country to a draft in one step.
 *
 * The currency, the tax name, the registration label and each line's tax rate
 * move together, so a visitor who switches market never leaves a 20% VAT line
 * on a US invoice. The country page and the saved profile both use this, which
 * keeps the two paths from drifting apart.
 */
/**
 * Moves a line rate when the tax name changes.
 *
 * Only a line still on the previous default (or an empty line) follows the
 * new name. A zero-rate or a hand-entered 15% HST line stays where the visitor
 * put it, so changing GST to HST does not turn a mixed invoice into one rate.
 */
export function relabelLineTax(
  items: readonly LineItemDraft[],
  previousRate: string,
  nextRate: string,
): LineItemDraft[] {
  return items.map((item) => {
    const rate = item.taxPercent.trim();
    if (rate === '' || rate === previousRate) return { ...item, taxPercent: nextRate };
    return item;
  });
}

export function applyCountryToDraft(
  draft: DocumentDraft,
  code: CountryCode,
  options: { resetLineTax?: boolean } = {},
): DocumentDraft {
  const config = getCountryConfig(code);
  const previous = getCountryConfig(draft.country);
  const resetLineTax = options.resetLineTax ?? true;
  const lineTax = defaultLineTax(config);

  /*
   * Country-specific fields move together. A UK VAT number left under a US EIN
   * label would be worse than an empty field, and a 14 day term left on a Net
   * 30 market is a contradiction. Each default is replaced only when the draft
   * still holds the previous country's default, so a deliberate choice stays.
   */
  let dueDate = draft.dueDate;
  if (dueDate.trim() !== '' && dueDate === addDays(draft.issueDate, previous.invoice.dueDays)) {
    dueDate = addDays(draft.issueDate, config.invoice.dueDays);
  }

  return {
    ...draft,
    country: code,
    currency: config.currency,
    taxLabel: config.tax.label,
    businessTaxId: '',
    businessTaxIdLabel: config.tax.registrationLabel,
    taxInvoice: config.tax.supportsTaxInvoice ? draft.taxInvoice : false,
    dueDate,
    supplyDate: config.tax.supplyDateField ? draft.supplyDate || draft.issueDate : '',
    paymentTerms:
      draft.paymentTerms.trim() === previous.invoice.paymentTerms
        ? config.invoice.paymentTerms
        : draft.paymentTerms,
    paymentDetails:
      draft.paymentDetails.trim() === previous.invoice.paymentDetails
        ? config.invoice.paymentDetails
        : draft.paymentDetails,
    items: resetLineTax
      ? draft.items.map((item) => ({ ...item, taxPercent: lineTax }))
      : draft.items,
  };
}
