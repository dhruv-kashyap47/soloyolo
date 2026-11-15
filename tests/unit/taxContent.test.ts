import { describe, expect, it } from 'vitest';

import {
  TAX_ASSUMPTIONS,
  TAX_EXAMPLES,
  TAX_FAQ,
  TAX_META,
  TAX_RELATED_CALCULATORS,
  TAX_TERMS,
  toTaxInput,
} from '@/data/calculators/tax';
import { taxContentSchema, validateTaxContent } from '@/data/calculators/tax.schema';
import { calculateTax } from '@/lib/calculators/tax';
import { formatCurrency } from '@/lib/formatting/currency';
import { findTool } from '@/lib/tools';

const PUBLISHED: Record<string, { net: string; tax: string; gross: string }> = {
  'us-add': { net: '1200.00', tax: '99.00', gross: '1299.00' },
  'uk-remove': { net: '500.00', tax: '100.00', gross: '600.00' },
  'ca-add': { net: '2400.00', tax: '312.00', gross: '2712.00' },
};

/** Money figures without the currency symbol, which differs by locale. */
function bareMoney(value: Parameters<typeof formatCurrency>[0], currency: Parameters<typeof formatCurrency>[1]) {
  return formatCurrency(value, currency).replace(/[^\d.,]/g, '');
}

describe('tax page content', () => {
  it('uses the expected route', () => {
    expect(TAX_META.path).toBe('/calculators/vat-gst-sales-tax-calculator/');
  });

  it('is registered as a live calculator', () => {
    const tool = findTool('vat-gst-sales-tax-calculator');
    expect(tool?.live).toBe(true);
    expect(tool?.href).toBe(TAX_META.path);
    for (const id of TAX_RELATED_CALCULATORS) {
      expect(findTool(id), `related tool ${id} is registered`).toBeDefined();
    }
  });

  it.each(TAX_EXAMPLES.map((example) => [example.id, example] as const))(
    'worked example %s produces the published figures',
    (id, example) => {
      const outcome = calculateTax(toTaxInput(example.inputs));
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;

      const published = PUBLISHED[id];
      expect(published, `published figures for ${id}`).toBeDefined();
      if (!published) return;

      expect(outcome.value.netRounded.toFixed(2)).toBe(published.net);
      expect(outcome.value.taxRounded.toFixed(2)).toBe(published.tax);
      expect(outcome.value.grossRounded.toFixed(2)).toBe(published.gross);

      expect(example.takeaway).toContain(bareMoney(outcome.value.grossRounded, example.currency));
      expect(example.takeaway).toContain(bareMoney(outcome.value.taxRounded, example.currency));
    },
  );

  it('lists terminology without smuggling in a rate', () => {
    expect(TAX_TERMS).toHaveLength(4);
    for (const entry of TAX_TERMS) {
      expect(entry.term + entry.setBy).not.toMatch(/\d/);
    }
  });

  it('has a substantial, non-duplicated FAQ', () => {
    expect(TAX_FAQ.length).toBeGreaterThanOrEqual(5);
    const questions = TAX_FAQ.map((faq) => faq.question.toLowerCase());
    expect(new Set(questions).size).toBe(questions.length);
    for (const faq of TAX_FAQ) {
      expect(faq.answer.length).toBeGreaterThan(60);
    }
  });

  it('explains that rates are not bundled', () => {
    expect(TAX_ASSUMPTIONS.join(' ').toLowerCase()).toContain('no country, state or provincial rates');
  });

  it('passes build-time content validation', () => {
    expect(() => validateTaxContent()).not.toThrow();
  });

  it('rejects malformed content', () => {
    const result = taxContentSchema.safeParse({
      meta: TAX_META,
      examples: [],
      faqs: [{ question: 'Why?', answer: 'Too short.' }],
      assumptions: [],
      terms: [],
      termsHaveNoDigits: true,
    });

    expect(result.success).toBe(false);
  });
});
