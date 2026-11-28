/**
 * Palette search: fuzzy, multi-word, dependency-free.
 *
 * Every word of the query must match somewhere (name, description, category
 * or keywords). Within a word:
 *
 * - a substring match scores highest, higher still at a word start
 *   ("rate" hits "Hourly Rate Calculator" as a whole word),
 * - otherwise a subsequence match keeps typo-tolerant queries working
 *   ("hrr" still finds the hourly rate calculator),
 * - no match at all removes the item.
 *
 * Results are ordered by score, best first; equal scores keep registry
 * order so the default list never reshuffles between keystrokes.
 */

import type { PaletteItem } from '@/lib/palette';

const WORD_BOUNDARY = /[\s(/-]/;

/** Index of `needle` as a subsequence of `haystack`, or -1. */
function subsequenceIndex(haystack: string, needle: string): number {
  let index = -1;
  for (const char of needle) {
    index = haystack.indexOf(char, index + 1);
    if (index === -1) return -1;
  }
  return index;
}

/** Score of one query word against one field: 0 = no match. */
function scoreField(field: string, term: string): number {
  const at = field.indexOf(term);
  if (at === -1) {
    const seq = subsequenceIndex(field, term);
    return seq === -1 ? 0 : 10;
  }
  // A match at a word start ("rate" in "hourly rate") beats one inside a word.
  return at === 0 || WORD_BOUNDARY.test(field[at - 1] ?? ' ') ? 100 : 60;
}

export function scoreItem(item: PaletteItem, term: string): number {
  const fields = [
    item.name.toLowerCase(),
    item.description.toLowerCase(),
    item.category.toLowerCase(),
    ...(item.keywords ?? []).map((keyword) => keyword.toLowerCase()),
  ];
  let best = 0;
  for (const field of fields) {
    best = Math.max(best, scoreField(field, term));
    if (best >= 100) break;
  }
  return best;
}

/**
 * Filters items for a multi-word query. Returns null when the query is
 * blank (callers show their own default ordering) or when any word
 * matches nothing, so an impossible query yields an empty result set.
 */
export function searchItems(
  items: readonly PaletteItem[],
  query: string,
): { scored: { item: PaletteItem; score: number }[]; matched: boolean } | null {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return null;

  const scored: { item: PaletteItem; score: number }[] = [];
  for (const item of items) {
    let total = 0;
    let matchedAll = true;
    for (const term of terms) {
      const score = scoreItem(item, term);
      if (score === 0) {
        matchedAll = false;
        break;
      }
      total += score;
    }
    if (matchedAll) scored.push({ item, score: total });
  }

  // Array#sort is stable, so equal scores keep registry order and the default
  // list never reshuffles between keystrokes.
  scored.sort((a, b) => b.score - a.score);
  return { scored, matched: scored.length > 0 };
}
