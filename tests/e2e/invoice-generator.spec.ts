import { test, expect, type Page } from '@playwright/test';

/**
 * The invoice generator, end to end.
 *
 * The print and clipboard calls are stubbed before the page loads: the point
 * is to prove the tool asks for them at the right moment, not to open a
 * print dialogue in the test runner.
 */
async function openGenerator(page: Page) {
  await page.addInitScript(() => {
    const scope = window as unknown as {
      __printCalls: number;
      __copied: string[];
    };
    scope.__printCalls = 0;
    scope.__copied = [];

    window.print = () => {
      scope.__printCalls += 1;
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText = async (text: string) => {
        scope.__copied.push(text);
      };
    }
  });

  await page.goto('/generators/invoice-generator/');
  await page.waitForSelector('html[data-generator-ready]');
}

test.describe('the invoice generator', () => {
  test('opens with a worked example and the totals that go with it', async ({ page }) => {
    await openGenerator(page);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Invoice Generator');
    await expect(page.getByLabel('Business name')).toHaveValue('Northwind Studio');
    await expect(page.getByLabel('Customer name')).toHaveValue('Alex Morgan');
    await expect(page.getByLabel('Invoice number')).toHaveValue('INV-0042');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('INVOICE');
    await expect(sheet).toContainText('INV-0042');
    await expect(sheet).toContainText('Brand identity');
    await expect(sheet).toContainText('£1,916.25');
    await expect(sheet).toContainText('£383.25');
    await expect(sheet).toContainText('£2,299.50');
  });

  test('recalculates the document when a price changes', async ({ page }) => {
    await openGenerator(page);

    const price = page.getByLabel('Unit price').first();
    await price.fill('2000');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('£2,716.25');
    await expect(sheet).toContainText('£543.25');
    await expect(sheet).toContainText('£3,259.50');
  });

  test('adds and removes a line item', async ({ page }) => {
    await openGenerator(page);

    await expect(page.getByLabel('Description')).toHaveCount(2);

    await page.getByRole('button', { name: 'Add a line item' }).click();
    await expect(page.getByLabel('Description')).toHaveCount(3);

    await page.getByRole('button', { name: 'Remove' }).first().click();
    await expect(page.getByLabel('Description')).toHaveCount(2);
  });

  test('a line with no description is not charged for', async ({ page }) => {
    await openGenerator(page);

    await page.getByLabel('Description').first().fill('');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('£716.25');
    await expect(sheet).not.toContainText('£1,916.25');
  });

  test('shows a field error for a number that cannot be read', async ({ page }) => {
    await openGenerator(page);

    const price = page.getByLabel('Unit price').first();
    await price.fill('twelve hundred');
    await price.blur();

    await expect(
      page.getByText('Enter the unit price as a number, for example 1200.'),
    ).toBeVisible();
    await expect(price).toHaveAttribute('aria-invalid', 'true');
  });

  test('takes a description as words, not as a number', async ({ page }) => {
    await openGenerator(page);

    const description = page.getByLabel('Description').first();

    // A number keypad on a phone, and a year regrouped to 2,026, were both
    // wrong: the field holds a description.
    await expect(description).not.toHaveAttribute('inputmode', 'numeric');

    await description.fill('');
    await description.pressSequentially('2026');

    await expect(description).toHaveValue('2026');
    const firstRow = page.locator('.sheet tbody tr').first();
    await expect(firstRow).toContainText('2026');
    await expect(firstRow).not.toContainText('2,026');
  });

  test('the line items summary link points at a field that exists', async ({ page }) => {
    await openGenerator(page);

    const descriptions = page.getByLabel('Description');
    const count = await descriptions.count();
    for (let index = 0; index < count; index += 1) {
      await descriptions.nth(index).fill('');
    }

    await page.getByRole('button', { name: 'Print or save as PDF' }).click();

    const link = page.getByRole('alert').getByRole('link', { name: 'Line items' });
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    expect(await page.locator(href as string).count()).toBe(1);

    await link.click();
    await expect(page.getByLabel('Description').first()).toBeFocused();
  });

  test('draws the native date picker in the page theme', async ({ page }) => {
    const scheme = () =>
      page.getByLabel('Due date').evaluate((element) => getComputedStyle(element).colorScheme);

    await page.emulateMedia({ colorScheme: 'dark' });
    await openGenerator(page);
    expect(await scheme()).toContain('dark');

    // The light theme must hand the native picker its light rendering too,
    // otherwise the calendar opens as a black panel on paper.
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await page.waitForSelector('html[data-generator-ready]');
    expect(await scheme()).toContain('light');
  });

  test('prints a long document in full, not just the first screen', async ({ page }) => {
    await openGenerator(page);

    for (let index = 0; index < 12; index += 1) {
      await page.getByRole('button', { name: 'Add a line item' }).click();
    }

    const descriptions = page.getByLabel('Description');
    const prices = page.getByLabel('Unit price');
    const count = await descriptions.count();
    for (let index = 2; index < count; index += 1) {
      await descriptions.nth(index).fill(`Extra line ${index}`);
      await prices.nth(index).fill('250');
    }

    await page.emulateMedia({ media: 'print' });

    const printLayout = await page.evaluate(() => {
      const preview = document.querySelector('.generator-preview') as HTMLElement;
      const style = getComputedStyle(preview);
      return {
        position: style.position,
        scrollHeight: preview.scrollHeight,
        clientHeight: preview.clientHeight,
      };
    });

    // A scroll box on paper silently drops everything past the first screen.
    expect(printLayout.position).toBe('static');
    expect(printLayout.scrollHeight - printLayout.clientHeight).toBeLessThanOrEqual(1);
  });

  test('blocks the print, announces the summary and moves focus to it', async ({ page }) => {
    await openGenerator(page);

    await page.getByLabel('Business name').fill('');

    const submit = page.getByRole('button', { name: 'Print or save as PDF' });
    await submit.scrollIntoViewIfNeeded();
    await submit.click();

    const summary = page.getByRole('alert');
    await expect(summary).toContainText('There is 1 thing to fix');
    await expect(summary).toBeFocused();

    const printCalls = await page.evaluate(
      () => (window as unknown as { __printCalls: number }).__printCalls,
    );
    expect(printCalls).toBe(0);
  });

  test('blocks a line whose total crosses the cap and never prints', async ({ page }) => {
    await openGenerator(page);

    const decline = page.locator('[data-consent-decline]');
    if (await decline.isVisible().catch(() => false)) await decline.click();

    await page.getByLabel('Quantity').first().fill('1000000');
    const price = page.getByLabel('Unit price').first();
    await price.fill('1000.01');
    await price.blur();

    // Wait for the live validation to reflect the cap before submitting; on a
    // slow mobile engine the click otherwise races the state render.
    await expect(page.getByText(/Line total must be/)).toBeVisible();

    const submit = page.getByRole('button', { name: 'Print or save as PDF' });
    await submit.scrollIntoViewIfNeeded();
    await submit.click();

    await expect(page.getByText(/Line total must be/)).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('to fix');
    const printCalls = await page.evaluate(
      () => (window as unknown as { __printCalls: number }).__printCalls,
    );
    expect(printCalls).toBe(0);
  });

  test('the summary link moves the focus to the field it names', async ({ page }) => {
    await openGenerator(page);

    await page.getByLabel('Business name').fill('');
    await page.getByRole('button', { name: 'Print or save as PDF' }).click();

    await page.getByRole('alert').getByRole('link', { name: 'Business name' }).click();

    await expect(page.getByLabel('Business name')).toBeFocused();
  });

  test('prints the document once everything is valid', async ({ page }) => {
    await openGenerator(page);

    await page.getByRole('button', { name: 'Print or save as PDF' }).click();

    const printCalls = await page.evaluate(
      () => (window as unknown as { __printCalls: number }).__printCalls,
    );
    expect(printCalls).toBe(1);
  });

  test('the preview toolbar will not print an incomplete document either', async ({ page }) => {
    await openGenerator(page);

    await page.getByLabel('Business name').fill('');

    const toolbarPrint = page.getByRole('button', { name: 'Print', exact: true });
    // On a phone the document, and its toolbar, sit behind the Preview tab.
    if (!(await toolbarPrint.isVisible())) {
      await page.getByRole('button', { name: 'Preview' }).click();
    }
    await toolbarPrint.click();

    const printCalls = await page.evaluate(
      () => (window as unknown as { __printCalls: number }).__printCalls,
    );
    expect(printCalls).toBe(0);
    await expect(page.getByRole('alert')).toContainText('There is 1 thing to fix');
  });

  test('copies the document as text', async ({ page }) => {
    await openGenerator(page);

    const copy = page.getByRole('button', { name: 'Copy', exact: true });
    // On a phone the document sits behind the Preview tab.
    if (!(await copy.isVisible())) {
      await page.getByRole('button', { name: 'Preview' }).click();
    }

    await copy.click();

    const copied = await page.evaluate(
      () => (window as unknown as { __copied: string[] }).__copied,
    );
    expect(copied[0]).toContain('INVOICE INV-0042');
    expect(copied[0]).toContain('Total: £2,299.50');
  });

  test('changes the currency without converting the amount', async ({ page }) => {
    await openGenerator(page);

    await page.getByLabel('Currency').selectOption('USD');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('$2,299.50');
    await expect(sheet).not.toContainText('£2,299.50');
  });

  test('uses the tax name and rate of the selected country', async ({ page }) => {
    await openGenerator(page);

    await page.getByLabel('Country').selectOption('AU');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('GST 10%');
    await expect(sheet).not.toContainText('VAT');
  });

  test('counts on from the number already used', async ({ page }) => {
    await openGenerator(page);

    await page.getByRole('button', { name: 'Use the next number' }).click();

    await expect(page.getByLabel('Invoice number')).toHaveValue('INV-0043');
  });

  test('counts on from a number written without a separator', async ({ page }) => {
    await openGenerator(page);

    await page.getByLabel('Invoice number').fill('INV0041');
    await page.getByRole('button', { name: 'Use the next number' }).click();

    await expect(page.getByLabel('Invoice number')).toHaveValue('INV-0042');
  });

  test('resets back to the worked example', async ({ page }) => {
    await openGenerator(page);

    await page.getByLabel('Customer name').fill('Someone else');
    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(page.getByLabel('Customer name')).toHaveValue('Alex Morgan');
    await expect(page.locator('.sheet')).toContainText('£2,299.50');
  });

  test('keeps the business details in this browser only when asked', async ({ page }) => {
    await openGenerator(page);

    await page.getByLabel('Keep these details in this browser').check();
    await page.getByLabel('Business name').fill('Harbour Design');
    await page.getByLabel('Notes').fill('A note for this invoice only');

    await expect
      .poll(async () =>
        page.evaluate(() =>
          window.localStorage.getItem('soloyolo-business-profile')?.includes('Harbour Design'),
        ),
      )
      .toBe(true);

    // The notes belong to the document being written, not to the business.
    const stored = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('soloyolo-business-profile') ?? '{}'),
    );
    expect(stored.defaultNotes).toBe('');

    await page.getByRole('button', { name: 'Clear the saved details' }).click();

    await expect(page.getByLabel('Business name')).toHaveValue('');
    expect(
      await page.evaluate(() => window.localStorage.getItem('soloyolo-business-profile')),
    ).toBeNull();
  });

  test('only the document reaches the printer', async ({ page }) => {
    await openGenerator(page);

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

  test('does not overflow horizontally on a phone', async ({ page }) => {
    await openGenerator(page);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.reload();
    await page.waitForSelector('html[data-generator-ready]');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(361);
  });

  test('switches between the details and the document on a phone', async ({ page }) => {
    await openGenerator(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForSelector('html[data-generator-ready]');

    const preview = page.locator('.generator-preview');
    await expect(preview).toBeHidden();

    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(preview).toBeVisible();
    await expect(page.locator('.sheet')).toContainText('INV-0042');
  });

  test('has no horizontal overflow on the document itself', async ({ page }) => {
    await openGenerator(page);

    const overflow = await page
      .locator('.sheet')
      .evaluate((element) => element.scrollWidth - element.clientWidth);

    expect(overflow).toBeLessThanOrEqual(1);
  });
});
