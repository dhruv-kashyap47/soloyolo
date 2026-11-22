import { describe, expect, it } from 'vitest';

import { BREAK_EVEN_RELATED_CALCULATORS } from '@/data/calculators/break-even';
import { FREELANCE_RATE_RELATED_CALCULATORS } from '@/data/calculators/freelance-rate';
import { HOURLY_RATE_RELATED_CALCULATORS } from '@/data/calculators/hourly-rate';
import { MARKUP_MARGIN_RELATED_CALCULATORS } from '@/data/calculators/markup-margin';
import { PAYMENT_FEE_RELATED_CALCULATORS } from '@/data/calculators/payment-fee';
import { PROJECT_PROFIT_RELATED_CALCULATORS } from '@/data/calculators/project-profit';
import { RETAINER_RELATED_CALCULATORS } from '@/data/calculators/retainer';
import { TAX_RELATED_CALCULATORS } from '@/data/calculators/tax';
import { GENERATOR_RELATED_TOOLS } from '@/data/generators/related';
import { findTool, liveTools } from '@/lib/tools';

/**
 * P5-08: the related-tool matrix.
 *
 * Every live tool gets its own list, each list stays small enough to be a
 * recommendation rather than a dump, links only live pages, and crosses from
 * calculators into generators (and back). The last check keeps the matrix from
 * orphaning anything: a live page nobody links to from a related block is a
 * page readers can only reach through the index.
 */
const MATRIX: Record<string, readonly string[]> = {
  'hourly-rate-calculator': HOURLY_RATE_RELATED_CALCULATORS,
  'freelance-rate-calculator': FREELANCE_RATE_RELATED_CALCULATORS,
  'project-profit-calculator': PROJECT_PROFIT_RELATED_CALCULATORS,
  'markup-vs-margin-calculator': MARKUP_MARGIN_RELATED_CALCULATORS,
  'payment-processing-fee-calculator': PAYMENT_FEE_RELATED_CALCULATORS,
  'vat-gst-sales-tax-calculator': TAX_RELATED_CALCULATORS,
  'retainer-pricing-calculator': RETAINER_RELATED_CALCULATORS,
  'break-even-calculator': BREAK_EVEN_RELATED_CALCULATORS,
  ...GENERATOR_RELATED_TOOLS,
};

describe('related tool matrix', () => {
  it('has a list for every live tool and no list for a dead one', () => {
    const liveIds = liveTools()
      .map((tool) => tool.id)
      .sort();

    expect(Object.keys(MATRIX).sort()).toEqual(liveIds);
  });

  for (const [id, related] of Object.entries(MATRIX)) {
    describe(id, () => {
      it('lists three to five live tools, each once, never itself', () => {
        expect(related.length).toBeGreaterThanOrEqual(3);
        expect(related.length).toBeLessThanOrEqual(5);
        expect(new Set(related).size, 'no duplicate ids').toBe(related.length);
        expect(related, 'never links to itself').not.toContain(id);

        for (const relatedId of related) {
          const tool = findTool(relatedId);
          expect(tool, `related tool ${relatedId} is registered`).toBeDefined();
          expect(tool?.live, `related tool ${relatedId} is live`).toBe(true);
        }
      });

      it('links across the calculator and generator boundary', () => {
        const ownKind = findTool(id)?.kind;
        const otherKind = ownKind === 'calculator' ? 'generator' : 'calculator';

        expect(related.map((relatedId) => findTool(relatedId)?.kind)).toContain(otherKind);
      });
    });
  }

  it('gives every live tool at least one inbound related link', () => {
    const inbound = new Map(liveTools().map((tool) => [tool.id, 0]));

    for (const related of Object.values(MATRIX)) {
      for (const relatedId of related) {
        inbound.set(relatedId, (inbound.get(relatedId) ?? 0) + 1);
      }
    }

    for (const [id, count] of inbound) {
      expect(count, `${id} has an inbound related link`).toBeGreaterThan(0);
    }
  });
});
