import { z } from 'zod';

import {
  HOURLY_RATE_ASSUMPTIONS,
  HOURLY_RATE_EXAMPLES,
  HOURLY_RATE_FAQ,
  HOURLY_RATE_META,
} from '@/data/calculators/hourly-rate';
import { CURRENCIES } from '@/lib/formatting/currency';
import { parseAmountInput } from '@/lib/validation/amount';

/**
 * Build-time validation for page content.
 *
 * Content is data, and bad data should break the build rather than ship a page
 * with missing FAQs or a malformed worked example. Zod is intentionally kept
 * out of the client bundle: this module is only imported by page frontmatter.
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
    targetIncome: amountString,
    annualExpenses: amountString,
    workingWeeks: amountString,
    billableHoursPerWeek: amountString,
  }),
  takeaway: z.string().min(60),
});

const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

export const hourlyRateContentSchema = z.object({
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

export type HourlyRateContent = z.infer<typeof hourlyRateContentSchema>;

export function validateHourlyRateContent(): void {
  const result = hourlyRateContentSchema.safeParse({
    meta: HOURLY_RATE_META,
    examples: HOURLY_RATE_EXAMPLES,
    faqs: HOURLY_RATE_FAQ,
    assumptions: HOURLY_RATE_ASSUMPTIONS,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid hourly rate page content: ${issues}`);
  }
}
