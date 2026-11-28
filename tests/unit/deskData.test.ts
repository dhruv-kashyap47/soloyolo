import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Decimal from 'decimal.js';

import { DEFAULT_RATE } from '@/lib/prefs';
import { calculateHourlyRate } from '@/lib/calculators/hourlyRate';

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

/** The desk libs read the global localStorage, like the browser. */
function installStorage() {
  const storage = memoryStorage();
  Object.assign(globalThis, { localStorage: storage });
  return storage;
}

async function loadModule(path: string) {
  vi.resetModules();
  return import(path);
}

describe('default rate stays pinned to the engine', () => {
  it('equals the hourly-rate engine answer for the default desk inputs', () => {
    const outcome = calculateHourlyRate({
      targetIncome: new Decimal('80000'),
      annualExpenses: new Decimal('12000'),
      workingWeeks: new Decimal('48'),
      billableHoursPerWeek: new Decimal('25'),
    });

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.value.hourlyRateRounded.toNumber()).toBe(DEFAULT_RATE);
    }
  });
});

describe('documents log', () => {
  const KEY = 'soloyolo-docs-created';

  beforeEach(() => {
    installStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts empty', async () => {
    const log = await loadModule('@/lib/documents-log');
    expect(log.getDocumentLog()).toEqual([]);
    expect(log.documentsThisWeek()).toBe(0);
  });

  it('counts prints and this week only', async () => {
    const log = await loadModule('@/lib/documents-log');
    log.recordDocumentPrinted('invoice');
    log.recordDocumentPrinted('quote');

    const entries = log.getDocumentLog();
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ kind: 'invoice' });
    expect(log.documentsThisWeek()).toBe(2);
  });

  it('ignores garbage in storage', async () => {
    localStorage.setItem(KEY, '{"not":"an array"}');
    const log = await loadModule('@/lib/documents-log');
    expect(log.getDocumentLog()).toEqual([]);
  });

  it('drops entries with a bad kind or timestamp', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([{ kind: 'invoice', at: 1 }, { kind: 'novel', at: 2 }, { kind: 'receipt' }]),
    );
    const log = await loadModule('@/lib/documents-log');
    expect(log.getDocumentLog()).toEqual([{ kind: 'invoice', at: 1 }]);
  });

  it('drops a timestamp JSON turns into Infinity or a negative number', async () => {
    // 1e400 is valid JSON number syntax and JSON.parse returns Infinity.
    localStorage.setItem(
      KEY,
      '[{"kind":"invoice","at":1e400},{"kind":"quote","at":-5},{"kind":"receipt","at":10}]',
    );
    const log = await loadModule('@/lib/documents-log');
    expect(log.getDocumentLog()).toEqual([{ kind: 'receipt', at: 10 }]);
  });

  it('reads at most the newest 200 entries from a tampered log', async () => {
    const entries = Array.from({ length: 250 }, (_, index) => ({
      kind: 'invoice',
      at: 1_000 + index,
    }));
    localStorage.setItem(KEY, JSON.stringify(entries));
    const log = await loadModule('@/lib/documents-log');
    const read = log.getDocumentLog();

    expect(read).toHaveLength(200);
    expect(read[0]).toEqual({ kind: 'invoice', at: 1_050 });
    expect(read.at(-1)).toEqual({ kind: 'invoice', at: 1_249 });
  });

  it('excludes earlier weeks from the weekly count', async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 3600 * 1000;
    localStorage.setItem(KEY, JSON.stringify([{ kind: 'invoice', at: eightDaysAgo }]));
    const log = await loadModule('@/lib/documents-log');
    expect(log.documentsThisWeek()).toBe(0);
    expect(log.getDocumentLog()).toHaveLength(1);
  });
});

describe('recents and pins', () => {
  beforeEach(() => {
    installStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records tool visits most-recent-first, deduped and capped', async () => {
    const palette = await loadModule('@/lib/palette');
    palette.recordToolVisit('invoice-generator');
    palette.recordToolVisit('hourly-rate-calculator');
    palette.recordToolVisit('invoice-generator');

    expect(palette.getRecents()).toEqual(['invoice-generator', 'hourly-rate-calculator']);
  });

  it('records the page the browser is on when it is a known tool', async () => {
    const palette = await loadModule('@/lib/palette');
    palette.recordVisitForLocation('/generators/invoice-generator/');
    expect(palette.getRecents()).toEqual(['invoice-generator']);

    palette.recordVisitForLocation('/');
    expect(palette.getRecents()).toEqual(['invoice-generator']);

    palette.recordVisitForLocation('/calculators/');
    expect(palette.getRecents()).toEqual(['invoice-generator']);
  });

  it('never records an action entry as a recent tool', async () => {
    const palette = await loadModule('@/lib/palette');
    palette.recordVisitForLocation('/generators/invoice-generator/');
    const recents = palette.getRecents();
    expect(recents).not.toContain('action-start-timer');
    expect(recents).not.toContain('action-add-client');
  });

  it('turns saved clients into invoice actions', async () => {
    const palette = await loadModule('@/lib/palette');
    localStorage.setItem(
      'soloyolo-clients',
      JSON.stringify([{ id: '1', name: 'Bright Coffee' }, { id: '2', name: '' }, 'garbage']),
    );

    const items = palette.clientPaletteItems(palette.getClients());
    expect(items).toHaveLength(1);
    expect(items[0]!.name).toBe('Invoice Bright Coffee');
    expect(items[0]!.href).toBe('/generators/invoice-generator/?client=Bright%20Coffee');
    expect(items[0]!.dynamic).toBe(true);
  });

  it('ignores malformed client storage', async () => {
    const palette = await loadModule('@/lib/palette');
    localStorage.setItem('soloyolo-clients', 'not json');
    expect(palette.getClients()).toEqual([]);
  });
});
