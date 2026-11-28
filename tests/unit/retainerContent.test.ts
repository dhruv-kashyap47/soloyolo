import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  RETAINER_ASSUMPTIONS,
  RETAINER_EXAMPLES,
  RETAINER_FAQ,
  RETAINER_META,
  RETAINER_RELATED_CALCULATORS,
} from '@/data/calculators/retainer';
import { retainerContentSchema, validateRetainerContent } from '@/data/calculators/retainer.schema';
import { calculateRetainer } from '@/lib/calculators/retainer';
import { formatCurrency } from '@/lib/formatting/currency';
import { findTool } from '@/lib/tools';

const PUBLISHED: Record<string, { retainer: string; effective: string }> = {
  'us-developer': { retainer: '3428.57', effective: '171.43' },
  'uk-consultant': { retainer: '1740.00', effective: '116.00' },
  'au-designer': { retainer: '1540.63', effective: '154.06' },
};

function bareMoney(
  value: Parameters<typeof formatCurrency>[0],
  currency: Parameters<typeof formatCurrency>[1],
) {
  return formatCurrency(value, currency).replace(/[^\d.,]/g, '');
}

describe('retainer page content', () => {
  it('uses the expected route', () => {
    expect(RETAINER_META.path).toBe('/calculators/retainer-pricing-calculator/');
  });

  it('is registered as a live calculator', () => {
    const tool = findTool('retainer-pricing-calculator');
    expect(tool?.live).toBe(true);
    expect(tool?.href).toBe(RETAINER_META.path);
    for (const id of RETAINER_RELATED_CALCULATORS) {
      expect(findTool(id), `related tool ${id} is registered`).toBeDefined();
    }
  });

  it.each(RETAINER_EXAMPLES.map((example) => [example.id, example] as const))(
    'worked example %s produces the published figures',
    (id, example) => {
      const outcome = calculateRetainer({
        monthlyHours: new Decimal(example.inputs.monthlyHours),
        hourlyRate: new Decimal(example.inputs.hourlyRate),
        monthlyExpenses: new Decimal(example.inputs.monthlyExpenses),
        desiredMarginPercent: new Decimal(example.inputs.desiredMarginPercent),
        discountPercent: new Decimal(example.inputs.discountPercent),
      });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const published = PUBLISHED[id];
      expect(published, `published figures for ${id}`).toBeDefined();
      if (!published) return;

      expect(outcome.value.retainerRounded.toFixed(2)).toBe(published.retainer);
      expect(outcome.value.effectiveHourlyRounded.toFixed(2)).toBe(published.effective);

      expect(example.takeaway).toContain(
        bareMoney(outcome.value.retainerRounded, example.currency),
      );
      expect(example.takeaway).toContain(
        bareMoney(outcome.value.effectiveHourlyRounded, example.currency),
      );
    },
  );

  it('has a substantial, non-duplicated FAQ', () => {
    expect(RETAINER_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = RETAINER_FAQ.map((faq) => faq.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
    for (const faq of RETAINER_FAQ) {
      expect(faq.answer.length).toBeGreaterThan(60);
    }
  });

  it('documents that the discount reduces the achieved margin', () => {
    expect(RETAINER_ASSUMPTIONS.join(' ').toLowerCase()).toContain(
      'a discount therefore reduces the achieved margin',
    );
  });

  it('passes build-time content validation', () => {
    expect(() => validateRetainerContent()).not.toThrow();
  });

  it('rejects malformed content', () => {
    const result = retainerContentSchema.safeParse({
      meta: RETAINER_META,
      examples: [],
      faqs: [{ question: 'Why?', answer: 'Too short.' }],
      assumptions: [],
    });

    expect(result.success).toBe(false);
  });
});
