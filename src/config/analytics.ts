import analytics from '../../config/analytics.json' with { type: 'json' };

/**
 * The approved Google tag.
 *
 * `GTM-NJMCB9BQ` is a Tag Manager container, not a bare GA4 destination.
 * The container carries the GA4 tag `G-XTBSGSTR60`; the site only needs to
 * load the container and let it decide which measurement tags to fire.
 *
 * The CSP origins live beside the id so the build-time policy and the runtime
 * network contract cannot drift apart.
 */
export const GOOGLE_TAG_ID = analytics.googleTagId;
export const GOOGLE_TAG_GA4_ID = analytics.ga4MeasurementId;

export const ANALYTICS_ORIGINS = {
  script: analytics.scriptOrigins,
  connect: analytics.connectOrigins,
  img: analytics.imgOrigins,
  frame: analytics.frameOrigins,
} as const;

/**
 * True for the Google Tag Manager / GA4 hosts the approved container may
 * contact. Used by the network tests so they still fail on every unapproved
 * third party.
 */
export function isAnalyticsOrigin(origin: string): boolean {
  const host = new URL(origin).hostname;
  return (
    host === 'www.googletagmanager.com' ||
    host === 'www.google-analytics.com' ||
    host.endsWith('.google-analytics.com')
  );
}
