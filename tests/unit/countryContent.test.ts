import { describe, expect, it } from 'vitest';

import { COUNTRY_PAGES, getCountryPageByGuide, getCountryPageByPath } from '@/data/countries/pages';
import { COUNTRIES } from '@/lib/countries';
import { COUNTRY_GUIDES } from '@/lib/countries/guides';

describe('the country invoice guides', () => {
  it('ships one page for every route in the guide registry', () => {
    expect(COUNTRY_PAGES).toHaveLength(15);
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
    const deVat = getCountryPageByGuide('de-vat-invoice');
    const chVat = getCountryPageByGuide('ch-vat-invoice');
    const inGst = getCountryPageByGuide('in-gst-invoice');
    const aeVat = getCountryPageByGuide('ae-vat-invoice');

    expect(ukVat.requirements.items.join(' ')).toMatch(/VAT registration number/);
    expect(ukVat.documentName).toBe('VAT invoice');
    expect(caGst.requirements.items.join(' ')).toMatch(/\$100/);
    expect(caGst.requirements.items.join(' ')).toMatch(/HST/);
    expect(auTax.requirements.items.join(' ')).toMatch(/ABN/);
    expect(auTax.requirements.items.join(' ')).toMatch(/\$1,000/);

    expect(deVat.requirements.items.join(' ')).toMatch(/USt-IdNr/);
    expect(deVat.notes.join(' ')).toMatch(/1 January 2027/);
    expect(deVat.notes.join(' ')).toMatch(/1 January 2028/);
    expect(chVat.requirements.items.join(' ')).toMatch(/MWST number/);
    expect(chVat.notes.join(' ')).toMatch(/29 November 2026/);
    expect(inGst.requirements.items.join(' ')).toMatch(/GSTIN/);
    expect(inGst.requirements.items.join(' ')).toMatch(/HSN/);
    expect(inGst.notes.join(' ')).toMatch(/CGST, SGST or IGST/);
    expect(aeVat.requirements.items.join(' ')).toMatch(/TRN/);
    expect(aeVat.notes.join(' ')).toMatch(/244\/2025/);
  });

  it('keeps the normal pages for non-registered businesses', () => {
    const de = getCountryPageByGuide('de-invoice');
    const ch = getCountryPageByGuide('ch-invoice');
    const india = getCountryPageByGuide('in-invoice');
    const uae = getCountryPageByGuide('ae-invoice');

    expect(de.notes.join(' ')).toMatch(/Kleinunternehmer/);
    expect(ch.notes.join(' ')).toMatch(/CHF 100,000/);
    expect(india.notes.join(' ')).toMatch(/₹40 lakh/);
    expect(uae.notes.join(' ')).toMatch(/AED 375,000/);
  });

  it('describes the city each new page example actually opens with', () => {
    const cases = [
      ['de-invoice', 'Berlin'],
      ['de-vat-invoice', 'Berlin'],
      ['ch-invoice', 'Zurich'],
      ['ch-vat-invoice', 'Geneva'],
      ['in-invoice', 'Mumbai'],
      ['in-gst-invoice', 'Bengaluru'],
      ['ae-invoice', 'Dubai'],
      ['ae-vat-invoice', 'Dubai'],
    ] as const;

    for (const [guideId, city] of cases) {
      expect(getCountryPageByGuide(guideId).scenario.body, guideId).toContain(city);
    }
  });

  it('does not use em dashes in the copy', () => {
    expect(JSON.stringify(COUNTRY_PAGES)).not.toContain('—');
  });

  it('refuses a page that does not exist', () => {
    expect(() => getCountryPageByPath('/nope/')).toThrow(/No country page/);
    expect(() => getCountryPageByGuide('nope')).toThrow(/No country page/);
  });
});
