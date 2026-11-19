import { useEffect, useRef, useState } from 'preact/hooks';
import { formatCurrency, isCurrencyCode } from '@/lib/formatting/currency';
import {
  DEFAULT_REGION,
  DEFAULT_RATE,
  getRate,
  getRegion,
  REGIONS,
  REGION_EVENT,
  setRegion,
  type RegionId,
} from '@/lib/prefs';
import { sendEvent } from '@/lib/analytics';
import { consumePendingIntents } from '@/lib/intents';
import { documentsThisWeek, getDocumentLog } from '@/lib/documents-log';
import {
  getRecents,
  getPinned,
  ALL_COMMAND_ITEMS,
  type PaletteItem,
  type ClientRecord,
} from '@/lib/palette';
import { PROFILE_STORAGE_KEY, type BusinessProfile } from '@/lib/storage/profile';

interface WeeklyTrackerState {
  weekKey: string;
  hours: number;
  goal: number;
  activeDays: number[];
}

const TRACKER_KEY = 'soloyolo-weekly-tracker';
const CLIENTS_KEY = 'soloyolo-clients';
const TIMER_KEY = 'soloyolo-timer-start';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function getWeekKey(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function streakDays(activeDays: number[]): number {
  const today = new Date().getDay();
  let streak = 0;
  let cursor = today;
  for (let i = 0; i < 7; i += 1) {
    if (activeDays.includes(cursor)) {
      streak += 1;
      cursor = (cursor + 6) % 7;
    } else if (i === 0) {
      cursor = (cursor + 6) % 7;
    } else {
      break;
    }
  }
  return streak;
}

interface Props {
  /** `compact` is the bento tile: the real local desk, stripped to this week. */
  variant?: 'full' | 'compact';
}

export default function TodayDashboard({ variant = 'full' }: Props) {
  const [regionId, setRegionId] = useState<RegionId>('GLOBAL');
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [tracker, setTracker] = useState<WeeklyTrackerState>({
    weekKey: getWeekKey(),
    hours: 0,
    goal: 25,
    activeDays: [],
  });
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientName, setClientName] = useState('');
  const [recents, setRecents] = useState<PaletteItem[]>([]);
  const [pinned, setPinned] = useState<PaletteItem[]>([]);
  const [docs, setDocs] = useState(0);
  const [docsWeek, setDocsWeek] = useState(0);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [greeting, setGreeting] = useState('Hello');
  const clientInput = useRef<HTMLInputElement>(null);
  const goalInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sendEvent('today_ready', {});
    setRegionId(getRegion().id);
    setRate(getRate());
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

    try {
      const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (rawProfile) {
        const parsed = readJson<BusinessProfile | null>(PROFILE_STORAGE_KEY, null);
        if (parsed && typeof parsed.businessName === 'string' && parsed.businessName.trim()) {
          setProfile(parsed);
        }
      }
    } catch {
      /* storage unavailable */
    }

    const week = getWeekKey();
    const stored = readJson<Partial<WeeklyTrackerState> | null>(TRACKER_KEY, null);
    const validTracker =
      stored &&
      stored.weekKey === week &&
      typeof stored.goal === 'number' &&
      stored.goal >= 1 &&
      stored.goal <= 80 &&
      typeof stored.hours === 'number' &&
      Number.isFinite(stored.hours) &&
      Array.isArray(stored.activeDays) &&
      stored.activeDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    if (validTracker) {
      setTracker(stored as WeeklyTrackerState);
    } else {
      const fresh: WeeklyTrackerState = { weekKey: week, hours: 0, goal: 25, activeDays: [] };
      setTracker(fresh);
      writeJson(TRACKER_KEY, fresh);
    }

    const storedClients = readJson<unknown>(CLIENTS_KEY, []);
    setClients(
      Array.isArray(storedClients)
        ? storedClients
            .filter(
              (entry): entry is ClientRecord =>
                typeof entry === 'object' &&
                entry !== null &&
                typeof (entry as ClientRecord).id === 'string' &&
                typeof (entry as ClientRecord).name === 'string',
            )
            .slice(0, 6)
        : [],
    );
    const log = getDocumentLog();
    setDocs(log.length);
    setDocsWeek(documentsThisWeek());
    try {
      const started = Number(localStorage.getItem(TIMER_KEY) ?? '0');
      setTimerStart(started > 0 ? started : null);
    } catch {
      setTimerStart(null);
    }

    const pinnedIds = getPinned();
    const recentIds = getRecents();
    // Only navigable tools can appear as "continue where you left off" rows;
    // a pinned action (Start timer) has no page to link to.
    const find = (id: string) =>
      ALL_COMMAND_ITEMS.find((item) => item.id === id && Boolean(item.href));
    setPinned(pinnedIds.map(find).filter((item): item is PaletteItem => Boolean(item)));
    setRecents(
      recentIds
        .filter((id) => !pinnedIds.includes(id))
        .map(find)
        .filter((item): item is PaletteItem => Boolean(item))
        .slice(0, 3),
    );

    const onRegion = (event: Event) => setRegionId((event as CustomEvent<RegionId>).detail);
    const onRate = (event: Event) => setRate((event as CustomEvent<number>).detail);
    const onTimer = () => toggleTimer();
    const onClients = () => focusClients();
    const onLog = (event: Event) => {
      const amount = Number((event as CustomEvent<number>).detail) || 1;
      updateHours(amount);
    };
    window.addEventListener(REGION_EVENT, onRegion);
    window.addEventListener('soloyolo:rate', onRate);
    window.addEventListener('soloyolo:timer-toggle', onTimer);
    window.addEventListener('soloyolo:focus-clients', onClients);
    window.addEventListener('soloyolo:log-time', onLog);

    // A quick action tapped before this island hydrated is queued by the
    // intent bridge; replay it now that the listeners exist.
    for (const intent of consumePendingIntents()) {
      window.dispatchEvent(
        intent.detail === undefined
          ? new Event(intent.name)
          : new CustomEvent<number>(intent.name, { detail: intent.detail }),
      );
    }

    return () => {
      window.removeEventListener(REGION_EVENT, onRegion);
      window.removeEventListener('soloyolo:rate', onRate);
      window.removeEventListener('soloyolo:timer-toggle', onTimer);
      window.removeEventListener('soloyolo:focus-clients', onClients);
      window.removeEventListener('soloyolo:log-time', onLog);
    };
  }, []);

  useEffect(() => {
    if (timerStart === null) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [timerStart]);

  useEffect(() => {
    if (editingGoal) goalInput.current?.focus();
  }, [editingGoal]);

  const region = REGIONS.find((item) => item.id === regionId) ?? DEFAULT_REGION;
  const currency = isCurrencyCode(region.currency) ? region.currency : 'USD';

  function updateHours(delta: number) {
    setTracker((prev) => {
      const day = new Date().getDay();
      const updated: WeeklyTrackerState = {
        ...prev,
        hours: Math.max(0, Math.min(80, Math.round((prev.hours + delta) * 100) / 100)),
        activeDays:
          delta > 0 && !prev.activeDays.includes(day) ? [...prev.activeDays, day] : prev.activeDays,
      };
      writeJson(TRACKER_KEY, updated);
      return updated;
    });
    sendEvent('hours_logged', { delta });
  }

  function toggleTimer() {
    setTimerStart((previous) => {
      const current = Date.now();
      setNow(current);
      if (previous !== null) {
        const elapsed = Math.max(0, (current - previous) / 3600000);
        if (elapsed > 0) updateHours(elapsed);
        try {
          localStorage.removeItem(TIMER_KEY);
        } catch {
          /* storage unavailable */
        }
        sendEvent('timer_stopped', { hours: Math.round(elapsed * 100) / 100 });
        return null;
      }
      try {
        localStorage.setItem(TIMER_KEY, String(current));
      } catch {
        /* storage unavailable */
      }
      sendEvent('timer_started', {});
      return current;
    });
  }

  function saveGoal(event: Event) {
    event.preventDefault();
    const parsed = Math.round(Number(goalDraft));
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 80) {
      setTracker((prev) => {
        const updated = { ...prev, goal: parsed };
        writeJson(TRACKER_KEY, updated);
        return updated;
      });
    }
    setEditingGoal(false);
  }

  function focusClients() {
    // The compact desk keeps the client form inside a collapsed <details>;
    // its input is not rendered until that opens, so open it first or the
    // palette's "Add client" action focuses nothing at all.
    const details = clientInput.current?.closest('details');
    if (details) details.open = true;
    clientInput.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    clientInput.current?.focus();
  }

  function addClient(event: Event) {
    event.preventDefault();
    const name = clientName.trim();
    if (!name) return;
    const next = [{ id: String(Date.now()), name }, ...clients].slice(0, 6);
    setClients(next);
    setClientName('');
    writeJson(CLIENTS_KEY, next);
    sendEvent('client_added', { count: next.length });
  }

  function removeClient(id: string) {
    const next = clients.filter((client) => client.id !== id);
    setClients(next);
    writeJson(CLIENTS_KEY, next);
    sendEvent('client_removed', { count: next.length });
  }

  const progress = Math.min(100, Math.round((tracker.hours / tracker.goal) * 100));
  const streak = streakDays(tracker.activeDays);
  const estimated = formatCurrency(tracker.hours * rate, currency, { decimals: 0 });
  const elapsed = timerStart === null ? 0 : Math.max(0, Math.floor((now - timerStart) / 1000));
  const timerLabel =
    elapsed >= 60
      ? `${Math.floor(elapsed / 3600)}h ${String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}m`
      : `${elapsed}s`;
  const greetingLine = `${greeting}${profile ? `, ${profile.businessName.split(' ')[0]}` : ''}.`;
  const activeCount = tracker.activeDays.length;
  const weekSummaryParts: string[] = [];
  if (activeCount > 0)
    weekSummaryParts.push(`${activeCount} active day${activeCount === 1 ? '' : 's'}`);
  if (docsWeek > 0)
    weekSummaryParts.push(`${docsWeek} document${docsWeek === 1 ? '' : 's'} printed`);
  const weekSummary = weekSummaryParts.join(', ');

  if (variant === 'compact') {
    return (
      <section class="home-today is-compact" aria-labelledby="today-heading">
        <div class="wrap">
          <div class="today-panel">
            <header class="today-head">
              <div>
                <p id="today-heading" class="today-title">
                  {greetingLine}
                </p>
              </div>
              <label class="region-field">
                <span class="sr-only">Your region</span>
                <select
                  value={regionId}
                  onChange={(event) => {
                    const id = (event.target as HTMLSelectElement).value as RegionId;
                    setRegionId(id);
                    setRegion(id);
                    sendEvent('region_changed', { region: id });
                  }}
                  aria-label="Choose your region and currency"
                >
                  {REGIONS.map((item) => (
                    <option value={item.id}>
                      {item.label} ({item.currency})
                    </option>
                  ))}
                </select>
              </label>
            </header>

            <div class="desk-week">
              <div
                class="progress-ring"
                style={`--p: ${progress}%`}
                role="img"
                aria-label={`${tracker.hours} of ${tracker.goal} billable hours, ${progress}% of your weekly goal`}
              >
                <span>{progress}%</span>
              </div>
              <div>
                <p class="tile-value">
                  {tracker.hours.toFixed(1)}
                  <span> / {tracker.goal} h</span>
                </p>
                <p class="tile-sub">billable hours this week</p>
              </div>
            </div>

            <div class="tile-controls">
              <button
                type="button"
                class="chip-btn sq"
                onClick={() => updateHours(-1)}
                aria-label="−1h, remove one billable hour"
              >
                −1h
              </button>
              <button
                type="button"
                class="chip-btn sq"
                onClick={() => updateHours(1)}
                aria-label="+1h, add one billable hour"
              >
                +1h
              </button>
              <button
                type="button"
                class={`chip-btn sq chip-timer ${timerStart !== null ? 'is-running' : ''}`}
                onClick={toggleTimer}
                aria-pressed={timerStart !== null}
              >
                {timerStart !== null ? `Stop ${timerLabel}` : 'Start timer'}
              </button>
            </div>

            <p class="desk-line">
              <a href="/generators/invoice-generator/">New invoice</a>
              <span>
                {docs} document{docs === 1 ? '' : 's'} printed
              </span>
              <span>
                {clients.length} client{clients.length === 1 ? '' : 's'} saved
              </span>
            </p>

            <details class="desk-more">
              <summary>Clients, weekly goal and recent tools</summary>
              <div class="desk-more-body">
                <div class="desk-row">
                  <span>Weekly goal</span>
                  {editingGoal ? (
                    <form class="goal-form" onSubmit={saveGoal}>
                      <input
                        ref={goalInput}
                        type="number"
                        min="1"
                        max="80"
                        step="1"
                        value={goalDraft}
                        onInput={(event) => setGoalDraft((event.target as HTMLInputElement).value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            setEditingGoal(false);
                          }
                        }}
                        aria-label="Weekly goal in billable hours"
                      />
                      <button type="submit" class="chip-btn sq">
                        Save
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      class="desk-edit"
                      onClick={() => {
                        setGoalDraft(String(tracker.goal));
                        setEditingGoal(true);
                      }}
                    >
                      {tracker.goal} h
                    </button>
                  )}
                </div>

                <div class="desk-row desk-clients">
                  <span>Clients</span>
                  <form class="client-form" onSubmit={addClient}>
                    <input
                      ref={clientInput}
                      value={clientName}
                      onInput={(event) => setClientName((event.target as HTMLInputElement).value)}
                      placeholder="Client name"
                      aria-label="Client name"
                      maxLength={60}
                    />
                    <button type="submit" class="chip-btn sq" aria-label="Add client">
                      Add
                    </button>
                  </form>
                </div>

                {clients.length ? (
                  <ul class="client-list">
                    {clients.map((client) => (
                      <li>
                        <span class="client-name">{client.name}</span>
                        <span class="client-actions">
                          <a
                            class="client-invoice"
                            href={`/generators/invoice-generator/?client=${encodeURIComponent(client.name)}`}
                          >
                            Invoice <span aria-hidden="true">→</span>
                          </a>
                          <button
                            type="button"
                            class="client-remove sq"
                            aria-label={`Remove ${client.name}`}
                            title={`Remove ${client.name}`}
                            onClick={() => removeClient(client.id)}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="m2 2 6 6M8 2l-6 6"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                              />
                            </svg>
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p class="tile-sub">Names stay in this browser. No account, no sync.</p>
                )}

                {recents.length || pinned.length ? (
                  <ul class="link-list desk-recents">
                    {[...pinned, ...recents].slice(0, 3).map((item) => (
                      <li>
                        <a href={item.href}>
                          <span>{item.name.replace(/ Calculator$| Generator$/, '')}</span>
                          <span aria-hidden="true">→</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </details>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section class="screen home-today" aria-labelledby="today-heading">
      <div class="wrap">
        <div class="today-panel sq">
          <header class="today-head">
            <div>
              <p class="eyebrow">Today</p>
              <h2 id="today-heading" class="today-title">
                {greetingLine}
              </h2>
            </div>
            <div class="today-head-actions">
              <label class="region-field">
                <span class="sr-only">Your region</span>
                <select
                  value={regionId}
                  onChange={(event) => {
                    const id = (event.target as HTMLSelectElement).value as RegionId;
                    setRegionId(id);
                    setRegion(id);
                    sendEvent('region_changed', { region: id });
                  }}
                  aria-label="Choose your region and currency"
                >
                  {REGIONS.map((item) => (
                    <option value={item.id}>
                      {item.label} ({item.currency})
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" class="btn btn-secondary sq btn-sm" data-open-palette>
                Search <kbd>⌘K</kbd>
              </button>
            </div>
          </header>

          <div class="today-grid">
            <article class="today-tile sq">
              <p class="tile-label">This week</p>
              <div class="tile-progress">
                <div
                  class="progress-ring"
                  style={`--p: ${progress}%`}
                  role="img"
                  aria-label={`${tracker.hours} of ${tracker.goal} billable hours, ${progress}% of your weekly goal`}
                >
                  <span>{progress}%</span>
                </div>
                <div>
                  <p class="tile-value">
                    {tracker.hours.toFixed(1)}
                    <span> / {tracker.goal} h</span>
                  </p>
                  <p class="tile-sub">billable hours logged</p>
                  {weekSummary ? <p class="tile-sub tile-week">{weekSummary}</p> : null}
                </div>
              </div>
              <div class="tile-controls">
                <button
                  type="button"
                  class="chip-btn sq"
                  onClick={() => updateHours(-1)}
                  aria-label="−1h, remove one billable hour"
                >
                  −1h
                </button>
                <button
                  type="button"
                  class="chip-btn sq"
                  onClick={() => updateHours(1)}
                  aria-label="+1h, add one billable hour"
                >
                  +1h
                </button>
                <button
                  type="button"
                  class="chip-btn sq"
                  onClick={() => updateHours(2)}
                  aria-label="+2h, add two billable hours"
                >
                  +2h
                </button>
                <button
                  type="button"
                  class={`chip-btn sq chip-timer ${timerStart !== null ? 'is-running' : ''}`}
                  onClick={toggleTimer}
                  aria-pressed={timerStart !== null}
                >
                  {timerStart !== null ? `Stop ${timerLabel}` : 'Start timer'}
                </button>
              </div>
              {editingGoal ? (
                <form class="goal-form" onSubmit={saveGoal}>
                  <input
                    ref={goalInput}
                    type="number"
                    min="1"
                    max="80"
                    step="1"
                    value={goalDraft}
                    onInput={(event) => setGoalDraft((event.target as HTMLInputElement).value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setEditingGoal(false);
                      }
                    }}
                    aria-label="Weekly goal in billable hours"
                  />
                  <button type="submit" class="chip-btn sq">
                    Save goal
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  class="goal-edit sq"
                  onClick={() => {
                    setGoalDraft(String(tracker.goal));
                    setEditingGoal(true);
                  }}
                >
                  Weekly goal: {tracker.goal} h
                </button>
              )}
            </article>

            <article class="today-tile sq">
              <p class="tile-label">Money ({currency})</p>
              <p class="tile-value">{estimated}</p>
              <p class="tile-sub">
                estimated earnings from {tracker.hours.toFixed(1)} h at{' '}
                {formatCurrency(rate, currency, { decimals: 0 })}/h
              </p>
              <dl class="tile-stats">
                <div>
                  <dt>Documents printed</dt>
                  <dd>
                    <a href="/generators/" title="Open the generators">
                      {docs}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Clients saved</dt>
                  <dd>
                    <button type="button" onClick={focusClients} title="Open your client list">
                      {clients.length}
                    </button>
                  </dd>
                </div>
              </dl>
              <a class="tile-link" href="/generators/invoice-generator/">
                New invoice <span aria-hidden="true">→</span>
              </a>
            </article>

            <article class="today-tile sq">
              <p class="tile-label">Streak</p>
              <p class="tile-value">
                {streak}
                <span> day{streak === 1 ? '' : 's'}</span>
              </p>
              <p class="tile-sub">
                {streak > 0 ? 'Days in a row this week.' : 'Log an hour to start this week.'}
              </p>
              <div class="week-dots" role="img" aria-label={`${activeCount} active days this week`}>
                {DAY_LETTERS.map((day, index) => (
                  <span class={`week-dot ${tracker.activeDays.includes(index) ? 'is-active' : ''}`}>
                    <span>{day}</span>
                  </span>
                ))}
              </div>
              <p class="tile-sub tile-note">{region.payment}</p>
            </article>
          </div>

          <div class="today-lower">
            <article class="today-tile sq">
              <p class="tile-label">Recent tools</p>
              {recents.length || pinned.length ? (
                <ul class="link-list">
                  {[...pinned, ...recents].slice(0, 4).map((item) => (
                    <li>
                      <a href={item.href}>
                        <span>{item.name.replace(/ Calculator$| Generator$/, '')}</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="tile-sub">
                  Your most-used tools will appear here after your first visit.
                </p>
              )}
            </article>

            <article class="today-tile sq" id="clients-tile">
              <p class="tile-label">Clients (on this device)</p>
              <form class="client-form" onSubmit={addClient}>
                <input
                  ref={clientInput}
                  value={clientName}
                  onInput={(event) => setClientName((event.target as HTMLInputElement).value)}
                  placeholder="Client name"
                  aria-label="Client name"
                  maxLength={60}
                />
                <button type="submit" class="chip-btn sq" aria-label="Add client">
                  Add
                </button>
              </form>
              {clients.length ? (
                <ul class="client-list">
                  {clients.map((client) => (
                    <li>
                      <span class="client-name">{client.name}</span>
                      <span class="client-actions">
                        <a
                          class="client-invoice"
                          href={`/generators/invoice-generator/?client=${encodeURIComponent(client.name)}`}
                        >
                          Invoice <span aria-hidden="true">→</span>
                        </a>
                        <button
                          type="button"
                          class="client-remove sq"
                          aria-label={`Remove ${client.name}`}
                          title={`Remove ${client.name}`}
                          onClick={() => removeClient(client.id)}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="m2 2 6 6M8 2l-6 6"
                              stroke="currentColor"
                              stroke-width="1.6"
                              stroke-linecap="round"
                            />
                          </svg>
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="tile-sub">Names stay in this browser. No account, no sync.</p>
              )}
            </article>

            <article class="today-tile sq">
              <p class="tile-label">Local rules</p>
              <p class="tile-note">{region.compliance}</p>
              <a class="tile-link" href="/countries/">
                See all country guides <span aria-hidden="true">→</span>
              </a>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
