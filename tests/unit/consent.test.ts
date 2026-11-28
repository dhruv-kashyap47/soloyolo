import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  analyticsAllowed,
  CONSENT_KEY,
  CONSENT_VERSION,
  LEGACY_CONSENT_KEY,
  parseStoredConsent,
  readConsent,
  saveConsent,
} from '@/lib/consent';

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

describe('consent storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts a current versioned choice', () => {
    expect(
      parseStoredConsent(JSON.stringify({ version: CONSENT_VERSION, analytics: true })),
    ).toEqual({
      state: { version: CONSENT_VERSION, analytics: true },
      migrated: false,
    });
  });

  it('rejects a malformed or future-version choice instead of guessing', () => {
    expect(parseStoredConsent(null)).toBeNull();
    expect(parseStoredConsent('')).toBeNull();
    expect(parseStoredConsent('not json')).toBeNull();
    expect(parseStoredConsent(JSON.stringify({ version: 99, analytics: true }))).toBeNull();
    expect(parseStoredConsent(JSON.stringify({ version: CONSENT_VERSION }))).toBeNull();
    expect(
      parseStoredConsent(JSON.stringify({ version: CONSENT_VERSION, analytics: 'yes' })),
    ).toBeNull();
  });

  it('migrates the old all/essential strings', () => {
    expect(parseStoredConsent('all')).toEqual({
      state: { version: CONSENT_VERSION, analytics: true },
      migrated: true,
    });
    expect(parseStoredConsent('essential')).toEqual({
      state: { version: CONSENT_VERSION, analytics: false },
      migrated: true,
    });
  });

  it('migrates the old granular JSON and ignores its ad grant', () => {
    expect(parseStoredConsent(JSON.stringify({ ads: true, analytics: false }))).toEqual({
      state: { version: CONSENT_VERSION, analytics: false },
      migrated: true,
    });
    expect(
      parseStoredConsent(JSON.stringify({ ads: true, analytics: true }))?.state.analytics,
    ).toBe(true);
  });

  it('reads the current key before the legacy key', () => {
    const storage = memoryStorage();
    storage.setItem(CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, analytics: false }));
    storage.setItem(LEGACY_CONSENT_KEY, 'all');

    expect(readConsent(storage)).toEqual({
      state: { version: CONSENT_VERSION, analytics: false },
      migrated: false,
    });
  });

  it('migrates a legacy key exactly once', () => {
    const storage = memoryStorage();
    storage.setItem(LEGACY_CONSENT_KEY, 'all');

    expect(readConsent(storage)?.state.analytics).toBe(true);
    expect(saveConsent(true, storage)).toBe(true);
    storage.removeItem(LEGACY_CONSENT_KEY);

    expect(readConsent(storage)).toEqual({
      state: { version: CONSENT_VERSION, analytics: true },
      migrated: false,
    });
  });

  it('writes a versioned state and reports a blocked store', () => {
    const storage = memoryStorage();
    expect(saveConsent(false, storage)).toBe(true);
    expect(JSON.parse(storage.getItem(CONSENT_KEY) ?? '{}')).toEqual({
      version: CONSENT_VERSION,
      analytics: false,
    });

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

    expect(saveConsent(true, broken)).toBe(false);
    expect(readConsent(broken)).toBeNull();
  });

  it('only reports analytics as allowed for an explicit true', () => {
    expect(analyticsAllowed(null)).toBe(false);
    expect(
      analyticsAllowed({ state: { version: CONSENT_VERSION, analytics: false }, migrated: false }),
    ).toBe(false);
    expect(
      analyticsAllowed({ state: { version: CONSENT_VERSION, analytics: true }, migrated: false }),
    ).toBe(true);
  });
});
