/**
 * Home demo choreography.
 *
 * The demos are server-rendered posters: every value is real engine output,
 * and the final frame is on screen before this file runs. When motion is
 * allowed and a demo is in view, this controller plays a short scripted story
 * by moving a cursor and switching the root's `data-step`. CSS owns every
 * transition, so the runtime only changes attributes and a few text nodes.
 *
 * Rules the controller enforces:
 * - every demo in view animates, each on its own automatic loop;
 * - an off-screen demo pauses;
 * - a hidden tab pauses everything;
 * - `prefers-reduced-motion` leaves the poster alone;
 * - the visitor can pause motion for the whole page.
 */

type Step = {
  /** Milliseconds to wait before applying this step. */
  delay: number;
  /** The visual state the root moves to. */
  step?: string;
  /** A data attribute the scene reads, e.g. which country is selected. */
  country?: string;
  /** Named target inside the demo for the cursor. `_start` parks it. */
  at?: string;
  atX?: number;
  atY?: number;
  /** A short press on the current target. */
  press?: boolean;
  /** Values or state that need more than an attribute. */
  run?: (root: HTMLElement) => void;
};

type Story = {
  steps: Step[];
  /** Milliseconds after the last step before the story starts again. */
  loopDelay?: number;
};

type DemoState = {
  story: Story;
  index: number;
  timer: number;
  at: string | null;
};

const states = new WeakMap<HTMLElement, DemoState>();
const visible = new Set<HTMLElement>();
const running = new Set<HTMLElement>();
const rollFrames = new WeakMap<HTMLElement, number>();

let userPaused = false;
let started = false;

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => motionQuery.matches;

function number(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function setRoll(element: HTMLElement | null, to: number): void {
  if (!element) return;
  element.dataset.rollFrom = element.dataset.rollTo ?? element.dataset.rollFrom ?? '0';
  element.dataset.rollTo = String(to);
}

function roll(root: HTMLElement, selector: string, duration = 820): void {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) return;

  const previous = rollFrames.get(element);
  if (previous) cancelAnimationFrame(previous);

  const from = number(element.dataset.rollFrom, 0);
  const to = number(element.dataset.rollTo, 0);
  const currency = element.dataset.rollCurrency;
  const locale = element.dataset.rollLocale ?? 'en-US';
  const min = number(element.dataset.rollMin, currency ? 2 : 0);
  const max = number(element.dataset.rollMax, min);
  const suffix = element.dataset.rollSuffix ?? '';

  const format = new Intl.NumberFormat(locale, {
    ...(currency ? { style: 'currency', currency } : {}),
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });

  const begin = performance.now();

  const tick = (now: number) => {
    const progress = Math.min(1, (now - begin) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = from + (to - from) * eased;
    element.textContent = `${format.format(value)}${suffix}`;
    if (progress < 1) {
      rollFrames.set(element, requestAnimationFrame(tick));
    } else {
      element.textContent = `${format.format(to)}${suffix}`;
      rollFrames.delete(element);
    }
  };

  rollFrames.set(element, requestAnimationFrame(tick));
}

function park(root: HTMLElement, x = 0.92, y = 0.07): void {
  const box = root.getBoundingClientRect();
  root.style.setProperty('--cursor-x', `${box.width * x}px`);
  root.style.setProperty('--cursor-y', `${box.height * y}px`);
  root.dataset.cursor = 'hidden';
}

function aim(root: HTMLElement, target: string, x = 0.5, y = 0.5): void {
  if (target === '_start') {
    park(root);
    return;
  }

  const element = root.querySelector<HTMLElement>(`[data-target="${target}"]`);
  if (!element) return;

  const box = root.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  root.style.setProperty('--cursor-x', `${rect.left - box.left + rect.width * x}px`);
  root.style.setProperty('--cursor-y', `${rect.top - box.top + rect.height * y}px`);
  root.dataset.cursor = 'visible';
  root.dataset.at = target;
}

function setTax(root: HTMLElement, country: 'UK' | 'DE', mode: 'add' | 'remove'): void {
  const tax = root.querySelector<HTMLElement>('[data-roll="tax"]');
  const modeLabel = root.querySelector<HTMLElement>('[data-tax-mode]');
  const total = root.querySelector<HTMLElement>('[data-tax-total]');
  const totalLabel = root.querySelector<HTMLElement>('[data-tax-total-label]');

  if (mode === 'add') {
    setRoll(tax, Number(country === 'UK' ? root.dataset.ukTax : root.dataset.deTax));
    if (total)
      total.textContent = (country === 'UK' ? root.dataset.ukTotal : root.dataset.deTotal) ?? '';
    if (modeLabel) modeLabel.textContent = 'added';
    if (totalLabel) totalLabel.textContent = 'Total with tax';
  } else {
    const net = Number(root.dataset.deNet ?? 0);
    const amount = Number(root.dataset.amountRaw ?? 1000);
    setRoll(tax, Math.round((amount - net) * 100) / 100);
    if (total) total.textContent = root.dataset.deNet ?? '';
    if (modeLabel) modeLabel.textContent = 'removed';
    if (totalLabel) totalLabel.textContent = 'Net before tax';
  }

  roll(root, '[data-roll="tax"]', 700);
}

function press(root: HTMLElement): void {
  root.dataset.pressed = 'true';
  const target = root.dataset.at;
  const element = target ? root.querySelector<HTMLElement>(`[data-target="${target}"]`) : null;
  element?.setAttribute('data-pressed', 'true');

  window.setTimeout(() => {
    root.dataset.pressed = 'false';
    element?.removeAttribute('data-pressed');
  }, 170);
}

function applyStep(root: HTMLElement, step: Step): void {
  if (step.step !== undefined) root.dataset.step = step.step;
  if (step.country !== undefined) root.dataset.country = step.country;
  if (step.at !== undefined) aim(root, step.at, step.atX, step.atY);
  if (step.press) press(root);
  step.run?.(root);
}

function clearTimer(root: HTMLElement): void {
  const state = states.get(root);
  if (state?.timer) {
    window.clearTimeout(state.timer);
    state.timer = 0;
  }
}

function scheduleNext(root: HTMLElement): void {
  const state = states.get(root);
  if (!state || state.timer || userPaused || reduced() || !running.has(root)) return;

  const next = state.index + 1;

  if (next >= state.story.steps.length) {
    state.timer = window.setTimeout(() => {
      state.timer = 0;
      restart(root);
    }, state.story.loopDelay ?? 1200);
    return;
  }

  const step = state.story.steps[next];
  if (!step) return;

  state.timer = window.setTimeout(() => {
    state.timer = 0;
    state.index = next;
    applyStep(root, step);
    scheduleNext(root);
  }, step.delay);
}

function restart(root: HTMLElement): void {
  const state = states.get(root);
  if (!state || userPaused || reduced() || !running.has(root)) return;

  state.index = 0;
  const first = state.story.steps[0];
  if (first) applyStep(root, first);
  scheduleNext(root);
}

function begin(root: HTMLElement): void {
  if (userPaused || reduced()) return;

  const state = states.get(root);
  if (!state) return;

  running.add(root);
  root.dataset.playing = 'true';

  if (state.index < 0) {
    // Show the opening frame without animating the poster into it.
    root.dataset.instant = 'true';
    state.index = 0;
    const first = state.story.steps[0];
    if (first) applyStep(root, first);
    void root.offsetWidth;
    requestAnimationFrame(() => {
      delete root.dataset.instant;
    });
    scheduleNext(root);
    return;
  }

  scheduleNext(root);
}

function pause(root: HTMLElement): void {
  clearTimer(root);
  running.delete(root);
  root.dataset.playing = 'false';
  root.dataset.pressed = 'false';
}

function pauseAll(): void {
  for (const root of [...running]) pause(root);
}

function playVisible(): void {
  if (userPaused || reduced()) return;
  for (const root of [...visible]) begin(root);
}

function syncToggles(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-demo-pause]')) {
    button.setAttribute('aria-pressed', String(userPaused));
    const label = button.querySelector<HTMLElement>('[data-demo-pause-label]');
    if (label) label.textContent = userPaused ? 'Play motion' : 'Pause motion';
  }
}

function setUserPaused(next: boolean): void {
  userPaused = next;
  if (userPaused) {
    pauseAll();
  } else {
    playVisible();
  }
  syncToggles();
}

function initDemo(root: HTMLElement): void {
  const name = root.dataset.demo;
  if (!name) return;
  const story = stories[name];
  if (!story) return;

  // The hero poster is the paid invoice. The rate and quote views are only
  // needed once the story runs, so they arrive as inert templates and are
  // instantiated here instead of being laid out on first paint.
  if (name === 'rate-pass') {
    const body = root.querySelector<HTMLElement>('.rp-body');
    if (body && !body.querySelector('.rp-view-rate')) {
      root.querySelectorAll<HTMLTemplateElement>('template[data-rp-view]').forEach((template) => {
        body.append(template.content.cloneNode(true));
      });
    }
  }

  states.set(root, { story, index: -1, timer: 0, at: null });
  park(root);
  root.dataset.ready = 'true';

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.add(root);
          begin(root);
        } else {
          visible.delete(root);
          pause(root);
        }
      }
    },
    { threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
  );

  // A film harness runs the one demo it names without the viewport deciding.
  if (!film) observer.observe(root);

  const onResize = () => {
    const at = root.dataset.at;
    if (at) aim(root, at, 0.82, 0.62);
  };
  window.addEventListener('resize', onResize, { passive: true });
}

const stories: Record<string, Story> = {
  'rate-pass': {
    loopDelay: 900,
    steps: [
      { delay: 0, step: '0', at: '_start', run: (r) => roll(r, '[data-roll="rate"]', 900) },
      { delay: 1500, at: 'use-rate', atX: 0.82, atY: 0.64 },
      { delay: 800, press: true },
      { delay: 240, step: '1', at: 'make-invoice', atX: 0.82, atY: 0.64 },
      { delay: 1900, press: true },
      {
        delay: 260,
        step: '2',
        at: 'print',
        atX: 0.84,
        atY: 0.6,
        run: (r) => roll(r, '[data-roll="total"]', 760),
      },
      { delay: 2100, press: true },
      { delay: 260, step: '3', run: (r) => r.setAttribute('data-printed', 'true') },
      { delay: 2700, at: 'new-doc', atX: 0.6, atY: 0.6 },
      { delay: 850, press: true },
      { delay: 260, step: '0', at: '_start', run: (r) => r.removeAttribute('data-printed') },
    ],
  },
  'invoice-countries': {
    loopDelay: 700,
    steps: [
      { delay: 0, country: 'UK', at: 'tab-US', atX: 0.5, atY: 0.6 },
      { delay: 1500, press: true },
      { delay: 240, country: 'US' },
      { delay: 1500, at: 'tab-DE', atX: 0.5, atY: 0.6 },
      { delay: 700, press: true },
      { delay: 240, country: 'DE' },
      { delay: 1500, at: 'tab-IN', atX: 0.5, atY: 0.6 },
      { delay: 700, press: true },
      { delay: 240, country: 'IN' },
      { delay: 1700, at: 'tab-UK', atX: 0.5, atY: 0.6 },
      { delay: 800, press: true },
      { delay: 240, country: 'UK' },
    ],
  },
  'project-profit': {
    loopDelay: 700,
    steps: [
      { delay: 0, step: '0', at: '_start' },
      { delay: 1500, at: 'toggle-contractor', atX: 0.5, atY: 0.5 },
      { delay: 700, press: true },
      {
        delay: 240,
        step: '1',
        run: (r) => {
          const profit = r.querySelector<HTMLElement>('[data-roll="profit"]');
          const margin = r.querySelector<HTMLElement>('[data-roll="margin"]');
          setRoll(profit, Number(r.dataset.profitWide ?? 0));
          setRoll(margin, Number(r.dataset.marginWide ?? 0));
          roll(r, '[data-roll="profit"]', 760);
          roll(r, '[data-roll="margin"]', 760);
        },
      },
      { delay: 3000, press: true },
      {
        delay: 240,
        step: '0',
        run: (r) => {
          const profit = r.querySelector<HTMLElement>('[data-roll="profit"]');
          const margin = r.querySelector<HTMLElement>('[data-roll="margin"]');
          setRoll(profit, Number(r.dataset.profitBase ?? 0));
          setRoll(margin, Number(r.dataset.marginBase ?? 0));
          roll(r, '[data-roll="profit"]', 760);
          roll(r, '[data-roll="margin"]', 760);
        },
      },
    ],
  },
  'payment-fee': {
    loopDelay: 700,
    steps: [
      { delay: 0, step: '0', at: '_start' },
      { delay: 1500, at: 'plan-b', atX: 0.5, atY: 0.6 },
      { delay: 700, press: true },
      {
        delay: 240,
        step: '1',
        run: (r) => {
          setRoll(
            r.querySelector<HTMLElement>('[data-roll="fee"]'),
            Number(r.dataset.feeWide ?? 0),
          );
          setRoll(
            r.querySelector<HTMLElement>('[data-roll="net"]'),
            Number(r.dataset.netWide ?? 0),
          );
          roll(r, '[data-roll="fee"]', 700);
          roll(r, '[data-roll="net"]', 700);
        },
      },
      { delay: 3000, press: true },
      {
        delay: 240,
        step: '0',
        run: (r) => {
          setRoll(
            r.querySelector<HTMLElement>('[data-roll="fee"]'),
            Number(r.dataset.feeBase ?? 0),
          );
          setRoll(
            r.querySelector<HTMLElement>('[data-roll="net"]'),
            Number(r.dataset.netBase ?? 0),
          );
          roll(r, '[data-roll="fee"]', 700);
          roll(r, '[data-roll="net"]', 700);
        },
      },
    ],
  },
  tax: {
    loopDelay: 700,
    steps: [
      { delay: 0, step: '0', country: 'UK', at: '_start', run: (r) => setTax(r, 'UK', 'add') },
      { delay: 1500, at: 'country-DE', atX: 0.5, atY: 0.6 },
      { delay: 700, press: true },
      { delay: 240, step: '1', country: 'DE', run: (r) => setTax(r, 'DE', 'add') },
      { delay: 1600, at: 'mode-remove', atX: 0.5, atY: 0.6 },
      { delay: 700, press: true },
      { delay: 240, step: '2', run: (r) => setTax(r, 'DE', 'remove') },
      { delay: 1600, at: 'mode-add', atX: 0.5, atY: 0.6 },
      { delay: 700, press: true },
      { delay: 240, step: '1', run: (r) => setTax(r, 'DE', 'add') },
      { delay: 1600, at: 'country-UK', atX: 0.5, atY: 0.6 },
      { delay: 700, press: true },
      { delay: 240, step: '0', country: 'UK', run: (r) => setTax(r, 'UK', 'add') },
    ],
  },
  documents: {
    loopDelay: 700,
    steps: [
      { delay: 0, step: '0', at: '_start' },
      { delay: 1600, at: 'show-receipt', atX: 0.5, atY: 0.6 },
      { delay: 700, press: true },
      { delay: 240, step: '1' },
      { delay: 3000, at: 'show-quote', atX: 0.5, atY: 0.6 },
      { delay: 700, press: true },
      { delay: 240, step: '0' },
    ],
  },
  reminder: {
    loopDelay: 700,
    steps: [
      { delay: 0, step: '0', at: '_start' },
      { delay: 1500, at: 'tone-1', atX: 0.5, atY: 0.6 },
      { delay: 600, press: true },
      { delay: 240, step: '1' },
      { delay: 1400, at: 'tone-2', atX: 0.5, atY: 0.6 },
      { delay: 600, press: true },
      { delay: 240, step: '2' },
      { delay: 1500, at: 'send', atX: 0.8, atY: 0.6 },
      { delay: 700, press: true },
      { delay: 240, step: '3' },
      { delay: 2400, at: 'new', atX: 0.7, atY: 0.6 },
      { delay: 800, press: true },
      { delay: 240, step: '0' },
    ],
  },
};

const film = new URLSearchParams(window.location.search).get('demo');

function boot(): void {
  if (started) return;
  started = true;

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-demo-pause]')) {
    button.addEventListener('click', () => setUserPaused(!userPaused));
  }
  syncToggles();

  if (reduced()) return;

  document.querySelectorAll<HTMLElement>('[data-demo]').forEach(initDemo);

  // A film harness can name one demo and run it without waiting for an idle
  // callback or for the page to scroll it into view. Only the demo named in
  // the query starts; the rest keep their poster.
  if (film) {
    document.documentElement.dataset.film = 'true';
    const root = document.querySelector<HTMLElement>(`[data-demo="${film}"]`);
    if (root) {
      visible.add(root);
      begin(root);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseAll();
    } else {
      playVisible();
    }
  });

  motionQuery.addEventListener('change', () => {
    if (reduced()) {
      pauseAll();
      for (const root of document.querySelectorAll<HTMLElement>('[data-demo]')) {
        const state = states.get(root);
        if (state) state.index = -1;
        root.dataset.step = 'poster';
        root.dataset.cursor = 'hidden';
      }
    } else {
      playVisible();
    }
  });
}

const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 300));
if (film) boot();
else idle(boot);
