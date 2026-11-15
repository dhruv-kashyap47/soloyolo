import { z } from 'zod';

import {
  BREAK_EVEN_ASSUMPTIONS,
  BREAK_EVEN_EXAMPLES,
  BREAK_EVEN_FAQ,
  BREAK_EVEN_META,
} from '@/data/calculators/break-even';
import { CURRENCIES } from '@/lib/formatting/currency';
import { parseAmountInput } from '@/lib/validation/amount';

const amountString = z
  .string()
  .refine((raw) => parseAmountInput(raw) !== null, { message: 'Expected a parseable amount.' });

const projectExample = z.object({
  mode: z.literal('project'),
  fixedCosts: amountString,
  pricePerUnit: amountString,
  variableCostPerUnit: amountString,
  hoursPerUnit: amountString,
});

const hourExample = z.object({
  mode: z.literal('hour'),
  fixedCosts: amountString,
  pricePerUnit: amountString,
  variableCostPerUnit: amountString,
});

const workedExampleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(8),
  scenario: z.string().min(80),
  currency: z.enum(CURRENCIES.map((currency) => currency.code)),
  inputs: z.discriminatedUnion('mode', [projectExample, hourExample]),
  takeaway: z.string().min(60),
});

const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

export const breakEvenContentSchema = z.object({
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

export function validateBreakEvenContent(): void {
  const result = breakEvenContentSchema.safeParse({
    meta: BREAK_EVEN_META,
    examples: BREAK_EVEN_EXAMPLES,
    faqs: BREAK_EVEN_FAQ,
    assumptions: BREAK_EVEN_ASSUMPTIONS,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid break-even page content: ${issues}`);
  }
}
