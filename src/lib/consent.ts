/**
 * Analytics consent, shared by the banner, the footer settings control and the
 * GTM bootstrap.
 *
 * The site loads no Google tag before an explicit "Accept analytics". The
 * choice is versioned so a future change to what is asked can invalidate an old
 * answer instead of silently applying it. Advertising consent is deliberately
 * not part of this model: ads are not enabled and ad storage stays denied.
 */

export const CONSENT_VERSION = 2;
export const CONSENT_KEY = 'soloyolo-consent-v2';

/** The pre-versioning key. Read once so an existing "Accept all" is honoured. */
export const LEGACY_CONSENT_KEY = 'soloyolo-consent';

export interface ConsentState {
  version: typeof CONSENT_VERSION;
  analytics: boolean;
}

export interface ConsentRead {
  state: ConsentState;
  /** True when the choice came from the legacy key and should be rewritten. */
  migrated: boolean;
}

export type ConsentDetail = ConsentState & { ads: false; value: 'accepted' | 'declined' };

function state(analytics: boolean): ConsentState {
  return { version: CONSENT_VERSION, analytics };
}

function parseState(raw: unknown): ConsentState | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as { version?: unknown; analytics?: unknown };
  if (record.version !== CONSENT_VERSION) return null;
  if (typeof record.analytics !== 'boolean') return null;
  return state(record.analytics);
}

/** Reads the pre-v2 value: `all`, `essential`, or the old `{ads, analytics}` JSON. */
function parseLegacy(raw: string): ConsentState | null {
  if (raw === 'all') return state(true);
  if (raw === 'essential') return state(false);

  try {
    const parsed = JSON.parse(raw) as { version?: unknown; analytics?: unknown } | null;
    // The old granular form had no version field. A future versioned value
    // must not be mistaken for it.
    if (parsed && parsed.version === undefined && typeof parsed.analytics === 'boolean') {
      return state(parsed.analytics);
    }
  } catch {
    /* not JSON: not a choice this site wrote */
  }
  return null;
}

function parseCurrent(raw: string | null): ConsentState | null {
  if (raw === null || raw === '') return null;
  try {
    return parseState(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** Parses either a current or legacy stored value. Exported for the tests. */
export function parseStoredConsent(raw: string | null): ConsentRead | null {
  const current = parseCurrent(raw);
  if (current) return { state: current, migrated: false };

  const legacy = raw === null ? null : parseLegacy(raw);
  return legacy ? { state: legacy, migrated: true } : null;
}

function defaultStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Reads the saved choice, preferring the current key and migrating once. */
export function readConsent(storage: Storage | null = defaultStorage()): ConsentRead | null {
  if (!storage) return null;

  try {
    const current = parseCurrent(storage.getItem(CONSENT_KEY));
    if (current) return { state: current, migrated: false };

    const legacyRaw = storage.getItem(LEGACY_CONSENT_KEY);
    const legacy = legacyRaw === null ? null : parseLegacy(legacyRaw);
    return legacy ? { state: legacy, migrated: true } : null;
  } catch {
    return null;
  }
}

/** Writes the choice. Returns false when the browser refuses storage. */
export function saveConsent(
  analytics: boolean,
  storage: Storage | null = defaultStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(CONSENT_KEY, JSON.stringify(state(analytics)));
    return true;
  } catch {
    return false;
  }
}

export function analyticsAllowed(read: ConsentRead | null): boolean {
  return read?.state.analytics === true;
}
