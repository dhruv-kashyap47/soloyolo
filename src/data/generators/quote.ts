import { validateGeneratorContent } from '@/data/generators/schema';

/**
 * The quote generator page.
 *
 * A quote is an invoice that has not been sent yet, so the words are
 * different: it has an expiry date, a validity promise and no amount due.
 */

export const QUOTE_META = {
  title: 'Quote Generator',
  seoTitle: 'Free Quote Generator for Freelancers',
  description:
    'Create a clear, itemised freelance quote or estimate with a validity date and your terms. Free, private, and printed or saved as a PDF in your browser.',
  path: '/generators/quote-generator/',
  eyebrow: 'Document generator',
  intro:
    'Put a price on the work before you start it. Build a quote with itemised lines, tax and terms, then print it or save it as a PDF from your browser.',
} as const;

export const QUOTE_STEPS = [
  {
    title: 'Describe the work',
    body: 'One line per part of the project, priced as a fixed amount or as a rate with the hours beside it. The quantity field takes any number, so 7.5 hours works as well as 1.',
  },
  {
    title: 'Set a date it stops being valid',
    body: 'A quote is an offer, and an offer needs an end date. The expiry date appears in the document so the customer knows how long the price holds.',
  },
  {
    title: 'Send it as a PDF',
    body: 'Print the quote and choose Save as PDF, or print it straight onto paper. The same document, whichever your customer prefers.',
  },
] as const;

export const QUOTE_FAQ = [
  {
    question: 'What should a freelance quote include?',
    answer:
      'A clear scope, one line per piece of work, the price and quantity, any tax, a validity date, the payment terms, what is included and what is not, and any deposit you require. The quote generator gives each of those a field, and the preview shows how they appear in the document your customer receives.',
  },
  {
    question: 'What is the difference between a quote and an invoice?',
    answer:
      'A quote is a price for work that has not happened yet and can still be discussed. An invoice asks for money for work that has been done. A quote usually carries an expiry date and no amount due, which is exactly how this document is laid out.',
  },
  {
    question: 'How long should a quote stay valid?',
    answer:
      'Long enough for the customer to get the quote approved, short enough that your costs cannot move much underneath it. Two to four weeks is the usual range for small projects, and the expiry date on the document says so in as many words.',
  },
  {
    question: 'Should I ask for a deposit before starting a project?',
    answer:
      'Often, yes. Put the deposit in the payment terms, for example 50% on deposit and the balance on delivery. The quote still shows the full total, and the terms make the first payment clear before the work starts. A deposit protects the time you are reserving and filters out clients who are not ready to commit.',
  },
  {
    question: 'Can I add tax to a quote?',
    answer:
      'Yes. Each line takes its own tax rate and you choose what to call tax, so a quote can carry VAT, GST, HST or sales tax in the words your customer expects.',
  },
  {
    question: 'Will the quote keep my business details for next time?',
    answer:
      'Only if you ask it to. There is a checkbox in the business section that keeps your details in this browser, and a button that clears them again. Nothing leaves your device either way.',
  },
  {
    question: 'Can I change the quote number to match my own system?',
    answer:
      'Yes. Type any number or pattern you like. The next number button counts on from the one you already have, so a quote numbered EST-12 becomes EST-13 when you press it.',
  },
] as const;

export const QUOTE_NOTES = [
  'A quote that names what is included, what is not and when the price expires is far easier to say yes to.',
  'Prices move. Keep the expiry date short enough that the numbers still work by the time the customer replies.',
  'This tool is not tax, legal or accounting advice, and it does not check a quote against the rules of any country.',
] as const;

validateGeneratorContent('quote generator', {
  meta: QUOTE_META,
  steps: QUOTE_STEPS,
  faqs: QUOTE_FAQ,
  notes: QUOTE_NOTES,
});
