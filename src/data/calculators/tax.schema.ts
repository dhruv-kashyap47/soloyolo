import { z } from 'zod';

import {
  TAX_ASSUMPTIONS,
  TAX_EXAMPLES,
  TAX_FAQ,
  TAX_META,
  TAX_TERMS,
} from '@/data/calculators/tax';
import { CURRENCIES } from '@/lib/formatting/currency';
import { parseAmountInput } from '@/lib/validation/amount';

const amountString = z
  .string()
  .refine((raw) => parseAmountInput(raw) !== null, { message: 'Expected a parseable amount.' });

const workedExampleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(8),
  scenario: z.string().min(80),
  currency: z.enum(CURRENCIES.map((currency) => currency.code)),
  inputs: z.object({
    mode: z.enum(['add', 'remove']),
    amount: amountString,
    ratePercent: amountString,
  }),
  takeaway: z.string().min(60),
});

const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

const termSchema = z.object({
  country: z.string().min(4),
  term: z.string().min(2),
  setBy: z.string().min(4),
});

export const taxContentSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    description: z.string().min(80),
    path: z.string().startsWith('/calculators/'),
    eyebrow: z.string().min(1),
    intro: z.string().min(80),
  }),
  examples: z.array(workedExampleSchema).min(2),
  faqs: z.array(faqSchema).min(5),
  assumptions: z.array(z.string().min(40)).min(4),
  terms: z.array(termSchema).min(4),
  // Rates must never sneak into the terminology table.
  termsHaveNoDigits: z.literal(true),
});

export function validateTaxContent(): void {
  const result = taxContentSchema.safeParse({
    meta: TAX_META,
    examples: TAX_EXAMPLES,
    faqs: TAX_FAQ,
    assumptions: TAX_ASSUMPTIONS,
    terms: TAX_TERMS,
    termsHaveNoDigits: TAX_TERMS.every((entry) => !/\d/.test(entry.term + entry.setBy)),
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid tax page content: ${issues}`);
  }
}
