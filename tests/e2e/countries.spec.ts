import { test, expect, type Page } from '@playwright/test';

const COUNTRY_PATHS = [
  '/us/invoice-generator/',
  '/uk/invoice-generator/',
  '/uk/vat-invoice-generator/',
  '/ca/invoice-generator/',
  '/ca/gst-hst-invoice-generator/',
  '/au/invoice-generator/',
  '/au/tax-invoice-generator/',
  '/de/invoice-generator/',
  '/de/vat-invoice-generator/',
  '/ch/invoice-generator/',
  '/ch/vat-invoice-generator/',
  '/in/invoice-generator/',
  '/in/gst-invoice-generator/',
  '/ae/invoice-generator/',
  '/ae/vat-invoice-generator/',
] as const;

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForSelector('html[data-generator-ready]');
}

test.describe('the country hub', () => {
  test('links every country invoice guide', async ({ page }) => {
    await page.goto('/countries/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Invoice rules by country');

    for (const path of COUNTRY_PATHS) {
      await expect(page.locator(`main a[href="${path}"]`).first()).toBeVisible();
    }

    const table = page.locator('#compare table');
    await expect(table).toContainText('RECHNUNG');
    await expect(table).toContainText('VAT INVOICE');
    await expect(table).toContainText('TAX INVOICE');
    await expect(table).toContainText('INVOICE');
  });

  test('every guide link resolves', async ({ request }) => {
    for (const path of COUNTRY_PATHS) {
      const response = await request.get(path);
      expect(response.status(), `expected ${path} to resolve`).toBeLessThan(400);
    }
  });

  test('keeps its ad boxes reserved', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/countries/');

    const heights = await page.evaluate(() => ({
      leaderboard: Math.round(
        document.querySelector('[data-slot="leaderboard"]')!.getBoundingClientRect().height,
      ),
      infeed: Math.round(
        document.querySelector('[data-slot="infeed"]')!.getBoundingClientRect().height,
      ),
      end: Math.round(document.querySelector('[data-slot="end"]')!.getBoundingClientRect().height),
    }));

    expect(heights.leaderboard).toBe(120);
    expect(heights.infeed).toBe(280);
    expect(heights.end).toBe(250);
  });
});

test.describe('country page structured data', () => {
  test('emits one FAQPage and one BreadcrumbList, not duplicates', async ({ page }) => {
    await page.goto('/in/gst-invoice-generator/');

    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) =>
        scripts.map((script) => JSON.parse(script.textContent ?? '{}')['@type'] as string),
      );

    expect(types.filter((type) => type === 'FAQPage')).toHaveLength(1);
    expect(types.filter((type) => type === 'BreadcrumbList')).toHaveLength(1);
    expect(types.filter((type) => type === 'WebApplication')).toHaveLength(1);
  });
});

test.describe('the UK VAT invoice page', () => {
  test('opens with the full VAT invoice fields and title', async ({ page }) => {
    await open(page, '/uk/vat-invoice-generator/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('VAT Invoice Generator');
    await expect(page.getByLabel('Country')).toHaveValue('UK');
    await expect(page.getByLabel('Country')).toBeDisabled();
    await expect(
      page.getByText('This page follows the United Kingdom invoice rules.'),
    ).toBeVisible();

    await expect(page.getByLabel('Supply date')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Print this as a VAT invoice/ })).toBeChecked();
    await expect(
      page.getByRole('checkbox', { name: /Print this as a VAT invoice/ }),
    ).toBeDisabled();

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('VAT INVOICE');
    await expect(sheet).toContainText('VAT number: GB 000 0000 00');
    await expect(sheet).toContainText('Supply date');
    await expect(sheet).toContainText('£2,299.50');
    await expect(page.locator('nav[aria-label="Primary"] a[href="/countries/"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('a saved profile cannot change the market or the currency', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'soloyolo-business-profile',
        JSON.stringify({
          version: 1,
          businessName: 'Saved Studio',
          address: '1 Test Street\nLeeds',
          email: 'hello@saved.test',
          phone: '',
          website: '',
          taxId: '12-3456789',
          taxIdLabel: 'EIN',
          logoDataUrl: '',
          defaultNotes: '',
          currency: 'USD',
          updatedAt: '2026-11-16T00:00:00.000Z',
        }),
      );
    });

    await page.goto('/uk/vat-invoice-generator/');
    await page.waitForSelector('html[data-generator-ready]');

    await expect(page.getByLabel('Business name')).toHaveValue('Saved Studio');
    await expect(page.getByLabel('Country')).toHaveValue('UK');
    await expect(page.getByLabel('Currency')).toHaveValue('GBP');
    await expect(page.getByRole('textbox', { name: 'VAT number', exact: true })).toHaveValue('');
  });

  test('cites HMRC for the VAT invoice rules', async ({ page }) => {
    await page.goto('/uk/vat-invoice-generator/');

    await expect(
      page.getByRole('link', { name: /HMRC: Record keeping \(VAT Notice 700\/21\)/ }),
    ).toHaveAttribute('href', 'https://www.gov.uk/guidance/record-keeping-for-vat-notice-70021');
  });

  test('exposes WebApplication, FAQPage and BreadcrumbList data', async ({ page }) => {
    await page.goto('/uk/vat-invoice-generator/');

    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) =>
        scripts.map((script) => JSON.parse(script.textContent ?? '{}')['@type']),
      );

    expect(types).toContain('WebApplication');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
  });
});

test.describe('the UK invoice page', () => {
  test('starts as a normal invoice, not a VAT invoice', async ({ page }) => {
    await open(page, '/uk/invoice-generator/');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('INVOICE');
    await expect(sheet).not.toContainText('VAT INVOICE');
    await expect(sheet).toContainText('Supply date');
    await expect(
      page.getByRole('checkbox', { name: /Print this as a VAT invoice/ }),
    ).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: /Print this as a VAT invoice/ })).toBeEnabled();
  });
});

test.describe('the Australian tax invoice page', () => {
  test('prints TAX INVOICE with the ABN and 10% GST', async ({ page }) => {
    await open(page, '/au/tax-invoice-generator/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tax Invoice Generator');
    await expect(page.getByLabel('Country')).toHaveValue('AU');
    await expect(page.getByLabel('Country')).toBeDisabled();

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('TAX INVOICE');
    await expect(sheet).toContainText('ABN: 00 000 000 000');
    await expect(sheet).toContainText('GST 10%');
    await expect(sheet).toContainText('$6,160.00');
  });

  test('cites the ATO tax invoice page', async ({ page }) => {
    await page.goto('/au/tax-invoice-generator/');

    await expect(page.getByRole('link', { name: 'ATO: Tax invoices' })).toHaveAttribute(
      'href',
      'https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/tax-invoices',
    );
  });
});

test.describe('the Canada GST/HST invoice page', () => {
  test('starts with HST 13% and the HST number', async ({ page }) => {
    await open(page, '/ca/gst-hst-invoice-generator/');

    await expect(page.getByLabel('Country')).toHaveValue('CA');
    await expect(page.getByLabel('Tax name')).toHaveValue('HST');
    await expect(page.getByRole('textbox', { name: 'HST number', exact: true })).toHaveValue(
      '00000 0000 RT0001',
    );

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('HST 13%');
    await expect(sheet).toContainText('HST number: 00000 0000 RT0001');
    await expect(sheet).toContainText('$5,073.70');
  });

  test('cites the CRA input tax credit chart', async ({ page }) => {
    await page.goto('/ca/gst-hst-invoice-generator/');

    await expect(
      page.getByRole('link', { name: /CRA: Input tax credits, records you need/ }),
    ).toHaveAttribute(
      'href',
      'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/input-tax-credit.html',
    );
  });
});

test.describe('the US invoice page', () => {
  test('uses USD and leaves sales tax out of the example', async ({ page }) => {
    await open(page, '/us/invoice-generator/');

    await expect(page.getByLabel('Country')).toHaveValue('US');
    await expect(page.getByLabel('Country')).toBeDisabled();
    await expect(page.getByRole('checkbox', { name: /Print this as a tax invoice/ })).toHaveCount(
      0,
    );

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('$4,750.00');
    await expect(sheet).not.toContainText('VAT');
    await expect(sheet).not.toContainText('GST');
    await expect(sheet).not.toContainText('Sales tax');
  });
});

test.describe('the India GST invoice page', () => {
  test('splits one GST total into CGST and SGST, then IGST', async ({ page }) => {
    await open(page, '/in/gst-invoice-generator/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('GST Invoice Generator');
    await expect(page.getByLabel('Country')).toHaveValue('IN');
    await expect(page.getByLabel('Country')).toBeDisabled();
    await expect(page.getByLabel('Place of supply', { exact: true })).toHaveValue('29');
    await expect(page.getByRole('textbox', { name: 'GSTIN', exact: true }).first()).toHaveValue(
      '29ABCDE1234F1Z5',
    );

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('TAX INVOICE');
    await expect(sheet).toContainText('GSTIN: 29ABCDE1234F1Z5');
    await expect(sheet).toContainText('29 - Karnataka');
    await expect(sheet).toContainText('CGST 9%');
    await expect(sheet).toContainText('SGST 9%');
    await expect(sheet).toContainText('₹7,650.00');
    await expect(sheet).toContainText('₹1,00,300.00');
    await expect(sheet).toContainText('HSN/SAC 998221');
    await expect(sheet).toContainText('Authorised signatory');

    await page.getByLabel('GST type').selectOption('igst');

    await expect(sheet).toContainText('IGST 18%');
    await expect(sheet).not.toContainText('CGST');
    await expect(sheet).not.toContainText('SGST');
    await expect(sheet).toContainText('₹15,300.00');
    await expect(sheet).toContainText('₹1,00,300.00');
  });

  test('cites Rule 46 and the e-invoicing boundary', async ({ page }) => {
    await page.goto('/in/gst-invoice-generator/');

    await expect(page.getByRole('link', { name: /Rule 46/ })).toHaveAttribute(
      'href',
      'https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter6/rule46_v1.00.html',
    );
    await expect(page.getByText(/Print or PDF is not an e-invoice/)).toBeVisible();
  });

  test('groups an INR amount the way the sheet prints it', async ({ page }) => {
    await open(page, '/in/gst-invoice-generator/');

    const price = page.getByLabel('Unit price').first();
    await price.fill('100000');

    await expect(price).toHaveValue('1,00,000');
    await expect(page.locator('.sheet')).toContainText('₹1,00,000.00');
    await expect(page.locator('.sheet')).toContainText('₹1,47,500.00');
    await expect(page.locator('.sheet')).toContainText('₹11,250.00');
  });

  test('a saved profile fills the business details but keeps the locked GST document fields', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'soloyolo-business-profile',
        JSON.stringify({
          version: 1,
          businessName: 'Saved Ledger',
          address: '1 Test Street\nPune',
          email: 'hello@saved.test',
          phone: '',
          website: '',
          taxId: '27ABCDE1234F1Z5',
          taxIdLabel: 'GSTIN',
          logoDataUrl: '',
          defaultNotes: '',
          currency: 'INR',
          updatedAt: '2026-11-17T00:00:00.000Z',
        }),
      );
    });

    await page.goto('/in/gst-invoice-generator/');
    await page.waitForSelector('html[data-generator-ready]');

    await expect(page.getByLabel('Business name')).toHaveValue('Saved Ledger');
    await expect(page.getByLabel('Country')).toHaveValue('IN');
    await expect(page.getByLabel('Currency')).toHaveValue('INR');
    await expect(page.getByRole('textbox', { name: 'GSTIN', exact: true }).first()).toHaveValue(
      '27ABCDE1234F1Z5',
    );
    await expect(page.getByLabel('Place of supply', { exact: true })).toHaveValue('29');
    await expect(page.getByRole('textbox', { name: 'HSN/SAC', exact: true }).first()).toHaveValue(
      '998221',
    );
  });
});

test.describe('the Germany invoice pages', () => {
  test('the normal page starts as a Kleinunternehmer Rechnung with no VAT', async ({ page }) => {
    await open(page, '/de/invoice-generator/');

    await expect(page.getByLabel('Country')).toHaveValue('DE');
    await expect(page.getByLabel('Country')).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Tax number', exact: true })).toHaveValue(
      '00/000/00000',
    );

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('RECHNUNG');
    await expect(sheet).toContainText('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.');
    await expect(sheet).not.toContainText('19%');
    await expect(sheet).toContainText('€3,540.00');
  });

  test('the VAT page requires the USt-IdNr. and prints 19%', async ({ page }) => {
    await open(page, '/de/vat-invoice-generator/');

    await expect(page.getByLabel('Country')).toHaveValue('DE');
    await expect(page.getByRole('textbox', { name: 'VAT ID', exact: true })).toHaveValue(
      'DE000000000',
    );
    await expect(page.getByLabel('Supply date', { exact: true })).toBeVisible();

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('RECHNUNG');
    await expect(sheet).toContainText('VAT ID: DE000000000');
    await expect(sheet).toContainText('MwSt 19%');
    await expect(sheet).toContainText('€5,164.60');
  });

  test('cites the e-invoicing timetable', async ({ page }) => {
    await page.goto('/de/vat-invoice-generator/');

    await expect(page.getByRole('link', { name: /BMF: E-invoicing FAQ/ })).toHaveAttribute(
      'href',
      'https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html',
    );
    await expect(page.getByText(/1 January 2027/).first()).toBeVisible();
  });

  test('restores a saved Steuernummer under the Tax number label', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'soloyolo-business-profile',
        JSON.stringify({
          version: 1,
          businessName: 'Saved Studio',
          address: '1 Test Street\nLeipzig',
          email: 'hello@saved.test',
          phone: '',
          website: '',
          taxId: '00/000/00000',
          taxIdLabel: 'Tax number',
          logoDataUrl: '',
          defaultNotes: '',
          currency: 'EUR',
          updatedAt: '2026-11-17T00:00:00.000Z',
        }),
      );
    });

    await page.goto('/de/invoice-generator/');
    await page.waitForSelector('html[data-generator-ready]');

    await expect(page.getByLabel('Registration number type')).toHaveValue('Tax number');
    const field = page.getByRole('textbox', { name: 'Tax number', exact: true });
    await expect(field).toHaveValue('00/000/00000');
    await expect(field).not.toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('the Switzerland invoice pages', () => {
  test('the normal page is a non-registered CHF invoice with no VAT', async ({ page }) => {
    await open(page, '/ch/invoice-generator/');

    await expect(page.getByLabel('Country')).toHaveValue('CH');
    await expect(page.getByLabel('Tax name')).toHaveValue('MWST');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('INVOICE');
    await expect(sheet).toContainText('CHF');
    await expect(sheet).not.toContainText('8.1%');
    await expect(sheet).not.toContainText('MWST number:');
  });

  test('the VAT page prints TVA at 8.1% with the CHE number', async ({ page }) => {
    await open(page, '/ch/vat-invoice-generator/');

    await expect(page.getByLabel('Country')).toHaveValue('CH');
    await expect(page.getByLabel('Tax name')).toHaveValue('TVA');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('INVOICE');
    await expect(sheet).toContainText('TVA 8.1%');
    await expect(sheet).toContainText('MWST number: CHE-000.000.000 MWST');

    await page.getByLabel('Tax name').selectOption('IVA');
    await expect(sheet).toContainText('IVA 8.1%');
    await expect(sheet).toContainText('8.1%');
  });

  test('cites the ESTV rates and the ballot watch', async ({ page }) => {
    await page.goto('/ch/vat-invoice-generator/');

    await expect(page.getByRole('link', { name: /ESTV: Swiss VAT rates/ })).toHaveAttribute(
      'href',
      'https://www.estv.admin.ch/en/vat-rates-switzerland',
    );
    await expect(page.getByText(/29 November 2026/).first()).toBeVisible();
  });
});

test.describe('the UAE invoice pages', () => {
  test('the normal page is a non-registered AED invoice with no VAT', async ({ page }) => {
    await open(page, '/ae/invoice-generator/');

    await expect(page.getByLabel('Country')).toHaveValue('AE');
    await expect(page.getByRole('textbox', { name: 'TRN', exact: true }).first()).toHaveValue('');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('INVOICE');
    await expect(sheet).toContainText('AED');
    await expect(sheet).not.toContainText('VAT 5%');
  });

  test('the VAT page prints the supplier TRN, the customer TRN and 5% VAT', async ({ page }) => {
    await open(page, '/ae/vat-invoice-generator/');

    await expect(page.getByLabel('Country')).toHaveValue('AE');
    await expect(page.getByRole('textbox', { name: 'TRN', exact: true }).first()).toHaveValue(
      '000000000000000',
    );

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('TAX INVOICE');
    await expect(sheet).toContainText('TRN: 000000000000000');
    await expect(sheet).toContainText('VAT 5%');
    await expect(sheet).toContainText('35,700.00');
  });

  test('cites the FTA e-invoicing boundary', async ({ page }) => {
    await page.goto('/ae/vat-invoice-generator/');

    await expect(page.getByRole('link', { name: /FTA: UAE e-Invoicing/ })).toHaveAttribute(
      'href',
      'https://tax.gov.ae/en/content/uae.einvoicing.aspx',
    );
    await expect(page.getByText(/244\/2025/).first()).toBeVisible();
  });
});

test.describe('the general invoice generator country switch', () => {
  test('moves currency, tax name and line rates with the country', async ({ page }) => {
    await open(page, '/generators/invoice-generator/');

    await page.getByLabel('Country').selectOption('AU');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('GST 10%');
    await expect(sheet).toContainText('$1,916.25');

    await page.getByLabel('Country').selectOption('US');

    await expect(sheet).toContainText('$1,916.25');
    await expect(sheet).not.toContainText('VAT');
    await expect(sheet).not.toContainText('GST');
    await expect(page.getByRole('checkbox', { name: /Print this as a tax invoice/ })).toHaveCount(
      0,
    );
  });

  test('moves a Canadian line between GST and HST', async ({ page }) => {
    await open(page, '/generators/invoice-generator/');

    await page.getByLabel('Country').selectOption('CA');
    await expect(page.getByLabel('Tax name')).toHaveValue('GST');
    await expect(page.locator('.sheet')).toContainText('GST 5%');

    await page.getByLabel('Tax name').selectOption('HST');
    await expect(page.locator('.sheet')).toContainText('HST 13%');
    await expect(page.getByRole('textbox', { name: 'HST number', exact: true })).toBeVisible();
  });

  test('keeps a zero-rated or hand-entered line when the tax name changes', async ({ page }) => {
    await open(page, '/generators/invoice-generator/');

    await page.getByLabel('Country').selectOption('CA');

    const taxRates = page.getByLabel('Tax rate');
    await taxRates.nth(0).fill('0');
    await taxRates.nth(1).fill('15');

    await page.getByLabel('Tax name').selectOption('HST');

    await expect(taxRates.nth(0)).toHaveValue('0');
    await expect(taxRates.nth(1)).toHaveValue('15');
  });

  test('moves through the four new markets and clears their extra fields', async ({ page }) => {
    await open(page, '/generators/invoice-generator/');

    await page.getByLabel('Country').selectOption('DE');
    await expect(page.getByLabel('Tax name')).toHaveValue('MwSt');
    await expect(page.getByLabel('Currency')).toHaveValue('EUR');
    await expect(page.locator('.sheet')).toContainText('RECHNUNG');
    await expect(page.locator('.sheet')).toContainText('MwSt 19%');
    await expect(page.getByLabel('Supply date', { exact: true })).toBeVisible();

    await page.getByLabel('Country').selectOption('CH');
    await expect(page.getByLabel('Tax name')).toHaveValue('VAT');
    await expect(page.getByLabel('Currency')).toHaveValue('CHF');
    await expect(page.locator('.sheet')).toContainText('INVOICE');
    await expect(page.locator('.sheet')).toContainText('VAT 8.1%');
    await expect(page.getByLabel('Supply date', { exact: true })).toHaveCount(0);

    await page.getByLabel('Country').selectOption('IN');
    await expect(page.getByLabel('Tax name')).toHaveValue('GST');
    await expect(page.getByLabel('Currency')).toHaveValue('INR');
    await expect(page.getByLabel('GST type')).toBeVisible();
    await expect(page.getByLabel('Place of supply', { exact: true })).toBeVisible();
    await expect(page.locator('.sheet')).toContainText('GST 18%');

    await page.getByLabel('Country').selectOption('AE');
    await expect(page.getByLabel('Tax name')).toHaveValue('VAT');
    await expect(page.getByLabel('Currency')).toHaveValue('AED');
    await expect(page.getByLabel('GST type')).toHaveCount(0);
    await expect(page.getByLabel('Place of supply', { exact: true })).toHaveCount(0);
    await expect(page.locator('.sheet')).toContainText('VAT 5%');
  });
});

test.describe('print on a country page', () => {
  test('only the tax invoice reaches the printer', async ({ page }) => {
    await open(page, '/au/tax-invoice-generator/');
    await page.emulateMedia({ media: 'print' });

    const sheetVisible = await page
      .locator('.sheet')
      .evaluate((element) => getComputedStyle(element).display !== 'none');
    const formVisible = await page
      .locator('.generator-form')
      .evaluate((element) => getComputedStyle(element).display !== 'none');
    const headerVisible = await page
      .locator('header.nav')
      .evaluate((element) => getComputedStyle(element).display !== 'none');

    expect(sheetVisible).toBe(true);
    expect(formVisible).toBe(false);
    expect(headerVisible).toBe(false);
  });

  test('prints the Indian split summary and signature line', async ({ page }) => {
    await open(page, '/in/gst-invoice-generator/');
    await page.emulateMedia({ media: 'print' });

    const sheet = page.locator('.sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('CGST 9%');
    await expect(sheet).toContainText('SGST 9%');
    await expect(sheet).toContainText('Authorised signatory');

    const signaturePosition = await page
      .locator('.sheet-signature')
      .evaluate((element) => getComputedStyle(element).display);
    expect(signaturePosition).not.toBe('none');
  });
});

test.describe('the country pages on a phone', () => {
  test('the hub does not overflow at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/countries/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(361);
  });

  test('the Australian tax invoice page does not overflow at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, '/au/tax-invoice-generator/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(361);
  });

  test('the India GST invoice page does not overflow at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, '/in/gst-invoice-generator/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(361);
  });

  test('the Germany VAT invoice page does not overflow at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, '/de/vat-invoice-generator/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(361);
  });

  test('the UAE VAT invoice page does not overflow at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, '/ae/vat-invoice-generator/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(361);
  });

  test('wraps a long place of supply inside the sheet on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await open(page, '/in/gst-invoice-generator/');

    await page.getByLabel('Place of supply', { exact: true }).selectOption('26');
    await expect(page.locator('.sheet')).toContainText('Dadra and Nagar Haveli');

    const sheetOverflow = await page
      .locator('.sheet')
      .evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(sheetOverflow).toBeLessThanOrEqual(1);

    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(pageOverflow).toBeLessThanOrEqual(361);
  });
});
