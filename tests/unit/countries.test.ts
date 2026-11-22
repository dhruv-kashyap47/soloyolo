import { describe, expect, it } from 'vitest';

import { countryInvoiceExample, countryInvoicePreset } from '@/data/countries/examples';
import { hydrateCountryExample } from '@/data/countries/hydrate';
import { invoiceExample } from '@/data/generators/examples';
import {
  COUNTRIES,
  countryForCurrency,
  defaultLineTax,
  getCountryConfig,
  lineTaxForLabel,
  taxIdLabelFor,
} from '@/lib/countries';
import { applyCountryToDraft, relabelLineTax } from '@/lib/countries/draft';
import { assertCountryConfigs, countryConfigSchema } from '@/lib/countries/schema';
import { validateDocumentDraft } from '@/lib/generators/validation';

describe('the country configs', () => {
  it('covers the eight markets with one currency each', () => {
    expect(COUNTRIES.map((country) => country.code)).toEqual([
      'US',
      'UK',
      'CA',
      'AU',
      'DE',
      'CH',
      'IN',
      'AE',
    ]);
    expect(COUNTRIES.map((country) => country.currency)).toEqual([
      'USD',
      'GBP',
      'CAD',
      'AUD',
      'EUR',
      'CHF',
      'INR',
      'AED',
    ]);
    expect(new Set(COUNTRIES.map((country) => country.currency)).size).toBe(8);
  });

  it('passes the build-time schema', () => {
    expect(() => assertCountryConfigs(COUNTRIES)).not.toThrow();
  });

  it('rejects a verification date that is not a real day', () => {
    const uk = getCountryConfig('UK');
    const result = countryConfigSchema.safeParse({ ...uk, verifiedOn: '2026-99-99' });

    expect(result.success).toBe(false);
  });

  it('rejects an all-invoice registration flag without a required registration', () => {
    const de = getCountryConfig('DE');
    const result = countryConfigSchema.safeParse({
      ...de,
      tax: { ...de.tax, registrationRequired: false },
    });

    expect(result.success).toBe(false);
  });

  it('gives every tax claim a checked official source', () => {
    for (const country of COUNTRIES) {
      expect(country.sources.length).toBeGreaterThanOrEqual(2);
      expect(country.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Set(country.sources.map((source) => source.id)).size).toBe(country.sources.length);

      for (const source of country.sources) {
        expect(source.url.startsWith('https://')).toBe(true);
        expect(source.note.length).toBeGreaterThan(30);
      }
    }
  });

  it('carries the rates the market uses', () => {
    expect(getCountryConfig('UK').tax.rates.map((rate) => rate.ratePercent)).toEqual([
      '20',
      '5',
      '0',
    ]);
    expect(getCountryConfig('AU').tax.rates[0]?.ratePercent).toBe('10');
    expect(getCountryConfig('CA').tax.rates.map((rate) => rate.ratePercent)).toEqual([
      '5',
      '13',
      '14',
      '15',
      null,
    ]);
    expect(getCountryConfig('US').tax.rates.every((rate) => rate.ratePercent === null)).toBe(true);
    expect(getCountryConfig('DE').tax.rates.map((rate) => rate.ratePercent)).toEqual([
      '19',
      '7',
      '0',
    ]);
    expect(getCountryConfig('CH').tax.rates.map((rate) => rate.ratePercent)).toEqual([
      '8.1',
      '2.6',
      '3.8',
    ]);
    expect(getCountryConfig('IN').tax.standardRatePercent).toBe('18');
    expect(getCountryConfig('IN').tax.rates.map((rate) => rate.ratePercent)).toEqual([
      '5',
      '18',
      '40',
      '3',
      '0.25',
      '0',
    ]);
    expect(getCountryConfig('AE').tax.rates.map((rate) => rate.ratePercent)).toEqual(['5', '0']);
  });

  it('only offers a tax invoice where the market has one', () => {
    expect(getCountryConfig('UK').tax.supportsTaxInvoice).toBe(true);
    expect(getCountryConfig('UK').tax.taxInvoiceTitle).toBe('VAT INVOICE');
    expect(getCountryConfig('AU').tax.taxInvoiceTitle).toBe('TAX INVOICE');
    expect(getCountryConfig('CA').tax.supportsTaxInvoice).toBe(true);
    expect(getCountryConfig('US').tax.supportsTaxInvoice).toBe(false);
    expect(getCountryConfig('DE').tax.taxInvoiceTitle).toBe('RECHNUNG');
    expect(getCountryConfig('CH').tax.taxInvoiceTitle).toBe('INVOICE');
    expect(getCountryConfig('IN').tax.taxInvoiceTitle).toBe('TAX INVOICE');
    expect(getCountryConfig('AE').tax.taxInvoiceTitle).toBe('TAX INVOICE');
  });

  it('prints the market’s own title for a normal invoice', () => {
    expect(getCountryConfig('US').invoice.documentTitle).toBe('INVOICE');
    expect(getCountryConfig('UK').invoice.documentTitle).toBe('INVOICE');
    expect(getCountryConfig('DE').invoice.documentTitle).toBe('RECHNUNG');
    expect(getCountryConfig('CH').invoice.documentTitle).toBe('INVOICE');
    expect(getCountryConfig('IN').invoice.documentTitle).toBe('INVOICE');
    expect(getCountryConfig('AE').invoice.documentTitle).toBe('INVOICE');
  });

  it('carries the market-specific invoice fields', () => {
    expect(getCountryConfig('DE').tax.supplyDateField).toBe(true);
    expect(getCountryConfig('DE').tax.registrationFormat).toBe('de-vat');
    expect(getCountryConfig('CH').tax.registrationFormat).toBe('ch-mwst');
    expect(getCountryConfig('CH').tax.labels).toEqual(['VAT', 'MWST', 'TVA', 'IVA']);
    expect(getCountryConfig('IN').invoice.numberMaxLength).toBe(16);
    expect(getCountryConfig('IN').invoice.customerTaxId?.label).toBe('GSTIN');
    expect(getCountryConfig('IN').invoice.placeOfSupply?.options.length).toBe(36);
    expect(getCountryConfig('IN').invoice.taxSplit?.default).toBe('cgst-sgst');
    expect(getCountryConfig('IN').invoice.hsnCode?.requiredOnTaxInvoice).toBe(true);
    expect(getCountryConfig('IN').invoice.signatureLine?.label).toBe('Authorised signatory');
    expect(getCountryConfig('AE').invoice.customerTaxId?.label).toBe('TRN');
    expect(getCountryConfig('AE').invoice.customerTaxId?.required).toBe(false);
    expect(getCountryConfig('US').invoice.customerTaxId).toBeUndefined();
  });
});

describe('applying a country to a draft', () => {
  it('moves the currency, tax name, registration label and line rates together', () => {
    const draft = countryInvoiceExample('UK', true);
    const next = applyCountryToDraft(draft, 'US');

    expect(next.country).toBe('US');
    expect(next.currency).toBe('USD');
    expect(next.taxLabel).toBe('Sales tax');
    expect(next.businessTaxIdLabel).toBe('EIN');
    expect(next.businessTaxId).toBe('');
    expect(next.paymentTerms).toBe('Net 30');
    expect(next.dueDate).not.toBe(draft.dueDate);
    expect(next.supplyDate).toBe('');
    expect(next.taxInvoice).toBe(false);
    expect(next.items.every((item) => item.taxPercent === '')).toBe(true);
  });

  it('keeps the UK country example aligned with the general example', () => {
    const country = countryInvoiceExample('UK', false);
    const general = invoiceExample();

    expect(country.businessName).toBe(general.businessName);
    expect(country.customerName).toBe(general.customerName);
    expect(country.currency).toBe(general.currency);
    expect(country.taxLabel).toBe(general.taxLabel);
    expect(country.paymentTerms).toBe(general.paymentTerms);
    expect(country.paymentDetails).toBe(general.paymentDetails);
    expect(country.items).toEqual(general.items);
  });

  it('turns the UK example into a VAT invoice with a supply date', () => {
    const vat = countryInvoiceExample('UK', true);

    expect(vat.taxInvoice).toBe(true);
    expect(vat.supplyDate).not.toBe('');
  });

  it('gives a normal UK invoice its supply date and leaves it off other markets', () => {
    expect(countryInvoiceExample('UK', false).supplyDate).not.toBe('');
    expect(countryInvoiceExample('US', false).supplyDate).toBe('');
    expect(countryInvoiceExample('CA', false).supplyDate).toBe('');
    expect(countryInvoiceExample('AU', false).supplyDate).toBe('');
  });

  it('keeps tax invoice mode when the next country has one', () => {
    const draft = countryInvoiceExample('UK', true);
    const next = applyCountryToDraft(draft, 'AU');

    expect(next.taxInvoice).toBe(true);
    expect(next.taxLabel).toBe('GST');
    expect(next.businessTaxIdLabel).toBe('ABN');
    expect(next.supplyDate).toBe('');
    expect(next.items.every((item) => item.taxPercent === '10')).toBe(true);
  });

  it('gives the UK a supply date again when a draft comes back from another market', () => {
    const uk = countryInvoiceExample('UK', false);
    const us = applyCountryToDraft(uk, 'US');
    const back = applyCountryToDraft(us, 'UK');

    expect(back.supplyDate).toBe(back.issueDate);
  });

  it('can keep the line rates when the caller asks', () => {
    const draft = countryInvoiceExample('UK', false);
    const next = applyCountryToDraft(draft, 'CA', { resetLineTax: false });

    expect(next.taxLabel).toBe('GST');
    expect(next.items[0]?.taxPercent).toBe('20');
  });

  it('moves only the default line rate when the tax name changes', () => {
    const items = [
      {
        id: 'a',
        description: 'Standard',
        quantity: '1',
        unitPrice: '10',
        discountPercent: '',
        taxPercent: '5',
        hsnCode: '',
      },
      {
        id: 'b',
        description: 'Zero rated',
        quantity: '1',
        unitPrice: '10',
        discountPercent: '',
        taxPercent: '0',
        hsnCode: '',
      },
      {
        id: 'c',
        description: 'Nova Scotia',
        quantity: '1',
        unitPrice: '10',
        discountPercent: '',
        taxPercent: '15',
        hsnCode: '',
      },
      {
        id: 'd',
        description: 'Empty',
        quantity: '1',
        unitPrice: '10',
        discountPercent: '',
        taxPercent: '',
        hsnCode: '',
      },
    ];

    const next = relabelLineTax(items, '5', '13');

    expect(next.map((item) => item.taxPercent)).toEqual(['13', '0', '15', '']);
  });

  it('moves the Indian fields with the country and clears them on the way out', () => {
    const india = countryInvoiceExample('IN', true);
    expect(india.placeOfSupply).toBe('29');
    expect(india.taxSplitMode).toBe('cgst-sgst');
    expect(india.customerTaxId).not.toBe('');

    const germany = applyCountryToDraft(india, 'DE');
    expect(germany.customerTaxId).toBe('');
    expect(germany.customerTaxIdLabel).toBe('Tax ID');
    expect(germany.placeOfSupply).toBe('');
    expect(germany.taxSplitMode).toBe('');
    expect(germany.items.every((item) => item.hsnCode === '')).toBe(true);

    const back = applyCountryToDraft(germany, 'IN');
    expect(back.placeOfSupply).toBe('');
    expect(back.taxSplitMode).toBe('cgst-sgst');
    expect(back.customerTaxIdLabel).toBe('GSTIN');
  });

  it('clears a place of supply when a draft moves to the UAE', () => {
    const india = countryInvoiceExample('IN', true);
    const uae = applyCountryToDraft(india, 'AE');

    expect(uae.placeOfSupply).toBe('');
    expect(uae.taxSplitMode).toBe('');
    expect(uae.customerTaxId).toBe('');
    expect(uae.customerTaxIdLabel).toBe('TRN');
    expect(uae.currency).toBe('AED');
  });

  it('moves the supply date between Germany and Switzerland', () => {
    const germany = countryInvoiceExample('DE', true);
    expect(germany.supplyDate).not.toBe('');

    const switzerland = applyCountryToDraft(germany, 'CH');
    expect(switzerland.supplyDate).toBe('');

    const back = applyCountryToDraft(switzerland, 'DE');
    expect(back.supplyDate).toBe(back.issueDate);
  });

  it('defaults a Swiss label switch without changing the rate', () => {
    const switzerland = countryInvoiceExample('CH', true);
    const tva = {
      ...switzerland,
      taxLabel: 'TVA' as const,
    };

    expect(lineTaxForLabel(getCountryConfig('CH'), tva.taxLabel)).toBe('8.1');
    expect(taxIdLabelFor(getCountryConfig('CH'), tva.taxLabel)).toBe('MWST number');
  });

  it('takes the market from the hydrate arguments, not the preset', () => {
    const hydrated = hydrateCountryExample(countryInvoicePreset('UK', false), 'US', false);

    expect(hydrated.country).toBe('US');
    expect(hydrated.taxInvoice).toBe(false);
    expect(hydrated.issueDate).not.toBe('');
    expect(hydrated.dueDate).not.toBe('');
  });
});

describe('the country helpers', () => {
  it('maps each currency to its market', () => {
    expect(countryForCurrency('USD')).toBe('US');
    expect(countryForCurrency('GBP')).toBe('UK');
    expect(countryForCurrency('CAD')).toBe('CA');
    expect(countryForCurrency('AUD')).toBe('AU');
    expect(countryForCurrency('EUR')).toBe('DE');
    expect(countryForCurrency('CHF')).toBe('CH');
    expect(countryForCurrency('INR')).toBe('IN');
    expect(countryForCurrency('AED')).toBe('AE');
  });

  it('names the Canadian registration number after the tax', () => {
    const canada = getCountryConfig('CA');

    expect(taxIdLabelFor(canada, 'GST')).toBe('GST number');
    expect(taxIdLabelFor(canada, 'HST')).toBe('HST number');
    expect(taxIdLabelFor(getCountryConfig('UK'), 'VAT')).toBe('VAT number');
  });

  it('leaves a US line rate empty rather than writing zero', () => {
    expect(defaultLineTax(getCountryConfig('US'))).toBe('');
    expect(defaultLineTax(getCountryConfig('UK'))).toBe('20');
  });

  it('moves a Canadian line between the GST and HST examples', () => {
    const canada = getCountryConfig('CA');

    expect(lineTaxForLabel(canada, 'GST')).toBe('5');
    expect(lineTaxForLabel(canada, 'HST')).toBe('13');
    expect(lineTaxForLabel(getCountryConfig('UK'), 'VAT')).toBe('20');
  });
});

describe('the Phase 8 country examples', () => {
  it('gives Germany a Kleinunternehmer example and a registered one', () => {
    const normal = countryInvoiceExample('DE', false);
    const vat = countryInvoiceExample('DE', true);

    expect(normal.businessTaxIdLabel).toBe('Tax number');
    expect(normal.notes).toContain('§ 19 UStG');
    expect(normal.items.every((item) => item.taxPercent === '')).toBe(true);
    expect(normal.supplyDate).not.toBe('');

    expect(vat.businessTaxIdLabel).toBe('VAT ID');
    expect(vat.businessTaxId).toMatch(/^DE\d{9}$/);
    expect(vat.items.every((item) => item.taxPercent === '19')).toBe(true);
    expect(vat.supplyDate).not.toBe('');
  });

  it('gives Switzerland a Zurich MWST example and a Geneva TVA one', () => {
    const normal = countryInvoiceExample('CH', false);
    const vat = countryInvoiceExample('CH', true);

    expect(normal.taxLabel).toBe('MWST');
    expect(normal.businessTaxId).toBe('');
    expect(normal.items.every((item) => item.taxPercent === '')).toBe(true);

    expect(vat.taxLabel).toBe('TVA');
    expect(vat.businessTaxId).toBe('CHE-000.000.000 MWST');
    expect(vat.items.every((item) => item.taxPercent === '8.1')).toBe(true);
  });

  it('gives India a non-registered example and both GST directions', () => {
    const normal = countryInvoiceExample('IN', false);
    const intra = countryInvoiceExample('IN', true);
    const inter = countryInvoiceExample('IN', true, { interState: true });

    expect(normal.businessTaxId).toBe('');
    expect(normal.items.every((item) => item.taxPercent === '')).toBe(true);

    expect(intra.placeOfSupply).toBe('29');
    expect(intra.taxSplitMode).toBe('cgst-sgst');
    expect(intra.items.every((item) => item.hsnCode !== '')).toBe(true);

    expect(inter.placeOfSupply).toBe('27');
    expect(inter.taxSplitMode).toBe('igst');
    expect(inter.customerTaxId).not.toBe(intra.customerTaxId);
  });

  it('gives the UAE a non-registered example and a TRN example', () => {
    const normal = countryInvoiceExample('AE', false);
    const vat = countryInvoiceExample('AE', true);

    expect(normal.businessTaxId).toBe('');
    expect(normal.items.every((item) => item.taxPercent === '')).toBe(true);

    expect(vat.businessTaxId).toMatch(/^\d{15}$/);
    expect(vat.customerTaxId).toMatch(/^\d{15}$/);
    expect(vat.items.every((item) => item.taxPercent === '5')).toBe(true);
  });

  it('gives every country example a printable invoice', () => {
    const codes = ['US', 'UK', 'CA', 'AU', 'DE', 'CH', 'IN', 'AE'] as const;

    for (const code of codes) {
      for (const taxInvoice of [false, true]) {
        const draft = countryInvoiceExample(code, taxInvoice);
        const result = validateDocumentDraft(draft, 'invoice');

        expect(result.ok, `${code} ${taxInvoice}: ${JSON.stringify(result.errors)}`).toBe(true);
      }
    }

    const interState = countryInvoiceExample('IN', true, { interState: true });
    expect(validateDocumentDraft(interState, 'invoice').ok).toBe(true);
  });
});

describe('the no-VAT note', () => {
  it('matches the German example and disappears in tax invoice mode', () => {
    const de = getCountryConfig('DE');
    const normal = countryInvoicePreset('DE', false);
    const vat = countryInvoicePreset('DE', true);

    expect(de.invoice.noVatNote).toBeTruthy();
    expect(normal.notes).toBe(de.invoice.noVatNote);
    expect(vat.notes).not.toBe(de.invoice.noVatNote);
  });

  it('is only set where a market has one', () => {
    for (const country of COUNTRIES) {
      if (country.code === 'DE') continue;
      expect(country.invoice.noVatNote, country.code).toBeUndefined();
    }
  });
});
