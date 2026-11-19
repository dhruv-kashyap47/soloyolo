import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/calculators/markup-vs-margin-calculator/');
  // the island marks <html data-calculator-ready> once its state is live
  await page.waitForSelector('html[data-calculator-ready]');
});

test('renders the margin mode with the worked example result', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Markup vs Margin Calculator');
  await expect(panel.getByText('50.0%', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('100.0%', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('$2,500.00', { exact: true }).first()).toBeVisible();
});

test('switches to the markup mode and highlights the markup', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByRole('button', { name: 'Markup' }).click();

  await expect(page.getByRole('button', { name: 'Markup' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(panel.locator('#result-heading')).toHaveText('Your markup');
  await expect(panel.getByText('100.0%', { exact: true }).first()).toBeVisible();
});

test('works out the price from cost and markup', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByRole('button', { name: 'Price' }).click();

  await expect(page.getByLabel('Markup', { exact: true })).toBeVisible();
  await expect(panel.getByText('$5,000.00', { exact: true }).first()).toBeVisible();

  await page.getByLabel('Markup', { exact: true }).fill('25');
  await expect(panel.getByText('$3,125.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('20.0%', { exact: true }).first()).toBeVisible();
});

test('works out the cost from price and margin', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByRole('button', { name: 'Cost' }).click();

  await expect(page.getByLabel('Margin', { exact: true })).toBeVisible();
  await page.getByLabel('Margin', { exact: true }).fill('40');

  await expect(panel.getByText('$3,000.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('66.7%', { exact: true }).first()).toBeVisible();
});

test('shows a field error for invalid input', async ({ page }) => {
  await page.getByRole('button', { name: 'Price' }).click();
  const markup = page.getByLabel('Markup', { exact: true });
  await markup.fill('one hundred');
  await markup.blur();

  await expect(page.getByText('Enter markup as a number, for example 100.')).toBeVisible();
  await expect(markup).toHaveAttribute('aria-invalid', 'true');
});

test('rejects a margin of 100 percent', async ({ page }) => {
  await page.getByRole('button', { name: 'Cost' }).click();
  const margin = page.getByLabel('Margin', { exact: true });
  await margin.fill('100');
  await margin.blur();

  await expect(page.getByText('Margin must be between 0 and 99.99.')).toBeVisible();
  await expect(margin).toHaveAttribute('aria-invalid', 'true');
});

test('blocks submission, announces the summary and focuses the first invalid field', async ({
  page,
}) => {
  const cost = page.getByLabel('Cost', { exact: true });
  await cost.fill('');
  await expect(cost).toHaveValue('');

  const submit = page.getByRole('button', { name: 'Work it out' });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();

  await expect(page.getByRole('alert')).toContainText('Check the highlighted fields');
  await expect(cost).toBeFocused();
});

test('switching currency reformats amounts without converting them', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByLabel('Currency').selectOption('GBP');

  await expect(panel.getByText('£2,500.00', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('£5,000.00', { exact: true }).first()).toBeVisible();
});

test('reset restores the worked example', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  await page.getByLabel('Cost', { exact: true }).fill('9999');
  await page.getByRole('button', { name: 'Reset to example' }).click();

  await expect(page.getByLabel('Cost', { exact: true })).toHaveValue('2,500');
  await expect(panel.getByText('50.0%', { exact: true }).first()).toBeVisible();
});

test('accepts keyboard input', async ({ page }) => {
  const panel = page.locator('[aria-labelledby="result-heading"]');
  const cost = page.getByLabel('Cost', { exact: true });
  await cost.focus();
  await cost.press('Control+A');
  await page.keyboard.type('2000');

  await expect(panel.getByText('60.0%', { exact: true }).first()).toBeVisible();
});

test('page explains the difference and prints the comparison table', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'The formula' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Markup is not margin' })).toBeVisible();

  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  await expect(table.getByText('9.1%', { exact: true })).toBeVisible();
  await expect(table.getByText('50.0%', { exact: true })).toBeVisible();
});

test('page includes assumptions and an accessible FAQ', async ({ page }) => {
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

  await expect(page.getByLabel('Cost', { exact: true })).toBeVisible();
  await expect(
    page.locator('[aria-labelledby="result-heading"]').getByText('50.0%', { exact: true }).first(),
  ).toBeVisible();
});
