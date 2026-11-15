import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import {
  calculateMarkupMargin,
  type MarkupMarginInput,
} from '@/lib/calculators/markupMargin';

function expectOk(outcome: ReturnType<typeof calculateMarkupMargin>) {
  if (!outcome.ok) throw new Error(`Expected success, got ${outcome.code}: ${outcome.message}`);
  return outcome.value;
}

function fromCostAndPrice(cost: string, price: string): MarkupMarginInput {
  return { mode: 'margin', cost: new Decimal(cost), price: new Decimal(price) };
}

describe('calculateMarkupMargin', () => {
  it('works out the margin from cost and price', () => {
    const result = expectOk(calculateMarkupMargin(fromCostAndPrice('2500', '5000')));

    expect(result.cost.toNumber()).toBe(2500);
    expect(result.price.toNumber()).toBe(5000);
    expect(result.profit.toNumber()).toBe(2500);
    expect(result.margin?.toNumber()).toBe(0.5);
    expect(result.markup?.toNumber()).toBe(1);
    expect(result.solved).toBe('margin');
  });

  it('works out the markup from the same pair', () => {
    const result = expectOk(
      calculateMarkupMargin({ mode: 'markup', cost: new Decimal('1200'), price: new Decimal('1800') }),
    );

    expect(result.markup?.toFixed(4)).toBe('0.5000');
    expect(result.margin?.toFixed(4)).toBe('0.3333');
    expect(result.solved).toBe('markup');
  });

  it('works out the price from cost and markup', () => {
    const result = expectOk(
      calculateMarkupMargin({
        mode: 'price',
        cost: new Decimal('800'),
        markupPercent: new Decimal('25'),
      }),
    );

    expect(result.price.toNumber()).toBe(1000);
    expect(result.margin?.toNumber()).toBe(0.2);
    expect(result.solved).toBe('price');
  });

  it('works out the cost from price and margin', () => {
    const result = expectOk(
      calculateMarkupMargin({
        mode: 'cost',
        price: new Decimal('5000'),
        marginPercent: new Decimal('40'),
      }),
    );

    expect(result.cost.toNumber()).toBe(3000);
    expect(result.profit.toNumber()).toBe(2000);
    expect(result.markup?.toFixed(4)).toBe('0.6667');
  });

  it('keeps one identity exact at 100% markup and 50% margin', () => {
    const result = expectOk(
      calculateMarkupMargin({
        mode: 'price',
        cost: new Decimal('2500'),
        markupPercent: new Decimal('100'),
      }),
    );

    expect(result.price.toNumber()).toBe(5000);
    expect(result.margin?.toNumber()).toBe(0.5);
  });

  it('reports a negative result when the price is below cost', () => {
    const result = expectOk(calculateMarkupMargin(fromCostAndPrice('2500', '2000')));

    expect(result.profit.toNumber()).toBe(-500);
    expect(result.margin?.toNumber()).toBe(-0.25);
    expect(result.markup?.toNumber()).toBe(-0.2);
  });

  it('returns a null margin at a zero price', () => {
    const result = expectOk(calculateMarkupMargin(fromCostAndPrice('500', '0')));

    expect(result.profit.toNumber()).toBe(-500);
    expect(result.margin).toBeNull();
    expect(result.markup?.toNumber()).toBe(-1);
  });

  it('returns a null markup at a zero cost', () => {
    const result = expectOk(calculateMarkupMargin(fromCostAndPrice('0', '500')));

    expect(result.profit.toNumber()).toBe(500);
    expect(result.margin?.toNumber()).toBe(1);
    expect(result.markup).toBeNull();
  });

  it('handles a zero cost and zero price together', () => {
    const result = expectOk(calculateMarkupMargin(fromCostAndPrice('0', '0')));

    expect(result.profit.toNumber()).toBe(0);
    expect(result.margin).toBeNull();
    expect(result.markup).toBeNull();
  });

  it('adds decimals without binary floating point error', () => {
    const result = expectOk(calculateMarkupMargin(fromCostAndPrice('0.1', '0.3')));

    expect(result.profit.toFixed(2)).toBe('0.20');
    expect(result.margin?.toFixed(4)).toBe('0.6667');
    expect(result.markup?.toNumber()).toBe(2);
  });

  it('rounds the solved price half-up to cents', () => {
    const result = expectOk(
      calculateMarkupMargin({
        mode: 'price',
        cost: new Decimal('10.005'),
        markupPercent: new Decimal('0'),
      }),
    );

    expect(result.price.toFixed(4)).toBe('10.0050');
    expect(result.priceRounded.toFixed(2)).toBe('10.01');
  });

  it('accepts a 99.99% margin and computes the smallest cost', () => {
    const result = expectOk(
      calculateMarkupMargin({
        mode: 'cost',
        price: new Decimal('10000'),
        marginPercent: new Decimal('99.99'),
      }),
    );

    expect(result.cost.toNumber()).toBe(1);
  });

  it('accepts the 10,000% markup boundary', () => {
    const result = expectOk(
      calculateMarkupMargin({
        mode: 'price',
        cost: new Decimal('100'),
        markupPercent: new Decimal('10000'),
      }),
    );

    expect(result.price.toNumber()).toBe(10100);
  });

  it('rejects negative inputs', () => {
    const negativeCost = calculateMarkupMargin(fromCostAndPrice('-1', '5000'));
    expect(negativeCost.ok).toBe(false);
    if (!negativeCost.ok) expect(negativeCost.code).toBe('negative_input');

    const negativeMarkup = calculateMarkupMargin({
      mode: 'price',
      cost: new Decimal('100'),
      markupPercent: new Decimal('-1'),
    });
    expect(negativeMarkup.ok).toBe(false);
    if (!negativeMarkup.ok) expect(negativeMarkup.code).toBe('negative_input');
  });

  it('rejects a markup above 10,000%', () => {
    const outcome = calculateMarkupMargin({
      mode: 'price',
      cost: new Decimal('100'),
      markupPercent: new Decimal('10001'),
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('markup_out_of_range');
  });

  it('rejects a margin of 100% or more', () => {
    for (const margin of ['100', '120']) {
      const outcome = calculateMarkupMargin({
        mode: 'cost',
        price: new Decimal('1000'),
        marginPercent: new Decimal(margin),
      });
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('margin_out_of_range');
    }
  });

  it('rejects non-finite values instead of returning Infinity or NaN', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const outcome = calculateMarkupMargin(fromCostAndPrice(String(bad), '5000'));
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.code).toBe('invalid_input');
    }
  });

  it('rejects money values above the supported maximum', () => {
    const outcome = calculateMarkupMargin(fromCostAndPrice('1000000001', '5000'));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.code).toBe('too_large');
  });

  it('does not mutate its inputs', () => {
    const input = fromCostAndPrice('2500', '5000');
    calculateMarkupMargin(input);
    if (input.mode === 'margin') {
      expect(input.cost.toString()).toBe('2500');
      expect(input.price.toString()).toBe('5000');
    }
  });
});
