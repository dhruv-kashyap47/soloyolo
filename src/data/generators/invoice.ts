import { validateGeneratorContent } from '@/data/generators/schema';

/**
 * The invoice generator page.
 *
 * The copy lives here so the page and the tool never drift apart. The worked
 * example is in `examples.ts`: the island imports it, and keeping it apart
 * means this file, with its build-time Zod schema, never reaches the browser.
 */
export const INVOICE_META = {
  title: 'Invoice Generator',
  seoTitle: 'Free Invoice Generator for Freelancers',
  description:
    'Create a professional freelance invoice with itemised lines, discounts, VAT, GST or sales tax, then print it or save it as a PDF. No account, no uploads.',
  path: '/generators/invoice-generator/',
  eyebrow: 'Document generator',
  intro:
    'Build an invoice a customer will take seriously: itemised lines, discounts, tax, a due date and your payment details. Fill it in, check the preview, then print it or save it as a PDF.',
} as const;

export const INVOICE_STEPS = [
  {
    title: 'Fill in who it is for',
    body: 'Your business details and your customer details sit at the top of the document. Keep them in this browser and you will not have to type them again on the next invoice.',
  },
  {
    title: 'Add the lines you are charging for',
    body: 'One line per piece of work. Each line can carry its own discount and tax rate, and the totals work themselves out as you type.',
  },
  {
    title: 'Check the preview, then print',
    body: 'The document on the right is the document you get. Print it, or choose Save as PDF in the print dialogue to send it as a file.',
  },
] as const;

export const INVOICE_FAQ = [
  {
    question: 'Is the invoice generator free, and do I need an account?',
    answer:
      'It is free and there is no account. Every generator runs entirely in your browser: nothing is uploaded, nothing is stored on a server, and there is no sign-up step. If you choose to keep your business details, they stay in this browser until you clear them.',
  },
  {
    question: 'What should a freelance invoice contain?',
    answer:
      'A unique invoice number, the issue and due dates, your business details, the customer details, a description of each line, quantities and prices, any discount, the tax rate and amount where it applies, your tax registration number if you have one, and the payment terms. The generator gives you fields for each of these.',
  },
  {
    question: 'What is the difference between an invoice and a receipt?',
    answer:
      'An invoice asks for payment for work that has been delivered or agreed. A receipt confirms that a payment has arrived. They usually come in that order: send the invoice first, then issue a receipt once the money lands. The receipt generator on this site records the amount received and any balance still due.',
  },
  {
    question: 'Can I invoice international clients in different currencies?',
    answer:
      'You can choose from eight currencies: USD, GBP, CAD, AUD, EUR, CHF, INR and AED. One document uses one currency and the tool does not convert between them, so agree the currency with the client first. Tax registration and invoicing rules still depend on where you and the client are, not on the currency symbol.',
  },
  {
    question: 'How do I save the invoice as a PDF?',
    answer:
      'Use the Print button and choose Save as PDF in your browser print dialogue. That produces the same page you see in the preview, as a PDF file you can attach to an email. No separate download button is needed.',
  },
  {
    question: 'Can I add VAT, GST or sales tax?',
    answer:
      'Yes. Each line item takes its own tax rate, and you choose what you call tax on the document: VAT, GST, HST, sales tax or plain tax. The tax is worked out on the discounted amount, which is how tax is normally charged.',
  },
  {
    question: 'What happens if I apply a discount on the whole invoice?',
    answer:
      'The discount is spread across the line items in proportion to what each one is worth, and the tax is then charged on the discounted amounts. The parts always add up to the total, so the figures on the document agree with each other.',
  },
  {
    question: 'Can I use my own invoice numbers?',
    answer:
      'Yes. Type any format you like and the document prints exactly what you typed. The next number button counts on from the number you already have, keeping your own prefix and any year segment.',
  },
  {
    question: 'Does the invoice meet the legal requirements in my country?',
    answer:
      'It gives you the fields most places expect: a unique number, the issue and due dates, the parties, itemised lines, the tax rate and your registration number. The exact requirements differ, so check the guidance from your tax authority for your own country before you send it.',
  },
] as const;

export const INVOICE_NOTES = [
  'Give every invoice its own number and keep a copy. A repeated number is the most common reason an invoice is rejected.',
  'The tax rate is yours to set. The tool charges tax on the discounted amount, but it does not know which rate applies to you.',
  'This tool is not tax, legal or accounting advice, and it does not check your invoice against the rules of any country.',
] as const;

validateGeneratorContent('invoice generator', {
  meta: INVOICE_META,
  steps: INVOICE_STEPS,
  faqs: INVOICE_FAQ,
  notes: INVOICE_NOTES,
});
