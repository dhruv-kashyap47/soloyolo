/**
 * Tiny, dependency-free preference layer shared by the home-page islands.
 *
 * Everything stays in localStorage: the product promises no account and no
 * server tracking. A custom event lets independent Preact islands react to a
 * change without pulling in a state library.
 */

export type RegionId =
  | 'US'
  | 'UK'
  | 'EU'
  | 'CA'
  | 'AU'
  | 'IN'
  | 'SEA'
  | 'LATAM'
  | 'MEA'
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
  payment: 'Wise or Payoneer for cross-border, card for client convenience.',
  compliance: 'Add the buyer and supplier tax IDs required by both countries.',
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
    payment: 'BACS, card or PayPal. IBAN + sort code are normal.',
    compliance: 'VAT invoice fields. Mandatory B2B e-invoicing from 2029.',
  },
  {
    id: 'EU',
    label: 'Europe',
    currency: 'EUR',
    payment: 'SEPA/IBAN first; card as a fallback.',
    compliance: 'VAT rules. Germany issues XRechnung/ZUGFeRD; EU ViDA from 2030.',
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
    id: 'IN',
    label: 'India',
    currency: 'INR',
    payment: 'UPI, IMPS/NEFT or card.',
    compliance: 'GSTIN, HSN/SAC and CGST/SGST or IGST split.',
  },
  {
    id: 'SEA',
    label: 'Southeast Asia',
    currency: 'USD',
    payment: 'Local wallets (PayNow, PromptPay), card or bank transfer.',
    compliance: 'GST/e-invoice rules differ by country (e.g. Malaysia MyInvois).',
  },
  {
    id: 'LATAM',
    label: 'Latin America',
    currency: 'USD',
    payment: 'PIX in Brazil, SPEI in Mexico, card or bank transfer.',
    compliance: 'Brazil NF-e/NFS-e and Mexico CFDI 4.0 are clearance-based.',
  },
  {
    id: 'MEA',
    label: 'Middle East & Africa',
    currency: 'USD',
    payment: 'Bank transfer, card, M-Pesa/mobile money, Payoneer.',
    compliance: 'UAE 5% VAT/TRN; several markets run clearance e-invoicing.',
  },
  {
    id: 'GLOBAL',
    label: 'International',
    currency: 'USD',
    payment: 'Wise or Payoneer for cross-border, card for client convenience.',
    compliance: 'Add the buyer and supplier tax IDs required by both countries.',
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
    const region = locale.split('-')[1] ?? '';
    const map: Record<string, RegionId> = {
      us: 'US',
      ca: 'CA',
      gb: 'UK',
      de: 'EU',
      fr: 'EU',
      es: 'EU',
      it: 'EU',
      nl: 'EU',
      ie: 'EU',
      au: 'AU',
      nz: 'AU',
      in: 'IN',
      sg: 'SEA',
      my: 'SEA',
      id: 'SEA',
      th: 'SEA',
      ph: 'SEA',
      vn: 'SEA',
      br: 'LATAM',
      mx: 'LATAM',
      ae: 'MEA',
      za: 'MEA',
      ke: 'MEA',
      ng: 'MEA',
    };
    return map[region] ?? 'GLOBAL';
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
