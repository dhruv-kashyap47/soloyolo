import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/', name: 'homepage' },
  { path: '/calculators/', name: 'calculator index' },
  { path: '/calculators/hourly-rate-calculator/', name: 'hourly rate calculator' },
  { path: '/about/', name: 'about' },
  { path: '/contact/', name: 'contact' },
  { path: '/privacy/', name: 'privacy policy' },
  { path: '/terms/', name: 'terms of use' },
] as const;

for (const route of ROUTES) {
  test(`${route.name} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route.path);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );

    expect(
      serious.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
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
