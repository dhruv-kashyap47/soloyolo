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
    page.evaluate(
      () =>
        Promise.race([
          Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]),
    );
  await waitForAnimations();
  // the calculator island hydrates after load and then plays its own fade in
  // (it marks <html data-calculator-ready> once its state is live)
  await page.waitForSelector('html[data-calculator-ready]', { timeout: 5000 }).catch(() => undefined);
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
