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

describe('the country configs', () => {
  it('covers the four markets with one currency each', () => {
    expect(COUNTRIES.map((country) => country.code)).toEqual(['US', 'UK', 'CA', 'AU']);
    expect(COUNTRIES.map((country) => country.currency)).toEqual(['USD', 'GBP', 'CAD', 'AUD']);
    expect(new Set(COUNTRIES.map((country) => country.currency)).size).toBe(4);
  });

  it('passes the build-time schema', () => {
    expect(() => assertCountryConfigs(COUNTRIES)).not.toThrow();
  });

  it('rejects a verification date that is not a real day', () => {
    const uk = getCountryConfig('UK');
    const result = countryConfigSchema.safeParse({ ...uk, verifiedOn: '2026-99-99' });

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
  });

  it('only offers a tax invoice where the market has one', () => {
    expect(getCountryConfig('UK').tax.supportsTaxInvoice).toBe(true);
    expect(getCountryConfig('UK').tax.taxInvoiceTitle).toBe('VAT INVOICE');
    expect(getCountryConfig('AU').tax.taxInvoiceTitle).toBe('TAX INVOICE');
    expect(getCountryConfig('CA').tax.supportsTaxInvoice).toBe(true);
    expect(getCountryConfig('US').tax.supportsTaxInvoice).toBe(false);
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
      },
      {
        id: 'b',
        description: 'Zero rated',
        quantity: '1',
        unitPrice: '10',
        discountPercent: '',
        taxPercent: '0',
      },
      {
        id: 'c',
        description: 'Nova Scotia',
        quantity: '1',
        unitPrice: '10',
        discountPercent: '',
        taxPercent: '15',
      },
      {
        id: 'd',
        description: 'Empty',
        quantity: '1',
        unitPrice: '10',
        discountPercent: '',
        taxPercent: '',
      },
    ];

    const next = relabelLineTax(items, '5', '13');

    expect(next.map((item) => item.taxPercent)).toEqual(['13', '0', '15', '13']);
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
