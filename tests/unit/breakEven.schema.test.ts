import { describe, expect, it } from 'vitest';

import {
  validateBreakEvenForm,
  type BreakEvenFormValues,
} from '@/lib/calculators/breakEven.schema';

function form(overrides: Partial<BreakEvenFormValues> = {}): BreakEvenFormValues {
  return {
    fixedCosts: '4000',
    pricePerUnit: '1500',
    variableCostPerUnit: '500',
    hoursPerUnit: '20',
    ...overrides,
  };
}

describe('validateBreakEvenForm', () => {
  it('accepts the default project example', () => {
    const result = validateBreakEvenForm('project', form());
    expect(result.ok).toBe(true);
    if (result.ok && result.input.mode === 'project') {
      expect(result.input.fixedCosts.toNumber()).toBe(4000);
      expect(result.input.pricePerUnit.toNumber()).toBe(1500);
      expect(result.input.hoursPerUnit.toNumber()).toBe(20);
    }
  });

  it('accepts the hourly mode and ignores hours per project', () => {
    const result = validateBreakEvenForm(
      'hour',
      form({ hoursPerUnit: 'not a number' }),
    );
    expect(result.ok).toBe(true);
    if (result.ok && result.input.mode === 'hour') {
      expect(result.input.pricePerUnit.toNumber()).toBe(1500);
    }
  });

  it('accepts pasted currency formats', () => {
    const result = validateBreakEvenForm('project', form({ fixedCosts: '$4,000' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.fixedCosts.toNumber()).toBe(4000);
  });

  it('requires the fields each mode needs', () => {
    const project = validateBreakEvenForm(
      'project',
      form({ fixedCosts: '', pricePerUnit: '', variableCostPerUnit: '', hoursPerUnit: '' }),
    );
    expect(project.ok).toBe(false);
    if (!project.ok) {
      expect(project.errors.fixedCosts).toBe('Enter your fixed costs.');
      expect(project.errors.pricePerUnit).toBe('Enter your price per project.');
      expect(project.errors.variableCostPerUnit).toBe('Enter your variable cost per project.');
      expect(project.errors.hoursPerUnit).toBe('Enter your hours per project.');
    }

    const hourlyMode = validateBreakEvenForm('hour', form({ pricePerUnit: '', variableCostPerUnit: '' }));
    expect(hourlyMode.ok).toBe(false);
    if (!hourlyMode.ok) {
      expect(hourlyMode.errors.pricePerUnit).toBe('Enter your price per hour.');
      expect(hourlyMode.errors.variableCostPerUnit).toBe('Enter your variable cost per hour.');
    }
  });

  it('rejects text that is not a number', () => {
    const result = validateBreakEvenForm('project', form({ fixedCosts: 'four thousand' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fixedCosts).toBe('Enter fixed costs as a number, for example 4000.');
    }
  });

  it('rejects negative values', () => {
    const result = validateBreakEvenForm('project', form({ variableCostPerUnit: '-1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.variableCostPerUnit).toBe('Variable cost per project cannot be negative.');
    }
  });

  it('enforces the hours range and allows zero', () => {
    const zero = validateBreakEvenForm('project', form({ hoursPerUnit: '0' }));
    expect(zero.ok).toBe(true);

    const tooMany = validateBreakEvenForm('project', form({ hoursPerUnit: '10001' }));
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) {
      expect(tooMany.errors.hoursPerUnit).toBe('Hours per project must be between 0 and 10000.');
    }
  });

  it('rejects values above the supported maximum', () => {
    const result = validateBreakEvenForm('project', form({ pricePerUnit: '1000000001' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.pricePerUnit).toBe('Enter price per project below 1,000,000,000.');
    }
  });

  it('reports each invalid field independently', () => {
    const result = validateBreakEvenForm(
      'project',
      form({ fixedCosts: 'abc', pricePerUnit: '-1', variableCostPerUnit: '500' }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['fixedCosts', 'pricePerUnit']);
    }
  });
});
