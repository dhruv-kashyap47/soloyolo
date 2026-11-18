/**
 * Tiny, dependency-free preference layer shared by the home-page islands.
 *
 * Everything stays in localStorage: the product promises no account and no
 * server tracking. A custom event lets independent Preact islands react to a
 * change without pulling in a state library.
 *
 * Only the eight markets the site supports appear here (United States, United
 * Kingdom, Canada, Australia, Germany, Switzerland, India, United Arab
 * Emirates). "International" is the neutral fallback for a visitor whose
 * browser locale is not one of them.
 */

export type RegionId =
  | 'US'
  | 'UK'
  | 'CA'
  | 'AU'
  | 'DE'
  | 'CH'
  | 'IN'
  | 'AE'
  | 'GLOBAL';

export interface Region {
  id: RegionId;
  label: string;
  currency: string;
  payment: string;
  compliance: string;
}

export const DEFAULT_REGION: Region = {
  id: 'GLOBAL',
  label: 'International',
  currency: 'USD',
  payment: 'Card or bank transfer.',
  compliance: 'Add the supplier and customer tax IDs each side requires.',
};

export const REGIONS: readonly Region[] = [
  {
    id: 'US',
    label: 'United States',
    currency: 'USD',
    payment: 'Card, ACH or PayPal. Add W-9 on request.',
    compliance: 'No federal e-invoice mandate. State sales tax varies.',
  },
  {
    id: 'UK',
    label: 'United Kingdom',
    currency: 'GBP',
    payment: 'BACS, card or PayPal. IBAN and sort code are normal.',
    compliance: 'VAT invoice fields. Mandatory B2B e-invoicing from 2029.',
  },
  {
    id: 'CA',
    label: 'Canada',
    currency: 'CAD',
    payment: 'Interac e-Transfer, card or PayPal.',
    compliance: 'GST/HST registration number and provincial rate.',
  },
  {
    id: 'AU',
    label: 'Australia',
    currency: 'AUD',
    payment: 'Bank transfer, card or PayPal. PayID is common.',
    compliance: 'ABN and GST on a tax invoice.',
  },
  {
    id: 'DE',
    label: 'Germany',
    currency: 'EUR',
    payment: 'SEPA transfer, card or PayPal.',
    compliance: 'VAT invoice fields at the 19% standard rate. XRechnung or ZUGFeRD for public buyers.',
  },
  {
    id: 'CH',
    label: 'Switzerland',
    currency: 'CHF',
    payment: 'Bank transfer, card or PayPal. QR-bill is common.',
    compliance: 'MWST at 8.1%. The CHE number goes on a VAT invoice.',
  },
  {
    id: 'IN',
    label: 'India',
    currency: 'INR',
    payment: 'UPI, IMPS/NEFT or card.',
    compliance: 'GSTIN, HSN/SAC and the CGST/SGST or IGST split.',
  },
  {
    id: 'AE',
    label: 'United Arab Emirates',
    currency: 'AED',
    payment: 'Bank transfer or card.',
    compliance: 'VAT at 5%. The supplier TRN goes on a tax invoice.',
  },
  {
    id: 'GLOBAL',
    label: 'International',
    currency: 'USD',
    payment: 'Card or bank transfer.',
    compliance: 'Add the supplier and customer tax IDs each side requires.',
  },
];

const REGION_KEY = 'soloyolo-region';

export const REGION_EVENT = 'soloyolo:region';

export function getRegionId(): RegionId {
  try {
    const stored = localStorage.getItem(REGION_KEY);
    if (REGIONS.some((region) => region.id === stored)) return stored as RegionId;
  } catch {
    /* storage unavailable */
  }
  return guessRegion();
}

/** Best-effort first-visit region from the browser locale. Never stored as fact. */
function guessRegion(): RegionId {
  try {
    const locale = navigator.language.toLowerCase();
    const map: Record<string, RegionId> = {
      'en-us': 'US',
      'en-gb': 'UK',
      'en-ca': 'CA',
      'fr-ca': 'CA',
      'en-au': 'AU',
      'de-de': 'DE',
      'de-ch': 'CH',
      'fr-ch': 'CH',
      'it-ch': 'CH',
      'en-in': 'IN',
      'hi-in': 'IN',
      'ar-ae': 'AE',
      'en-ae': 'AE',
    };
    return map[locale] ?? 'GLOBAL';
  } catch {
    return 'GLOBAL';
  }
}

export function getRegion(): Region {
  return REGIONS.find((region) => region.id === getRegionId()) ?? DEFAULT_REGION;
}

export function setRegion(id: RegionId): void {
  try {
    localStorage.setItem(REGION_KEY, id);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent<RegionId>(REGION_EVENT, { detail: id }));
}

const RATE_KEY = 'soloyolo-rate';
export const RATE_EVENT = 'soloyolo:rate';

/**
 * The rate the desk assumes before the visitor has simulated anything.
 * It equals the hourly-rate engine's answer for the QuickEstimator's
 * default inputs ($80,000 income, $12,000 expenses, 48 weeks, 25 h) —
 * a unit test pins the two together so this can never drift.
 */
export const DEFAULT_RATE = 76.67;

export function getRate(): number {
  try {
    const value = Number(localStorage.getItem(RATE_KEY));
    if (Number.isFinite(value) && value > 0) return value;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_RATE;
}

export function setRate(value: number): void {
  try {
    localStorage.setItem(RATE_KEY, String(value));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent<number>(RATE_EVENT, { detail: value }));
}
