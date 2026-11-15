import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  FREELANCE_RATE_ASSUMPTIONS,
  FREELANCE_RATE_EXAMPLES,
  FREELANCE_RATE_FAQ,
  FREELANCE_RATE_META,
  FREELANCE_RATE_RELATED_CALCULATORS,
} from '@/data/calculators/freelance-rate';
import {
  freelanceRateContentSchema,
  validateFreelanceRateContent,
} from '@/data/calculators/freelance-rate.schema';
import { calculateFreelanceRate } from '@/lib/calculators/freelanceRate';
import { findTool } from '@/lib/tools';

/**
 * Guards the published figures against code drift: every rate printed on the
 * page is recalculated here, and the takeaway copy must quote the same number.
 */
const PUBLISHED_RATES: Record<string, string> = {
  'us-developer': '104.62',
  'uk-consultant': '86.17',
  'au-designer': '110.08',
};

describe('freelance rate page content', () => {
  it('uses the expected route', () => {
    expect(FREELANCE_RATE_META.path).toBe('/calculators/freelance-rate-calculator/');
  });

  it('is registered as a live calculator', () => {
    const tool = findTool('freelance-rate-calculator');
    expect(tool?.live).toBe(true);
    expect(tool?.href).toBe(FREELANCE_RATE_META.path);
    for (const id of FREELANCE_RATE_RELATED_CALCULATORS) {
      expect(findTool(id), `related tool ${id} is registered`).toBeDefined();
    }
  });

  it.each(FREELANCE_RATE_EXAMPLES.map((example) => [example.id, example] as const))(
    'worked example %s produces the published rate',
    (id, example) => {
      const outcome = calculateFreelanceRate({
        desiredIncome: new Decimal(example.inputs.desiredIncome),
        annualExpenses: new Decimal(example.inputs.annualExpenses),
        workingWeeks: new Decimal(example.inputs.workingWeeks),
        workingHoursPerWeek: new Decimal(example.inputs.workingHoursPerWeek),
        nonBillablePercent: new Decimal(example.inputs.nonBillablePercent),
        profitBufferPercent: new Decimal(example.inputs.profitBufferPercent),
      });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const rate = outcome.value.hourlyRateRounded.toFixed(2);
      expect(rate).toBe(PUBLISHED_RATES[id]);
      expect(example.takeaway).toContain(rate);
    },
  );

  it('has a substantial, non-duplicated FAQ', () => {
    expect(FREELANCE_RATE_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = FREELANCE_RATE_FAQ.map((faq) => faq.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
    for (const faq of FREELANCE_RATE_FAQ) {
      expect(faq.answer.length).toBeGreaterThan(60);
    }
  });

  it('documents the non-billable and buffer assumptions', () => {
    const copy = FREELANCE_RATE_ASSUMPTIONS.join(' ').toLowerCase();
    expect(copy).toContain('non-billable');
    expect(copy).toContain('buffer');
  });

  it('passes build-time content validation', () => {
    expect(() => validateFreelanceRateContent()).not.toThrow();
  });

  it('rejects malformed content', () => {
    const result = freelanceRateContentSchema.safeParse({
      meta: FREELANCE_RATE_META,
      examples: [],
      faqs: [{ question: 'Why?', answer: 'Too short.' }],
      assumptions: [],
    });

    expect(result.success).toBe(false);
  });
});
