import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/calculators/break-even-calculator/');
  await page.waitForSelector('html[data-calculator-ready]');
});

test('renders the worked example', async ({ page }) => {
  const panel = page.locator('#calculator');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Break-even Calculator');
  await expect(panel.getByText('4', { exact: true })).toBeVisible();
  await expect(panel.getByText('$6,000.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('80 h', { exact: true })).toBeVisible();
});

test('rounds fractional projects up but keeps revenue exact', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Fixed costs per month').fill('6500');

  await expect(panel.getByText('7', { exact: true })).toBeVisible();
  await expect(panel.getByText('$9,750.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('130 h', { exact: true })).toBeVisible();
});

test('switches to the hourly mode and finds break-even hours', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByRole('button', { name: 'Per hour' }).click();

  await expect(page.getByLabel('Price per hour')).toBeVisible();
  await page.getByLabel('Fixed costs per month').fill('2000');
  await page.getByLabel('Price per hour').fill('75');
  await page.getByLabel('Variable cost per hour').fill('15');

  await expect(panel.getByText('34', { exact: true })).toBeVisible();
  await expect(panel.getByText('$2,500.00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Rounded up to the next whole hour', { exact: false })).toBeVisible();
});

test('refuses a price below variable cost', async ({ page }) => {
  await page.getByLabel('Price per project').fill('400');

  await expect(
    page
      .getByText('Price must be above the variable cost, otherwise no volume reaches break-even.')
      .first(),
  ).toBeVisible();
});

test('rejects more than 10,000 hours per project', async ({ page }) => {
  const hours = page.getByLabel('Hours per project');
  await hours.fill('10001');
  await hours.blur();

  await expect(page.getByText('Hours per project must be between 0 and 10000.')).toBeVisible();
  await expect(hours).toHaveAttribute('aria-invalid', 'true');
});

test('blocks submission and focuses the first invalid field', async ({ page }) => {
  const fixed = page.getByLabel('Fixed costs per month');
  await fixed.fill('');

  const submit = page.getByRole('button', { name: 'Find break-even' });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();

  await expect(page.getByRole('alert')).toContainText('Check the highlighted fields');
  await expect(fixed).toBeFocused();
});

test('switching currency reformats without converting', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Currency').selectOption('GBP');
  await expect(panel.getByText('£6,000.00', { exact: true }).first()).toBeVisible();
});

test('reset restores the worked example', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Fixed costs per month').fill('9999');
  await page.getByRole('button', { name: 'Reset to example' }).click();

  await expect(page.getByLabel('Fixed costs per month')).toHaveValue('4,000');
  await expect(panel.getByText('4', { exact: true })).toBeVisible();
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
  await expect(page.locator('#calculator').getByText('4', { exact: true })).toBeVisible();
});
