/**
 * Generates the per-page Open Graph cards for the core routes.
 *
 * The cards are rendered by Chromium from one HTML template, so the type is
 * real text (not baked into an AI image) and the series stays consistent. The
 * route list matches the 17 core pages that use a custom card; country, legal
 * and informational pages keep the shared /og.jpg.
 *
 * Usage: pnpm og:generate
 */
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const OUTPUT_DIR = 'public/og';
const WIDTH = 1200;
const HEIGHT = 630;

const cards = [
  {
    file: 'home.jpg',
    category: 'Free business toolkit',
    title: 'Business tools for independent work.',
    description: 'Calculators and documents for freelancers and independent professionals.',
  },
  {
    file: 'tools.jpg',
    category: 'The toolkit',
    title: 'Every tool, in one place.',
    description: '12 free calculators and generators for pricing, profit, tax and paperwork.',
  },
  {
    file: 'calculators.jpg',
    category: 'Calculators',
    title: 'Business calculators for independent work.',
    description: 'Rates, profit, margin, fees, tax, retainers and break-even.',
  },
  {
    file: 'generators.jpg',
    category: 'Generators',
    title: 'Documents you can actually send.',
    description: 'Invoices, quotes, receipts and payment reminders.',
  },
  {
    file: 'countries.jpg',
    category: 'Country guides',
    title: 'Invoice rules by country.',
    description: 'Eight markets, one document engine, local tax rules.',
  },
  {
    file: 'hourly-rate.jpg',
    category: 'Calculator',
    title: 'Hourly Rate Calculator',
    description: 'Find the rate your income target and billable hours require.',
  },
  {
    file: 'freelance-rate.jpg',
    category: 'Calculator',
    title: 'Freelance Rate Calculator',
    description: 'Build a sustainable rate from real hours, costs and a profit buffer.',
  },
  {
    file: 'project-profit.jpg',
    category: 'Calculator',
    title: 'Project Profit Calculator',
    description: 'See profit, margin and markup after every project cost.',
  },
  {
    file: 'markup-margin.jpg',
    category: 'Calculator',
    title: 'Markup vs Margin Calculator',
    description: 'Convert cost, price, markup and margin without mixing them up.',
  },
  {
    file: 'retainer.jpg',
    category: 'Calculator',
    title: 'Retainer Pricing Calculator',
    description: 'Price a monthly retainer that still hits your target margin.',
  },
  {
    file: 'break-even.jpg',
    category: 'Calculator',
    title: 'Break-even Calculator',
    description: 'Find the revenue, projects or hours that cover your costs.',
  },
  {
    file: 'payment-fee.jpg',
    category: 'Calculator',
    title: 'Payment Fee Calculator',
    description: 'See exactly what lands after processing fees.',
  },
  {
    file: 'tax.jpg',
    category: 'Calculator',
    title: 'VAT / GST / Sales Tax Calculator',
    description: 'Add or remove indirect tax with the right local terminology.',
  },
  {
    file: 'invoice.jpg',
    category: 'Document generator',
    title: 'Invoice Generator',
    description: 'Itemised lines, tax, currency and a print-ready invoice.',
  },
  {
    file: 'quote.jpg',
    category: 'Document generator',
    title: 'Quote Generator',
    description: 'A clear estimate with scope, terms and a validity date.',
  },
  {
    file: 'receipt.jpg',
    category: 'Document generator',
    title: 'Receipt Generator',
    description: 'Record a payment, the method and any balance still due.',
  },
  {
    file: 'reminder.jpg',
    category: 'Document generator',
    title: 'Payment Reminder Generator',
    description: 'A polite, professional chase for an overdue invoice.',
  },
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function html({ category, title, description }, index, font, mono, logoMark) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Outfit';
    src: url(data:font/woff2;base64,${font}) format('woff2');
    font-weight: 100 900;
    font-style: normal;
    font-display: block;
  }
  @font-face {
    font-family: 'DM Mono';
    src: url(data:font/woff2;base64,${mono}) format('woff2');
    font-weight: 500;
    font-style: normal;
    font-display: block;
  }
  * { box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; margin: 0; overflow: hidden; }
  body {
    background:
      radial-gradient(900px 620px at 88% 12%, rgba(82, 102, 235, 0.16), transparent 62%),
      radial-gradient(700px 500px at 4% 96%, rgba(157, 77, 255, 0.10), transparent 65%),
      #f6f3ec;
    color: #14161f;
    font-family: 'Outfit', system-ui, sans-serif;
    position: relative;
  }
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(20, 22, 31, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(20, 22, 31, 0.035) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 72%);
  }
  .ghost {
    position: absolute;
    top: -54px;
    right: 26px;
    font-family: 'DM Mono', monospace;
    font-size: 250px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.08em;
    color: rgba(20, 22, 31, 0.05);
    z-index: 0;
  }
  .frame {
    position: relative;
    z-index: 1;
    height: 100%;
    padding: 58px 76px 54px;
    display: flex;
    flex-direction: column;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 44px; height: 44px; border-radius: 10px; display: block; }
  .brand span { font-size: 34px; font-weight: 600; letter-spacing: -0.04em; color: #14161f; }
  .free {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #5b6172;
  }
  .main { margin-top: 70px; max-width: 900px; }
  .category {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 6px 12px;
    border: 1px solid rgba(82, 102, 235, 0.34);
    border-radius: 999px;
    background: rgba(82, 102, 235, 0.07);
    color: #3d4fd6;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  h1 {
    margin: 24px 0 0;
    max-width: 900px;
    font-size: 68px;
    font-weight: 500;
    line-height: 1.04;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }
  p {
    margin: 22px 0 0;
    max-width: 760px;
    color: #4d5364;
    font-size: 24px;
    line-height: 1.4;
    letter-spacing: -0.01em;
  }
  .bottom {
    margin-top: auto;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 28px;
  }
  .meta {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.08em;
    color: #5b6172;
  }
  .rule {
    width: 128px;
    height: 6px;
    margin-bottom: 16px;
    border-radius: 999px;
    background: linear-gradient(90deg, #5266eb, #9d4dff);
  }
  .bottom-note {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.06em;
    color: #777d8c;
    text-align: right;
  }
</style>
</head>
<body>
  <div class="ghost">${String(index + 1).padStart(2, '0')}</div>
  <div class="frame">
    <div class="top">
      <div class="brand">
        <img src="data:image/png;base64,${logoMark}" alt="">
        <span>soloyolo</span>
      </div>
      <span class="free">Free · No account</span>
    </div>
    <div class="main">
      <span class="category">${escapeHtml(category)}</span>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
    </div>
    <div class="bottom">
      <div>
        <div class="rule"></div>
        <div class="meta">soloyolotools.com</div>
      </div>
      <div class="bottom-note">Runs in your browser</div>
    </div>
  </div>
</body>
</html>`;
}

const font = (await readFile('public/fonts/outfit-latin-wght-normal.woff2')).toString('base64');
const mono = (await readFile('public/fonts/dm-mono-latin-500-normal.woff2')).toString('base64');
const logoMark = (await readFile('src/assets/brand/logo-mark.png')).toString('base64');

await mkdir(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

for (const [index, card] of cards.entries()) {
  await page.setContent(html(card, index, font, mono, logoMark), { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const heading = document.querySelector('h1');
    if (!heading) return;
    const maxHeight = 228;
    let size = 68;
    while (heading.getBoundingClientRect().height > maxHeight && size > 48) {
      size -= 2;
      heading.style.fontSize = `${size}px`;
    }
  });
  await page.screenshot({
    path: `${OUTPUT_DIR}/${card.file}`,
    type: 'jpeg',
    quality: 92,
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });
  console.log(`wrote ${OUTPUT_DIR}/${card.file}`);
}

await browser.close();
