import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  PAYMENT_FEE_ASSUMPTIONS,
  PAYMENT_FEE_EXAMPLES,
  PAYMENT_FEE_FAQ,
  PAYMENT_FEE_META,
  PAYMENT_FEE_RELATED_CALCULATORS,
} from '@/data/calculators/payment-fee';
import {
  paymentFeeContentSchema,
  validatePaymentFeeContent,
} from '@/data/calculators/payment-fee.schema';
import { calculatePaymentFee } from '@/lib/calculators/paymentFee';
import { formatCurrency } from '@/lib/formatting/currency';
import { formatPercent } from '@/lib/formatting/number';
import { findTool } from '@/lib/tools';

const PUBLISHED: Record<string, { net: string; effective: string }> = {
  'us-card': { net: '970.70', effective: '2.9%' },
  'uk-small': { net: '246.05', effective: '1.6%' },
  'au-micro': { net: '43.91', effective: '2.4%' },
};

describe('payment fee page content', () => {
  it('uses the expected route', () => {
    expect(PAYMENT_FEE_META.path).toBe('/calculators/payment-processing-fee-calculator/');
  });

  it('is registered as a live calculator', () => {
    const tool = findTool('payment-processing-fee-calculator');
    expect(tool?.live).toBe(true);
    expect(tool?.href).toBe(PAYMENT_FEE_META.path);
    for (const id of PAYMENT_FEE_RELATED_CALCULATORS) {
      expect(findTool(id), `related tool ${id} is registered`).toBeDefined();
    }
  });

  it.each(PAYMENT_FEE_EXAMPLES.map((example) => [example.id, example] as const))(
    'worked example %s produces the published figures',
    (id, example) => {
      const outcome = calculatePaymentFee({
        amount: new Decimal(example.inputs.amount),
        percentFee: new Decimal(example.inputs.percentFee),
        fixedFee: new Decimal(example.inputs.fixedFee),
      });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const published = PUBLISHED[id];
      expect(published, `published figures for ${id}`).toBeDefined();
      if (!published) return;

      expect(outcome.value.netRounded.toFixed(2)).toBe(published.net);
      expect(outcome.value.effectivePercent).not.toBeNull();
      if (outcome.value.effectivePercent === null) return;

      expect(formatPercent(outcome.value.effectivePercent)).toBe(published.effective);
      expect(example.takeaway).toContain(
        formatCurrency(outcome.value.netRounded, example.currency).replace(/[$£]/g, ''),
      );
      expect(example.takeaway).toContain(published.effective);
    },
  );

  it('has a substantial, non-duplicated FAQ', () => {
    expect(PAYMENT_FEE_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = PAYMENT_FEE_FAQ.map((faq) => faq.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
    for (const faq of PAYMENT_FEE_FAQ) {
      expect(faq.answer.length).toBeGreaterThan(60);
    }
  });

  it('states that no processor rates are bundled', () => {
    expect(PAYMENT_FEE_ASSUMPTIONS.join(' ').toLowerCase()).toContain('no processor rates');
  });

  it('passes build-time content validation', () => {
    expect(() => validatePaymentFeeContent()).not.toThrow();
  });

  it('rejects malformed content', () => {
    const result = paymentFeeContentSchema.safeParse({
      meta: PAYMENT_FEE_META,
      examples: [],
      faqs: [{ question: 'Why?', answer: 'Too short.' }],
      assumptions: [],
    });

    expect(result.success).toBe(false);
  });
});
