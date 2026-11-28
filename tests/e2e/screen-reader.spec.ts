import { expect, test } from '@playwright/test';

/**
 * P6-06 — the screen-reader contract.
 *
 * This cannot replace a human VoiceOver or NVDA spot check, but it locks the
 * parts that make that check work: one polite status region per tool, atomic
 * updates, and a changed sentence after a changed input. The manual gate is
 * recorded in `docs/phase-6-audit.md`.
 */

test('the calculator announces a changed result in one polite region', async ({ page }) => {
  await page.goto('/calculators/hourly-rate-calculator/');
  await page.waitForSelector('html[data-calculator-ready]');

  const live = page.locator('p.sr-only[role="status"][aria-live="polite"]');
  await expect(live).toHaveCount(1);
  await expect(live).toHaveAttribute('aria-atomic', 'true');
  await expect(live).toHaveText('Required rate: $76.67 per hour.');

  await page.getByLabel('Target annual income').fill('100000');
  await expect(live).toHaveText('Required rate: $93.33 per hour.');

  await page.getByLabel('Currency').selectOption('GBP');
  await expect(live).toHaveText('Required rate: £93.33 per hour.');
});

test('the calculator mobile result is visible without being a second live region', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calculators/hourly-rate-calculator/');
  await page.waitForSelector('html[data-calculator-ready]');

  const mobile = page.locator('.mobile-result');
  await expect(mobile).toBeVisible();
  // The result panel's sr-only region is the tool's one polite region; a live
  // visible copy would announce the same figure twice on every keystroke.
  await expect(mobile).not.toHaveAttribute('role', 'status');
  await expect(mobile).not.toHaveAttribute('aria-live');
  await expect(mobile).toContainText('$76.67');
  await expect(page.locator('p.sr-only[role="status"][aria-live="polite"]')).toHaveCount(1);

  await page.getByLabel('Target annual income').fill('100000');
  await expect(mobile).toContainText('$93.33');
});

test('the generator announces the document total and updates it', async ({ page }) => {
  await page.goto('/generators/invoice-generator/');
  await page.waitForSelector('html[data-generator-ready]');

  const live = page.locator('span.sr-only[role="status"][aria-live="polite"]');
  await expect(live).toHaveCount(1);
  await expect(live).toHaveText('Total £2,299.50.');

  await page.getByLabel('Unit price').first().fill('2000');
  await expect(live).toHaveText('Total £3,259.50.');
});

test('the generator error summary is an alert wired to the field it names', async ({ page }) => {
  await page.goto('/generators/invoice-generator/');
  await page.waitForSelector('html[data-generator-ready]');

  await page.getByLabel('Business name').fill('');
  await page.getByRole('button', { name: 'Print or save as PDF' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toBeFocused();
  await expect(alert).toContainText('There is 1 thing to fix');

  const businessName = page.getByLabel('Business name');
  const describedBy = await businessName.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  const description = page.locator(`#${describedBy!.split(' ').at(-1)}`);
  await expect(description).toContainText('Enter your business name');
});
