/**
 * Local log of documents the visitor actually printed or saved.
 *
 * The generators have no backend: printing is the save action, so a print
 * is the honest definition of "a document was made". Entries carry a
 * timestamp and a kind so the dashboard can count this week's documents
 * without inventing history.
 */

export type DocumentKind = 'invoice' | 'quote' | 'receipt' | 'reminder';

export interface DocumentLogEntry {
  kind: DocumentKind;
  at: number;
}

const DOCS_KEY = 'soloyolo-docs-created';
const MAX_ENTRIES = 200;

export function getDocumentLog(): DocumentLogEntry[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const kinds: DocumentKind[] = ['invoice', 'quote', 'receipt', 'reminder'];
    return parsed.filter(
      (entry): entry is DocumentLogEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        kinds.includes((entry as Partial<DocumentLogEntry>).kind as DocumentKind) &&
        typeof (entry as Partial<DocumentLogEntry>).at === 'number',
    );
  } catch {
    return [];
  }
}

/** Called by every generator right before its document reaches the printer. */
export function recordDocumentPrinted(kind: DocumentKind): void {
  const next = [...getDocumentLog(), { kind, at: Date.now() }].slice(-MAX_ENTRIES);
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: this print simply is not counted */
  }
}

/** Monday 00:00 of the ISO week containing `now`. */
export function weekStart(now: Date = new Date()): number {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.getTime();
}

export function documentsThisWeek(now: Date = new Date()): number {
  const start = weekStart(now);
  return getDocumentLog().filter((entry) => entry.at >= start).length;
}
