import { formatDate } from '@/lib/formatting/date';
import { formatCurrency } from '@/lib/formatting/currency';
import { formatNumber, formatRate } from '@/lib/formatting/number';
import type { DocumentModel } from '@/lib/generators/document';
import type { DocumentTotals } from '@/lib/generators/totals';

/**
 * A plain text version of a document.
 *
 * Copying this into an email is the second most common thing a person does
 * with an invoice after printing it, so the text carries the same figures the
 * sheet does, in the same order, with the same rounding.
 */
export function documentSummary(model: DocumentModel, totals: DocumentTotals): string {
  const currency = model.currency;
  const lines: string[] = [];

  lines.push(`${model.title}${model.number ? ` ${model.number}` : ''}`);
  lines.push('');

  if (model.business.name) {
    lines.push('From');
    lines.push(model.business.name);
    for (const line of model.business.address
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)) {
      lines.push(line);
    }
    if (model.business.email) lines.push(model.business.email);
    if (model.business.phone) lines.push(model.business.phone);
    if (model.business.website) lines.push(model.business.website);
    if (model.business.taxId) {
      lines.push(`${model.business.taxIdLabel}: ${model.business.taxId}`);
    }
    lines.push('');
  }

  if (model.customer.name || model.customer.company) {
    lines.push(model.kind === 'receipt' ? 'Received from' : 'Bill to');
    if (model.customer.name) lines.push(model.customer.name);
    if (model.customer.company) lines.push(model.customer.company);
    for (const line of model.customer.address
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)) {
      lines.push(line);
    }
    if (model.customer.email) lines.push(model.customer.email);
    lines.push('');
  }

  if (model.kind === 'receipt') {
    if (model.transactionDate) {
      lines.push(`Date: ${formatDate(model.transactionDate, { currency })}`);
    }
    if (model.paymentMethod) lines.push(`Method: ${model.paymentMethod}`);
    lines.push(`Status: ${model.paymentStatus}`);
  } else {
    if (model.issueDate) lines.push(`Issued: ${formatDate(model.issueDate, { currency })}`);
    if (model.kind === 'invoice' && model.supplyDate) {
      lines.push(`Supply date: ${formatDate(model.supplyDate, { currency })}`);
    }
    if (model.kind === 'invoice' && model.dueDate) {
      lines.push(`Due: ${formatDate(model.dueDate, { currency })}`);
    }
    if (model.kind === 'quote' && model.expiryDate) {
      lines.push(`Valid until: ${formatDate(model.expiryDate, { currency })}`);
    }
  }

  if (model.paymentTerms) lines.push(`Terms: ${model.paymentTerms}`);
  lines.push('');

  for (const line of totals.lines) {
    const quantity = formatNumber(line.quantity, { decimals: line.quantity.isInteger() ? 0 : 2 });
    lines.push(
      `${line.description}: ${quantity} x ${formatCurrency(line.unitPrice, currency)} = ${formatCurrency(line.gross, currency)}`,
    );
  }

  if (totals.lines.length > 0) lines.push('');

  lines.push(`Subtotal: ${formatCurrency(totals.subtotal, currency)}`);

  if (totals.lineDiscountTotal.greaterThan(0)) {
    lines.push(`Discount: ${formatCurrency(totals.lineDiscountTotal, currency)}`);
  }

  if (totals.documentDiscountTotal.greaterThan(0)) {
    lines.push(
      `Discount (${formatRate(model.discountPercent)}%): ${formatCurrency(totals.documentDiscountTotal, currency)}`,
    );
  }

  for (const group of totals.taxGroups) {
    lines.push(
      `${model.taxLabel} ${formatRate(group.ratePercent)}%: ${formatCurrency(group.amount, currency)}`,
    );
  }

  lines.push(`Total: ${formatCurrency(totals.total, currency)}`);

  if (totals.amountPaid.greaterThan(0)) {
    lines.push(`Paid: ${formatCurrency(totals.amountPaid, currency)}`);
  }

  if (totals.amountDue.greaterThan(0) && model.kind !== 'quote') {
    lines.push(
      `${model.kind === 'receipt' ? 'Balance due' : 'Amount due'}: ${formatCurrency(totals.amountDue, currency)}`,
    );
  }

  if (model.notes) {
    lines.push('');
    lines.push('Notes');
    lines.push(model.notes);
  }

  if (model.paymentDetails) {
    lines.push('');
    lines.push('Payment details');
    lines.push(model.paymentDetails);
  }

  return lines.join('\n');
}
