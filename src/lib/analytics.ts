/**
 * Local-first product analytics for the home page.
 *
 * The toolkit promises that no data leaves the browser, so this module keeps a
 * bounded event buffer plus session counters and emits a DOM event. A site owner
 * can forward `soloyolo:event` to GA4 / Ad Manager / a self-hosted collector;
 * nothing is sent by default. Ad networks receive their own consent-gated data.
 */

export interface ProductEvent {
  name: string;
  detail?: Record<string, string | number | boolean>;
  at: number;
}

const BUFFER_KEY = '__soloyoloEvents';
const SESSION_KEY = 'soloyolo-session';
const RETURN_KEY = 'soloyolo-last-visit';

declare global {
  interface Window {
    __soloyoloEvents?: ProductEvent[];
  }
}

export function sendEvent(
  name: string,
  detail: Record<string, string | number | boolean> = {},
): void {
  const event: ProductEvent = { name, detail, at: Date.now() };
  const buffer = (window[BUFFER_KEY] ??= []);
  buffer.push(event);
  if (buffer.length > 200) buffer.shift();
  window.dispatchEvent(new CustomEvent<ProductEvent>('soloyolo:event', { detail: event }));
}

/** Call once per page load. Returns the session's page count and return status. */
export function startSession(page: string): { pages: number; returning: boolean } {
  let pages = 1;
  let returning = false;
  try {
    // Storage is user editable, so a corrupt counter must not turn every later
    // session into NaN or Infinity. A bad value restarts the count at one.
    const previous = Number(sessionStorage.getItem(SESSION_KEY) ?? '0');
    pages = Number.isFinite(previous) && previous >= 0 ? previous + 1 : 1;
    sessionStorage.setItem(SESSION_KEY, String(pages));

    const last = Number(localStorage.getItem(RETURN_KEY) ?? '0');
    returning = Number.isFinite(last) && last > 0;
    localStorage.setItem(RETURN_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
  sendEvent('session_start', { page, pages, returning });
  return { pages, returning };
}

/** Ad viewability per IAB: 50% of pixels in view for at least one second. */
export function observeAdViewability(element: Element, slot: string): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && timer === undefined) {
          timer = setTimeout(() => {
            sendEvent('ad_view', { slot, viewable: true });
            timer = undefined;
          }, 1000);
        } else if (
          (!entry.isIntersecting || entry.intersectionRatio < 0.5) &&
          timer !== undefined
        ) {
          clearTimeout(timer);
          timer = undefined;
        }
      }
    },
    { threshold: [0, 0.5, 1] },
  );
  observer.observe(element);
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    observer.disconnect();
  };
}
