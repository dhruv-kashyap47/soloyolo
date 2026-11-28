import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  MARKUP_MARGIN_ASSUMPTIONS,
  MARKUP_MARGIN_COMPARISON,
  MARKUP_MARGIN_EXAMPLES,
  MARKUP_MARGIN_FAQ,
  MARKUP_MARGIN_META,
  MARKUP_MARGIN_RELATED_CALCULATORS,
  toMarkupMarginInput,
} from '@/data/calculators/markup-margin';
import {
  markupMarginContentSchema,
  validateMarkupMarginContent,
} from '@/data/calculators/markup-margin.schema';
import { calculateMarkupMargin } from '@/lib/calculators/markupMargin';
import { formatPercent } from '@/lib/formatting/number';
import { findTool } from '@/lib/tools';

/**
 * Guards the published figures against code drift: every percentage printed on
 * the page is recalculated here, and the takeaway copy must quote the same
 * numbers the tool produces.
 */
const PUBLISHED: Record<string, { markup: string; margin: string }> = {
  'us-retail': { markup: '100.0%', margin: '50.0%' },
  'uk-service': { markup: '50.0%', margin: '33.3%' },
  'au-products': { markup: '25.0%', margin: '20.0%' },
};

/** Markup → the margin it really represents, as printed in the comparison table. */
const PUBLISHED_COMPARISON: Record<string, string> = {
  '10': '9.1%',
  '20': '16.7%',
  '25': '20.0%',
  '50': '33.3%',
  '100': '50.0%',
  '200': '66.7%',
};

describe('markup vs margin page content', () => {
  it('uses the expected route', () => {
    expect(MARKUP_MARGIN_META.path).toBe('/calculators/markup-vs-margin-calculator/');
  });

  it('is registered as a live calculator', () => {
    const tool = findTool('markup-vs-margin-calculator');
    expect(tool?.live).toBe(true);
    expect(tool?.href).toBe(MARKUP_MARGIN_META.path);
    for (const id of MARKUP_MARGIN_RELATED_CALCULATORS) {
      expect(findTool(id), `related tool ${id} is registered`).toBeDefined();
    }
  });

  it.each(MARKUP_MARGIN_EXAMPLES.map((example) => [example.id, example] as const))(
    'worked example %s produces the published percentages',
    (id, example) => {
      const outcome = calculateMarkupMargin(toMarkupMarginInput(example.inputs));
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const published = PUBLISHED[id];
      expect(published, `published figures for ${id}`).toBeDefined();
      if (!published) return;

      expect(outcome.value.markup).not.toBeNull();
      expect(outcome.value.margin).not.toBeNull();
      if (outcome.value.markup === null || outcome.value.margin === null) return;

      expect(formatPercent(outcome.value.markup)).toBe(published.markup);
      expect(formatPercent(outcome.value.margin)).toBe(published.margin);
      expect(example.takeaway).toContain(published.markup);
      expect(example.takeaway).toContain(published.margin);
    },
  );

  it.each(MARKUP_MARGIN_COMPARISON.map((markup) => [markup] as const))(
    'comparison row for %s%% markup matches the printed margin',
    (markup) => {
      const outcome = calculateMarkupMargin({
        mode: 'price',
        cost: new Decimal(100),
        markupPercent: new Decimal(markup),
      });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;
      expect(outcome.value.margin).not.toBeNull();
      if (outcome.value.margin === null) return;

      expect(formatPercent(outcome.value.margin)).toBe(PUBLISHED_COMPARISON[markup]);
    },
  );

  it('keeps every comparison markup in the published map', () => {
    expect(Object.keys(PUBLISHED_COMPARISON).sort()).toEqual([...MARKUP_MARGIN_COMPARISON].sort());
  });

  it('has a substantial, non-duplicated FAQ', () => {
    expect(MARKUP_MARGIN_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = MARKUP_MARGIN_FAQ.map((faq) => faq.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
    for (const faq of MARKUP_MARGIN_FAQ) {
      expect(faq.answer.length).toBeGreaterThan(60);
    }
  });

  it('documents both denominators', () => {
    const copy = MARKUP_MARGIN_ASSUMPTIONS.join(' ').toLowerCase();
    expect(copy).toContain('markup is profit divided by cost');
    expect(copy).toContain('margin is profit divided by price');
  });

  it('passes build-time content validation', () => {
    expect(() => validateMarkupMarginContent()).not.toThrow();
  });

  it('rejects malformed content', () => {
    const result = markupMarginContentSchema.safeParse({
      meta: MARKUP_MARGIN_META,
      examples: [],
      faqs: [{ question: 'Why?', answer: 'Too short.' }],
      assumptions: [],
    });

    expect(result.success).toBe(false);
  });
});
