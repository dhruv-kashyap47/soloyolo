import { useEffect, useRef, useState } from 'preact/hooks';

interface Props {
  /** The build-time engine result, so the demo never drifts from the maths. */
  rate: number;
  currency: string;
  income: string;
  costs: string;
  weeks: number;
  hours: number;
  quote: string;
  revenue: string;
  capacity: string;
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

/**
 * The one animated demo on the home page.
 *
 * The server renders the finished poster state, so the first paint is the
 * result, not an empty window. Hydration replays the six-second sequence once.
 * There is no loop: the replay control is a real button, and reduced motion
 * keeps the poster without ever starting a timer.
 */
export default function RateDemo({ rate, currency, income, costs, weeks, hours, quote, revenue, capacity }: Props) {
  const [shown, setShown] = useState(rate);
  const [running, setRunning] = useState(false);
  const frame = useRef(0);
  const startTimer = useRef(0);
  const replayFrame = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const play = () => {
      setRunning(false);
      replayFrame.current = window.requestAnimationFrame(() => {
        setRunning(true);
        const started = performance.now();
        const duration = 1500;
        const tick = (now: number) => {
          const progress = Math.min(1, (now - started) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setShown(Number((rate * eased).toFixed(2)));
          if (progress < 1) frame.current = window.requestAnimationFrame(tick);
        };
        setShown(0);
        frame.current = window.requestAnimationFrame(tick);
      });
    };

    startTimer.current = window.setTimeout(play, 650);

    return () => {
      window.clearTimeout(startTimer.current);
      window.cancelAnimationFrame(frame.current);
      window.cancelAnimationFrame(replayFrame.current);
    };
  }, [rate]);

  const replay = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(rate);
      return;
    }
    setRunning(false);
    replayFrame.current = window.requestAnimationFrame(() => {
      setRunning(true);
      const started = performance.now();
      const duration = 1500;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setShown(Number((rate * eased).toFixed(2)));
        if (progress < 1) frame.current = window.requestAnimationFrame(tick);
      };
      setShown(0);
      frame.current = window.requestAnimationFrame(tick);
    });
  };

  return (
    <div class={running ? 'rate-demo is-running' : 'rate-demo'} data-rate-demo>
      <div class="demo-window">
        <div class="demo-titlebar" aria-hidden="true">
          <span class="demo-dots">
            <i />
            <i />
            <i />
          </span>
          <span>Hourly rate</span>
          <span class="demo-currency">{currency}</span>
        </div>

        <div class="demo-body">
          <div class="demo-fields" aria-hidden="true">
            <div class="demo-field" style="--i: 0">
              <span>Income target</span>
              <b>{income}</b>
            </div>
            <div class="demo-field" style="--i: 1">
              <span>Business costs</span>
              <b>{costs}</b>
            </div>
            <div class="demo-field" style="--i: 2">
              <span>Working weeks</span>
              <b>{weeks}</b>
            </div>
            <div class="demo-field" style="--i: 3">
              <span>Billable hours</span>
              <b>{hours}/week</b>
            </div>
            <span class="demo-caret" aria-hidden="true" />
          </div>

          <div class="demo-facts" aria-hidden="true">
            <span><small>Revenue needed</small><b>{revenue}</b></span>
            <span><small>Billable hours</small><b>{capacity}/yr</b></span>
          </div>

          <div class="demo-trace" aria-hidden="true">
            <span>({income} + {costs})</span>
            <span>÷ ({weeks} weeks × {hours} h)</span>
            <span class="demo-trace-result">= {money(shown, currency)}/h</span>
          </div>

          <div class="demo-result">
            <span class="demo-result-label">Your rate</span>
            <p class="demo-rate">
              <strong>{money(shown, currency)}</strong>
              <span>/hour</span>
            </p>
            <p class="demo-note">Covers costs, then pays you.</p>
          </div>
        </div>

        <div class="demo-foot">
          <span class="demo-quote">40 hours: {quote}</span>
          <button type="button" class="demo-replay sq" onClick={replay}>
            Replay
          </button>
        </div>
      </div>

      <p class="sr-only">
        Example: {income} target income, {costs} costs, {weeks} working weeks and {hours}{' '}
        billable hours a week produce a rate of {money(rate, currency)} an hour. The same rate
        prices 40 hours at {quote}.
      </p>
    </div>
  );
}
