import type Decimal from 'decimal.js';

import { formatDate } from '@/lib/formatting/date';
import { formatCurrency } from '@/lib/formatting/currency';
import { formatNumber, formatRate } from '@/lib/formatting/number';
import type { DocumentModel } from '@/lib/generators/document';
import type { DocumentTotals } from '@/lib/generators/totals';

export interface DocumentPreviewProps {
  model: DocumentModel;
  totals: DocumentTotals;
}

/** A quantity reads better without decimals when it is a whole number. */
function formatQuantity(value: Decimal): string {
  return formatNumber(value, { decimals: value.isInteger() ? 0 : 2 });
}

function addressLines(address: string): string[] {
  return address
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** The tax name with its rate, for example "VAT 20%". */
function taxGroupLabel(taxLabel: string, ratePercent: Decimal): string {
  return `${taxLabel} ${formatRate(ratePercent)}%`;
}

/**
 * The document preview.
 *
 * This is the artefact itself, not a picture of it: the same element is
 * printed, so a visitor who checks the preview has checked the document.
 * Every figure comes from the totals engine, and the parts on screen add up
 * to the total because the engine makes them add up.
 */
export default function DocumentPreview({ model, totals }: DocumentPreviewProps) {
  const currency = model.currency;
  const isReceipt = model.kind === 'receipt';

  const metaRows: { label: string; value: string }[] = [];

  if (isReceipt) {
    metaRows.push({ label: 'Date', value: formatDate(model.transactionDate, { currency }) });
  } else {
    metaRows.push({ label: 'Issued', value: formatDate(model.issueDate, { currency }) });
  }

  if (model.kind === 'invoice' && model.dueDate) {
    metaRows.push({ label: 'Due', value: formatDate(model.dueDate, { currency }) });
  }

  if (model.kind === 'quote' && model.expiryDate) {
    metaRows.push({ label: 'Valid until', value: formatDate(model.expiryDate, { currency }) });
  }

  if (isReceipt && model.paymentMethod) {
    metaRows.push({ label: 'Method', value: model.paymentMethod });
  }

  const statusLabel = model.paymentStatus.toUpperCase();

  return (
    <article class="sheet" aria-label={`${model.title} preview`}>
      <header class="sheet-head">
        <div class="sheet-from">
          {model.business.logoDataUrl ? (
            <img class="sheet-logo" src={model.business.logoDataUrl} alt="" />
          ) : null}
          <div class="sheet-from-text">
            <p class="sheet-brand">{model.business.name || 'Your business name'}</p>
            {addressLines(model.business.address).length > 0 && (
              <address class="sheet-contact">
                {addressLines(model.business.address).map((line) => (
                  <span>{line}</span>
                ))}
              </address>
            )}
            {model.business.email && <span class="sheet-contact">{model.business.email}</span>}
            {model.business.phone && <span class="sheet-contact">{model.business.phone}</span>}
            {model.business.website && <span class="sheet-contact">{model.business.website}</span>}
          </div>
        </div>

        <div class="sheet-titleblock">
          {/* The document's title drawn on the sheet, not a page heading: the
              page already has one h1 and one h2 per section. */}
          <p class="sheet-title">{model.title}</p>
          {model.number && <p class="sheet-number">{model.number}</p>}
          {isReceipt && <p class="sheet-status">{statusLabel}</p>}
          <dl class="sheet-meta">
            {metaRows.map((row) => (
              <div class="sheet-meta-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div class="sheet-parties">
        <section class="sheet-party">
          <p class="sheet-label">From</p>
          <p class="sheet-party-name">{model.business.name || 'Your business name'}</p>
          {model.business.taxId && (
            <p class="sheet-party-line">
              {model.business.taxIdLabel}: {model.business.taxId}
            </p>
          )}
          {model.business.email && <p class="sheet-party-line">{model.business.email}</p>}
          {model.business.phone && <p class="sheet-party-line">{model.business.phone}</p>}
        </section>

        <section class="sheet-party">
          <p class="sheet-label">{isReceipt ? 'Received from' : 'Bill to'}</p>
          <p class="sheet-party-name">{model.customer.name || 'Customer name'}</p>
          {model.customer.company && <p class="sheet-party-line">{model.customer.company}</p>}
          {addressLines(model.customer.address).map((line) => (
            <p class="sheet-party-line">{line}</p>
          ))}
          {model.customer.email && <p class="sheet-party-line">{model.customer.email}</p>}
        </section>
      </div>

      {totals.lines.length > 0 ? (
        <table class="sheet-items">
          <thead>
            <tr>
              <th scope="col">Description</th>
              <th scope="col" class="sheet-num">
                Qty
              </th>
              <th scope="col" class="sheet-num">
                Unit price
              </th>
              <th scope="col" class="sheet-num">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {totals.lines.map((line) => (
              <tr>
                <td>
                  <span class="sheet-item-name">{line.description}</span>
                  {(line.discountPercent.greaterThan(0) || line.taxPercent.greaterThan(0)) && (
                    <span class="sheet-item-note">
                      {line.discountPercent.greaterThan(0) &&
                        `${formatRate(line.discountPercent)}% discount`}
                      {line.discountPercent.greaterThan(0) &&
                        line.taxPercent.greaterThan(0) &&
                        ' · '}
                      {line.taxPercent.greaterThan(0) &&
                        `${model.taxLabel} ${formatRate(line.taxPercent)}%`}
                    </span>
                  )}
                </td>
                <td class="sheet-num">{formatQuantity(line.quantity)}</td>
                <td class="sheet-num">{formatCurrency(line.unitPrice, currency)}</td>
                <td class="sheet-num">{formatCurrency(line.gross, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p class="sheet-empty">Add a line item to see the totals.</p>
      )}

      <div class="sheet-totals">
        <dl>
          <div class="sheet-total-row">
            <dt>Subtotal</dt>
            <dd>{formatCurrency(totals.subtotal, currency)}</dd>
          </div>

          {totals.lineDiscountTotal.greaterThan(0) && (
            <div class="sheet-total-row">
              <dt>Discount</dt>
              <dd>{formatCurrency(totals.lineDiscountTotal, currency)}</dd>
            </div>
          )}

          {totals.documentDiscountTotal.greaterThan(0) && (
            <div class="sheet-total-row">
              <dt>Discount ({formatRate(model.discountPercent)}%)</dt>
              <dd>{formatCurrency(totals.documentDiscountTotal, currency)}</dd>
            </div>
          )}

          {totals.discountTotal.greaterThan(0) && (
            <div class="sheet-total-row">
              <dt>Net</dt>
              <dd>{formatCurrency(totals.netTotal, currency)}</dd>
            </div>
          )}

          {totals.taxGroups.map((group) => (
            <div class="sheet-total-row">
              <dt>{taxGroupLabel(model.taxLabel, group.ratePercent)}</dt>
              <dd>{formatCurrency(group.amount, currency)}</dd>
            </div>
          ))}

          <div class="sheet-total-row sheet-total-row--total">
            <dt>Total</dt>
            <dd>{formatCurrency(totals.total, currency)}</dd>
          </div>

          {isReceipt && totals.amountPaid.greaterThan(0) && (
            <div class="sheet-total-row">
              <dt>Paid</dt>
              <dd>{formatCurrency(totals.amountPaid, currency)}</dd>
            </div>
          )}

          {model.kind !== 'quote' && totals.amountDue.greaterThan(0) && (
            <div class="sheet-total-row sheet-total-row--due">
              <dt>{isReceipt ? 'Balance due' : 'Amount due'}</dt>
              <dd>{formatCurrency(totals.amountDue, currency)}</dd>
            </div>
          )}
        </dl>

        {totals.taxGroups.length > 1 && (
          <table class="sheet-tax">
            <thead>
              <tr>
                <th scope="col">Tax summary</th>
                <th scope="col" class="sheet-num">
                  Net
                </th>
                <th scope="col" class="sheet-num">
                  Tax
                </th>
              </tr>
            </thead>
            <tbody>
              {totals.taxGroups.map((group) => (
                <tr>
                  <td>{taxGroupLabel(model.taxLabel, group.ratePercent)}</td>
                  <td class="sheet-num">{formatCurrency(group.base, currency)}</td>
                  <td class="sheet-num">{formatCurrency(group.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(model.notes || model.paymentDetails || model.paymentTerms) && (
        <footer class="sheet-foot">
          {model.notes && (
            <section class="sheet-foot-block">
              <p class="sheet-label">Notes</p>
              {model.notes.split('\n').map((line) => (
                <p class="sheet-foot-line">{line}</p>
              ))}
            </section>
          )}
          {model.paymentDetails && (
            <section class="sheet-foot-block">
              <p class="sheet-label">Payment details</p>
              {model.paymentDetails.split('\n').map((line) => (
                <p class="sheet-foot-line">{line}</p>
              ))}
            </section>
          )}
          {model.paymentTerms && (
            <section class="sheet-foot-block">
              <p class="sheet-label">Terms</p>
              <p class="sheet-foot-line">{model.paymentTerms}</p>
            </section>
          )}
        </footer>
      )}

      {model.showFooterNote && (
        <p class="sheet-made">
          Created with SoloYolo, a free invoice generator that runs in your browser.
        </p>
      )}
    </article>
  );
}
