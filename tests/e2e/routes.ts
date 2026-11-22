/**
 * Every statically built route the launch build ships.
 *
 * Shared by the console audit and the P6-11 network audit so both cover the
 * same pages. Not a spec file: Playwright's testMatch only picks up
 * `*.spec.ts`.
 */
export const ROUTES = [
  '/',
  '/tools/',
  '/resources/',
  '/calculators/',
  '/calculators/hourly-rate-calculator/',
  '/calculators/freelance-rate-calculator/',
  '/calculators/project-profit-calculator/',
  '/calculators/markup-vs-margin-calculator/',
  '/calculators/payment-processing-fee-calculator/',
  '/calculators/vat-gst-sales-tax-calculator/',
  '/calculators/retainer-pricing-calculator/',
  '/calculators/break-even-calculator/',
  '/generators/',
  '/generators/invoice-generator/',
  '/generators/quote-generator/',
  '/generators/receipt-generator/',
  '/generators/payment-reminder-generator/',
  '/countries/',
  '/us/invoice-generator/',
  '/uk/invoice-generator/',
  '/uk/vat-invoice-generator/',
  '/ca/invoice-generator/',
  '/ca/gst-hst-invoice-generator/',
  '/au/invoice-generator/',
  '/au/tax-invoice-generator/',
  '/de/invoice-generator/',
  '/de/vat-invoice-generator/',
  '/ch/invoice-generator/',
  '/ch/vat-invoice-generator/',
  '/in/invoice-generator/',
  '/in/gst-invoice-generator/',
  '/ae/invoice-generator/',
  '/ae/vat-invoice-generator/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/disclaimer/',
] as const;
