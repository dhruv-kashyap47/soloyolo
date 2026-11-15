import { z } from 'zod';

import {
  FREELANCE_RATE_ASSUMPTIONS,
  FREELANCE_RATE_EXAMPLES,
  FREELANCE_RATE_FAQ,
  FREELANCE_RATE_META,
} from '@/data/calculators/freelance-rate';
import { CURRENCIES } from '@/lib/formatting/currency';
import { parseAmountInput } from '@/lib/validation/amount';

/**
 * Build-time validation for the freelance rate page content. Zod stays out of
 * the client bundle: only page frontmatter imports this module.
 */
const amountString = z
  .string()
  .refine((raw) => parseAmountInput(raw) !== null, { message: 'Expected a parseable amount.' });

const workedExampleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(8),
  scenario: z.string().min(80),
  currency: z.enum(CURRENCIES.map((currency) => currency.code)),
  inputs: z.object({
    desiredIncome: amountString,
    annualExpenses: amountString,
    workingWeeks: amountString,
    workingHoursPerWeek: amountString,
    nonBillablePercent: amountString,
    profitBufferPercent: amountString,
  }),
  takeaway: z.string().min(60),
});

const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

export const freelanceRateContentSchema = z.object({
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

export type FreelanceRateContent = z.infer<typeof freelanceRateContentSchema>;

export function validateFreelanceRateContent(): void {
  const result = freelanceRateContentSchema.safeParse({
    meta: FREELANCE_RATE_META,
    examples: FREELANCE_RATE_EXAMPLES,
    faqs: FREELANCE_RATE_FAQ,
    assumptions: FREELANCE_RATE_ASSUMPTIONS,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid freelance rate page content: ${issues}`);
  }
}
