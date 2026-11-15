import { describe, expect, it } from 'vitest';

import { BREAK_EVEN_EXAMPLES } from '@/data/calculators/break-even';
import { FREELANCE_RATE_EXAMPLES } from '@/data/calculators/freelance-rate';
import { HOURLY_RATE_EXAMPLES } from '@/data/calculators/hourly-rate';
import { MARKUP_MARGIN_EXAMPLES } from '@/data/calculators/markup-margin';
import { PAYMENT_FEE_EXAMPLES } from '@/data/calculators/payment-fee';
import { PROJECT_PROFIT_EXAMPLES } from '@/data/calculators/project-profit';
import { RETAINER_EXAMPLES } from '@/data/calculators/retainer';
import { TAX_EXAMPLES } from '@/data/calculators/tax';

/**
 * Regression guard for a real copy bug: the panel formats CAD and AUD with the
 * locale's plain "$" (Intl behaviour), while several examples wrote "C$" or
 * "A$". Readers saw one symbol in the prose and another in the result. The copy
 * now matches what the formatter prints; the country in each heading carries the
 * disambiguation.
 */
const EXAMPLES = [
  ...HOURLY_RATE_EXAMPLES,
  ...FREELANCE_RATE_EXAMPLES,
  ...PROJECT_PROFIT_EXAMPLES,
  ...MARKUP_MARGIN_EXAMPLES,
  ...PAYMENT_FEE_EXAMPLES,
  ...TAX_EXAMPLES,
  ...RETAINER_EXAMPLES,
  ...BREAK_EVEN_EXAMPLES,
];

describe('worked-example currency copy', () => {
  it('uses the same dollar symbol the interface prints', () => {
    for (const example of EXAMPLES) {
      for (const text of [example.scenario, example.takeaway]) {
        expect(text, `${example.id} uses a prefix the formatter does not print`).not.toMatch(
          /(^|[^A-Za-z])[AC]\$/,
        );
      }
    }
  });
});
