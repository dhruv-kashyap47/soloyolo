import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/calculators/project-profit-calculator/');
  // the island marks <html data-calculator-ready> once its state is live
  await page.waitForSelector('html[data-calculator-ready]');
});

test('renders the calculator with the worked example result', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Project Profit Calculator');
  await expect(panel.getByText('$4,000.00', { exact: true })).toBeVisible();
  await expect(panel.getByText('33.3%', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('50.0%', { exact: true }).first()).toBeVisible();
});

test('recalculates when revenue changes', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByLabel('Project revenue').fill('10000');

  await expect(panel.getByText('$2,000.00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('20.0%', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('25.0%', { exact: true }).first()).toBeVisible();
});

test('shows a loss clearly instead of failing', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByLabel('Project revenue').fill('5000');

  await expect(panel.getByText('-$3,000.00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('This project loses money')).toBeVisible();
  await expect(panel.getByText('-$3,000.00', { exact: true }).first()).toHaveClass(/text-danger/);
});

test('shows a field error for invalid input', async ({ page }) => {
  const revenue = page.getByLabel('Project revenue');
  await revenue.fill('twelve thousand');
  await revenue.blur();

  await expect(
    page.getByText('Enter project revenue as a number, for example 12000.'),
  ).toBeVisible();
  await expect(revenue).toHaveAttribute('aria-invalid', 'true');
});

test('blocks submission, announces the summary and focuses the first invalid field', async ({
  page,
}) => {
  const revenue = page.getByLabel('Project revenue');
  await revenue.fill('');
  await expect(revenue).toHaveValue('');

  const submit = page.getByRole('button', { name: 'Calculate profit' });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();

  await expect(page.getByRole('alert')).toContainText('Check the highlighted fields');
  await expect(revenue).toBeFocused();
});

test('switching currency reformats the result without converting it', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByLabel('Currency').selectOption('GBP');
  await expect(panel.getByText('£4,000.00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('£8,000.00', { exact: true }).first()).toBeVisible();
});

test('reset restores the worked example', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByLabel('Project revenue').fill('12345');
  await page.getByRole('button', { name: 'Reset to example' }).click();

  await expect(page.getByLabel('Project revenue')).toHaveValue('12,000');
  await expect(panel.getByText('$4,000.00', { exact: true })).toBeVisible();
});

test('accepts keyboard input', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  const revenue = page.getByLabel('Project revenue');
  await revenue.focus();
  await revenue.press('Control+A');
  await page.keyboard.type('20000');

  await expect(panel.getByText('$12,000.00', { exact: true }).first()).toBeVisible();
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

  await expect(page.getByLabel('Project revenue')).toBeVisible();
  await expect(
    page
      .locator('[aria-labelledby="result-heading"]')
      .getByText('$4,000.00', { exact: true })
      .first(),
  ).toBeVisible();
});
