import { z } from 'zod';

import {
  PAYMENT_FEE_ASSUMPTIONS,
  PAYMENT_FEE_EXAMPLES,
  PAYMENT_FEE_FAQ,
  PAYMENT_FEE_META,
} from '@/data/calculators/payment-fee';
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
    amount: amountString,
    percentFee: amountString,
    fixedFee: amountString,
  }),
  takeaway: z.string().min(60),
});

const faqSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(60),
});

export const paymentFeeContentSchema = z.object({
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

export function validatePaymentFeeContent(): void {
  const result = paymentFeeContentSchema.safeParse({
    meta: PAYMENT_FEE_META,
    examples: PAYMENT_FEE_EXAMPLES,
    faqs: PAYMENT_FEE_FAQ,
    assumptions: PAYMENT_FEE_ASSUMPTIONS,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid payment fee page content: ${issues}`);
  }
}
