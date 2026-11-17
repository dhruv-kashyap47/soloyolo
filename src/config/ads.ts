/**
 * One place to control ad density, networks and experiments.
 *
 * Every slot has a fixed reserved box (no CLS), a lazy trigger, a clear label,
 * and a size that fits the macOS squircle grid. Set PUBLIC_ADSENSE_CLIENT and
 * the matching PUBLIC_ADSENSE_SLOT_* variables to go live; without them the
 * slots render neutral placeholders that keep the exact same geometry.
 */

export type AdSlotId = 'leaderboard' | 'infeed' | 'sidebar' | 'anchor' | 'end';

export interface AdSlotConfig {
  id: AdSlotId;
  network: 'adsense' | 'none';
  enabled: boolean;
  envSlot: string;
  /** CSS class that reserves the exact box. Defined in global.css. */
  boxClass: string;
  lazy: boolean;
  refresh: boolean;
  /** Minimum gap from interactive controls, in pixels (adjacent-sibling rule). */
  safeGap: number;
  description: string;
}

export const AD_CONFIG: Record<AdSlotId, AdSlotConfig> = {
  leaderboard: {
    id: 'leaderboard',
    network: 'adsense',
    enabled: true,
    envSlot: 'PUBLIC_ADSENSE_SLOT_LEADERBOARD',
    boxClass: 'ad-slot-leaderboard',
    lazy: false,
    refresh: false,
    safeGap: 16,
    description: 'Above the fold, just below the tool header. Highest-value viewable unit.',
  },
  infeed: {
    id: 'infeed',
    network: 'adsense',
    enabled: true,
    envSlot: 'PUBLIC_ADSENSE_SLOT_INFEED',
    boxClass: 'ad-slot-infeed',
    lazy: true,
    refresh: false,
    safeGap: 16,
    description: 'Native-style unit between calculator and generator sections.',
  },
  sidebar: {
    id: 'sidebar',
    network: 'adsense',
    enabled: true,
    envSlot: 'PUBLIC_ADSENSE_SLOT_SIDEBAR',
    boxClass: 'ad-slot-sidebar',
    lazy: true,
    refresh: false,
    safeGap: 24,
    description: 'Sticky 300x600 rail on wide desktop only. No mobile intrusion.',
  },
  anchor: {
    id: 'anchor',
    network: 'adsense',
    enabled: true,
    envSlot: 'PUBLIC_ADSENSE_SLOT_ANCHOR',
    boxClass: 'ad-slot-anchor',
    lazy: true,
    refresh: false,
    safeGap: 12,
    description: 'Dismissible mobile anchor after consent and first interaction.',
  },
  end: {
    id: 'end',
    network: 'adsense',
    enabled: true,
    envSlot: 'PUBLIC_ADSENSE_SLOT_END',
    boxClass: 'ad-slot-end',
    lazy: true,
    refresh: false,
    safeGap: 16,
    description: 'Below-the-fold closing unit, after the primary action.',
  },
};

/** Optional A/B variant from ?adVariant=a|b, used as a data attribute for tests. */
export function adVariant(): 'a' | 'b' {
  if (typeof window === 'undefined') return 'a';
  const value = new URLSearchParams(window.location.search).get('adVariant');
  return value === 'b' ? 'b' : 'a';
}
