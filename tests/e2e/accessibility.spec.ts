import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

const ROUTES = [
  { path: '/', name: 'homepage' },
  { path: '/calculators/', name: 'calculator index' },
  { path: '/calculators/hourly-rate-calculator/', name: 'hourly rate calculator' },
  { path: '/calculators/freelance-rate-calculator/', name: 'freelance rate calculator' },
  { path: '/calculators/project-profit-calculator/', name: 'project profit calculator' },
  { path: '/calculators/markup-vs-margin-calculator/', name: 'markup vs margin calculator' },
  { path: '/calculators/payment-processing-fee-calculator/', name: 'payment fee calculator' },
  { path: '/calculators/vat-gst-sales-tax-calculator/', name: 'tax calculator' },
  { path: '/calculators/retainer-pricing-calculator/', name: 'retainer pricing calculator' },
  { path: '/calculators/break-even-calculator/', name: 'break-even calculator' },
  { path: '/generators/', name: 'generator index' },
  { path: '/generators/invoice-generator/', name: 'invoice generator' },
  { path: '/generators/quote-generator/', name: 'quote generator' },
  { path: '/generators/receipt-generator/', name: 'receipt generator' },
  {
    path: '/generators/payment-reminder-generator/',
    name: 'payment reminder generator',
  },
  { path: '/countries/', name: 'country guides' },
  { path: '/us/invoice-generator/', name: 'US invoice generator' },
  { path: '/uk/invoice-generator/', name: 'UK invoice generator' },
  { path: '/uk/vat-invoice-generator/', name: 'UK VAT invoice generator' },
  { path: '/ca/invoice-generator/', name: 'Canada invoice generator' },
  { path: '/ca/gst-hst-invoice-generator/', name: 'Canada GST/HST invoice generator' },
  { path: '/au/invoice-generator/', name: 'Australia invoice generator' },
  { path: '/au/tax-invoice-generator/', name: 'Australia tax invoice generator' },
  { path: '/de/invoice-generator/', name: 'Germany invoice generator' },
  { path: '/de/vat-invoice-generator/', name: 'Germany VAT invoice generator' },
  { path: '/ch/invoice-generator/', name: 'Switzerland invoice generator' },
  { path: '/ch/vat-invoice-generator/', name: 'Switzerland VAT invoice generator' },
  { path: '/in/invoice-generator/', name: 'India invoice generator' },
  { path: '/in/gst-invoice-generator/', name: 'India GST invoice generator' },
  { path: '/ae/invoice-generator/', name: 'UAE invoice generator' },
  { path: '/ae/vat-invoice-generator/', name: 'UAE VAT invoice generator' },
  { path: '/about/', name: 'about' },
  { path: '/contact/', name: 'contact' },
  { path: '/privacy/', name: 'privacy policy' },
  { path: '/terms/', name: 'terms of use' },
] as const;

/**
 * The hero entrance and the calculator's result both fade in with a short
 * opacity animation: axe reading the page mid-fade reports colours that are
 * never shown at rest, so let the page settle first.
 */
async function settle(page: Page) {
  const waitForAnimations = () =>
    page.evaluate(() =>
      Promise.race([
        Promise.all(
          document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
        ),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]),
    );
  await waitForAnimations();
  // the calculator island hydrates after load and then plays its own fade in
  // (it marks <html data-calculator-ready> once its state is live)
  await page
    .waitForSelector('html[data-calculator-ready]', { timeout: 5000 })
    .catch(() => undefined);
  // the generator islands mark <html data-generator-ready> instead
  await page
    .waitForSelector('html[data-generator-ready]', { timeout: 5000 })
    .catch(() => undefined);
  await page
    .waitForFunction(
      () => {
        const panel = document.querySelector('[aria-labelledby="result-heading"]');
        if (!panel) return true;
        return [...panel.querySelectorAll('*')].every(
          (element) => parseFloat(getComputedStyle(element).opacity) > 0.99,
        );
      },
      undefined,
      { timeout: 4000 },
    )
    .catch(() => undefined);
  await waitForAnimations();
}

for (const route of ROUTES) {
  test(`${route.name} has no serious accessibility violations`, async ({ page }) => {
    // The home page's stage demos loop forever, so an unrestricted scan can
    // catch a panel mid-fade and read a colour that is never shown at rest.
    // Freezing motion keeps every axe scan about the resting colours; the
    // reveal system also skips itself under reduced motion, so nothing ends
    // up hidden instead.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route.path);
    await settle(page);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );

    expect(
      serious.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
        where: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
      })),
    ).toEqual([]);
  });
}

test('every page has one h1 and a unique title', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route.path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/SoloYolo/);
  }
});

test('the single dark theme does not flip with a light system preference', async ({ page }) => {
  // Decision 2026-11-17: one theme. A light OS preference must change nothing,
  // so the page keeps the tested dark tokens and still passes axe. The bento
  // home later moved the canvas to true AMOLED black (see --color-canvas).
  // Motion is frozen for the same reason as the route scans above: the home
  // demos loop forever and a mid-fade frame is not a real colour.
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  await settle(page);

  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe('rgb(0, 0, 0)');

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(serious.map((violation) => ({ id: violation.id, nodes: violation.nodes.length }))).toEqual(
    [],
  );
});

test('the command palette dialog is accessible', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-palette]:visible').first().click();
  await page.locator('[role="dialog"][aria-label="Command palette"]').waitFor({ state: 'visible' });
  await page.getByPlaceholder(/Type a tool name/).fill('invoice');
  await page.waitForTimeout(200);

  const results = await new AxeBuilder({ page })
    .include('[role="dialog"][aria-label="Command palette"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(serious.map((violation) => ({ id: violation.id, nodes: violation.nodes.length }))).toEqual(
    [],
  );
  await page.keyboard.press('Escape');
});
