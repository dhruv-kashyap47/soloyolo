import { describe, expect, it } from 'vitest';

import {
  DOCUMENT_SERIES,
  firstDocumentNumber,
  formatDocumentNumber,
  nextDocumentNumber,
  parseDocumentNumber,
} from '@/lib/generators/numbering';

describe('formatDocumentNumber', () => {
  it('pads the sequence to the chosen width', () => {
    expect(formatDocumentNumber(7, { prefix: 'INV', padding: 4 })).toBe('INV-0007');
    expect(formatDocumentNumber(1234, { prefix: 'INV', padding: 4 })).toBe('INV-1234');
  });

  it('adds a year segment when one is given', () => {
    expect(formatDocumentNumber(7, { prefix: 'INV', padding: 4, year: 2026 })).toBe(
      'INV-2026-0007',
    );
  });

  it('never produces a negative sequence', () => {
    expect(formatDocumentNumber(-3, { prefix: 'INV', padding: 4 })).toBe('INV-0000');
  });

  it('truncates a fractional sequence', () => {
    expect(formatDocumentNumber(4.9, { prefix: 'INV', padding: 3 })).toBe('INV-004');
  });
});

describe('parseDocumentNumber', () => {
  it('reads a number with the series prefix', () => {
    expect(parseDocumentNumber('INV-0042', 'INV')).toEqual({ value: 42 });
    expect(parseDocumentNumber('inv-0042', 'INV')).toEqual({ value: 42 });
  });

  it('reads a prefix written straight onto the number', () => {
    expect(parseDocumentNumber('INV0042', 'INV')).toEqual({ value: 42 });
    expect(parseDocumentNumber('inv7', 'INV')).toEqual({ value: 7 });
  });

  it('does not read another series prefix as its own', () => {
    expect(parseDocumentNumber('QUO0042', 'INV')).toBeNull();
  });

  it('reads a number with a year segment', () => {
    expect(parseDocumentNumber('INV-2026-0042', 'INV')).toEqual({ value: 42, year: 2026 });
  });

  it('reads a plain sequence', () => {
    expect(parseDocumentNumber('0042', 'INV')).toEqual({ value: 42 });
    expect(parseDocumentNumber('42', 'INV')).toEqual({ value: 42 });
  });

  it('rejects text it cannot read', () => {
    expect(parseDocumentNumber('', 'INV')).toBeNull();
    expect(parseDocumentNumber('INV-ABC', 'INV')).toBeNull();
    expect(parseDocumentNumber('INV-42-43', 'INV')).toBeNull();
  });
});

describe('nextDocumentNumber', () => {
  it('counts on from the last number used', () => {
    expect(nextDocumentNumber('invoice', 'INV-0041')).toBe('INV-0042');
  });

  it('counts on from a prefix written straight onto the number', () => {
    expect(nextDocumentNumber('invoice', 'INV0041')).toBe('INV-0042');
  });

  it('starts at one when there is no last number', () => {
    expect(nextDocumentNumber('invoice', undefined)).toBe('INV-0001');
    expect(nextDocumentNumber('invoice', '')).toBe('INV-0001');
  });

  it('keeps the year segment it read', () => {
    expect(nextDocumentNumber('invoice', 'INV-2026-0041')).toBe('INV-2026-0042');
  });

  it('adds a year when the last number had none', () => {
    expect(nextDocumentNumber('invoice', 'INV-0041', { year: 2026 })).toBe('INV-2026-0042');
  });

  it('uses the prefix of the series it is asked for', () => {
    expect(nextDocumentNumber('quote', 'QUO-0009')).toBe('QUO-0010');
    expect(nextDocumentNumber('receipt', 'RCT-0009')).toBe('RCT-0010');
  });

  it('falls back to one when the last number cannot be read', () => {
    expect(nextDocumentNumber('invoice', 'not a number')).toBe('INV-0001');
  });
});

describe('firstDocumentNumber', () => {
  it('starts each series at one', () => {
    expect(firstDocumentNumber('invoice')).toBe('INV-0001');
    expect(firstDocumentNumber('quote')).toBe('QUO-0001');
    expect(firstDocumentNumber('receipt')).toBe('RCT-0001');
  });
});

describe('DOCUMENT_SERIES', () => {
  it('gives every series a prefix and a label', () => {
    expect(DOCUMENT_SERIES.invoice.prefix).toBe('INV');
    expect(DOCUMENT_SERIES.quote.label).toBe('Quote');
    expect(DOCUMENT_SERIES.receipt.plural).toBe('Receipts');
  });
});
