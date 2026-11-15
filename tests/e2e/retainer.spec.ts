import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/calculators/retainer-pricing-calculator/');
  await page.waitForSelector('html[data-calculator-ready]');
});

test('renders the worked example', async ({ page }) => {
  const panel = page.locator('#calculator');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Retainer Pricing Calculator');
  await expect(panel.getByText('$3,428.57', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('$1,028.57', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('$171.43', { exact: true }).first()).toBeVisible();
});

test('a discount cuts the retainer and the achieved margin', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Discount offered').fill('10');

  await expect(panel.getByText('$3,085.71', { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('22.2%', { exact: true }).first()).toBeVisible();
});

test('enforces the monthly hours range', async ({ page }) => {
  const hours = page.getByLabel('Hours a month');
  await hours.fill('0');
  await hours.blur();

  await expect(page.getByText('Monthly hours must be between 1 and 744.')).toBeVisible();
  await expect(hours).toHaveAttribute('aria-invalid', 'true');
});

test('rejects a margin of 100 percent', async ({ page }) => {
  const margin = page.getByLabel('Desired margin');
  await margin.fill('100');
  await margin.blur();

  await expect(page.getByText('Desired margin must be between 0 and 99.')).toBeVisible();
});

test('blocks submission and focuses the first invalid field', async ({ page }) => {
  const rate = page.getByLabel('Your hourly rate');
  await rate.fill('');

  const submit = page.getByRole('button', { name: 'Price the retainer' });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();

  await expect(page.getByRole('alert')).toContainText('Check the highlighted fields');
  await expect(rate).toBeFocused();
});

test('switching currency reformats without converting', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Currency').selectOption('GBP');
  await expect(panel.getByText('£3,428.57', { exact: true }).first()).toBeVisible();
});

test('reset restores the worked example', async ({ page }) => {
  const panel = page.locator('#calculator');
  await page.getByLabel('Hours a month').fill('5');
  await page.getByRole('button', { name: 'Reset to example' }).click();

  await expect(page.getByLabel('Hours a month')).toHaveValue('20');
  await expect(panel.getByText('$3,428.57', { exact: true }).first()).toBeVisible();
});

test('accepts keyboard input', async ({ page }) => {
  const panel = page.locator('#calculator');
  const discount = page.getByLabel('Discount offered');
  await discount.focus();
  await discount.press('Control+A');
  await page.keyboard.type('20');

  await expect(panel.getByText('$2,742.86', { exact: true }).first()).toBeVisible();
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
    page.locator('#calculator').getByText('$3,428.57', { exact: true }).first(),
  ).toBeVisible();
});
