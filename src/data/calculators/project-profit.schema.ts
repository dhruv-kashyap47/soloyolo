import { z } from 'zod';

import {
  PROJECT_PROFIT_ASSUMPTIONS,
  PROJECT_PROFIT_EXAMPLES,
  PROJECT_PROFIT_FAQ,
  PROJECT_PROFIT_META,
} from '@/data/calculators/project-profit';
import { CURRENCIES } from '@/lib/formatting/currency';
import { parseAmountInput } from '@/lib/validation/amount';

/**
 * Build-time validation for the project profit page content. Zod stays out of
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
    revenue: amountString,
    labor: amountString,
    contractor: amountString,
    software: amountString,
    other: amountString,
    overhead: amountString,
  }),
  takeaway: z.string().min(60),
});

const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

export const projectProfitContentSchema = z.object({
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

export type ProjectProfitContent = z.infer<typeof projectProfitContentSchema>;

export function validateProjectProfitContent(): void {
  const result = projectProfitContentSchema.safeParse({
    meta: PROJECT_PROFIT_META,
    examples: PROJECT_PROFIT_EXAMPLES,
    faqs: PROJECT_PROFIT_FAQ,
    assumptions: PROJECT_PROFIT_ASSUMPTIONS,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid project profit page content: ${issues}`);
  }
}
