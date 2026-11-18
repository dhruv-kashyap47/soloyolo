import { test, expect } from '@playwright/test';

test('homepage loads with the primary call to action', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Run your solo business');
  await expect(
    page.getByRole('link', { name: /calculate your hourly rate/i }).first(),
  ).toBeVisible();

  await page
    .getByRole('link', { name: /calculate your hourly rate/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/calculators\/hourly-rate-calculator\/$/);
});

test('home quick actions work and every ad slot reserves space', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-quick="invoice"]')).toBeVisible();
  await expect(page.locator('[data-quick="timer"]')).toBeVisible();
  await expect(page.locator('[data-quick="clients"]')).toBeVisible();

  await page.click('[data-quick="timer"]');
  await expect(page.locator('.chip-timer')).toContainText('Stop');
  await page.click('[data-quick="timer"]');
  await expect(page.locator('.chip-timer')).toContainText('Start timer');

  const slots = ['leaderboard', 'infeed', 'sidebar', 'anchor', 'end'];
  for (const slot of slots) {
    await expect(page.locator(`[data-slot="${slot}"]`)).toHaveCount(1);
  }
});

test('the add-client quick action focuses the client input', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );

  await page.click('[data-quick="clients"]');
  await expect(page.locator('.client-form input')).toBeFocused();
});

test('region choice changes the dashboard currency', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );
  await page.selectOption('.region-field select', 'IN');
  await expect(page.locator('.tile-label').nth(1)).toContainText('INR');
});

test('the weekly goal is editable and persists', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );

  await page.click('.goal-edit');
  await page.fill('.goal-form input', '30');
  await page.click('.goal-form button');
  await expect(page.locator('.goal-edit')).toContainText('30 h');
  await expect(page.locator('.progress-ring')).toHaveAttribute(
    'aria-label',
    / of 30 billable hours/,
  );

  await page.reload();
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );
  await expect(page.locator('.goal-edit')).toContainText('30 h');
});

test('clients are actionable: a saved client prefills a new invoice', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );

  await page.fill('.client-form input', 'Bright Coffee');
  await page.click('.client-form button');
  await expect(page.locator('.client-list li .client-name')).toContainText('Bright Coffee');

  await page.click('.client-list .client-invoice');
  await expect(page).toHaveURL(/\/generators\/invoice-generator\/\?client=/);
  await expect(page.getByLabel('Customer name')).toHaveValue('Bright Coffee');
  // A real invoice never opens with the demo customer's details.
  await expect(page.getByLabel('Customer email')).toHaveValue('');
});

test('a removed client disappears and is gone after a reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );

  await page.fill('.client-form input', 'One-off Job');
  await page.click('.client-form button');
  await page.click('.client-list .client-remove');
  await expect(page.locator('.client-list li')).toHaveCount(0);

  await page.reload();
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );
  await expect(page.locator('.client-list li')).toHaveCount(0);
});

test('the command palette opens from the header on every page', async ({ page }) => {
  await page.goto('/calculators/hourly-rate-calculator/');
  // The header shows one search trigger per breakpoint; click the visible one.
  await page.locator('[data-open-palette]:visible').first().click();

  const dialog = page.locator('[role="dialog"][aria-label="Command palette"]');
  await expect(dialog).toBeVisible();
  await expect(page.getByPlaceholder(/Type a tool name/)).toBeFocused();
  await page.getByPlaceholder(/Type a tool name/).fill('break');
  await expect(page.locator('#palette-results li').first()).toContainText('Break-even');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('the palette search is fuzzy and multi-word', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+K');

  const input = page.getByPlaceholder(/Type a tool name/);
  await expect(input).toBeFocused();

  // Typos still find the tool.
  await input.fill('hrr');
  await expect(page.locator('#palette-results li').first()).toContainText('Hourly Rate');

  // Multi-word queries match whole phrases people actually type.
  await input.fill('new invoice');
  await expect(page.locator('#palette-results li').first()).toContainText('New Invoice');

  // Saved clients are searchable entries.
  await page.evaluate(() =>
    localStorage.setItem(
      'soloyolo-clients',
      JSON.stringify([{ id: '1', name: 'Bright Coffee' }]),
    ),
  );
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+K');
  await expect(page.getByPlaceholder(/Type a tool name/)).toBeFocused();
  await page.getByPlaceholder(/Type a tool name/).fill('bright');
  await expect(page.locator('#palette-results li').first()).toContainText('Invoice Bright Coffee');

  await page.keyboard.press('Escape');
});

test('the palette traps focus and returns it to the trigger', async ({ page, browserName }) => {
  await page.goto('/');
  const trigger = page.locator('[data-open-palette]:visible').first();
  await trigger.click();

  const dialog = page.locator('[role="dialog"][aria-label="Command palette"]');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#palette-results')).toBeVisible();
  await expect(page.getByPlaceholder(/Type a tool name/)).toBeFocused();

  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() =>
      Boolean(document.activeElement?.closest('[role="dialog"]')),
    );
    expect(inside, `focus escaped the palette after ${i + 1} tabs`).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  // WebKit (iOS Safari) refuses programmatic focus on buttons, so focus can
  // only be handed back to the trigger where the engine allows it. The
  // palette always attempts the hand-back; Chromium proves it here.
  if (browserName === 'chromium') await expect(trigger).toBeFocused();
});

test('pinned tools rise to the top of the palette and persist', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+K');
  const input = page.getByPlaceholder(/Type a tool name/);
  await expect(input).toBeFocused();

  await input.fill('break-even');
  await expect(page.locator('#palette-results li[role="option"]').first()).toContainText('Break-even');
  await page.getByRole('button', { name: /pin/i }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Pinned Break-even' })).toHaveCount(1);

  await input.fill('');
  await expect(page.locator('#palette-results li[role="option"]').first()).toContainText('Break-even');

  await page.reload();
  await page.keyboard.press('Control+K');
  await expect(page.locator('#palette-results li[role="option"]').first()).toContainText('Break-even');
});

test('quick actions are searchable and run from the palette', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );
  await page.keyboard.press('Control+K');
  await page.getByPlaceholder(/Type a tool name/).fill('start timer');
  await expect(page.locator('#palette-results li[role="option"]').first()).toContainText('Start timer');
  await page.keyboard.press('Enter');
  await expect(page.locator('.chip-timer')).toContainText('Stop');
});

test('the palette records real tool visits as recents', async ({ page }) => {
  await page.goto('/generators/invoice-generator/');
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'palette_ready',
    ),
  );

  await page.goto('/');
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );
  await expect(page.locator('.today-lower .link-list a').first()).toContainText('New Invoice');
});

test('printing a document is counted on the home desk', async ({ page }) => {
  await page.goto('/generators/invoice-generator/');
  // The print dialogue never opens in the test: the recorder runs first.
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.getByRole('button', { name: 'Print or save as PDF' }).click();
  await page.waitForTimeout(200);

  await page.goto('/');
  await page.waitForFunction(() =>
    ((window as unknown as { __soloyoloEvents?: { name: string }[] }).__soloyoloEvents ?? []).some(
      (event) => event.name === 'today_ready',
    ),
  );
  await expect(page.locator('.tile-stats').first()).toContainText('Documents printed');
  await expect(page.locator('.tile-stats dd a').first()).toContainText('1');
});

test('the anchor ad appears only with ads consent and is dismissible', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 800 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();

  await page.goto('/');
  await expect(page.locator('.ad-slot-anchor')).toBeHidden();

  await page.evaluate(() => localStorage.setItem('soloyolo-consent', 'all'));
  await page.reload();

  // An anchor unit only shows when a live ad network is configured. The test
  // build has no publisher id, so simulate one: the consent gate is what is
  // under test, not the build environment.
  const network = await page.locator('.ad-slot-anchor').getAttribute('data-network');
  if (network !== 'adsense') {
    await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>('.ad-slot-anchor');
      if (root) root.dataset.network = 'adsense';
      window.dispatchEvent(new CustomEvent('soloyolo:consent', { detail: 'all' }));
    });
  }

  await expect(page.locator('.ad-slot-anchor')).toBeVisible();
  await expect(page.locator('.ad-slot-anchor')).toHaveCSS('position', 'fixed');

  await page.click('[data-ad-dismiss]');
  await expect(page.locator('.ad-slot-anchor')).toBeHidden();
  await ctx.close();
});

test('tool page ad slots keep their original reserved heights', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/calculators/hourly-rate-calculator/');

  const heights = await page.evaluate(() => ({
    top: Math.round(document.querySelector('[data-slot="leaderboard"]')!.getBoundingClientRect().height),
    inarticle: Math.round(document.querySelector('[data-slot="infeed"]')!.getBoundingClientRect().height),
    sidebar: Math.round(document.querySelector('[data-slot="sidebar"]')!.getBoundingClientRect().height),
    end: Math.round(document.querySelector('[data-slot="end"]')!.getBoundingClientRect().height),
  }));

  expect(heights.top).toBe(120);
  expect(heights.inarticle).toBe(280);
  expect(heights.sidebar).toBe(600);
  expect(heights.end).toBe(250);
});

test('each tool grid renders uniform card heights', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  // Each group (calculators, generators) is its own grid: every card in a
  // grid is exactly as tall as its neighbours, including across rows.
  const perGrid = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.tool-grid')).map((grid) =>
      [...new Set(
        Array.from(grid.querySelectorAll('.card')).map((card) =>
          Math.round(card.getBoundingClientRect().height),
        ),
      )],
    ),
  );
  expect(perGrid.length).toBe(2);
  for (const heights of perGrid) expect(heights).toHaveLength(1);
});

test('homepage links only to pages that exist', async ({ page }) => {
  await page.goto('/');

  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

  const unique = [...new Set(hrefs)];
  for (const href of unique) {
    const response = await page.request.get(href);
    expect(response.status(), `expected ${href} to resolve`).toBeLessThan(400);
  }
});

test('calculator index lists the live calculators', async ({ page }) => {
  await page.goto('/calculators/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Business calculators');
  await expect(page.getByRole('link', { name: /hourly rate calculator/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /freelance rate calculator/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /project profit calculator/i }).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: /markup vs margin calculator/i }).first(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /payment fee calculator/i }).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: /vat \/ gst \/ sales tax calculator/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /retainer pricing calculator/i }).first(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /break-even calculator/i }).first()).toBeVisible();
});
