import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/calculators/hourly-rate-calculator/');
  // the island marks <html data-calculator-ready> once its state is live
  await page.waitForSelector('html[data-calculator-ready]');
});

test('renders the calculator with the worked example result', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hourly Rate Calculator');
  await expect(page.getByText('$76.67', { exact: true })).toBeVisible();
  await expect(page.getByText('$92,000.00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('1,200', { exact: true }).first()).toBeVisible();
});

test('recalculates when an input changes', async ({ page }) => {
  const income = page.getByLabel('Target annual income');
  await income.fill('100000');

  await expect(page.getByText('$93.33', { exact: true })).toBeVisible();
  await expect(page.getByText('$112,000.00', { exact: true }).first()).toBeVisible();
});

test('shows a field error for invalid input', async ({ page }) => {
  const income = page.getByLabel('Target annual income');
  await income.fill('eighty thousand');
  await income.blur();

  await expect(
    page.getByText('Enter target annual income as a number, for example 80000.'),
  ).toBeVisible();
  await expect(income).toHaveAttribute('aria-invalid', 'true');
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
  await expect(page.getByText('£76.67', { exact: true })).toBeVisible();
  await expect(page.getByText('£92,000.00', { exact: true }).first()).toBeVisible();
});

test('reset restores the worked example', async ({ page }) => {
  await page.getByLabel('Target annual income').fill('12345');
  await page.getByRole('button', { name: 'Reset to example' }).click();

  await expect(page.getByLabel('Target annual income')).toHaveValue('80,000');
  await expect(page.getByText('$76.67', { exact: true })).toBeVisible();
});

test('accepts keyboard input', async ({ page }) => {
  const income = page.getByLabel('Target annual income');
  await income.focus();
  await income.press('Control+A');
  await page.keyboard.type('60000');

  await expect(page.getByText('$60.00', { exact: true })).toBeVisible();
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
  await expect(page.getByText('$76.67', { exact: true })).toBeVisible();
});

test('unknown pages return the custom 404', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('That page');
});
