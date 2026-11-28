import type { Faq } from '@/data/calculators/hourly-rate';

/**
 * The homepage FAQ.
 *
 * These questions cover the toolkit as a whole. Tool-specific questions stay
 * on the tool page, so the two FAQ sets do not repeat each other or create
 * competing FAQPage structured data.
 */
export const HOME_FAQ: readonly Faq[] = [
  {
    question: 'What is soloyolo?',
    answer:
      'soloyolo is a free toolkit of business calculators and document generators for freelancers, consultants, contractors and small service businesses. It helps you work out what to charge, what a project really earns and what you keep after fees and tax, then create invoices, quotes, receipts and payment reminders.',
  },
  {
    question: 'Is soloyolo free?',
    answer:
      'Yes. Every calculator and generator is free to use, with no paid tier and no paywalled result. The site is funded by advertising. If ads are enabled, their scripts load only after you accept them in the cookie banner; choosing essential-only means no ad script loads.',
  },
  {
    question: 'Who can use soloyolo?',
    answer:
      'It is built for independent professionals who price and deliver their own work: freelancers, consultants, contractors, designers, developers, writers, coaches and small service businesses. The calculators also suit anyone who needs to check a rate, margin, fee or tax figure before sending a document.',
  },
  {
    question: 'What business calculators does soloyolo provide?',
    answer:
      'There are eight: hourly rate, freelance rate, project profit, markup versus margin, payment processing fees, VAT/GST/sales tax, retainer pricing and break-even. Each one shows its formula, assumptions and worked examples, and all of them run in your browser.',
  },
  {
    question: 'Can freelancers calculate their hourly rate with soloyolo?',
    answer:
      'Yes. The hourly rate calculator works from an income target, annual business costs, working weeks and billable hours. The freelance rate calculator starts from all the hours you work, removes the share you cannot invoice and adds a profit buffer. Use the first when you know your billable capacity; use the second when you need to model the real shape of your week.',
  },
  {
    question: 'Can I create an invoice without an account?',
    answer:
      'Yes. Open the invoice generator, fill in your details, add the lines and print or save the document as a PDF. There is no sign-up, no email capture and no server-side copy of the invoice.',
  },
  {
    question: 'Does soloyolo upload my invoices or business information?',
    answer:
      'No. The generators run entirely in your browser, so client names, addresses, line items and logos are never uploaded. If you tick the option to keep your business details, they are stored only in this browser and a button clears them again.',
  },
  {
    question: 'Does soloyolo store my calculator data?',
    answer:
      'The calculators can remember the last valid values you entered so a reload does not lose them. That copy stays in this browser, is never sent to a server, and disappears when you clear the site data. Resetting a tool returns it to its example values.',
  },
  {
    question: 'Can I create quotes and receipts with soloyolo?',
    answer:
      'Yes. The quote generator adds a validity date and terms to an itemised price. The receipt generator records the amount received, the payment method and any balance still due. The payment reminder generator writes the follow-up message when an invoice is late.',
  },
  {
    question: 'Can soloyolo help me calculate project profit?',
    answer:
      'Yes. The project profit calculator subtracts your own time at an internal cost rate, contractors, software, other direct costs and a share of overhead from the project revenue. It then shows the profit, margin and markup, so you can see whether a large invoice actually leaves a worthwhile return.',
  },
  {
    question: 'Can I calculate freelance retainer pricing?',
    answer:
      'Yes. The retainer calculator combines committed hours, your internal rate, monthly expenses, a target margin and any client discount. It returns a monthly fee, the effective hourly rate and the profit the retainer leaves, so you can test a discount before you offer it.',
  },
  {
    question: 'Can I use soloyolo on my phone?',
    answer:
      'Yes. The calculators, generators and document previews are responsive and work on phones and tablets as well as desktop. Printing or saving a PDF uses your browser print dialogue, and the options available there depend on your device.',
  },
];
