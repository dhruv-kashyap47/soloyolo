import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/calculators/payment-processing-fee-calculator/');
  await page.waitForSelector('html[data-calculator-ready]');
});

test('renders the worked example', async ({ page }) => {
  const panel = page.locator('#calculator');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Payment Fee Calculator');
  await expect(panel.getByText('$970.70', { exact: true })).toBeVisible();
  await expect(panel.getByText('$29.30', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('2.9%', { exact: true }).first()).toBeVisible();
});

test('recalculates on a small payment where the fixed fee dominates', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Payment amount').fill('45');
  await page.getByLabel('Percentage fee').fill('1.75');

  await expect(panel.getByText('$43.91', { exact: true })).toBeVisible();
  await expect(panel.getByText('2.4%', { exact: true }).first()).toBeVisible();
});

test('rejects a zero amount', async ({ page }) => {
  const amount = page.getByLabel('Payment amount');
  await amount.fill('0');
  await amount.blur();

  await expect(page.getByText('Amount must be above zero.')).toBeVisible();
  await expect(amount).toHaveAttribute('aria-invalid', 'true');
});

test('shows a field error for text that is not a number', async ({ page }) => {
  const percent = page.getByLabel('Percentage fee');
  await percent.fill('two point nine');
  await percent.blur();

  await expect(
    page.getByText('Enter percentage fee as a number, for example 2.9.'),
  ).toBeVisible();
});

test('blocks submission and focuses the first invalid field', async ({ page }) => {
  const amount = page.getByLabel('Payment amount');
  await amount.fill('');

  const submit = page.getByRole('button', { name: 'Calculate fees' });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();

  await expect(page.getByRole('alert')).toContainText('Check the highlighted fields');
  await expect(amount).toBeFocused();
});

test('switching currency reformats without converting', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Currency').selectOption('GBP');
  await expect(panel.getByText('£970.70', { exact: true })).toBeVisible();
});

test('reset restores the worked example', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Payment amount').fill('99');
  await page.getByRole('button', { name: 'Reset to example' }).click();

  await expect(page.getByLabel('Payment amount')).toHaveValue('1,000');
  await expect(panel.getByText('$970.70', { exact: true })).toBeVisible();
});

test('accepts keyboard input', async ({ page }) => {
  const panel = page.locator('#calculator');
  const amount = page.getByLabel('Payment amount');
  await amount.focus();
  await amount.press('Control+A');
  await page.keyboard.type('2000');

  await expect(panel.getByText('$1,941.70', { exact: true })).toBeVisible();
});

test('page includes formula, assumptions and accessible FAQ', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'The formula' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assumptions and limitations' })).toBeVisible();

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
    page.locator('#calculator').getByText('$970.70', { exact: true }),
  ).toBeVisible();
});
