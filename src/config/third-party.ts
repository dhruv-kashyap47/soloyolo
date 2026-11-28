/**
 * P7-14 — the only third-party origins this site may talk to.
 *
 * The values come from `config/third-party.json`, which is filled from a real
 * `scripts/capture-third-parties.mjs` capture against the configured ad + CMP
 * staging build. Do not type an origin here from memory: P6-11b–f and the CSP
 * both read this object, so an invented entry would test a fiction.
 *
 * `cmp` is what loads before the visitor chooses (including the AdSense /
 * Publisher tag that deploys the Google-certified CMP). `adStack` is what may
 * load only after advertising consent. Both lists are empty until the capture,
 * which makes the policy fail closed: no ad origin is allowed by the CSP.
 */
import allowlist from '../../config/third-party.json' with { type: 'json' };

export interface ThirdPartyAllowlist {
  capturedOn: string | null;
  captureSource: string | null;
  cmp: readonly string[];
  adStack: readonly string[];
}

export const THIRD_PARTY: ThirdPartyAllowlist = allowlist;

/** Origins requested before a consent choice. */
export const CMP_ORIGINS = THIRD_PARTY.cmp;

/** Origins that may load only after advertising consent. */
export const AD_STACK_ORIGINS = THIRD_PARTY.adStack;

/** Both lists, de-duplicated, for CSP and the network contract. */
export const THIRD_PARTY_ORIGINS: readonly string[] = [
  ...new Set([...CMP_ORIGINS, ...AD_STACK_ORIGINS]),
];

/**
 * True only when a real capture exists. The P6-11b–f harness refuses to run
 * on an empty allowlist instead of passing vacuously.
 */
export const HAS_THIRD_PARTY_CAPTURE: boolean =
  THIRD_PARTY.capturedOn !== null && THIRD_PARTY_ORIGINS.length > 0;
