import { expect, test, type Page } from '@playwright/test';

/**
 * P6-10 — the print/PDF review.
 *
 * `page.pdf()` is Chromium-only, so these tests run in the desktop Chromium
 * project. WebKit's screen sheet and print media rules are covered by the
 * shared layout and generator flows; the final iOS AirPrint check is the
 * manual P3-15 gate.
 */

const DOCUMENTS = [
  {
    kind: 'invoice',
    path: '/generators/invoice-generator/',
    title: 'INVOICE',
    total: '£2,299.50',
  },
  {
    kind: 'quote',
    path: '/generators/quote-generator/',
    title: 'QUOTATION',
    total: 'Total',
  },
  {
    kind: 'receipt',
    path: '/generators/receipt-generator/',
    title: 'PAYMENT RECEIPT',
    total: '£1,669.20',
  },
] as const;

async function openGenerator(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'load' });
  await page.waitForSelector('html[data-generator-ready]');
}

function pageCount(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
}

function mediaBox(pdf: Buffer): { width: number; height: number } | null {
  const match = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(
    pdf.toString('latin1'),
  );
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

test.describe('print and PDF', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'page.pdf is Chromium-only');

  for (const document of DOCUMENTS) {
    test(`prints the ${document.kind} as one A4 page`, async ({ page }) => {
      await openGenerator(page, document.path);
      await page.emulateMedia({ media: 'print' });

      await expect(page.locator('.sheet')).toBeVisible();
      await expect(page.locator('.sheet')).toContainText(document.title);
      await expect(page.locator('.sheet')).toContainText(document.total);
      await expect(page.locator('.generator-form')).toBeHidden();
      await expect(page.locator('header.nav')).toBeHidden();

      // A scroll box on paper silently drops everything past the first
      // screen. The sheet must be normal flow and fully expanded.
      const layout = await page.locator('.sheet').evaluate((sheet) => ({
        overflow: (sheet as HTMLElement).scrollHeight - (sheet as HTMLElement).clientHeight,
        inFlow: getComputedStyle(sheet).position,
      }));
      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.inFlow).not.toBe('fixed');

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });

      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(pdf.length).toBeGreaterThan(20_000);

      const size = mediaBox(pdf);
      expect(size, 'A4 MediaBox').not.toBeNull();
      expect(size!.width).toBeGreaterThan(590);
      expect(size!.width).toBeLessThan(600);
      expect(size!.height).toBeGreaterThan(835);
      expect(size!.height).toBeLessThan(850);
      expect(pageCount(pdf), 'printed pages').toBe(1);
    });
  }

  test('a long invoice prints every line and its total', async ({ page }) => {
    await openGenerator(page, '/generators/invoice-generator/');

    for (let index = 0; index < 12; index += 1) {
      await page.getByRole('button', { name: 'Add a line item' }).click();
    }

    const descriptions = page.getByLabel('Description');
    const prices = page.getByLabel('Unit price');
    const count = await descriptions.count();
    for (let index = 2; index < count; index += 1) {
      await descriptions.nth(index).fill(`Extra line ${index}`);
      await prices.nth(index).fill('250');
    }

    await page.emulateMedia({ media: 'print' });

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('Extra line 13');
    const overflow = await sheet.evaluate(
      (element) => element.scrollHeight - element.clientHeight,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    expect(pageCount(pdf), 'the long invoice spans more than one A4 page').toBeGreaterThan(1);
    expect(pdf.length).toBeGreaterThan(20_000);
  });
});
