/**
 * Intent bridge for the home quick actions.
 *
 * The dashboard islands hydrate on idle, so a very fast tap on "Start
 * timer" can land before any listener exists. Dispatching through here
 * keeps a queue of undelivered intents; the dashboard drains it on
 * mount, so the click is never lost.
 */

export type IntentName = 'soloyolo:timer-toggle' | 'soloyolo:focus-clients' | 'soloyolo:log-time';

interface PendingIntent {
  name: IntentName;
  detail?: number;
}

declare global {
  interface Window {
    __soloyoloPendingIntents?: PendingIntent[];
    /** Set by the eager palette bridge in BaseLayout when the palette was
     *  asked to open before its island had hydrated. */
    __soloyoloPalettePending?: boolean;
  }
}

export function dispatchIntent(name: IntentName, detail?: number): void {
  (window.__soloyoloPendingIntents ??= []).push({ name, detail });
  window.dispatchEvent(
    detail === undefined ? new Event(name) : new CustomEvent<number>(name, { detail }),
  );
}

/** Returns and clears intents fired before the listener existed. */
export function consumePendingIntents(): PendingIntent[] {
  const pending = window.__soloyoloPendingIntents ?? [];
  window.__soloyoloPendingIntents = [];
  return pending;
}
