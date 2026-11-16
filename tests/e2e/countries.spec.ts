import { test, expect, type Page } from '@playwright/test';

const COUNTRY_PATHS = [
  '/us/invoice-generator/',
  '/uk/invoice-generator/',
  '/uk/vat-invoice-generator/',
  '/ca/invoice-generator/',
  '/ca/gst-hst-invoice-generator/',
  '/au/invoice-generator/',
  '/au/tax-invoice-generator/',
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
      await expect(page.locator(`a[href="${path}"]`).first()).toBeVisible();
    }

    const table = page.locator('#compare table');
    await expect(table).toContainText('VAT INVOICE');
    await expect(table).toContainText('TAX INVOICE');
    await expect(table).toContainText('Not used');
  });

  test('every guide link resolves', async ({ request }) => {
    for (const path of COUNTRY_PATHS) {
      const response = await request.get(path);
      expect(response.status(), `expected ${path} to resolve`).toBeLessThan(400);
    }
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
});
