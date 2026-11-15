import { z } from 'zod';

import {
  MARKUP_MARGIN_ASSUMPTIONS,
  MARKUP_MARGIN_EXAMPLES,
  MARKUP_MARGIN_FAQ,
  MARKUP_MARGIN_META,
} from '@/data/calculators/markup-margin';
import { CURRENCIES } from '@/lib/formatting/currency';
import { parseAmountInput } from '@/lib/validation/amount';

/**
 * Build-time validation for the markup vs margin page content. Zod stays out
 * of the client bundle: only page frontmatter imports this module.
 */
const amountString = z
  .string()
  .refine((raw) => parseAmountInput(raw) !== null, { message: 'Expected a parseable amount.' });

const fromCostAndPrice = z.object({
  mode: z.literal('margin'),
  cost: amountString,
  price: amountString,
});

const fromCostAndPriceMarkup = z.object({
  mode: z.literal('markup'),
  cost: amountString,
  price: amountString,
});

const fromCostAndMarkup = z.object({
  mode: z.literal('price'),
  cost: amountString,
  markupPercent: amountString,
});

const fromPriceAndMargin = z.object({
  mode: z.literal('cost'),
  price: amountString,
  marginPercent: amountString,
});

const workedExampleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(8),
  scenario: z.string().min(80),
  currency: z.enum(CURRENCIES.map((currency) => currency.code)),
  inputs: z.discriminatedUnion('mode', [
    fromCostAndPrice,
    fromCostAndPriceMarkup,
    fromCostAndMarkup,
    fromPriceAndMargin,
  ]),
  takeaway: z.string().min(60),
});

const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

export const markupMarginContentSchema = z.object({
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

export type MarkupMarginContent = z.infer<typeof markupMarginContentSchema>;

export function validateMarkupMarginContent(): void {
  const result = markupMarginContentSchema.safeParse({
    meta: MARKUP_MARGIN_META,
    examples: MARKUP_MARGIN_EXAMPLES,
    faqs: MARKUP_MARGIN_FAQ,
    assumptions: MARKUP_MARGIN_ASSUMPTIONS,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid markup margin page content: ${issues}`);
  }
}
