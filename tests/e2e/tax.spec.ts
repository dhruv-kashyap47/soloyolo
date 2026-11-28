import { test, expect } from '@playwright/test';

/**
 * Money assertions are scoped to the result panel
 * (`[aria-labelledby="result-heading"]`). The mobile summary beside the fields
 * repeats the headline figure in the DOM — it is CSS-hidden on wide screens —
 * so page-wide text lookups find two copies and either strict-fail or pin the
 * hidden one.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/calculators/vat-gst-sales-tax-calculator/');
  await page.waitForSelector('html[data-calculator-ready]');
});

test('renders the worked example', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'VAT / GST / Sales Tax Calculator',
  );
  await expect(panel.getByText('$99.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('$1,299.00', { exact: true }).first()).toBeVisible();
});

test('removes tax from a gross amount by dividing', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByRole('button', { name: 'Remove tax' }).click();
  await page.getByLabel('Amount including tax').fill('600');
  await page.getByLabel('Sales tax rate').fill('20');

  await expect(panel.getByText('$100.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('$500.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('$600.00', { exact: true }).first()).toBeVisible();
});

test('restores the saved mode together with the saved amounts', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByRole('button', { name: 'Remove tax' }).click();
  await page.getByLabel('Amount including tax').fill('600');
  await page.getByLabel('Sales tax rate').fill('20');
  await expect(panel.getByText('$500.00', { exact: true }).first()).toBeVisible();

  await page.reload();
  await page.waitForSelector('html[data-calculator-ready]');

  await expect(page.getByRole('button', { name: 'Remove tax' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Amount including tax')).toHaveValue('600');
  await expect(panel.getByText('$500.00', { exact: true }).first()).toBeVisible();
});

test('country changes the terminology, not the arithmetic', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
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
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByLabel('Currency').selectOption('GBP');
  await expect(panel.getByText('£99.00', { exact: true }).first()).toBeVisible();
});

test('reset restores the worked example', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
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

test('groups an INR amount in lakhs in the field', async ({ page }) => {
  await page.getByLabel('Currency').selectOption('INR');

  const amount = page.getByLabel('Amount before tax');
  await amount.fill('100000');

  await expect(amount).toHaveValue('1,00,000');
  await expect(page.getByText('₹1,00,000.00', { exact: true }).first()).toBeVisible();
});

test('360px viewport does not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(361);
  await expect(
    page.locator('[aria-labelledby="result-heading"]').getByText('$99.00', { exact: true }).first(),
  ).toBeVisible();
});
