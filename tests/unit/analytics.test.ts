import { afterEach, describe, expect, it, vi } from 'vitest';

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

/**
 * `startSession` talks to `window`, `sessionStorage` and `localStorage`. The
 * unit test supplies the same globals the browser would, and captures the
 * event it dispatches, so the returned values and the payload can both be
 * checked.
 */
function installBrowser() {
  const events: { name: string; detail: Record<string, unknown> }[] = [];
  const session = memoryStorage();
  const local = memoryStorage();

  vi.stubGlobal('sessionStorage', session);
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal(
    'CustomEvent',
    class {
      type: string;
      detail: unknown;
      constructor(type: string, init: { detail?: unknown } = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
  );
  vi.stubGlobal('window', {
    dispatchEvent(event: { type: string; detail: Record<string, unknown> }) {
      events.push({ name: event.type, detail: event.detail ?? {} });
      return true;
    },
  });

  return { events, session, local };
}

async function loadAnalytics() {
  vi.resetModules();
  return import('@/lib/analytics');
}

describe('startSession', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('counts pages in the session and records the visit', async () => {
    const { events, local } = installBrowser();
    const analytics = await loadAnalytics();

    expect(analytics.startSession('/')).toMatchObject({ pages: 1, returning: false });
    expect(analytics.startSession('/tools/')).toMatchObject({ pages: 2, returning: true });
    expect(events.map((event) => event.name)).toEqual(['soloyolo:event', 'soloyolo:event']);
    expect(events.map((event) => event.detail.name)).toEqual(['session_start', 'session_start']);
    expect(events.map((event) => (event.detail.detail as { pages: number }).pages)).toEqual([1, 2]);
    expect(local.getItem('soloyolo-last-visit')).toEqual(expect.any(String));
  });

  it('restarts at one when the stored page counter is corrupt', async () => {
    const { session } = installBrowser();
    session.setItem('soloyolo-session', 'not a number');
    const analytics = await loadAnalytics();

    const result = analytics.startSession('/');
    expect(result).toEqual({ pages: 1, returning: false });
    expect(session.getItem('soloyolo-session')).toBe('1');
  });

  it('rejects an infinite or negative stored counter', async () => {
    const { session } = installBrowser();
    const analytics = await loadAnalytics();

    session.setItem('soloyolo-session', '1e400');
    expect(analytics.startSession('/').pages).toBe(1);

    session.setItem('soloyolo-session', '-3');
    expect(analytics.startSession('/').pages).toBe(1);
  });

  it('does not report a returning visitor from a corrupt timestamp', async () => {
    const { local } = installBrowser();
    local.setItem('soloyolo-last-visit', 'yesterday');
    const analytics = await loadAnalytics();

    expect(analytics.startSession('/').returning).toBe(false);
    expect(Number(local.getItem('soloyolo-last-visit'))).toBeGreaterThan(0);
  });
});
