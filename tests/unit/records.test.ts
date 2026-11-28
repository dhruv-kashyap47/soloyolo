import { describe, expect, it } from 'vitest';

import {
  CROSS_BORDER_NOTES,
  EINVOICING_ROWS,
  RECORDS_FAQS,
  RECORDS_SOURCES,
  RECORDS_VERIFIED_ON,
  RETENTION_ROWS,
  SOURCE_SHORT_LABELS,
} from '@/data/records';

/**
 * The records page only works if every row points at a source and every source
 * is reachable from the page. A citation that names an id nobody defined would
 * print an empty link, so the build fails here instead.
 */
describe('the e-invoicing and records data', () => {
  const ids = new Set(RECORDS_SOURCES.map((source) => source.id));

  const citations = [
    ...EINVOICING_ROWS.flatMap((row) => row.sourceIds),
    ...RETENTION_ROWS.flatMap((row) => row.sourceIds),
    ...CROSS_BORDER_NOTES.flatMap((note) => note.sourceIds),
  ];

  it('cites only sources that exist', () => {
    expect(citations.length).toBeGreaterThan(0);

    for (const id of citations) {
      expect(ids.has(id), `${id} is cited but not defined`).toBe(true);
    }
  });

  it('uses every source it defines', () => {
    for (const source of RECORDS_SOURCES) {
      expect(citations.includes(source.id), `${source.id} is defined but unused`).toBe(true);
      expect(SOURCE_SHORT_LABELS[source.id], `${source.id} has no short label`).toBeTruthy();
    }
  });

  it('links only https pages', () => {
    for (const source of RECORDS_SOURCES) {
      expect(source.url.startsWith('https://'), source.id).toBe(true);
    }
  });

  it('covers every market exactly once in each table', () => {
    expect(EINVOICING_ROWS).toHaveLength(8);
    expect(RETENTION_ROWS).toHaveLength(7);
    expect(new Set(EINVOICING_ROWS.map((row) => row.country)).size).toBe(8);

    const markets = EINVOICING_ROWS.map((row) => row.country);
    for (const row of RETENTION_ROWS) {
      expect(markets, `${row.country} has no e-invoicing row`).toContain(row.country);
    }
  });

  it('omits India retention instead of guessing it', () => {
    expect(RETENTION_ROWS.some((row) => row.country === 'India')).toBe(false);
  });

  it('records the day the claims were checked', () => {
    expect(RECORDS_VERIFIED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(RECORDS_VERIFIED_ON).toISOString().startsWith(RECORDS_VERIFIED_ON)).toBe(true);
  });

  it('asks and answers in whole sentences', () => {
    expect(RECORDS_FAQS.length).toBeGreaterThanOrEqual(4);

    for (const faq of RECORDS_FAQS) {
      expect(faq.question.endsWith('?'), faq.question).toBe(true);
      expect(faq.answer.length, faq.question).toBeGreaterThan(80);
    }
  });

  it('does not use an em dash in the copy', () => {
    expect(
      JSON.stringify([
        EINVOICING_ROWS,
        RETENTION_ROWS,
        CROSS_BORDER_NOTES,
        RECORDS_FAQS,
        RECORDS_SOURCES,
      ]),
    ).not.toContain('—');
  });
});
