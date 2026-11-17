import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/calculators/vat-gst-sales-tax-calculator/');
  await page.waitForSelector('html[data-calculator-ready]');
});

test('renders the worked example', async ({ page }) => {
  const panel = page.locator('#calculator');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'VAT / GST / Sales Tax Calculator',
  );
  await expect(panel.getByText('$99.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('$1,299.00', { exact: true }).first()).toBeVisible();
});

test('removes tax from a gross amount by dividing', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByRole('button', { name: 'Remove tax' }).click();
  await page.getByLabel('Amount including tax').fill('600');
  await page.getByLabel('Sales tax rate').fill('20');

  await expect(panel.getByText('$100.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('$500.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('$600.00', { exact: true }).first()).toBeVisible();
});

test('country changes the terminology, not the arithmetic', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Country').selectOption('UK');

  await expect(page.getByLabel('VAT rate')).toBeVisible();
  await expect(panel.getByText('VAT', { exact: true }).first()).toBeVisible();

  await page.getByLabel('VAT rate').fill('20');
  await expect(panel.getByText('$240.00', { exact: true }).first()).toBeVisible();
});

test('rejects a rate above 100', async ({ page }) => {
  const rate = page.getByLabel('Sales tax rate');
  await rate.fill('101');
  await rate.blur();

  await expect(page.getByText('Tax rate must be between 0 and 100.')).toBeVisible();
  await expect(rate).toHaveAttribute('aria-invalid', 'true');
});

test('shows a field error for text that is not a number', async ({ page }) => {
  const amount = page.getByLabel('Amount before tax');
  await amount.fill('twelve hundred');
  await amount.blur();

  await expect(page.getByText('Enter amount as a number, for example 1200.')).toBeVisible();
});

test('blocks submission and focuses the first invalid field', async ({ page }) => {
  const amount = page.getByLabel('Amount before tax');
  await amount.fill('');

  const submit = page.getByRole('button', { name: 'Calculate tax' });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();

  await expect(page.getByRole('alert')).toContainText('Check the highlighted fields');
  await expect(amount).toBeFocused();
});

test('switching currency reformats without converting', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Currency').selectOption('GBP');
  await expect(panel.getByText('£99.00', { exact: true }).first()).toBeVisible();
});

test('reset restores the worked example', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Amount before tax').fill('500');
  await page.getByRole('button', { name: 'Reset to example' }).click();

  await expect(page.getByLabel('Amount before tax')).toHaveValue('1,200');
  await expect(panel.getByText('$99.00', { exact: true }).first()).toBeVisible();
});

test('page explains terminology in a table and includes an FAQ', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'What the tax is called' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'VAT', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Umsatzsteuer', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'MWST / TVA / IVA', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'GST', exact: true }).first()).toBeVisible();

  const firstQuestion = page.locator('details summary').first();
  await firstQuestion.click();
  await expect(page.locator('details[open] p').first()).toBeVisible();
});

test('360px viewport does not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(361);
  await expect(
    page.locator('#calculator').getByText('$99.00', { exact: true }).first(),
  ).toBeVisible();
});
