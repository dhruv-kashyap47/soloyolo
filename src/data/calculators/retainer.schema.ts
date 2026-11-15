import { z } from 'zod';

import {
  RETAINER_ASSUMPTIONS,
  RETAINER_EXAMPLES,
  RETAINER_FAQ,
  RETAINER_META,
} from '@/data/calculators/retainer';
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
    monthlyHours: amountString,
    hourlyRate: amountString,
    monthlyExpenses: amountString,
    desiredMarginPercent: amountString,
    discountPercent: amountString,
  }),
  takeaway: z.string().min(60),
});

const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

export const retainerContentSchema = z.object({
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
});

export function validateRetainerContent(): void {
  const result = retainerContentSchema.safeParse({
    meta: RETAINER_META,
    examples: RETAINER_EXAMPLES,
    faqs: RETAINER_FAQ,
    assumptions: RETAINER_ASSUMPTIONS,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid retainer page content: ${issues}`);
  }
}
