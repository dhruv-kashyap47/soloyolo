import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  PROJECT_PROFIT_ASSUMPTIONS,
  PROJECT_PROFIT_EXAMPLES,
  PROJECT_PROFIT_FAQ,
  PROJECT_PROFIT_META,
  PROJECT_PROFIT_RELATED_CALCULATORS,
} from '@/data/calculators/project-profit';
import {
  projectProfitContentSchema,
  validateProjectProfitContent,
} from '@/data/calculators/project-profit.schema';
import { calculateProjectProfit } from '@/lib/calculators/projectProfit';
import { formatPercent } from '@/lib/formatting/number';
import { findTool } from '@/lib/tools';

/**
 * Guards the published figures against code drift: every margin and markup
 * printed on the page is recalculated here, and the takeaway copy must quote
 * the same numbers the tool produces.
 */
const PUBLISHED: Record<string, { margin: string; markup: string }> = {
  'us-web-project': { margin: '33.3%', markup: '50.0%' },
  'uk-brand-project': { margin: '22.2%', markup: '28.6%' },
  'ca-app-project': { margin: '-13.9%', markup: '-12.2%' },
};

function calculate(example: (typeof PROJECT_PROFIT_EXAMPLES)[number]) {
  return calculateProjectProfit({
    revenue: new Decimal(example.inputs.revenue),
    labor: new Decimal(example.inputs.labor),
    contractor: new Decimal(example.inputs.contractor),
    software: new Decimal(example.inputs.software),
    other: new Decimal(example.inputs.other),
    overhead: new Decimal(example.inputs.overhead),
  });
}

describe('project profit page content', () => {
  it('uses the expected route', () => {
    expect(PROJECT_PROFIT_META.path).toBe('/calculators/project-profit-calculator/');
  });

  it('is registered as a live calculator', () => {
    const tool = findTool('project-profit-calculator');
    expect(tool?.live).toBe(true);
    expect(tool?.href).toBe(PROJECT_PROFIT_META.path);
    for (const id of PROJECT_PROFIT_RELATED_CALCULATORS) {
      expect(findTool(id), `related tool ${id} is registered`).toBeDefined();
    }
  });

  it.each(PROJECT_PROFIT_EXAMPLES.map((example) => [example.id, example] as const))(
    'worked example %s produces the published margin and markup',
    (id, example) => {
      const outcome = calculate(example);
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const published = PUBLISHED[id];
      expect(published, `published figures for ${id}`).toBeDefined();
      if (!published) return;

      expect(outcome.value.margin).not.toBeNull();
      expect(outcome.value.markup).not.toBeNull();
      if (outcome.value.margin === null || outcome.value.markup === null) return;

      expect(formatPercent(outcome.value.margin)).toBe(published.margin);
      expect(formatPercent(outcome.value.markup)).toBe(published.markup);
      expect(example.takeaway).toContain(published.margin);
      expect(example.takeaway).toContain(published.markup);
    },
  );

  it('has a substantial, non-duplicated FAQ', () => {
    expect(PROJECT_PROFIT_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = PROJECT_PROFIT_FAQ.map((faq) => faq.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
    for (const faq of PROJECT_PROFIT_FAQ) {
      expect(faq.answer.length).toBeGreaterThan(60);
    }
  });

  it('documents the margin-versus-markup distinction', () => {
    const copy = PROJECT_PROFIT_ASSUMPTIONS.join(' ').toLowerCase();
    expect(copy).toContain('margin divides profit by revenue');
    expect(copy).toContain('markup divides profit by total cost');
  });

  it('passes build-time content validation', () => {
    expect(() => validateProjectProfitContent()).not.toThrow();
  });

  it('rejects malformed content', () => {
    const result = projectProfitContentSchema.safeParse({
      meta: PROJECT_PROFIT_META,
      examples: [],
      faqs: [{ question: 'Why?', answer: 'Too short.' }],
      assumptions: [],
    });

    expect(result.success).toBe(false);
  });
});
