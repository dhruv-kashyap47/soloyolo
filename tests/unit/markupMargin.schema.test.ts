import { describe, expect, it } from 'vitest';

import {
  validateMarkupMarginForm,
  type MarkupMarginFormValues,
} from '@/lib/calculators/markupMargin.schema';

function form(overrides: Partial<MarkupMarginFormValues> = {}): MarkupMarginFormValues {
  return {
    cost: '2500',
    price: '5000',
    markupPercent: '100',
    marginPercent: '50',
    ...overrides,
  };
}

describe('validateMarkupMarginForm', () => {
  it('validates the cost and price pair for the margin mode', () => {
    const result = validateMarkupMarginForm('margin', form());
    expect(result.ok).toBe(true);
    if (result.ok && result.input.mode === 'margin') {
      expect(result.input.cost.toNumber()).toBe(2500);
      expect(result.input.price.toNumber()).toBe(5000);
    }
  });

  it('validates the same pair for the markup mode', () => {
    const result = validateMarkupMarginForm('markup', form());
    expect(result.ok).toBe(true);
    if (result.ok && result.input.mode === 'markup') {
      expect(result.input.price.toNumber()).toBe(5000);
    }
  });

  it('validates cost and markup when the price is the unknown', () => {
    const result = validateMarkupMarginForm('price', form());
    expect(result.ok).toBe(true);
    if (result.ok && result.input.mode === 'price') {
      expect(result.input.cost.toNumber()).toBe(2500);
      expect(result.input.markupPercent.toNumber()).toBe(100);
    }
  });

  it('validates price and margin when the cost is the unknown', () => {
    const result = validateMarkupMarginForm('cost', form());
    expect(result.ok).toBe(true);
    if (result.ok && result.input.mode === 'cost') {
      expect(result.input.price.toNumber()).toBe(5000);
      expect(result.input.marginPercent.toNumber()).toBe(50);
    }
  });

  it('ignores the fields the mode does not use', () => {
    const result = validateMarkupMarginForm(
      'price',
      form({ price: 'not a number', marginPercent: 'also not' }),
    );
    expect(result.ok).toBe(true);
  });

  it('accepts pasted currency formats', () => {
    const result = validateMarkupMarginForm('margin', form({ cost: '$2,500', price: '£5,000.50' }));
    expect(result.ok).toBe(true);
    if (result.ok && result.input.mode === 'margin') {
      expect(result.input.price.toFixed(2)).toBe('5000.50');
    }
  });

  it('requires both fields the mode needs', () => {
    const margin = validateMarkupMarginForm('margin', form({ cost: '', price: ' ' }));
    expect(margin.ok).toBe(false);
    if (!margin.ok) {
      expect(margin.errors.cost).toBe('Enter your cost.');
      expect(margin.errors.price).toBe('Enter your price.');
    }

    const price = validateMarkupMarginForm('price', form({ cost: '', markupPercent: '' }));
    expect(price.ok).toBe(false);
    if (!price.ok) {
      expect(price.errors.cost).toBe('Enter your cost.');
      expect(price.errors.markupPercent).toBe('Enter your markup.');
    }

    const cost = validateMarkupMarginForm('cost', form({ price: '', marginPercent: '' }));
    expect(cost.ok).toBe(false);
    if (!cost.ok) {
      expect(cost.errors.price).toBe('Enter your price.');
      expect(cost.errors.marginPercent).toBe('Enter your margin.');
    }
  });

  it('rejects text that is not a number', () => {
    const result = validateMarkupMarginForm('margin', form({ cost: 'two thousand' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.cost).toBe('Enter cost as a number, for example 2500.');
    }
  });

  it('rejects negative amounts', () => {
    const result = validateMarkupMarginForm('margin', form({ price: '-1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.price).toBe('Price cannot be negative.');
  });

  it('enforces the markup range', () => {
    for (const markup of ['-1', '10001']) {
      const result = validateMarkupMarginForm('price', form({ markupPercent: markup }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.markupPercent).toBe('Markup must be between 0 and 10000.');
      }
    }
  });

  it('enforces the margin range', () => {
    for (const margin of ['-1', '100']) {
      const result = validateMarkupMarginForm('cost', form({ marginPercent: margin }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.marginPercent).toBe('Margin must be between 0 and 99.99.');
      }
    }
  });

  it('rejects money above the supported maximum', () => {
    const result = validateMarkupMarginForm('margin', form({ price: '1000000001' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.price).toBe('Enter price below 1,000,000,000.');
    }
  });

  it('reports each invalid field independently', () => {
    const result = validateMarkupMarginForm('margin', form({ cost: 'abc', price: '-5' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['cost', 'price']);
    }
  });

  it('accepts the boundary values', () => {
    const lower = validateMarkupMarginForm('price', form({ markupPercent: '0' }));
    expect(lower.ok).toBe(true);

    const upper = validateMarkupMarginForm('price', form({ markupPercent: '10000' }));
    expect(upper.ok).toBe(true);

    const margin = validateMarkupMarginForm('cost', form({ marginPercent: '99.99' }));
    expect(margin.ok).toBe(true);
  });
});
