import { validateGeneratorContent } from '@/data/generators/schema';

/**
 * The receipt generator page.
 *
 * A receipt is short by design: it records that a payment happened, who
 * paid, how much and when. The document is the compact one, with the status
 * and the method on the face of it.
 */

export const RECEIPT_META = {
  title: 'Receipt Generator',
  description:
    'Issue a clear payment receipt for a completed transaction, with the amount, the method and the date. Free, private and running entirely in your browser.',
  path: '/generators/receipt-generator/',
  eyebrow: 'Document generator',
  intro:
    'Confirm a payment the moment it happens. A short receipt with the amount received, the method and the date, printed from your browser.',
} as const;

export const RECEIPT_STEPS = [
  {
    title: 'Record the payment',
    body: 'Enter the amount you received and how it was paid. The receipt shows the balance still owed, so a part payment is documented properly.',
  },
  {
    title: 'Set the status',
    body: 'Paid, partly paid, pending or refunded. The status is printed at the top of the receipt, where a customer will look for it.',
  },
  {
    title: 'Print it for the customer',
    body: 'A receipt is often handed over on the spot. Print it, or save it as a PDF and send it on afterwards.',
  },
] as const;

export const RECEIPT_FAQ = [
  {
    question: 'Do I need a receipt as well as an invoice?',
    answer:
      'Usually yes, and they answer different questions. The invoice asks for the money and sets out what was bought. The receipt confirms that the money has arrived. Sending one after the other is normal practice.',
  },
  {
    question: 'Can I use a receipt for a part payment?',
    answer:
      'Yes. Enter the amount you actually received and leave the rest of the total outstanding. The receipt then shows the total, the amount received and the balance still due.',
  },
  {
    question: 'What payment methods can I record?',
    answer:
      'Bank transfer, card, cash, cheque, PayPal, Stripe, Square or other. Choose the one that applies and it is printed on the receipt.',
  },
  {
    question: 'Should a receipt show tax separately?',
    answer:
      'It should. Every line carries its own tax rate and the receipt lists the tax under the total, so the customer can see exactly what they paid and what was tax.',
  },
  {
    question: 'Is my customer data safe?',
    answer:
      'Yes. The receipt is built in your browser and never sent to a server. If you keep your business details, they are stored on this device only, and one button clears them.',
  },
  {
    question: 'Can I add my logo to a receipt?',
    answer:
      'Yes. Choose a PNG, JPEG or WebP image in the business section. It is read and scaled down in your browser, and it never leaves your device.',
  },
] as const;

export const RECEIPT_NOTES = [
  'Number every receipt and keep a copy. A receipt without a number is hard to reconcile later.',
  'A part payment receipt should show what is still owed, which this document does for you.',
  'This tool is not tax, legal or accounting advice, and it does not check a receipt against the rules of any country.',
] as const;

validateGeneratorContent('receipt generator', {
  meta: RECEIPT_META,
  steps: RECEIPT_STEPS,
  faqs: RECEIPT_FAQ,
  notes: RECEIPT_NOTES,
});
