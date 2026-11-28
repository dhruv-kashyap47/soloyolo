import { describe, expect, it } from 'vitest';

import {
  clearProfile,
  emptyProfile,
  loadProfile,
  parseProfile,
  PROFILE_STORAGE_KEY,
  PROFILE_VERSION,
  saveProfile,
} from '@/lib/storage/profile';
import { MAX_STORED_LOGO_CHARS } from '@/lib/storage/logo';
import { businessProfileSchema } from '@/lib/storage/profile.schema';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

const VALID = {
  ...emptyProfile(),
  businessName: 'Northwind Studio',
  email: 'hello@northwind.test',
  currency: 'GBP' as const,
  updatedAt: '2026-11-16T10:00:00.000Z',
};

describe('parseProfile', () => {
  it('accepts a complete profile', () => {
    const result = parseProfile(VALID);

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.profile.businessName).toBe('Northwind Studio');
      expect(result.profile.currency).toBe('GBP');
    }
  });

  it('accepts a profile written as a JSON string', () => {
    const result = parseProfile(JSON.stringify(VALID));

    expect(result.status).toBe('ok');
  });

  it('accepts a profile written in each supported currency', () => {
    for (const currency of ['USD', 'GBP', 'CAD', 'AUD', 'EUR', 'CHF', 'INR', 'AED'] as const) {
      const result = parseProfile({ ...VALID, currency });
      expect(result.status, currency).toBe('ok');
    }
  });

  it('rejects a profile from another version', () => {
    const result = parseProfile({ ...VALID, version: PROFILE_VERSION + 1 });

    expect(result.status).toBe('invalid');
  });

  it('rejects a broken value', () => {
    expect(parseProfile(null).status).toBe('invalid');
    expect(parseProfile('not json').status).toBe('invalid');
    expect(parseProfile({ ...VALID, businessName: 42 }).status).toBe('invalid');
    expect(parseProfile({ ...VALID, currency: 'XYZ' }).status).toBe('invalid');
    expect(parseProfile({ ...VALID, taxIdLabel: 'Nope' }).status).toBe('invalid');
  });

  it('rejects a currency that is only stringifiable, not a string', () => {
    const currency = { toString: () => 'GBP' };
    expect(parseProfile({ ...VALID, currency }).status).toBe('invalid');
    expect(businessProfileSchema.safeParse({ ...VALID, currency }).success).toBe(false);
  });

  it('rejects a logo that is not an image data URL', () => {
    expect(parseProfile({ ...VALID, logoDataUrl: 'javascript:alert(1)' }).status).toBe('invalid');
    expect(
      parseProfile({ ...VALID, logoDataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }).status,
    ).toBe('invalid');
    expect(
      parseProfile({ ...VALID, logoDataUrl: 'data:image/png;base64,iVBORw0KGgo=' }).status,
    ).toBe('ok');
  });

  it('agrees with the Zod contract', () => {
    const fixtures: unknown[] = [
      VALID,
      { ...VALID, version: 99 },
      { ...VALID, currency: 'XYZ' },
      { ...VALID, taxIdLabel: 'Nope' },
      { ...VALID, logoDataUrl: 'javascript:alert(1)' },
      { ...VALID, businessName: 42 },
      { ...VALID, currency: { toString: () => 'GBP' } },
      null,
    ];

    for (const fixture of fixtures) {
      const runtime = parseProfile(fixture).status === 'ok';
      const schema = businessProfileSchema.safeParse(fixture).success;

      expect(runtime, JSON.stringify(fixture)).toBe(schema);
    }
  });

  it('accepts a logo up to the size the encoder promises, and no further', () => {
    const prefix = 'data:image/png;base64,';
    const atLimit = `${prefix}${'A'.repeat(MAX_STORED_LOGO_CHARS - prefix.length)}`;
    expect(atLimit.length).toBe(MAX_STORED_LOGO_CHARS);
    expect(parseProfile({ ...VALID, logoDataUrl: atLimit }).status).toBe('ok');

    const overLimit = `${atLimit}A`;
    expect(parseProfile({ ...VALID, logoDataUrl: overLimit }).status).toBe('invalid');
    expect(businessProfileSchema.safeParse({ ...VALID, logoDataUrl: overLimit }).success).toBe(false);
  });
});

describe('loadProfile, saveProfile and clearProfile', () => {
  it('reports an empty store', () => {
    expect(loadProfile(memoryStorage()).status).toBe('empty');
  });

  it('writes and reads a profile', () => {
    const storage = memoryStorage();

    expect(saveProfile(VALID, storage)).toBe(true);

    const result = loadProfile(storage);
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.profile.businessName).toBe('Northwind Studio');
    }
  });

  it('removes the profile again', () => {
    const storage = memoryStorage();
    saveProfile(VALID, storage);
    clearProfile(storage);

    expect(loadProfile(storage).status).toBe('empty');
  });

  it('stores under its own key', () => {
    const storage = memoryStorage();
    saveProfile(VALID, storage);

    expect(storage.getItem(PROFILE_STORAGE_KEY)).toContain('Northwind Studio');
  });

  it('survives a store that refuses to work', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;

    expect(loadProfile(broken).status).toBe('unavailable');
    expect(saveProfile(VALID, broken)).toBe(false);
    expect(() => clearProfile(broken)).not.toThrow();
  });
});
