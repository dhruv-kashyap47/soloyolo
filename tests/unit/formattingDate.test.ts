import { describe, expect, it } from 'vitest';

import {
  addDays,
  daysBetween,
  formatDate,
  formatDateShort,
  isIsoDate,
  todayIso,
} from '@/lib/formatting/date';

describe('isIsoDate', () => {
  it('accepts a real calendar day', () => {
    expect(isIsoDate('2026-11-16')).toBe(true);
    expect(isIsoDate('2026-02-28')).toBe(true);
  });

  it('rejects a day that does not exist', () => {
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-11-32')).toBe(false);
  });

  it('rejects anything that is not a day', () => {
    expect(isIsoDate('16/11/2026')).toBe(false);
    expect(isIsoDate('2026-11')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });
});

describe('addDays', () => {
  it('moves forward across a month', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });

  it('moves backward across a year', () => {
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('leaves a value that is not a day alone', () => {
    expect(addDays('nonsense', 3)).toBe('nonsense');
  });
});

describe('daysBetween', () => {
  it('counts whole days', () => {
    expect(daysBetween('2026-11-12', '2026-11-19')).toBe(7);
    expect(daysBetween('2026-11-19', '2026-11-12')).toBe(-7);
  });

  it('returns null when a date cannot be read', () => {
    expect(daysBetween('nope', '2026-11-19')).toBeNull();
  });
});

describe('formatDate', () => {
  it('writes the day the way the currency writes its money', () => {
    expect(formatDate('2026-11-16', { currency: 'USD' })).toBe('November 16, 2026');
    expect(formatDate('2026-11-16', { currency: 'GBP' })).toBe('16 November 2026');
  });

  it('never moves the day because of a timezone', () => {
    expect(formatDate('2026-01-01', { locale: 'en-US' })).toBe('January 1, 2026');
    expect(formatDate('2026-12-31', { locale: 'en-GB' })).toBe('31 December 2026');
  });

  it('returns an empty string for a day it cannot read', () => {
    expect(formatDate('nope')).toBe('');
  });

  it('writes a short form for tight spaces', () => {
    expect(formatDateShort('2026-11-16', { locale: 'en-GB' })).toBe('16 Nov 2026');
  });
});

describe('todayIso', () => {
  it('writes the local calendar day', () => {
    const value = todayIso(new Date(2026, 10, 16));

    expect(value).toBe('2026-11-16');
    expect(isIsoDate(value)).toBe(true);
  });
});
