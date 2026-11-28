import { isCurrencyCode, type CurrencyCode } from '@/lib/formatting/currency';
import { TAX_ID_LABELS, type TaxIdLabel } from '@/lib/generators/document';
import { MAX_STORED_LOGO_CHARS } from '@/lib/storage/logo';

/**
 * The optional business profile.
 *
 * A returning freelancer should not type their own address into every
 * invoice. The profile is offered, never forced, and it lives only in this
 * browser: there is no account, no server and nothing to sync.
 *
 * The shape is versioned so a future change can read an old profile and
 * migrate it, or throw it away rather than guess. The runtime parser below is
 * hand written on purpose: Zod stays in the build, where it validates page
 * content, and never reaches the browser bundle. `profile.schema.ts` holds
 * the same contract in Zod form, and a unit test proves the two agree.
 */

export const PROFILE_STORAGE_KEY = 'soloyolo-business-profile';
export const PROFILE_VERSION = 1;

/** Longest a stored string can be. Anything longer is a sign of a bad write. */
const MAX_FIELD_LENGTH = 600;

export interface BusinessProfile {
  version: number;
  businessName: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  taxIdLabel: TaxIdLabel;
  logoDataUrl: string;
  defaultNotes: string;
  currency: CurrencyCode;
  /** When the profile was last written, as an ISO timestamp. */
  updatedAt: string;
}

export type ProfileLoadResult =
  | { status: 'empty' }
  | { status: 'ok'; profile: BusinessProfile }
  | { status: 'invalid' }
  | { status: 'unavailable' };

export function emptyProfile(): BusinessProfile {
  return {
    version: PROFILE_VERSION,
    businessName: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    taxId: '',
    taxIdLabel: 'Tax ID',
    logoDataUrl: '',
    defaultNotes: '',
    currency: 'USD',
    updatedAt: '',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(
  source: Record<string, unknown>,
  key: string,
  maxLength = MAX_FIELD_LENGTH,
): string | null {
  const value = source[key];
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  if (value.length > maxLength) return null;
  return value;
}

function readTaxIdLabel(source: Record<string, unknown>): TaxIdLabel | null {
  const value = source.taxIdLabel;
  if (value === undefined || value === null) return 'Tax ID';
  if (typeof value !== 'string') return null;
  if (!TAX_ID_LABELS.includes(value as TaxIdLabel)) return null;
  return value as TaxIdLabel;
}

function readLogo(source: Record<string, unknown>): string | null {
  const value = source.logoDataUrl;
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  if (value === '') return '';
  // Only a data URL of an image the tool itself produced is accepted.
  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return null;
  if (value.length > MAX_STORED_LOGO_CHARS) return null;
  return value;
}

/**
 * Reads a profile out of an unknown value.
 *
 * Anything that is not a complete, well formed profile is rejected rather
 * than repaired: a half read profile would put the wrong address on a
 * customer invoice.
 */
export function parseProfile(raw: unknown): ProfileLoadResult {
  if (typeof raw === 'string') {
    try {
      return parseProfile(JSON.parse(raw));
    } catch {
      return { status: 'invalid' };
    }
  }

  if (!isRecord(raw)) return { status: 'invalid' };

  if (raw.version !== PROFILE_VERSION) return { status: 'invalid' };

  const businessName = readString(raw, 'businessName');
  const address = readString(raw, 'address');
  const email = readString(raw, 'email');
  const phone = readString(raw, 'phone');
  const website = readString(raw, 'website');
  const taxId = readString(raw, 'taxId');
  const defaultNotes = readString(raw, 'defaultNotes');
  const updatedAt = readString(raw, 'updatedAt', 64);
  const taxIdLabel = readTaxIdLabel(raw);
  const logoDataUrl = readLogo(raw);

  const currency = raw.currency;

  if (
    businessName === null ||
    address === null ||
    email === null ||
    phone === null ||
    website === null ||
    taxId === null ||
    defaultNotes === null ||
    updatedAt === null ||
    taxIdLabel === null ||
    logoDataUrl === null
  ) {
    return { status: 'invalid' };
  }

  // A non-string that stringifies to a currency code (an object with a custom
  // `toString`, for example) would pass a `String(currency)` check and then
  // reach Intl as an object. Require the stored value itself to be a string.
  if (currency !== undefined && (typeof currency !== 'string' || !isCurrencyCode(currency))) {
    return { status: 'invalid' };
  }

  return {
    status: 'ok',
    profile: {
      version: PROFILE_VERSION,
      businessName,
      address,
      email,
      phone,
      website,
      taxId,
      taxIdLabel,
      logoDataUrl,
      defaultNotes,
      currency: (currency ?? 'USD') as CurrencyCode,
      updatedAt,
    },
  };
}

function safeStorage(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Reads the saved profile, if there is one worth reading. */
export function loadProfile(storage?: Storage | null): ProfileLoadResult {
  const store = safeStorage(storage);
  if (!store) return { status: 'unavailable' };

  let raw: string | null;
  try {
    raw = store.getItem(PROFILE_STORAGE_KEY);
  } catch {
    return { status: 'unavailable' };
  }

  if (raw === null || raw === '') return { status: 'empty' };
  return parseProfile(raw);
}

/** Writes the profile. Returns false when the browser refused to store it. */
export function saveProfile(profile: BusinessProfile, storage?: Storage | null): boolean {
  const store = safeStorage(storage);
  if (!store) return false;

  try {
    store.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...profile, version: PROFILE_VERSION }));
    return true;
  } catch {
    // A full quota is the usual reason. The caller tells the visitor plainly.
    return false;
  }
}

/** Removes the profile from this browser. */
export function clearProfile(storage?: Storage | null): void {
  const store = safeStorage(storage);
  if (!store) return;

  try {
    store.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
