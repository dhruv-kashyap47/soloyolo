import { test, expect, type Page } from '@playwright/test';

import { ROUTES } from './routes';

/**
 * P5-09 / Gate 5: every route ships its own metadata, one h1 and a heading
 * outline that does not skip a level, and every internal link resolves.
 *
 * These are site-wide audits rather than per-page copies: one test walks all
 * routes so a duplicate title or description anywhere fails the build.
 */

interface PageMetadata {
  route: string;
  title: string;
  description: string;
  canonical: string;
}

async function readMetadata(page: Page, route: string): Promise<PageMetadata> {
  return {
    route,
    title: await page.title(),
    description: (await page.locator('meta[name="description"]').getAttribute('content')) ?? '',
    canonical: (await page.locator('link[rel="canonical"]').getAttribute('href')) ?? '',
  };
}

test('every route has unique, complete metadata and one heading outline', async ({ page }) => {
  const seen: PageMetadata[] = [];

  for (const route of ROUTES) {
    await page.goto(route);

    const metadata = await readMetadata(page, route);
    expect(metadata.title, `title on ${route}`).toContain('soloyolo');
    expect(metadata.description.length, `description length on ${route}`).toBeGreaterThanOrEqual(
      50,
    );
    expect(metadata.canonical, `canonical on ${route}`).toMatch(
      new RegExp(`${route.replaceAll('/', '\\/')}$`),
    );

    await expect(page.locator('h1'), `one h1 on ${route}`).toHaveCount(1);

    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((headings) => headings.map((heading) => Number(heading.tagName.slice(1))));

    expect(levels[0], `starts at h1 on ${route}`).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      const previous = levels[index - 1] ?? 1;
      const current = levels[index] ?? 1;
      expect(
        current,
        `no skipped heading level on ${route} around h${previous} -> h${current}`,
      ).toBeLessThanOrEqual(previous + 1);
    }

    seen.push(metadata);
  }

  const titles = seen.map((entry) => entry.title);
  expect(new Set(titles).size, `unique titles: ${titles.join(' | ')}`).toBe(titles.length);

  const descriptions = seen.map((entry) => entry.description);
  expect(new Set(descriptions).size, 'unique descriptions').toBe(descriptions.length);

  const canonicals = seen.map((entry) => entry.canonical);
  expect(new Set(canonicals).size, 'unique canonicals').toBe(canonicals.length);
});

test('every internal link resolves and every route has an inbound link', async ({ page }) => {
  const linksByRoute = new Map<string, Set<string>>();
  const allTargets = new Set<string>();

  for (const route of ROUTES) {
    await page.goto(route);

    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href') ?? ''));

    const targets = new Set<string>();
    for (const href of hrefs) {
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const { pathname } = new URL(href, 'https://soloyolotools.com');
      if (pathname === route) continue;
      targets.add(pathname);
      allTargets.add(pathname);
    }

    linksByRoute.set(route, targets);
  }

  const checked = new Set<string>();
  for (const target of allTargets) {
    if (checked.has(target)) continue;
    checked.add(target);

    const response = await page.request.get(target, { maxRedirects: 5 });
    expect(response.status(), `internal link ${target} resolves`).toBeLessThan(400);
  }

  const linked = new Set<string>();
  for (const targets of linksByRoute.values()) {
    for (const target of targets) linked.add(target);
  }

  const orphans = ROUTES.filter((route) => route !== '/' && !linked.has(route));
  expect(orphans, `routes with no inbound link: ${orphans.join(', ')}`).toEqual([]);
});
