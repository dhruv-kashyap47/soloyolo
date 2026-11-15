import { describe, expect, it } from 'vitest';

import {
  BREAK_EVEN_ASSUMPTIONS,
  BREAK_EVEN_EXAMPLES,
  BREAK_EVEN_FAQ,
  BREAK_EVEN_META,
  BREAK_EVEN_RELATED_CALCULATORS,
  toBreakEvenInput,
} from '@/data/calculators/break-even';
import {
  breakEvenContentSchema,
  validateBreakEvenContent,
} from '@/data/calculators/break-even.schema';
import { calculateBreakEven } from '@/lib/calculators/breakEven';
import { formatNumber } from '@/lib/formatting/number';
import { findTool } from '@/lib/tools';

const PUBLISHED: Record<string, { units: string; revenue: string; hours: string }> = {
  'us-studio': { units: '4', revenue: '6000.00', hours: '80' },
  'uk-consultant': { units: '34', revenue: '2500.00', hours: '33.3' },
  'au-maker': { units: '7', revenue: '5727.27', hours: '76.4' },
};

describe('break-even page content', () => {
  it('uses the expected route', () => {
    expect(BREAK_EVEN_META.path).toBe('/calculators/break-even-calculator/');
  });

  it('is registered as a live calculator', () => {
    const tool = findTool('break-even-calculator');
    expect(tool?.live).toBe(true);
    expect(tool?.href).toBe(BREAK_EVEN_META.path);
    for (const id of BREAK_EVEN_RELATED_CALCULATORS) {
      expect(findTool(id), `related tool ${id} is registered`).toBeDefined();
    }
  });

  it.each(BREAK_EVEN_EXAMPLES.map((example) => [example.id, example] as const))(
    'worked example %s produces the published figures',
    (id, example) => {
      const outcome = calculateBreakEven(toBreakEvenInput(example.inputs));
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const published = PUBLISHED[id];
      expect(published, `published figures for ${id}`).toBeDefined();
      if (!published) return;

      expect(outcome.value.unitsRoundedUp.toFixed(0)).toBe(published.units);
      expect(outcome.value.revenueRounded.toFixed(2)).toBe(published.revenue);
      expect(outcome.value.breakEvenHours).not.toBeNull();
      if (outcome.value.breakEvenHours === null) return;

      expect(
        formatNumber(outcome.value.breakEvenHours, {
          decimals: outcome.value.breakEvenHours.isInteger() ? 0 : 1,
        }),
      ).toBe(published.hours);

      // The takeaway quotes whole units and a rounded revenue figure.
      expect(example.takeaway).toContain(published.units);
      expect(example.takeaway).toContain(formatNumber(outcome.value.revenueRounded));
    },
  );

  it('has a substantial, non-duplicated FAQ', () => {
    expect(BREAK_EVEN_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = BREAK_EVEN_FAQ.map((faq) => faq.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
    for (const faq of BREAK_EVEN_FAQ) {
      expect(faq.answer.length).toBeGreaterThan(60);
    }
  });

  it('documents monthly fixed costs and rounded units', () => {
    const copy = BREAK_EVEN_ASSUMPTIONS.join(' ').toLowerCase();
    expect(copy).toContain('fixed costs are monthly');
    expect(copy).toContain('rounded up');
  });

  it('passes build-time content validation', () => {
    expect(() => validateBreakEvenContent()).not.toThrow();
  });

  it('rejects malformed content', () => {
    const result = breakEvenContentSchema.safeParse({
      meta: BREAK_EVEN_META,
      examples: [],
      faqs: [{ question: 'Why?', answer: 'Too short.' }],
      assumptions: [],
    });

    expect(result.success).toBe(false);
  });
});
