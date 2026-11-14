import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  HOURLY_RATE_EXAMPLES,
  HOURLY_RATE_FAQ,
  HOURLY_RATE_META,
} from '@/data/calculators/hourly-rate';
import {
  hourlyRateContentSchema,
  validateHourlyRateContent,
} from '@/data/calculators/hourly-rate.schema';
import { calculateHourlyRate } from '@/lib/calculators/hourlyRate';

/**
 * Guards the content on the page against code drift: every worked example shown
 * to readers is recalculated here and compared with the published figure.
 */
const PUBLISHED_RATES: Record<string, string> = {
  'us-developer': '76.67',
  'uk-consultant': '55.43',
  'au-designer': '113.33',
};

describe('hourly rate page content', () => {
  it('uses the expected route', () => {
    expect(HOURLY_RATE_META.path).toBe('/calculators/hourly-rate-calculator/');
  });

  it.each(HOURLY_RATE_EXAMPLES.map((example) => [example.id, example] as const))(
    'worked example %s produces the published rate',
    (id, example) => {
      const outcome = calculateHourlyRate({
        targetIncome: new Decimal(example.inputs.targetIncome),
        annualExpenses: new Decimal(example.inputs.annualExpenses),
        workingWeeks: new Decimal(example.inputs.workingWeeks),
        billableHoursPerWeek: new Decimal(example.inputs.billableHoursPerWeek),
      });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      expect(outcome.value.hourlyRateRounded.toFixed(2)).toBe(PUBLISHED_RATES[id]);
    },
  );

  it('has a substantial, non-duplicated FAQ', () => {
    expect(HOURLY_RATE_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = HOURLY_RATE_FAQ.map((faq) => faq.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
    for (const faq of HOURLY_RATE_FAQ) {
      expect(faq.answer.length).toBeGreaterThan(60);
    }
  });

  it('passes build-time content validation', () => {
    expect(() => validateHourlyRateContent()).not.toThrow();
  });

  it('rejects malformed content', () => {
    const result = hourlyRateContentSchema.safeParse({
      meta: HOURLY_RATE_META,
      examples: [],
      faqs: [{ question: 'Why?', answer: 'Too short.' }],
      assumptions: [],
    });

    expect(result.success).toBe(false);
  });
});
