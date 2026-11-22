import { test, expect, type Page } from '@playwright/test';

/**
 * The cross-border treatments, end to end.
 *
 * Each market prints a different sentence and zero-rates the lines, so the
 * checks read the sheet rather than the form: what a customer would receive is
 * the thing that has to be right.
 */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForSelector('html[data-generator-ready]');
}

test.describe('cross-border treatments', () => {
  test('Germany prints the reverse-charge sentence and charges no VAT', async ({ page }) => {
    await open(page, '/de/vat-invoice-generator/');

    const sheet = page.locator('.sheet');
    await expect(sheet).not.toContainText('Steuerschuldnerschaft');

    await page.selectOption('#crossBorder', 'eu-reverse-charge');

    await expect(sheet.locator('.sheet-endorsement')).toContainText('3a Abs. 2 UStG');
    await expect(sheet.locator('.sheet-endorsement')).toContainText('Reverse Charge');
    await expect(page.locator('#crossBorderCustomerTaxId')).toBeVisible();

    const total = await sheet.locator('.sheet-total-row--total dd').textContent();
    const subtotal = await sheet.locator('.sheet-total-row dd').first().textContent();
    expect(total).toBe(subtotal);

    await expect(sheet).not.toContainText('MwSt 19%');
  });

  test('Germany asks for the customer VAT ID before printing', async ({ page }) => {
    await open(page, '/de/vat-invoice-generator/');
    await page.selectOption('#crossBorder', 'eu-reverse-charge');

    await page.getByRole('button', { name: 'Print or save as PDF' }).click();

    await expect(page.getByText('Customer USt-IdNr. is required.')).toBeVisible();
  });

  test('India hides the place of supply on an export under LUT', async ({ page }) => {
    await open(page, '/in/gst-invoice-generator/');

    await expect(page.locator('#placeOfSupply')).toBeVisible();
    await expect(page.locator('#taxSplitMode')).toBeVisible();

    await page.selectOption('#crossBorder', 'export-lut');

    await expect(page.locator('#placeOfSupply')).toHaveCount(0);
    await expect(page.locator('#taxSplitMode')).toHaveCount(0);
    await expect(page.locator('.sheet-endorsement')).toContainText(
      'WITHOUT PAYMENT OF INTEGRATED TAX',
    );
  });

  test('the UAE prints the export sentence', async ({ page }) => {
    await open(page, '/ae/vat-invoice-generator/');
    await page.selectOption('#crossBorder', 'export-services');

    await expect(page.locator('.sheet-endorsement')).toContainText(
      'The place of supply is outside the UAE',
    );
  });

  test('a market without a treatment renders no control', async ({ page }) => {
    await open(page, '/us/invoice-generator/');
    await expect(page.locator('#crossBorder')).toHaveCount(0);
  });
});
