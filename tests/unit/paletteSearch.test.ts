import { describe, expect, it } from 'vitest';

import { searchItems } from '@/lib/palette-search';
import { ALL_COMMAND_ITEMS, type PaletteItem } from '@/lib/palette';

const items: PaletteItem[] = [
  {
    id: 'hourly-rate-calculator',
    name: 'Hourly Rate Calculator',
    description: 'Find the rate that covers income targets.',
    href: '/calculators/hourly-rate-calculator/',
    category: 'Calculator',
    keywords: ['rate', 'hour', 'pricing'],
  },
  {
    id: 'invoice-generator',
    name: 'New Invoice',
    description: 'Build professional invoices and print to PDF.',
    href: '/generators/invoice-generator/',
    category: 'Generator',
    keywords: ['invoice', 'bill', 'pdf', 'create'],
  },
  {
    id: 'payment-fee-calculator',
    name: 'Payment Fee Calculator',
    description: 'Net payout after processor fees.',
    href: '/calculators/payment-processing-fee-calculator/',
    category: 'Calculator',
    keywords: ['fee', 'stripe'],
  },
];

describe('palette search', () => {
  it('returns null for a blank query so callers keep their default ordering', () => {
    expect(searchItems(items, '   ')).toBeNull();
  });

  it('finds by substring across name, description, category and keywords', () => {
    const result = searchItems(items, 'invoice');
    expect(result?.matched).toBe(true);
    expect(result?.scored[0]?.item.id).toBe('invoice-generator');
  });

  it('matches fuzzy subsequences so typos still find the tool', () => {
    const result = searchItems(items, 'hrr');
    expect(result?.matched).toBe(true);
    expect(result?.scored.some((entry) => entry.item.id === 'hourly-rate-calculator')).toBe(true);
  });

  it('matches every word of a multi-word query', () => {
    const result = searchItems(items, 'new invoice');
    expect(result?.matched).toBe(true);
    expect(result?.scored[0]?.item.id).toBe('invoice-generator');
  });

  it('requires every word to match somewhere', () => {
    const result = searchItems(items, 'invoice quantum');
    expect(result?.matched).toBe(false);
    expect(result?.scored).toEqual([]);
  });

  it('ranks a word-start match above a mid-word match', () => {
    const result = searchItems(items, 'rate');
    expect(result?.scored[0]?.item.id).toBe('hourly-rate-calculator');
  });

  it('keeps registry order for equal scores', () => {
    const both: PaletteItem[] = [
      { ...items[0]!, id: 'a-first', name: 'Zeta Rate Tool' },
      { ...items[0]!, id: 'b-second', name: 'Alpha Rate Tool' },
    ];
    const result = searchItems(both, 'rate');
    const ids = result?.scored.map((entry) => entry.item.id);
    expect(ids).toEqual(['a-first', 'b-second']);
  });

  it('covers every live tool and country guide in the shipped registry', () => {
    // Every registry entry must be findable by a fragment of its own name.
    for (const item of ALL_COMMAND_ITEMS) {
      const words = item.name.toLowerCase().split(/\s+/);
      const probe = words[words.length - 1]!.slice(0, 4);
      const result = searchItems(ALL_COMMAND_ITEMS, probe);
      expect(
        result?.scored.some((entry) => entry.item.id === item.id),
        `"${probe}" should find ${item.id}`,
      ).toBe(true);
    }
  });

  it('finds the top quick actions the way people type them', () => {
    for (const query of ['new invoice', 'make invoice', 'create invoice', 'invoice']) {
      const result = searchItems(ALL_COMMAND_ITEMS, query);
      expect(result?.scored[0]?.item.id, `"${query}" should surface the invoice generator`).toBe(
        'invoice-generator',
      );
    }

    for (const query of ['timer', 'start timer', 'track time']) {
      const result = searchItems(ALL_COMMAND_ITEMS, query);
      expect(
        result?.scored.some((entry) => entry.item.id === 'action-start-timer'),
        `"${query}" should surface the timer action`,
      ).toBe(true);
    }
  });
});
