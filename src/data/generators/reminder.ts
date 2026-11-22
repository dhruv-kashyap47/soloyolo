import { validateGeneratorContent } from '@/data/generators/schema';

/**
 * The payment reminder page.
 *
 * The reminders themselves are written in `src/lib/generators/reminder.ts`,
 * so the wording is unit tested rather than typed into an interface.
 */

export const REMINDER_META = {
  title: 'Payment Reminder Generator',
  description:
    'Write a professional payment reminder for an overdue invoice in four tones, then copy it into your email. Free, private and running entirely in your browser.',
  path: '/generators/payment-reminder-generator/',
  eyebrow: 'Document generator',
  intro:
    'Chasing an invoice is easier with the right words. Pick a tone, fill in the details, and copy a reminder that names the invoice, the amount and the date it was due.',
} as const;

export const REMINDER_STEPS = [
  {
    title: 'Pick the tone that fits',
    body: 'Four tones, from a friendly nudge to a final notice. The wording changes completely, not just the sign off, so you can match it to the customer and to how late the invoice is.',
  },
  {
    title: 'Fill in the details',
    body: 'The customer name, the invoice number, the amount and the date it was due. The reminder works out how late the invoice is and says so when it is.',
  },
  {
    title: 'Copy it into your email',
    body: 'The finished message appears as you type. Copy the whole thing, subject line included, and paste it into your email client.',
  },
] as const;

export const REMINDER_FAQ = [
  {
    question: 'Which tone should I use for an invoice that is late?',
    answer:
      'Most people start with professional, which is courteous but clear. Friendly suits a customer you know well and an invoice that is only a few days late. Firm is for an invoice well past its date, and final notice is a last step, not a first one.',
  },
  {
    question: 'How late should an invoice be before I chase it?',
    answer:
      'A few days after the due date is normal, and a week is usually comfortable. If a customer regularly pays late, chasing earlier is a matter of your policy rather than a rule.',
  },
  {
    question: 'Can I add a payment link to the reminder?',
    answer:
      'Yes. Put the link in the payment link field and it appears in the message. Leave the field empty and the reminder asks the customer to reply instead, which is the better route when there is no link to share.',
  },
  {
    question: 'Does the reminder mention fees or debt collectors?',
    answer:
      'The final notice says the account will be passed to a collections service if payment does not arrive. It does not add a late fee or a legal threat, because the tool cannot know that would be accurate for your contract.',
  },
  {
    question: 'Is my customer data private?',
    answer:
      'Yes. The message is written in your browser and nothing is uploaded. The reminder keeps the message fields in this browser so a reload does not lose your draft, and business details are stored only if you choose to keep them. Both stay on your device until you clear them.',
  },
  {
    question: 'Can I edit the message before I send it?',
    answer:
      'Yes, and you should. Copy it into your email and adjust the wording as much as you like. The tool writes a starting point, not a legal letter.',
  },
] as const;

export const REMINDER_NOTES = [
  'A reminder is a message to a customer, not a legal notice. Keep it factual and it stays professional.',
  'Keep a record of every chase you send, with the date. It answers the awkward question later.',
  'This tool is not legal or debt collection advice, and it does not know the terms of your contract.',
] as const;

validateGeneratorContent('payment reminder generator', {
  meta: REMINDER_META,
  steps: REMINDER_STEPS,
  faqs: REMINDER_FAQ,
  notes: REMINDER_NOTES,
});
