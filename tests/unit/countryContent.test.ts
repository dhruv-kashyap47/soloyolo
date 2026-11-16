import { describe, expect, it } from 'vitest';

import { COUNTRY_PAGES, getCountryPageByGuide, getCountryPageByPath } from '@/data/countries/pages';
import { COUNTRIES } from '@/lib/countries';
import { COUNTRY_GUIDES } from '@/lib/countries/guides';

describe('the country invoice guides', () => {
  it('ships one page for every route in the guide registry', () => {
    expect(COUNTRY_PAGES).toHaveLength(7);
    expect(COUNTRY_PAGES.map((page) => page.guideId).sort()).toEqual(
      COUNTRY_GUIDES.map((guide) => guide.id).sort(),
    );

    for (const guide of COUNTRY_GUIDES) {
      expect(getCountryPageByGuide(guide.id)).toBeTruthy();
      expect(getCountryPageByPath(guide.href)).toBeTruthy();
    }
  });

  it('gives each page a unique title, description and path', () => {
    expect(new Set(COUNTRY_PAGES.map((page) => page.meta.title)).size).toBe(COUNTRY_PAGES.length);
    expect(new Set(COUNTRY_PAGES.map((page) => page.meta.description)).size).toBe(
      COUNTRY_PAGES.length,
    );
    expect(new Set(COUNTRY_PAGES.map((page) => page.guideId)).size).toBe(COUNTRY_PAGES.length);
  });

  it('cites only sources that exist in the country config', () => {
    for (const page of COUNTRY_PAGES) {
      const guide = COUNTRY_GUIDES.find((entry) => entry.id === page.guideId);
      const country = COUNTRIES.find((entry) => entry.code === guide?.country);

      expect(guide).toBeTruthy();
      expect(country).toBeTruthy();
      expect(page.sourceIds.length).toBeGreaterThanOrEqual(2);

      for (const sourceId of page.sourceIds) {
        expect(
          country?.sources.some((source) => source.id === sourceId),
          `${page.guideId} cites ${sourceId}`,
        ).toBe(true);
      }
    }
  });

  it('keeps the tax invoice pages specific to their market', () => {
    const ukVat = getCountryPageByGuide('uk-vat-invoice');
    const caGst = getCountryPageByGuide('ca-gst-hst-invoice');
    const auTax = getCountryPageByGuide('au-tax-invoice');

    expect(ukVat.requirements.items.join(' ')).toMatch(/VAT registration number/);
    expect(ukVat.documentName).toBe('VAT invoice');
    expect(caGst.requirements.items.join(' ')).toMatch(/\$100/);
    expect(caGst.requirements.items.join(' ')).toMatch(/HST/);
    expect(auTax.requirements.items.join(' ')).toMatch(/ABN/);
    expect(auTax.requirements.items.join(' ')).toMatch(/\$1,000/);
  });

  it('does not use em dashes in the copy', () => {
    expect(JSON.stringify(COUNTRY_PAGES)).not.toContain('—');
  });

  it('refuses a page that does not exist', () => {
    expect(() => getCountryPageByPath('/nope/')).toThrow(/No country page/);
    expect(() => getCountryPageByGuide('nope')).toThrow(/No country page/);
  });
});
