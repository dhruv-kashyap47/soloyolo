/* eslint-disable no-undef */
// Tool-page convenience audit. Prints one JSON record per route.
// Usage: node scripts/tool-audit.mjs [baseUrl]
import { chromium } from '@playwright/test';
import process from 'node:process';

const base = process.argv[2] ?? 'http://localhost:4321';
const routes = [
  '/calculators/hourly-rate-calculator/',
  '/calculators/freelance-rate-calculator/',
  '/calculators/project-profit-calculator/',
  '/calculators/markup-vs-margin-calculator/',
  '/calculators/payment-processing-fee-calculator/',
  '/calculators/vat-gst-sales-tax-calculator/',
  '/calculators/retainer-pricing-calculator/',
  '/calculators/break-even-calculator/',
  '/generators/invoice-generator/',
  '/generators/quote-generator/',
  '/generators/receipt-generator/',
  '/generators/payment-reminder-generator/',
  '/uk/vat-invoice-generator/',
];

const browser = await chromium.launch();
const results = [];

for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 } });
  for (const route of routes) {
    const errors = [];
    page.removeAllListeners('console');
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(base + route, { waitUntil: 'networkidle' });
    const essential = page.getByRole('button', { name: 'Decline' });
    if (await essential.isVisible().catch(() => false)) await essential.click();
    await page.waitForTimeout(700);

    const data = await page.evaluate(() => {
      const visible = (el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      };
      const text = (el) => (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);

      const form = document.querySelector('form');
      const calculator = document.querySelector('#calculator, #generator');
      const result = document.querySelector('#result-heading');
      const firstField = document.querySelector('form input, form select, form textarea');
      const inputs = [
        ...document.querySelectorAll('form input, form select, form textarea'),
      ].filter(visible);
      const unlabeled = inputs.filter((el) => {
        if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
        const id = el.getAttribute('id');
        return !id || !document.querySelector(`label[for="${CSS.escape(id)}"]`);
      }).length;
      const noInputMode = inputs.filter(
        (el) =>
          el instanceof HTMLInputElement &&
          ['text', 'email', 'tel', 'url', 'number'].includes(el.type) &&
          !el.getAttribute('inputmode'),
      ).length;
      const noEnter = inputs.filter(
        (el) =>
          el instanceof HTMLInputElement &&
          ['text', 'email', 'tel', 'url', 'number'].includes(el.type) &&
          !el.getAttribute('enterkeyhint'),
      ).length;
      const smallTargets = [...document.querySelectorAll('button, a[href], select')]
        .filter(visible)
        .filter((el) => !el.closest('p, li, .prose-ledger, footer'))
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        })
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}:${text(el)}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`,
        )
        .slice(0, 8);

      const ads = [...document.querySelectorAll('.ad-slot')].map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          slot: el.dataset.slot,
          top: Math.round(rect.top + scrollY),
          height: Math.round(rect.height),
        };
      });

      return {
        title: document.title,
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        formTop: form ? Math.round(form.getBoundingClientRect().top + scrollY) : null,
        calculatorTop: calculator
          ? Math.round(calculator.getBoundingClientRect().top + scrollY)
          : null,
        firstFieldTop: firstField
          ? Math.round(firstField.getBoundingClientRect().top + scrollY)
          : null,
        resultTop: result ? Math.round(result.getBoundingClientRect().top + scrollY) : null,
        inputs: inputs.length,
        unlabeled,
        noInputMode,
        noEnter,
        prefilled: inputs.filter((el) => el.value).length,
        hasCopy: [...document.querySelectorAll('button')].some((el) => /copy/i.test(text(el))),
        hasPrint: [...document.querySelectorAll('button')].some((el) => /print/i.test(text(el))),
        hasShare: [...document.querySelectorAll('button')].some((el) => /share/i.test(text(el))),
        hasReset: [...document.querySelectorAll('button')].some((el) => /reset/i.test(text(el))),
        tabs: (() => {
          const tabs = document.querySelector('.generator-tabs');
          if (!tabs) return null;
          const style = getComputedStyle(tabs);
          return { display: style.display, position: style.position, top: style.top };
        })(),
        smallTargets,
        ads,
      };
    });

    results.push({ route, width, errors, ...data });
  }
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
