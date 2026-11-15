import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/calculators/freelance-rate-calculator/');
  // the island marks <html data-calculator-ready> once its state is live
  await page.waitForSelector('html[data-calculator-ready]');
});

test('renders the calculator with the worked example result', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Freelance Rate Calculator');
  await expect(page.getByText('$104.62', { exact: true })).toBeVisible();
  await expect(page.getByText('$115,500.00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('1,104 h', { exact: true }).first()).toBeVisible();
});

test('recalculates when the non-billable share changes', async ({ page }) => {
  await page.getByLabel('Non-billable time').fill('0');

  // 1,840 billable hours instead of 1,104: $115,500 ÷ 1,840 = $62.77
  await expect(page.getByText('$62.77', { exact: true })).toBeVisible();
  await expect(page.getByText('1,840 h', { exact: true }).first()).toBeVisible();
});

test('recalculates the buffer separately from income', async ({ page }) => {
  await page.getByLabel('Profit buffer').fill('0');

  await expect(page.getByText('$95.11', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('$105,000.00', { exact: true }).first()).toBeVisible();
});

test('shows a field error for invalid input', async ({ page }) => {
  const income = page.getByLabel('Target annual income');
  await income.fill('lots of money');
  await income.blur();

  await expect(
    page.getByText('Enter target annual income as a number, for example 90000.'),
  ).toBeVisible();
  await expect(income).toHaveAttribute('aria-invalid', 'true');
});

test('rejects a fully non-billable week', async ({ page }) => {
  const nonBillable = page.getByLabel('Non-billable time');
  await nonBillable.fill('100');
  await nonBillable.blur();

  await expect(page.getByText('Non-billable time must be between 0 and 99.')).toBeVisible();
  await expect(nonBillable).toHaveAttribute('aria-invalid', 'true');
});

test('blocks submission, announces the summary and focuses the first invalid field', async ({
  page,
}) => {
  const income = page.getByLabel('Target annual income');
  await income.fill('');
  await expect(income).toHaveValue('');

  const submit = page.getByRole('button', { name: 'Calculate rate' });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();

  await expect(page.getByRole('alert')).toContainText('Check the highlighted fields');
  await expect(income).toBeFocused();
});

test('switching currency reformats the result without converting it', async ({ page }) => {
  await page.getByLabel('Currency').selectOption('GBP');
  await expect(page.getByText('£104.62', { exact: true })).toBeVisible();
  await expect(page.getByText('£115,500.00', { exact: true }).first()).toBeVisible();
});

test('reset restores the worked example', async ({ page }) => {
  await page.getByLabel('Target annual income').fill('12345');
  await page.getByRole('button', { name: 'Reset to example' }).click();

  await expect(page.getByLabel('Target annual income')).toHaveValue('90,000');
  await expect(page.getByText('$104.62', { exact: true })).toBeVisible();
});

test('accepts keyboard input', async ({ page }) => {
  const income = page.getByLabel('Target annual income');
  await income.focus();
  await income.press('Control+A');
  await page.keyboard.type('60000');

  // base 75,000 + 10% = 82,500 ÷ 1,104 = $74.73
  await expect(page.getByText('$74.73', { exact: true })).toBeVisible();
});

test('page includes formula, assumptions and accessible FAQ', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'The formula' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assumptions and limitations' })).toBeVisible();

  const firstQuestion = page.locator('details summary').first();
  await firstQuestion.click();
  await expect(page.locator('details[open] p').first()).toBeVisible();
});

test('mobile layout does not overflow horizontally', async ({ page }) => {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const innerWidth = await page.evaluate(() => window.innerWidth);

  expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);
});

test('360px viewport does not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(361);

  await expect(page.getByLabel('Target annual income')).toBeVisible();
  await expect(page.getByText('$104.62', { exact: true })).toBeVisible();
});
