import type Decimal from 'decimal.js';

import { formatDate } from '@/lib/formatting/date';
import { formatCurrency, type CurrencyCode } from '@/lib/formatting/currency';

/**
 * Payment reminder copy.
 *
 * Four tones, from a friendly nudge to a final notice. The words are written
 * here, not in the interface, so the same reminder reads the same way every
 * time and can be unit tested. Nothing in this file is legal advice: the
 * firmest tone here still asks for payment politely, because a collection
 * threat that is not accurate is a problem, not a persuader.
 */

export const REMINDER_TONES = ['friendly', 'professional', 'firm', 'final'] as const;
export type ReminderTone = (typeof REMINDER_TONES)[number];

export const REMINDER_TONE_LABELS: Record<ReminderTone, string> = {
  friendly: 'Friendly',
  professional: 'Professional',
  firm: 'Firm',
  final: 'Final notice',
};

export const REMINDER_TONE_SUMMARIES: Record<ReminderTone, string> = {
  friendly: 'Warm and casual. Good for a first chase and a client you know well.',
  professional: 'Neutral and courteous. The default for most overdue invoices.',
  firm: 'Direct and businesslike. For an invoice that is well past due.',
  final: 'A last note before the account is referred elsewhere. Use it once.',
};

export interface ReminderInput {
  tone: ReminderTone;
  customerName: string;
  invoiceNumber: string;
  amountDue: Decimal;
  currency: CurrencyCode;
  /** The day the invoice was due, as `YYYY-MM-DD`. */
  dueDate: string;
  paymentLink: string;
  businessName: string;
  /** How many days the invoice is overdue. Zero or less means it is not yet due. */
  daysOverdue?: number;
}

export interface ReminderResult {
  /** The subject line, or an empty string for the friendly tone. */
  subject: string;
  /** The message body. */
  body: string;
  /** The whole thing, ready to paste. */
  text: string;
}

function greeting(name: string, fallback: string): string {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  return trimmed;
}

function paragraphs(...parts: (string | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join('\n\n');
}

function overduePhrase(days: number): string | undefined {
  if (days <= 0) return undefined;
  if (days === 1) return 'It is now one day past the due date.';
  if (days < 14) return `It is now ${days} days past the due date.`;
  if (days < 60) return `It is now ${Math.round(days / 7)} weeks past the due date.`;
  return `It is now ${Math.round(days / 30)} months past the due date.`;
}

/** Starts a sentence with a capital letter. */
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Writes the reminder.
 *
 * Missing details are handled, not punished: no customer name gives a neutral
 * opening, and no payment link gives an instruction to reply instead. The
 * reminder never states a fee, a debt collector or a legal consequence,
 * because the tool cannot know that is true.
 */
export function buildReminder(input: ReminderInput): ReminderResult {
  const amount = formatCurrency(input.amountDue, input.currency);
  const due = formatDate(input.dueDate, { currency: input.currency });
  const invoice = input.invoiceNumber.trim();
  const business = input.businessName.trim();
  const link = input.paymentLink.trim();
  const name = input.customerName.trim();
  const days = input.daysOverdue ?? 0;

  const invoicePhrase = invoice ? `invoice ${invoice} for ${amount}` : `the amount of ${amount}`;

  // Two ways to say the same date, so each sentence can be read naturally.
  const dueWhen = due ? `, due on ${due}` : '';
  const dueAnd = due ? ` was due on ${due} and` : '';
  const late = overduePhrase(days);

  const payLine = link
    ? `You can pay it here: ${link}`
    : 'You can pay it by replying to this message, or through the usual bank transfer details.';

  let subject = '';
  let body = '';

  switch (input.tone) {
    case 'friendly': {
      body = paragraphs(
        `Hi ${greeting(name, 'there')},`,
        `A quick note about ${invoicePhrase}${dueWhen}.`,
        late,
        'If it has already been paid, please ignore this message, there is nothing to do.',
        payLine,
        `Thanks for your business${business ? ', and thank you for sorting this one out when you can' : ''}.`,
        'Best,',
      );
      break;
    }

    case 'professional': {
      subject = invoice ? `Payment reminder: invoice ${invoice}` : 'Payment reminder';
      body = paragraphs(
        `Hello ${greeting(name, 'there')},`,
        `${capitalise(invoicePhrase)}${dueAnd} is still outstanding on my account.`,
        late,
        payLine,
        'If the payment is already on the way, reply to this message and I will confirm it on arrival.',
        'Kind regards,',
      );
      break;
    }

    case 'firm': {
      subject = invoice ? `Overdue invoice ${invoice}` : 'Overdue invoice';
      body = paragraphs(
        `Dear ${greeting(name, 'there')},`,
        `${capitalise(invoicePhrase)}${dueAnd} remains unpaid.`,
        late,
        payLine,
        'If you dispute this invoice, reply with the details so we can settle the question quickly.',
        'Regards,',
      );
      break;
    }

    case 'final': {
      subject = invoice ? `Final notice: invoice ${invoice}` : 'Final notice: overdue invoice';
      body = paragraphs(
        'This is a final reminder.',
        `Dear ${greeting(name, 'there')},`,
        `${capitalise(invoicePhrase)}${dueAnd} is still outstanding.`,
        late,
        payLine,
        'If payment is not received within seven days of this message, I will pass the account to a collections service.',
        'Regards,',
      );
      break;
    }
  }

  const closing = business ? [body, business].join('\n') : body;

  return {
    subject,
    body: closing,
    text: subject ? `Subject: ${subject}\n\n${closing}` : closing,
  };
}
