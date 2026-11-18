import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { getRegion, type RegionId } from '@/lib/prefs';import { sendEvent } from '@/lib/analytics';
import {
  ALL_COMMAND_ITEMS,
  clientPaletteItems,
  getClients,
  getPinned,
  getRecents,
  recordToolVisit,
  recordVisitForLocation,
  setPinned,
  type PaletteItem,
} from '@/lib/palette';
import { searchItems } from '@/lib/palette-search';

const REGION_HINTS: Record<RegionId, string[]> = {
  US: ['us', 'usa', 'w9', 'ein', 'sales tax'],
  UK: ['uk', 'vat', 'hmrc', 'gbp'],
  CA: ['canada', 'gst', 'hst', 'cra'],
  AU: ['australia', 'ato', 'abn', 'tax invoice'],
  DE: ['germany', 'vat', 'rechnung', 'ust'],
  CH: ['switzerland', 'mwst', 'tva', 'chf'],
  IN: ['india', 'gst', 'gstin', 'inr'],
  AE: ['uae', 'vat', 'trn', 'aed'],
  GLOBAL: ['invoice', 'rate', 'tax'],
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** The modifier this device actually has, for the pin hint. */
const MODIFIER =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘' : 'Ctrl+';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const [pinned, setPinnedState] = useState<string[]>([]);
  const [pinMessage, setPinMessage] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef<string | null>(null);
  const dialogId = useId();

  // Mount: record the page we are on as a visited tool, adopt any intent
  // that fired before hydration, and refresh recents/pins.
  useEffect(() => {
    sendEvent('palette_ready', { path: location.pathname });
    recordVisitForLocation(location.pathname);
    if (window.__soloyoloPalettePending) {
      window.__soloyoloPalettePending = false;
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    setRecents(getRecents());
    setPinnedState(getPinned());
  }, [isOpen]);

  // The eager bridge in BaseLayout owns Cmd/Ctrl+K and every
  // [data-open-palette] click, so the shortcut works even before this
  // island hydrates. These listeners react to what it dispatches.
  useEffect(() => {
    const open = (event?: Event) => {
      // On iOS a tap does not focus the trigger, so the element that asked
      // for the palette travels with the event: it is the focus target when
      // the dialog closes.
      const trigger = (event as CustomEvent<{ trigger?: HTMLElement }> | undefined)?.detail?.trigger;
      if (trigger instanceof HTMLElement) restoreFocusRef.current = trigger;
      setIsOpen(true);
    };
    const toggle = () => setIsOpen((prev) => !prev);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes the palette even if focus has slipped out of the dialog
      // (for example right after opening, before the focus lands).
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
      if (isOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      // Single-key direct shortcuts, only when the visitor is not typing.
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput =
        activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' ||
        (document.activeElement as HTMLElement | null)?.isContentEditable === true;
      if (isInput) return;
      if (e.key === '1') {
        e.preventDefault();
        recordToolVisit('hourly-rate-calculator');
        window.location.href = '/calculators/hourly-rate-calculator/';
      } else if (e.key === '2') {
        e.preventDefault();
        recordToolVisit('invoice-generator');
        window.location.href = '/generators/invoice-generator/';
      } else if (e.key === '3') {
        e.preventDefault();
        recordToolVisit('freelance-rate-calculator');
        window.location.href = '/calculators/freelance-rate-calculator/';
      } else if (e.key === '/' || e.key === '?') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('soloyolo:open-palette', open);
    window.addEventListener('soloyolo:palette-hotkey', toggle);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('soloyolo:open-palette', open);
      window.removeEventListener('soloyolo:palette-hotkey', toggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Lock body scroll, reset the query, focus the input, remember the
  // trigger so focus comes back on close. A layout effect focuses before the
  // first paint, so the dialog is never briefly on screen without a target.
  useLayoutEffect(() => {
    if (isOpen) {
      sendEvent('palette_open', {});
      // Keep the trigger captured by the open event; fall back to whatever
      // had focus (keyboard opens have no trigger element).
      restoreFocusRef.current ??= document.activeElement as HTMLElement | null;
      // Save what was there: the mobile menu may already own the lock.
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setQuery('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    } else if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
  }, [isOpen]);

  // Restore focus to the trigger when the dialog closes.
  useEffect(() => {
    if (isOpen) return;
    if (restoreFocusRef.current?.isConnected) restoreFocusRef.current.focus();
    restoreFocusRef.current = null;
  }, [isOpen]);

  // Saved clients are searchable actions; read once per open, not per keystroke.
  const clientItems = useMemo(() => clientPaletteItems(getClients()), [isOpen]);
  // Timer and client actions only exist on the home desk. Offering them on a
  // calculator page would close the palette and do nothing.
  const deskOnly = new Set(['action-start-timer', 'action-add-client']);
  const isDesk = typeof location === 'undefined' || location.pathname === '/';
  const allItems = [...ALL_COMMAND_ITEMS, ...clientItems].filter(
    (item) => isDesk || !(item.id && deskOnly.has(item.id)),
  );

  // Filter items: fuzzy multi-word search, or the default ordering
  // (pinned first, then recents, then region-weighted tools).
  const normalizedQuery = query.trim().toLowerCase();
  let filteredItems: PaletteItem[] = [];

  if (!normalizedQuery) {
    const pinnedItems = pinned
      .map((id) => allItems.find((it) => it.id === id))
      .filter((it): it is PaletteItem => Boolean(it));

    const recentItems = recents
      .filter((id) => !pinned.includes(id))
      .map((id) => allItems.find((it) => it.id === id))
      .filter((it): it is PaletteItem => Boolean(it));

    const hints = REGION_HINTS[getRegion().id] ?? [];
    const score = (item: PaletteItem) =>
      hints.reduce((total, hint) => total + Number(item.keywords?.includes(hint) ?? false), 0);
    const remaining = allItems
      .filter((it) => !it.dynamic && !pinned.includes(it.id) && !recents.includes(it.id))
      .sort((a, b) => score(b) - score(a));

    filteredItems = [...pinnedItems, ...recentItems, ...remaining];
  } else {
    const result = searchItems(allItems, normalizedQuery);
    filteredItems = result ? result.scored.map((entry) => entry.item) : [];
  }

  const selectItem = (item: PaletteItem) => {
    sendEvent('tool_open', { id: item.id, source: 'palette' });
    setIsOpen(false);
    if (item.run) {
      // Let the close effect restore focus first, then run the action so an
      // action that focuses a field (Add client) keeps that focus.
      window.setTimeout(() => item.run?.(), 0);
      return;
    }
    if (item.href) {
      recordToolVisit(item.id);
      window.location.href = item.href;
    }
  };

  const togglePin = (e: Event, itemId: string | undefined) => {
    e.stopPropagation();
    if (!itemId) return;
    const isPinned = pinned.includes(itemId);
    const updated = isPinned
      ? pinned.filter((id) => id !== itemId)
      : [itemId, ...pinned].slice(0, 8);
    setPinnedState(updated);
    setPinned(updated);
    const name = allItems.find((item) => item.id === itemId)?.name ?? 'Item';
    setPinMessage(isPinned ? `Unpinned ${name}` : `Pinned ${name} to the top`);
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard: arrows navigate, Enter opens, Escape closes, Tab is trapped
  // inside the dialog (aria-modal must not leak focus to the page behind).
  const handleDialogKeyDown = (e: KeyboardEvent) => {
    // An IME uses Enter/Escape to commit a composition; those keystrokes are
    // not commands for the palette.
    if (e.isComposing) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }

    if (filteredItems.length === 0) return;

    const selected = filteredItems[selectedIndex];

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Pin/unpin the highlighted entry without opening it.
      e.preventDefault();
      if (selected) togglePin(e, selected.id);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      // Enter on the Pin or Close button belongs to that button, not to the
      // highlighted result behind it.
      if ((e.target as HTMLElement | null)?.closest('button')) return;
      e.preventDefault();
      if (selected) {
        selectItem(selected);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-16"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      id={dialogId}
    >
      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-canvas/80 backdrop-blur-md transition-opacity duration-150"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Palette container */}
      <div
        ref={dialogRef}
        class="card card-raised relative z-10 flex w-full max-w-2xl flex-col overflow-hidden border border-line-strong bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleDialogKeyDown}
        tabIndex={-1}
      >
        {/* Search header */}
        <div class="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            class="text-accent-strong shrink-0"
            aria-hidden="true"
          >
            <path
              d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zm4.5-0.5L14 14"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <input
            ref={inputRef}
            type="text"
            class="w-full bg-transparent text-base text-ink placeholder-muted outline-none sm:text-lg"
            placeholder="Type a tool name, topic (tax, rate, invoice, margin) or country..."
            value={query}
            onInput={(e) => {
              setQuery((e.target as HTMLInputElement).value);
              setSelectedIndex(0);
            }}
            aria-autocomplete="list"
            aria-controls="palette-results"
            aria-activedescendant={
              filteredItems[selectedIndex] ? `palette-item-${filteredItems[selectedIndex].id}` : undefined
            }
          />

          <kbd
            class="hidden rounded border border-line bg-surface-2 px-2 py-0.5 text-xs font-mono font-semibold text-ink sm:inline-block"
            title="Press Escape to close"
          >
            Esc
          </kbd>

          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-ink sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-label="Close command palette"
          >
            ✕
          </button>
        </div>

        {/* Results List */}
        <ul
          id="palette-results"
          ref={listRef}
          class="max-h-[60vh] overflow-y-auto p-2 divide-y divide-line/40"
          role="listbox"
          aria-label="Tools, actions and country guides"
          tabIndex={0}
        >
          {filteredItems.length === 0 ? (
            <li class="p-8 text-center text-sm text-ink-soft">
              <p class="font-medium">No matching tools found for "{query}"</p>
              <p class="mt-1 text-xs text-muted">
                Try searching for <span class="text-accent-strong">rate</span>,{' '}
                <span class="text-accent-strong">invoice</span>,{' '}
                <span class="text-accent-strong">profit</span>, or a country like{' '}
                <span class="text-accent-strong">Germany</span> or{' '}
                <span class="text-accent-strong">India</span>.
              </p>
            </li>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isItemPinned = pinned.includes(item.id);
              const isRecent = recents.includes(item.id);

              return (
                <li
                  id={`palette-item-${item.id}`}
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  data-active={isSelected ? 'true' : 'false'}
                  class={`group flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-3 transition-colors ${
                    isSelected
                      ? 'bg-accent-soft text-ink ring-1 ring-accent-line'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                  }`}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm text-ink group-hover:text-accent-strong">
                        {item.name}
                      </span>

                      {/* Category tag */}
                      <span class="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-semibold text-ink-soft">
                        {item.category}
                      </span>

                      {isItemPinned && (
                        <span class="text-accent-strong text-xs" title="Pinned to top">
                          ★<span class="sr-only"> Pinned</span>
                        </span>
                      )}

                      {!isItemPinned && isRecent && !query && (
                        <span class="text-[0.625rem] font-medium tracking-wide text-accent-strong uppercase">
                          Recent
                        </span>
                      )}
                    </div>

                    <p class="mt-0.5 truncate text-xs text-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    {item.shortcut && !query && (
                      <kbd class="hidden rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] font-mono font-medium text-accent-strong sm:inline-block">
                        {item.shortcut}
                      </kbd>
                    )}

                    <span
                      aria-hidden="true"
                      class={`text-xs transition-transform ${
                        isSelected ? 'translate-x-0.5 text-accent-strong' : 'text-muted'
                      }`}
                    >
                      →
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer shortcuts helper + the pin action for the highlighted row */}
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/40 px-4 py-2.5 text-[0.75rem] text-ink-soft">
          <div class="flex flex-wrap items-center gap-3">
            <span class="flex items-center gap-1">
              <kbd class="rounded border border-line bg-surface-2 px-1 text-[0.625rem] font-mono text-ink font-semibold">↑</kbd>
              <kbd class="rounded border border-line bg-surface-2 px-1 text-[0.625rem] font-mono text-ink font-semibold">↓</kbd>
              Navigate
            </span>
            <span class="flex items-center gap-1">
              <kbd class="rounded border border-line bg-surface-2 px-1 font-mono text-[0.625rem] text-ink font-semibold">↵</kbd>
              Open
            </span>
            <button
              type="button"
              class="palette-pin-btn flex items-center gap-1 rounded border border-line bg-surface-2 px-2 py-1 font-semibold text-ink hover:border-line-strong disabled:opacity-50"
              onClick={(event) => togglePin(event, filteredItems[selectedIndex]?.id)}
              disabled={filteredItems.length === 0}
            >
              <span aria-hidden="true">★</span>
              {filteredItems[selectedIndex] && pinned.includes(filteredItems[selectedIndex]!.id)
                ? 'Unpin'
                : 'Pin'}
              <kbd class="ml-0.5 hidden font-mono text-[0.625rem] text-ink-soft sm:inline">{MODIFIER}↵</kbd>
            </button>
          </div>

          <div class="hidden sm:flex items-center gap-2">
            <span>Press <kbd class="rounded border border-line bg-surface-2 px-1 font-mono text-[0.625rem] text-ink font-semibold">1</kbd> <kbd class="rounded border border-line bg-surface-2 px-1 font-mono text-[0.625rem] text-ink font-semibold">2</kbd> <kbd class="rounded border border-line bg-surface-2 px-1 font-mono text-[0.625rem] text-ink font-semibold">3</kbd> anytime for top tools</span>
          </div>
        </div>
        <p class="sr-only" role="status" aria-live="polite">{pinMessage}</p>
      </div>
    </div>
  );
}
