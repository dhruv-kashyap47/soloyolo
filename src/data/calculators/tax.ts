import Decimal from 'decimal.js';

import type { TaxInput, TaxMode } from '@/lib/calculators/tax';
import { COUNTRY_TAX_TERMS } from '@/lib/countries/taxTerms';
import type { CurrencyCode } from '@/lib/formatting/currency';

export interface Faq {
  question: string;
  answer: string;
}

export interface WorkedExample {
  id: string;
  name: string;
  scenario: string;
  currency: CurrencyCode;
  inputs: {
    mode: TaxMode;
    amount: string;
    ratePercent: string;
  };
  takeaway: string;
}

export interface TaxTerm {
  country: string;
  term: string;
  setBy: string;
}

export const TAX_META = {
  title: 'VAT / GST / Sales Tax Calculator',
  description:
    'Add tax to a price or remove it from a total, with the right name for the country you are working in, and the arithmetic explained rather than hidden.',
  path: '/calculators/vat-gst-sales-tax-calculator/',
  eyebrow: 'Tax calculator',
  intro:
    'Add tax to a net price or take it back out of a gross total. The rate is yours to enter; the page explains why removing tax is not the same as subtracting the rate.',
} as const;

export const TAX_EXAMPLES: readonly WorkedExample[] = [
  {
    id: 'us-add',
    name: 'Adding sales tax · United States',
    scenario:
      'A $1,200 quote goes to a client in a state where the combined state and local sales tax rate is 8.25%. The price is quoted before tax and the invoice has to add it.',
    currency: 'USD',
    inputs: { mode: 'add', amount: '1200', ratePercent: '8.25' },
    takeaway:
      'The tax is $99.00 and the client pays $1,299.00. The $99.00 is collected on behalf of the state: it is not revenue and should never be treated as profit.',
  },
  {
    id: 'uk-remove',
    name: 'Removing VAT · United Kingdom',
    scenario:
      'A £600 payment lands with VAT already inside it. The freelancer needs the net figure for the bookkeeping entry, at the standard 20% rate.',
    currency: 'GBP',
    inputs: { mode: 'remove', amount: '600', ratePercent: '20' },
    takeaway:
      'The net is £500.00 and the VAT is £100.00. Subtracting 20% from £600.00 would give £480.00 and £120.00, which is wrong: removing tax divides by 1.2, it does not deduct the rate.',
  },
  {
    id: 'ca-add',
    name: 'Adding HST · Canada',
    scenario:
      'A $2,400 design invoice is issued in a province using 13% HST, with the price quoted before tax.',
    currency: 'CAD',
    inputs: { mode: 'add', amount: '2400', ratePercent: '13' },
    takeaway:
      'HST adds $312.00, so the invoice totals $2,712.00. The same tool handles GST at 5% or a combined rate: enter whatever applies to the province and the client.',
  },
];

/**
 * Terminology only. No rates: they vary by country, state and province, and
 * they change. The names come from the same list the calculator uses, so the
 * page and the form cannot drift apart.
 */
export const TAX_TERMS: readonly TaxTerm[] = COUNTRY_TAX_TERMS.map((entry) => ({
  country: entry.label,
  term: entry.term,
  setBy: entry.setBy,
}));

export function toTaxInput(inputs: WorkedExample['inputs']): TaxInput {
  return {
    mode: inputs.mode,
    amount: new Decimal(inputs.amount),
    ratePercent: new Decimal(inputs.ratePercent),
  };
}

export const TAX_ASSUMPTIONS: readonly string[] = [
  'The tax rate is entered by hand. No country, state or provincial rates are bundled, because they change and a stale default is worse than no default.',
  'Adding tax multiplies the net amount by the rate and adds it. Removing tax divides the gross amount by one plus the rate.',
  'Removing tax is not the same as subtracting the rate from a total. At any positive rate, the tax inside a gross amount is a smaller share of the total than the rate itself.',
  'The country selector changes terminology only, from sales tax to VAT, GST, Umsatzsteuer, MWST / TVA / IVA or federal VAT. It does not change the arithmetic or apply a rate.',
  'The Indian GST invoice splits one GST total into CGST + SGST for an intra-state supply or IGST for an inter-state supply. This calculator shows the single total; the invoice generator does the split.',
  'Amounts are treated as a single line at one rate. Invoices with mixed rates, exemptions, zero-rated items or reverse charges need each line calculated separately.',
  'The tool does not decide whether you should charge tax, which rate applies, or how to report it. That depends on your registration, location and the client’s location.',
  'The currency selector formats amounts only. It does not convert currencies and does not imply a tax jurisdiction.',
];

export const TAX_FAQ: readonly Faq[] = [
  {
    question: 'How do I add tax to a price?',
    answer:
      'Use the Add tax mode and enter the price before tax. The calculator multiplies it by the rate and adds the result. A 1,200 price at 8.25% becomes 99.00 of tax and a 1,299.00 total. That total is what the client pays; the tax portion is collected, not earned.',
  },
  {
    question: 'How do I remove tax from a total?',
    answer:
      'Use the Remove tax mode and enter the amount the client paid, tax included. The calculator divides by one plus the rate to find the net, then subtracts that from the total to find the tax. At 20%, 600.00 including tax is 500.00 net and 100.00 of tax.',
  },
  {
    question: 'Why is removing tax not just subtracting the percentage?',
    answer:
      'Because the percentage was added to the smaller, pre-tax amount, not to the total. Subtracting 20% from a gross figure removes 20% of the gross, which is more than the tax that was added. Dividing by 1.2 reverses the original multiplication exactly; subtracting 20% does not.',
  },
  {
    question: 'Are the tax rates included?',
    answer:
      'No. Rates differ by country, state, province and sometimes by product category, and they change with budgets. The tool asks for the rate so the answer is always based on the rule that applies to you today. The country selector only changes whether the page says sales tax, VAT, GST or HST.',
  },
  {
    question: 'Which countries does the terminology cover?',
    answer:
      'The selector covers the eight markets this site is built for: the United States, United Kingdom, Canada, Australia, Germany, Switzerland, India and the UAE. The maths is identical everywhere; only the name of the tax and who sets it differ. Other countries work too, as long as you know the rate and read the label as “tax”.',
  },
  {
    question: 'Is this tax advice?',
    answer:
      'No. It is arithmetic. It cannot tell you whether you need to register, whether a client is exempt, how a reverse-charge rule applies, or what to file. Those questions depend on facts the calculator never sees. Check with the tax authority in your country or a qualified accountant.',
  },
];

export const TAX_RELATED_CALCULATORS: readonly string[] = [
  'payment-processing-fee-calculator',
  'markup-vs-margin-calculator',
  'project-profit-calculator',
];
