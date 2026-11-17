import Decimal from 'decimal.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import { calculateHourlyRate, quoteWork } from '@/lib/calculators/hourlyRate';
import { formatCurrency, isCurrencyCode, type CurrencyCode } from '@/lib/formatting/currency';
import { formatNumber } from '@/lib/formatting/number';
import { getRegion, REGION_EVENT, setRate } from '@/lib/prefs';
import { sendEvent } from '@/lib/analytics';

interface Preset {
  label: string;
  income: string;
  expenses: string;
  weeks: string;
  hours: string;
}

interface EstimatorInputs {
  income: string;
  expenses: string;
  weeks: string;
  hours: string;
}

const PRESETS: readonly Preset[] = [
  {
    label: 'Standard Freelancer',
    income: '80000',
    expenses: '12000',
    weeks: '48',
    hours: '25',
  },
  {
    label: 'Senior Consultant',
    income: '120000',
    expenses: '18000',
    weeks: '46',
    hours: '22',
  },
  {
    label: 'Studio / Side Hustle',
    income: '45000',
    expenses: '6000',
    weeks: '48',
    hours: '15',
  },
];

const DEFAULT_INPUTS: EstimatorInputs = {
  income: '80000',
  expenses: '12000',
  weeks: '48',
  hours: '25',
};

const ESTIMATOR_KEY = 'soloyolo-estimator';

/** Only restored when every value fits the controls' own ranges. */
function readStoredInputs(): EstimatorInputs | null {
  try {
    const raw = localStorage.getItem(ESTIMATOR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Record<keyof EstimatorInputs, unknown>>;
    const read = (key: keyof EstimatorInputs, min: number, max: number): string | null => {
      const value = parsed[key];
      if (typeof value !== 'string') return null;
      const num = Number(value);
      return Number.isFinite(num) && num >= min && num <= max ? value : null;
    };
    const income = read('income', 20000, 250000);
    const expenses = read('expenses', 0, 10000000);
    const weeks = read('weeks', 1, 52);
    const hours = read('hours', 10, 40);
    if (!income || !expenses || !weeks || !hours) return null;
    return { income, expenses, weeks, hours };
  } catch {
    return null;
  }
}

function writeStoredInputs(inputs: EstimatorInputs): void {
  try {
    localStorage.setItem(ESTIMATOR_KEY, JSON.stringify(inputs));
  } catch {
    /* storage unavailable: the simulator still works, it just forgets */
  }
}

export default function QuickEstimator() {
  const [income, setIncome] = useState(DEFAULT_INPUTS.income);
  const [expenses, setExpenses] = useState(DEFAULT_INPUTS.expenses);
  const [weeks, setWeeks] = useState(DEFAULT_INPUTS.weeks);
  const [hours, setHours] = useState(DEFAULT_INPUTS.hours);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const applyRegion = () => {
      const code = getRegion().currency;
      if (isCurrencyCode(code)) setCurrency(code);
    };
    applyRegion();

    // Continue where you left off: the last sliders position returns with
    // the visitor (and recomputes the same saved rate, not the default).
    const stored = readStoredInputs();
    if (stored) {
      setIncome(stored.income);
      setExpenses(stored.expenses);
      setWeeks(stored.weeks);
      setHours(stored.hours);
    }

    window.addEventListener(REGION_EVENT, applyRegion);
    return () => window.removeEventListener(REGION_EVENT, applyRegion);
  }, []);

  useEffect(() => {
    writeStoredInputs({ income, expenses, weeks, hours });
  }, [income, expenses, weeks, hours]);

  // Compute exact decimal hourly rate. When the inputs cannot produce a
  // number, the panel says so instead of inventing one.
  const outcome = calculateHourlyRate({
    targetIncome: new Decimal(income || '0'),
    annualExpenses: new Decimal(expenses || '0'),
    workingWeeks: new Decimal(weeks || '48'),
    billableHoursPerWeek: new Decimal(hours || '25'),
  });

  let hourlyRateStr = '—';
  let dayRateStr = '—';
  let revenueStr = '—';
  let quote40hStr = '—';
  let billableHoursYear = '—';

  if (outcome.ok) {
    const rate = outcome.value.hourlyRateRounded;
    hourlyRateStr = formatCurrency(rate, currency);
    revenueStr = formatCurrency(outcome.value.requiredAnnualRevenue, currency);
    billableHoursYear = formatNumber(outcome.value.billableHoursPerYear);
    dayRateStr = formatCurrency(rate.times(8), currency);
    quote40hStr = formatCurrency(quoteWork(rate, 40), currency);
  }

  const currentRate = outcome.ok ? outcome.value.hourlyRateRounded.toNumber() : null;

  // The dashboard's earnings figure uses the same rate the visitor sees
  // here — pushed only after the visitor actually changes something, so a
  // reload never clobbers the saved rate with the default inputs.
  const rateSynced = useRef(false);
  useEffect(() => {
    if (currentRate === null) return;
    if (!rateSynced.current) {
      rateSynced.current = true;
      return;
    }
    setRate(currentRate);
  }, [currentRate]);

  const handleCopy = () => {
    if (!navigator.clipboard || !outcome.ok) return;
    navigator.clipboard.writeText(`${hourlyRateStr}/hr (${dayRateStr}/day)`);
    sendEvent('rate_copied', { currency });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (preset: Preset) => {
    setIncome(preset.income);
    setExpenses(preset.expenses);
    setWeeks(preset.weeks);
    setHours(preset.hours);
  };

  return (
    <div
      class="card card-raised relative flex flex-col overflow-hidden p-6 sm:p-7 border border-line-strong bg-surface transition-all duration-200"
      data-enter
      style="--enter-i: 2"
    >
      {/* Card Header */}
      <div class="flex items-center justify-between gap-3 border-b border-line pb-4">
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <p class="text-[0.6875rem] font-semibold tracking-[0.12em] text-muted uppercase">
            Interactive Rate Simulator
          </p>
        </div>

        <div class="flex items-center gap-2">
          <select
            class="currency-select rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-semibold text-accent-strong outline-none hover:border-line-strong transition-colors cursor-pointer"
            value={currency}
            onChange={(e) => setCurrency((e.target as HTMLSelectElement).value as CurrencyCode)}
            aria-label="Currency"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
            <option value="AUD">AUD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="CHF">CHF (Fr.)</option>
            <option value="AED">AED (AED)</option>
          </select>

          <span class="rounded-full border border-accent-line bg-accent-soft px-2.5 py-0.5 text-[0.6875rem] font-semibold text-accent-strong">
            Live Math
          </span>
        </div>
      </div>

      {/* Preset pills */}
      <div class="mt-4 flex flex-wrap items-center gap-1.5">
        <span class="text-[0.6875rem] text-muted uppercase tracking-wider mr-1">Presets:</span>
        {PRESETS.map((p) => {
          const isActive = income === p.income && hours === p.hours;
          return (
            <button
              type="button"
              key={p.label}
              onClick={() => applyPreset(p)}
              class={`preset-pill rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-accent-ink font-semibold'
                  : 'bg-surface-2 text-ink-soft hover:bg-line hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Hero rate highlight */}
      <div class="mt-5 rounded-2xl border border-line bg-canvas/60 p-4 sm:p-5">
        <div class="flex items-baseline justify-between gap-2 flex-wrap">
          <p class="flex items-baseline gap-2">
            <span class="text-4xl sm:text-5xl font-medium tracking-tight text-accent-strong tabular-nums">
              {hourlyRateStr}
            </span>
            <span class="text-sm font-medium text-ink-soft">/ hour</span>
          </p>

          <button
            type="button"
            onClick={handleCopy}
            class="copy-rate flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-soft hover:text-ink hover:border-line-strong transition-colors"
            title="Copy hourly rate"
            disabled={!outcome.ok}
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="text-emerald-400">
                  <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span class="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" stroke="currentColor" stroke-width="1.4"/>
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <p class="mt-2 text-xs text-ink-soft leading-relaxed">
          {outcome.ok ? (
            <>
              Covers {revenueStr} annual target revenue, billed across {billableHoursYear} hours/year.
            </>
          ) : (
            <>Move the sliders to a workable week and the rate appears here.</>
          )}
        </p>

        {/* Breakdown chips */}
        <div class="mt-4 grid grid-cols-3 gap-2 border-t border-line/60 pt-3">
          <div>
            <span class="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">Day rate (8h)</span>
            <p class="text-sm font-semibold text-ink tabular-nums mt-0.5">{dayRateStr}</p>
          </div>
          <div>
            <span class="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">40h Project</span>
            <p class="text-sm font-semibold text-ink tabular-nums mt-0.5">{quote40hStr}</p>
          </div>
          <div>
            <span class="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">Annual Target</span>
            <p class="text-sm font-semibold text-ink tabular-nums mt-0.5">{revenueStr}</p>
          </div>
        </div>
      </div>

      {/* Reactive Sliders / Controls */}
      <div class="mt-5 space-y-3.5">
        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-medium text-ink-soft">Target Net Income</span>
            <span class="font-mono font-semibold text-ink tabular-nums">
              {formatCurrency(new Decimal(income || '0'), currency)}
            </span>
          </div>
          <input
            type="range"
            min="20000"
            max="250000"
            step="5000"
            value={income}
            onInput={(e) => setIncome((e.target as HTMLInputElement).value)}
            class="range-input"
            aria-label="Target Annual Income"
          />
        </div>

        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-medium text-ink-soft">Billable Hours / Week</span>
            <span class="font-mono font-semibold text-ink tabular-nums">{hours} hrs/wk</span>
          </div>
          <input
            type="range"
            min="10"
            max="40"
            step="1"
            value={hours}
            onInput={(e) => setHours((e.target as HTMLInputElement).value)}
            class="range-input"
            aria-label="Billable Hours Per Week"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div class="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
        <a
          href="/calculators/hourly-rate-calculator/"
          class="link-draw inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-strong sm:min-h-10"
        >
          See full breakdown with tax & expenses
          <span aria-hidden="true">→</span>
        </a>

        <a
          href="/generators/invoice-generator/"
          class="hidden sm:inline-flex text-xs text-muted hover:text-ink transition-colors"
        >
          Draft invoice at this rate
        </a>
      </div>
    </div>
  );
}
