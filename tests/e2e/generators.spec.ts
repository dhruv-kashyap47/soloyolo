import { test, expect, type Page } from '@playwright/test';

async function open(page: Page, path: string) {
  await page.addInitScript(() => {
    const scope = window as unknown as { __printCalls: number; __copied: string[] };
    scope.__printCalls = 0;
    scope.__copied = [];

    window.print = () => {
      scope.__printCalls += 1;
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText = async (text: string) => {
        scope.__copied.push(text);
      };
    }
  });

  await page.goto(path);
  await page.waitForSelector('html[data-generator-ready]');
}

test.describe('the generator index', () => {
  test('lists every generator and links to it', async ({ page }) => {
    await page.goto('/generators/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Documents you can');
    await expect(page.getByRole('link', { name: /invoice generator/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /quote generator/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /receipt generator/i }).first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /payment reminder generator/i }).first(),
    ).toBeVisible();
  });

  test('links only to pages that exist', async ({ page }) => {
    await page.goto('/generators/');

    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

    for (const href of [...new Set(hrefs)]) {
      const response = await page.request.get(href);
      expect(response.status(), `expected ${href} to resolve`).toBeLessThan(400);
    }
  });
});

test.describe('the quote generator', () => {
  test('opens with a quote, its number and an expiry date', async ({ page }) => {
    await open(page, '/generators/quote-generator/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quote Generator');
    await expect(page.getByLabel('Quote number')).toHaveValue('QUO-0018');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('QUOTATION');
    await expect(sheet).toContainText('Valid until');
    await expect(sheet).not.toContainText('Amount due');
  });

  test('asks for an expiry date rather than a due date', async ({ page }) => {
    await open(page, '/generators/quote-generator/');

    await expect(page.getByLabel('Valid until')).toBeVisible();
    await expect(page.getByLabel('Due date')).toHaveCount(0);
  });

  test('counts on from the quote number already used', async ({ page }) => {
    await open(page, '/generators/quote-generator/');

    await page.getByRole('button', { name: 'Use the next number' }).click();

    await expect(page.getByLabel('Quote number')).toHaveValue('QUO-0019');
  });
});

test.describe('the receipt generator', () => {
  test('opens with a receipt that records the payment', async ({ page }) => {
    await open(page, '/generators/receipt-generator/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Receipt Generator');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('PAYMENT RECEIPT');
    await expect(sheet).toContainText('PAID');
    await expect(sheet).toContainText('Bank transfer');
    await expect(sheet).toContainText('£1,669.20');
  });

  test('shows the balance when only part of the payment arrived', async ({ page }) => {
    await open(page, '/generators/receipt-generator/');

    await page.getByLabel('Amount received').fill('1000');

    const sheet = page.locator('.sheet');
    await expect(sheet).toContainText('Balance due');
    await expect(sheet).toContainText('£669.20');
  });

  test('changes when the payment status changes', async ({ page }) => {
    await open(page, '/generators/receipt-generator/');

    await page.getByLabel('Payment status').selectOption('refunded');

    await expect(page.locator('.sheet')).toContainText('REFUNDED');
  });

  test('asks for a transaction date rather than an issue date', async ({ page }) => {
    await open(page, '/generators/receipt-generator/');

    await expect(page.getByLabel('Transaction date')).toBeVisible();
    await expect(page.getByLabel('Issue date')).toHaveCount(0);
  });
});

test.describe('the payment reminder generator', () => {
  test('writes a reminder with the details filled in', async ({ page }) => {
    await open(page, '/generators/payment-reminder-generator/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Payment Reminder Generator');

    const message = page.locator('.sheet');
    await expect(message).toContainText('Subject: Payment reminder: invoice INV-0042');
    await expect(message).toContainText('Alex Morgan');
    await expect(message).toContainText('£1,440.00');
  });

  test('rewrites the message when the tone changes', async ({ page }) => {
    await open(page, '/generators/payment-reminder-generator/');

    const message = page.locator('.sheet');
    const professional = await message.innerText();

    await page.getByLabel('Friendly').check();

    await expect(message).not.toHaveText(professional);
    await expect(message).toContainText('Hi Alex Morgan');
  });

  test('says how late the invoice is', async ({ page }) => {
    await open(page, '/generators/payment-reminder-generator/');

    const dueDate = page.getByLabel('Due date');
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const iso = lastMonth.toISOString().slice(0, 10);
    await dueDate.fill(iso);

    await expect(page.locator('.sheet')).toContainText('weeks past the due date');
  });

  test('copies the message with its subject line', async ({ page }) => {
    await open(page, '/generators/payment-reminder-generator/');

    const button = page.getByRole('button', { name: 'Copy the message' });
    await button.click();

    const copied = await page.evaluate(
      () => (window as unknown as { __copied: string[] }).__copied,
    );
    expect(copied[0]).toContain('Subject: Payment reminder: invoice INV-0042');
    expect(copied[0]).toContain('£1,440.00');
  });

  test('copies the body on its own', async ({ page }) => {
    await open(page, '/generators/payment-reminder-generator/');

    await page.getByRole('button', { name: 'Copy without the subject' }).click();

    const copied = await page.evaluate(
      () => (window as unknown as { __copied: string[] }).__copied,
    );
    expect(copied[0]).not.toContain('Subject:');
    expect(copied[0]).toContain('Alex Morgan');
  });

  test('does not overflow horizontally on a phone', async ({ page }) => {
    await open(page, '/generators/payment-reminder-generator/');

    await page.setViewportSize({ width: 360, height: 800 });
    await page.reload();
    await page.waitForSelector('html[data-generator-ready]');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(361);
  });
});
