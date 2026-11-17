# BUILD THIS PRODUCT: FREELANCER & MICROBUSINESS TOOLKIT

You are the lead engineer responsible for designing and implementing a production-ready web application.

Do not turn this into a generic calculator website. Build a focused **Freelancer & Microbusiness Toolkit** for users in:

- United States
- United Kingdom
- Canada
- Australia
- Germany
- Switzerland
- India
- United Arab Emirates

The core positioning is:

> A free, privacy-friendly business toolkit that helps freelancers, consultants, creators, contractors, and small service businesses calculate pricing, profitability, taxes, and generate professional business documents.

The website combines:

1. Business calculators
2. Invoice/document generators
3. Country-specific business tooling
4. SEO-focused informational pages

The product should eventually monetize through advertising, affiliate partnerships, and premium features, but **the first version must prioritize usefulness, correctness, SEO, performance, and trust**.

---

# 1. PRODUCT STRATEGY

Do NOT build:

- a generic "all calculators" website
- a generic AI-generated SEO farm
- a full accounting application
- a QuickBooks/Xero clone
- a tax-advice platform

Instead, build a focused utility platform for independent professionals and small businesses.

Primary audience:

- Freelancers
- Consultants
- Developers
- Designers
- Creators
- Contractors
- Coaches
- Agencies
- Sole traders
- Small service businesses

Primary countries:

- US
- UK
- Canada
- Australia
- Germany
- Switzerland
- India
- UAE

The same application should support all eight markets, but country-specific pages and invoice configurations must contain genuinely different information, defaults, fields, examples, and tax terminology. The first four shipped in Phase 4; Germany, Switzerland, India and the UAE are the Phase 8 expansion tracked in `task.md`.

Do NOT simply duplicate pages and replace country names.

---

# 2. CORE WEBSITE STRUCTURE

Use this URL architecture:

/

├── calculators/
│ ├── hourly-rate-calculator/
│ ├── freelance-rate-calculator/
│ ├── project-profit-calculator/
│ ├── markup-vs-margin-calculator/
│ ├── payment-processing-fee-calculator/
│ ├── vat-gst-sales-tax-calculator/
│ ├── retainer-pricing-calculator/
│ └── break-even-calculator/
│
├── generators/
│ ├── invoice-generator/
│ ├── quote-generator/
│ ├── receipt-generator/
│ └── payment-reminder-generator/
│
├── us/
│ └── invoice-generator/
│
├── uk/
│ ├── invoice-generator/
│ └── vat-invoice-generator/
│
├── ca/
│ ├── invoice-generator/
│ └── gst-hst-invoice-generator/
│
├── au/
│ ├── invoice-generator/
│ └── tax-invoice-generator/
│
├── de/
│ ├── invoice-generator/
│ └── vat-invoice-generator/
│
├── ch/
│ ├── invoice-generator/
│ └── vat-invoice-generator/
│
├── in/
│ ├── invoice-generator/
│ └── gst-invoice-generator/
│
├── ae/
│ ├── invoice-generator/
│ └── vat-invoice-generator/
│
├── resources/
├── about/
├── contact/
├── privacy-policy/
├── terms/
└── disclaimer/

Use clean, descriptive, SEO-friendly URLs.

---

# 3. TECHNOLOGY STACK

Use:

- Astro
- TypeScript
- Preact for interactive components
- Tailwind CSS
- Cloudflare Pages
- GitHub
- GitHub Actions
- Vitest
- Playwright
- Zod
- decimal.js

Do NOT introduce a backend unless there is a concrete requirement.

For the MVP:

- No FastAPI
- No Express
- No database
- No authentication
- No server-side calculator execution
- No AI API dependency

The application should be primarily static/client-side.

Architecture:

```text
                    USER
                     |
                     v
              CLOUDFLARE CDN
                     |
                     v
               ASTRO WEBSITE
                     |
          +----------+----------+
          |                     |
          v                     v
    CALCULATORS             GENERATORS
          |                     |
          v                     v
     TYPESCRIPT             TYPESCRIPT
      FORMULAS             DOCUMENT LOGIC
          |                     |
          +----------+----------+
                     |
                     v
                BROWSER
              /    |     \
             v     v      v
          RESULTS PREVIEW PDF
```

The reason for this architecture is simplicity, low operating cost, excellent performance, and privacy.

---

# 4. PRIVACY MODEL

Core calculators and generators should run in the browser.

Do not send invoice/customer/business information to a backend unless absolutely necessary.

Use localStorage only where useful for convenience.

If local storage is used:

- Make it clear to the user.
- Provide a "Clear saved data" action.
- Never imply that localStorage is an encrypted vault.
- Do not store unnecessary sensitive information.

The application should work without creating an account.

## 4.1 Request layers: what "no third-party requests" means

The rule is a **browser-subresource** rule. It governs what the visitor's browser fetches, not how the site is built, deployed or operated.

| Layer                   | Example                                                           | Counts against the rule? |
| ----------------------- | ----------------------------------------------------------------- | ------------------------ |
| Build-time dependency   | `decimal.js`, `@fontsource/*`, `zod`, `pdf-lib`                   | No                       |
| Build-time fetch        | FX rates pulled in CI and baked into static JSON                  | No                       |
| Deploy / CI / DNS       | Cloudflare Pages, GitHub Actions                                  | No                       |
| **Browser subresource** | Fonts CDN, analytics beacon, ad script, CMP, address autocomplete | **Yes**                  |

There is no backend, no edge function and no custom region logic in this project (plan §3, §29), so there is no server-side row to consider.

**The rule (supersedes the earlier "no third-party requests" shorthand):** the consent tool is the only third-party subresource allowed before a consent decision; after consent, third-party origins are limited to the explicit CMP and ad-stack allowlists. There is no custom region detection, and no analytics beacon at launch.

Consequences:

- Third-party calls rejected on privacy grounds stay rejected: address autocomplete, live VAT/ABN/GSTIN/TRN lookups, live tax-rate lookups, payment-processor integrations, browser monitoring SDKs, affiliate tracking scripts.
- Build-time data is not a third-party request. Fetching FX rates during the build and shipping static JSON is compatible with this policy (D-13 addendum).
- A bundled library is not a third-party request. `pdf-lib` lazy loaded from the site's own origin is compatible.

## 4.2 Consent model: CMP configuration, not code

The AdSense/Publisher tag loads for **every visitor in every region** because it deploys the Google CMP. The CMP then decides which consent flow applies and gates ad requests. The tag is the one ad-stack origin permitted before a consent decision and belongs in the CMP allowlist. Region policy lives in the CMP's configuration, not in this codebase. There is no custom region detection: no timezone, locale or geo-endpoint heuristics, and no backend.

| Group        | Regions              | Behaviour                                                       |
| ------------ | -------------------- | --------------------------------------------------------------- |
| Opt-in       | EEA, UK, Switzerland | The CMP asks before any advertising request is made.            |
| Opt-out      | US, Australia        | Ads load by default with a visible opt-out and disclosure.      |
| Undetermined | CMP cannot classify  | The CMP's own default, verified on staging rather than assumed. |

Canada follows the CMP configuration, which today means no consent message. No Quebec-specific claim appears in this plan, the tracker or the privacy page until the CMP's Quebec targeting is verified and legal review decides the policy.

Germany is EEA (opt-in) and Switzerland is already in the opt-in row. India and the UAE fall outside the CMP's named regions today, so they receive the CMP's default behaviour. That behaviour must be verified on staging (P7-20) and written into the privacy page before the new markets launch; no custom geo, timezone or locale heuristic is added (D-34).

Google documents EEA/UK/CH and US states as its CMP regions. Anything outside those regions receives the CMP's default behaviour, which is why the undetermined and rest-of-world case must be tested on staging rather than assumed.

## 4.3 Measurement

At launch, measurement is **Google Search Console plus AdSense reporting only**. There is no custom events endpoint, no Google Analytics, no browser monitoring SDK and no Cloudflare Web Analytics beacon at launch.

- Invoice, customer and tax data never leave the browser and are never measured.
- Cloudflare Web Analytics (CWA) is **off at launch**. It is controlled by a build-time flag (`PUBLIC_CWA_TOKEN`; empty means no beacon in the build), and Cloudflare's automatic injection must be off for the Pages project and for the zone.
- CWA may be enabled only if all of the following hold: the consent signal for a non-Google script is verified to work; the beacon is inserted by a manual script that runs only after the consent check; the beacon origin is added to the allowlist and the CSP; a CWA-enabled variant of P6-11d exists and passes; and the privacy text changes in the same commit. If any of that cannot be done cleanly, CWA stays off.
- CWA must never load independently of consent where consent is required.
- The privacy policy is updated **in the same commit** as the CMP and AdSense work. While the CWA flag is off, the privacy page does not mention Cloudflare analytics.

## 4.4 Documents, contact and other services

- **PDF:** browser print-to-PDF first. If iOS Safari output is unacceptable in testing, fall back to `pdf-lib`, bundled and lazy loaded, fetched only when the visitor presses "download PDF", with fonts embedded. Build the fallback only if testing shows a real failure.
- **Contact:** `mailto:` plus Cloudflare Email Routing. No form processor. The address is shown as visible text with a copy button, because a `mailto:` link fails silently without a mail client.

## 4.5 Not in MVP

These are deliberately excluded, not pending:

- Address autocomplete — leaks customer PII to a third party.
- Live VIES / ABN / GSTIN / TRN lookups — local regex format validation only.
- Live tax-rate lookups — manual configuration with `sources[]` and `verifiedOn`.
- Payment-processor integration — the user pastes a payment-link string.
- Browser error / monitoring SDKs.
- Affiliate tracking scripts — outbound links only, `rel="sponsored nofollow"`.
- E-invoicing integrations — German XRechnung/ZUGFeRD, UAE e-invoicing (Ministerial Decision 244/2025) and India IRN/e-way bill are structured clearance integrations, not print CSS. The pages disclose that print/PDF is not an e-invoice.
- Arabic / RTL document output — the UAE accepts an invoice in Arabic or English; the MVP prints English.

---

# 5. CALCULATORS

Build these eight calculators.

## 5.1 Hourly Rate Calculator

Inputs:

- Target annual income
- Annual business expenses
- Working weeks per year
- Billable hours per week

Calculate:

```text
required hourly rate =
(target income + annual expenses)
/
(working weeks × billable hours per week)
```

Example:

```text
Target income = $80,000
Expenses = $12,000
Working weeks = 48
Billable hours/week = 25

($80,000 + $12,000) / (48 × 25)
= $76.67/hour
```

Handle:

- zero values
- negative values
- impossible inputs
- decimals
- very large values
- rounding

---

## 5.2 Freelance Rate Calculator

Account for:

- Desired income
- Business expenses
- Working weeks
- Working hours
- Non-billable percentage
- Desired buffer/profit

Calculate a sustainable hourly rate.

Clearly explain the assumptions.

---

## 5.3 Project Profit Calculator

Inputs:

- Project revenue
- Labor cost
- Contractor cost
- Software/tools
- Other costs
- Overhead

Calculate:

- Total cost
- Gross profit
- Profit margin
- Markup

---

## 5.4 Markup vs Margin Calculator

Inputs:

- Cost
- Selling price
- Markup
- Margin

Allow the user to calculate missing values.

Clearly explain that:

```text
Markup = profit / cost

Margin = profit / selling price
```

Make the distinction extremely clear.

---

## 5.5 Payment Processing Fee Calculator

Inputs:

- Transaction amount
- Percentage fee
- Fixed fee

Calculate:

```text
percentage fee
fixed fee
total fee
net amount received
effective fee percentage
```

Allow the user to enter their processor's fee structure.

Do NOT hard-code one payment processor's rates into the core calculator.

---

## 5.6 VAT / GST / Sales Tax Calculator

Support:

- tax-exclusive → tax-inclusive
- tax-inclusive → tax-exclusive
- tax amount
- configurable tax rate

Use terminology appropriate to the selected country.

Do not present the calculator as tax advice.

---

## 5.7 Retainer Pricing Calculator

Inputs:

- Monthly hours
- Hourly rate
- Expenses
- Desired margin
- Discount, if applicable

Calculate:

- Monthly retainer
- Annual revenue
- Effective hourly rate
- Profit

---

## 5.8 Break-even Calculator

Calculate break-even based on:

- Fixed costs
- Variable cost per project/unit
- Selling price
- Hours or projects

Show:

- Break-even revenue
- Break-even units/projects
- Break-even hours where appropriate

---

# 6. GENERATORS

These are the primary product features.

## 6.1 Invoice Generator

This is the flagship generator.

Users must be able to enter:

### Business

- Business name
- Address
- Email
- Phone
- Website
- Tax/business registration information where applicable
- Logo

### Customer

- Customer name
- Company
- Address
- Email

### Invoice

- Invoice number
- Issue date
- Due date
- Currency
- Payment terms
- Notes

### Line items

- Description
- Quantity
- Unit price
- Discount
- Tax

Automatically calculate:

```text
subtotal
discount
tax
total
amount due
```

Provide a professional live preview.

Allow:

- Print
- Save as PDF
- Download
- Clear/reset
- Local business profile persistence

The generated document must look professional enough to actually send to a customer.

---

# 7. COUNTRY-SPECIFIC INVOICE SUPPORT

Support:

## United States

Use:

- USD
- sales tax terminology
- configurable sales tax
- US-style invoice defaults

Do not attempt automatic state/local tax calculation in MVP.

---

## United Kingdom

Support:

- GBP
- VAT terminology
- VAT invoice mode
- appropriate UK invoice fields
- UK-specific explanation

Use official UK government guidance as the authority when determining requirements.

---

## Canada

Support:

- CAD
- GST/HST terminology
- appropriate tax fields
- Canada-specific invoice explanation

Use official Canadian government guidance.

---

## Australia

Support:

- AUD
- GST terminology
- tax invoice mode
- ABN-related fields where applicable
- Australia-specific explanation

Use official Australian government guidance.

---

## Germany

Support:

- EUR
- Umsatzsteuer / VAT terminology, with 19% standard, 7% reduced and 0% for specific supplies
- Kleinunternehmer (§19 UStG) invoices that show no VAT, with the statutory note
- USt-IdNr. or Steuernummer as the registration number
- the §14(4) UStG invoice details, including the supply date
- Germany-specific explanation

The normal page covers a Kleinunternehmer invoice; the VAT page covers a registered business. Print/PDF is not a compliant domestic B2B e-invoice: receiving has been mandatory since 1 January 2025, issuing is mandatory for turnover above €800,000 from 1 January 2027 and for all businesses from 1 January 2028, and Kleinunternehmer are exempt from issuing. The page must say so.

Use the UStG and BMF guidance as the authority.

---

## Switzerland

Support:

- CHF
- MWST / TVA / IVA terminology, with 8.1% standard, 2.6% reduced and 3.8% accommodation
- an MWST number in the `CHE-123.456.789 MWST` form
- the Art. 26 MWSTG invoice details
- the CHF 100,000 registration threshold
- an English `INVOICE` title, because Switzerland is multilingual and the site is English; the tax label can be switched to MWST, TVA or IVA
- Switzerland-specific explanation

Current rates apply until a change takes effect. A ballot on 29 November 2026 could raise the standard rate to 8.5% and the accommodation rate to 4.0% from 2028; the reduced 2.6% rate is unchanged. Do not publish the proposed figures as current before the vote, and re-verify after it.

Use the ESTV and the Federal Act on Value Added Tax as the authority.

---

## India

Support:

- INR
- GST terminology, with 5% / 18% / 40% (plus 0%, 3% and 0.25% special rates) effective 22 September 2025; 40% is for specified goods, not most services
- GSTIN as the registration number
- the ₹40 lakh goods / ₹20 lakh services registration thresholds, with the lower special-category state thresholds explained rather than generalised
- CGST + SGST for an intra-state supply and IGST for an inter-state supply
- place of supply, HSN/SAC and the Rule 46 tax-invoice details
- an authorised-signatory line
- India-specific explanation

One total GST is computed on the taxable base and only then split for display, so the printed CGST, SGST or IGST always adds back to the total. The line rate stays the total GST. The normal page covers a non-registered business; the GST page covers a registered one. A composition dealer's bill of supply is out of scope.

Print/PDF is not an e-invoice and does not generate an IRN or e-way bill. The page must say so.

Use the GST Council, CBIC and the GST portal as the authority.

---

## United Arab Emirates

Support:

- AED
- VAT terminology at 5%
- TRN as the registration number
- the mandatory AED 375,000 and voluntary AED 187,500 registration thresholds
- the FTA tax-invoice details, including the customer TRN where the customer is registered
- UAE-specific explanation

An invoice may be issued in Arabic or English; the MVP prints English. Print/PDF is not an e-invoice under the UAE e-invoicing programme, and an in-scope business needs an accredited service provider. The page must say so and must not confuse VAT with UAE corporate tax.

Use the Federal Tax Authority as the authority.

IMPORTANT:

Tax and invoice requirements can change.

Do not hard-code claims without documenting their source.

Create a maintainable configuration layer so rates and country-specific behavior can be updated independently from the UI.

---

# 8. OTHER GENERATORS

## Quote / Estimate Generator

Support:

- business information
- customer information
- quote number
- issue date
- expiry date
- line items
- discounts
- tax
- notes
- terms
- PDF/print output

---

## Receipt Generator

Support:

- business
- customer
- transaction date
- receipt number
- payment method
- items
- subtotal
- tax
- total
- payment status

---

## Payment Reminder Generator

Allow users to generate professional payment reminder text.

Tone options:

- Friendly
- Professional
- Firm
- Final notice

Include:

- customer name
- invoice number
- amount
- due date
- payment link
- business name

Provide copy-to-clipboard functionality.

---

# 9. DESIGN SYSTEM

The site should NOT look like a generic calculator website.

Design direction:

- modern SaaS
- premium
- clean
- trustworthy
- fast
- professional
- excellent typography
- generous spacing
- strong visual hierarchy

Avoid:

- excessive gradients
- generic AI landing-page aesthetics
- excessive glassmorphism
- clutter
- unnecessary animations
- huge hero sections
- excessive ads
- stock-photo-heavy layouts

The calculator itself should be the visual focus.

Use a consistent design system for:

- buttons
- inputs
- cards
- tables
- result panels
- navigation
- typography
- alerts
- tooltips
- FAQ sections

Everything must be responsive.

Mobile usability is a first-class requirement.

---

# 10. CALCULATOR PAGE TEMPLATE

Every calculator page should follow this structure:

```text
H1
Short description

[CALCULATOR]

RESULT

How it works

Formula

Worked example

Assumptions / limitations

Frequently asked questions

Related calculators

Related generators
```

Do NOT artificially force a specific word count.

Content should exist because it helps the user understand the tool.

---

# 11. GENERATOR PAGE TEMPLATE

Use:

```text
H1
Short explanation

[GENERATOR]

LIVE PREVIEW

Download PDF
Print
Copy / Save where appropriate

How to use it

Country/use-case information

Important notes

FAQs

Related tools
```

The generator must be usable immediately without registration.

---

# 12. SEO STRATEGY

SEO is a core product requirement.

Target long-tail, high-intent searches rather than broad keywords.

Examples:

```text
freelance hourly rate calculator
freelancer rate calculator
project profit margin calculator
markup vs margin calculator
free invoice generator
invoice generator for freelancers
VAT invoice generator UK
GST HST invoice generator Canada
tax invoice generator Australia
invoice generator with sales tax
German invoice generator
Rechnung generator VAT 19%
Swiss VAT invoice generator
MWST invoice generator Switzerland
GST invoice generator India
CGST SGST invoice format
UAE VAT invoice generator
tax invoice UAE TRN
```

Do not build hundreds of thin programmatic pages.

Start with:

- 8 calculator pages
- 4 generator pages
- 15 country-specific invoice experiences (7 existing + 8 new), plus the country hub
- supporting informational pages

Only expand when Search Console data shows actual demand.

---

# 13. PROGRAMMATIC SEO RULES

Programmatic pages are allowed only when they provide genuine additional value.

Bad:

```text
/invoice-generator-for-designers/
/invoice-generator-for-developers/
/invoice-generator-for-consultants/
/invoice-generator-for-photographers/
```

where the only difference is the profession name.

Good:

Each page must have genuinely different:

- defaults
- examples
- line-item structures
- advice
- terminology
- FAQs
- use cases
- internal links

Start with the eight calculators, four generators, the country guides and the trust pages: roughly 30–40 meaningful pages. The eight-market expansion adds eight guide pages, not eight programmatic variants of the same page.

Do not mass-generate hundreds of pages.

---

# 14. TECHNICAL SEO

Implement:

- semantic HTML
- correct title tags
- meta descriptions
- canonical URLs
- Open Graph metadata
- Twitter/X metadata
- XML sitemap
- robots.txt
- breadcrumbs
- structured data where appropriate
- clean URLs
- internal linking
- correct heading hierarchy
- image optimization
- lazy loading where appropriate

Do not rely on JavaScript to render essential SEO content.

Astro should generate the important page content as HTML.

Use appropriate structured data.

Do not depend on FAQ rich results as a core SEO strategy.

---

# 15. PERFORMANCE

Performance is a major requirement.

Target:

- excellent Lighthouse performance
- low JavaScript payload
- minimal dependencies
- no unnecessary client-side hydration
- optimized assets
- fast initial page load
- good Core Web Vitals

Use Astro islands/partial hydration.

Only hydrate interactive calculator/generator components.

Do not turn the entire website into a client-rendered SPA.

---

# 16. ACCESSIBILITY

Implement:

- keyboard navigation
- proper labels
- semantic HTML
- visible focus states
- sufficient contrast
- accessible error messages
- screen-reader-friendly result updates
- touch-friendly controls
- reduced-motion support

Do not use placeholder text as the only form label.

---

# 17. FINANCIAL CALCULATION CORRECTNESS

This is critical.

Never rely on ordinary JavaScript floating-point arithmetic for financial calculations where precision matters.

Use:

- decimal.js
- or integer minor currency units where appropriate

Create unit tests for every formula.

Test:

- normal values
- zero
- negative values
- decimals
- very large values
- rounding
- tax-inclusive calculations
- tax-exclusive calculations
- discounts
- empty values
- invalid values
- boundary values

Every calculator must have independent tests.

Do not trust the UI result simply because the formula looks correct.

---

# 18. TESTING

Use Vitest for calculation logic.

Use Playwright for critical user flows.

Minimum E2E coverage:

```text
Homepage loads
Calculator loads
Calculator accepts input
Calculator produces expected result
Invoice can be created
Invoice totals are correct
Invoice preview renders
PDF/print flow works
Country selection changes configuration
Mobile layout works
```

Create regression tests for every bug found.

---

# 19. DATA / CONFIGURATION ARCHITECTURE

Do not scatter country-specific values throughout components.

Use a structured configuration system.

Example concept:

```ts
countryConfig = {
  US: {...},
  UK: {...},
  CA: {...},
  AU: {...},
  DE: {...},
  CH: {...},
  IN: {...},
  AE: {...}
}
```

Separate:

- currency
- tax terminology
- invoice fields
- validation
- formatting
- defaults
- official-source references
- document title
- customer registration field, place of supply and HSN/SAC where the market needs them
- the India GST split mode and labels

from UI components.

This makes future maintenance significantly easier.

The runtime registry that ships in the generator island must stay small. Long source notes and page copy stay in build-time modules; if the island crosses its bundle budget, split a slim runtime config from the full content config rather than shipping every note to the browser.

---

# 20. LEGAL / TRUST PAGES

Create:

```text
/about
/contact
/privacy-policy
/terms
/disclaimer
```

The About page should clearly explain who operates the site.

The Disclaimer should make clear that calculators are informational tools and do not constitute professional tax, accounting or legal advice.

Country-specific tax information should link to official government sources.

Do not make unsupported legal or tax claims.

---

# 21. MONETIZATION

Do not compromise the product experience for monetization.

Initial strategy:

1. Google AdSense
2. Relevant affiliate partnerships
3. Later premium features

Potential affiliate categories:

- invoicing software
- accounting software
- payment processors
- business software
- proposal/project-management tools

Affiliate recommendations must be relevant to the user's task.

Clearly disclose affiliate relationships.

Do not insert advertisements inside calculator input/output workflows.

Ad coverage in Germany, Switzerland, India and the UAE is a separate decision (D-34 / P8-46). Do not assume the same demand, policy or consent behaviour as the first four markets, and do not add a new placement while that decision is open.

---

# 22. FUTURE PREMIUM VERSION

Do NOT implement this in MVP unless architecture naturally supports it.

Future premium features:

- saved clients
- saved invoices
- invoice history
- recurring invoices
- custom branding
- multiple templates
- bulk document generation
- recurring billing workflows
- team accounts
- ad-free experience

Eventually the product could evolve from a collection of free tools into a lightweight business SaaS.

But do not prematurely build authentication, subscriptions, databases or complex backend infrastructure.

---

# 23. MEASUREMENT

At launch, measurement is **Google Search Console plus AdSense reporting only**.

Do NOT add product event tracking, a custom events endpoint, Google Analytics, a browser monitoring SDK or Cloudflare Web Analytics at launch. CWA may only be enabled through the plan §4.3 gate. Cloudflare's edge statistics may be read in the dashboard; they require no page request.

Do NOT send invoice contents, customer information, financial amounts, or other sensitive form data to any measurement system. Aggregate reporting only.

Product events (for example `calculator_completed` or `invoice_created`) are not part of launch. Adding them later requires a new decision, the plan §4.3 gate and a privacy-policy change in the same commit.

---

# 24. SEARCH CONSOLE

Prepare the application for:

- Google Search Console
- sitemap submission
- indexing monitoring
- query monitoring
- CTR analysis
- country traffic analysis, with Germany, Switzerland, India and the UAE segmented from the first four markets
- page performance analysis

Do not assume SEO success.

Use actual search data to determine what to build next.

---

# 25. DEVELOPMENT PRIORITY

Build in this exact order.

## Phase 1

Foundation:

- Astro
- TypeScript
- Tailwind
- Preact
- routing
- design system
- responsive layout
- SEO infrastructure

## Phase 2

Calculators:

1. Hourly Rate Calculator
2. Freelance Rate Calculator
3. Project Profit Calculator
4. Markup vs Margin Calculator
5. Payment Processing Fee Calculator
6. VAT/GST/Sales Tax Calculator
7. Retainer Pricing Calculator
8. Break-even Calculator

## Phase 3

Generators:

1. Invoice Generator
2. Quote Generator
3. Receipt Generator
4. Payment Reminder Generator

## Phase 4

Country localization:

1. US
2. UK
3. Canada
4. Australia
5. Germany
6. Switzerland
7. India
8. UAE

The first four shipped in Phase 4. The four-market expansion (Germany, Switzerland, India, UAE) is tracked as Phase 8 in `task.md`, with the shared engine work, India GST split and e-invoicing boundaries landing before the country pages.

## Phase 5

SEO/content:

- About
- Contact
- Privacy
- Terms
- Disclaimer
- calculator explanations
- worked examples
- FAQs
- related-tool linking

## Phase 6

Testing:

- unit tests
- E2E tests
- accessibility
- mobile
- PDF/print
- performance
- SEO

## Phase 7

Production:

- Cloudflare Pages
- GitHub Actions
- sitemap
- Search Console
- analytics
- production monitoring

---

# 26. CODE QUALITY REQUIREMENTS

Use strict TypeScript.

Avoid:

- any
- duplicated calculation logic
- duplicated country configuration
- giant components
- unnecessary abstractions
- premature backend architecture
- unnecessary dependencies

Prefer:

- reusable components
- pure calculation functions
- configuration-driven country support
- small focused modules
- strong typing
- tests around business logic

Separate:

```text
UI
↓
validation
↓
business logic
↓
formatting
```

Do not put financial formulas directly inside JSX/template code.

---

# 27. REPOSITORY STRUCTURE

Use a maintainable structure similar to:

```text
src/
├── components/
│   ├── ui/
│   ├── calculators/
│   ├── generators/
│   ├── invoice/
│   └── layout/
│
├── lib/
│   ├── calculators/
│   ├── generators/
│   ├── finance/
│   ├── countries/
│   ├── formatting/
│   └── validation/
│
├── data/
│   ├── calculators/
│   ├── generators/
│   └── countries/
│
├── pages/
│   ├── calculators/
│   ├── generators/
│   ├── us/
│   ├── uk/
│   ├── ca/
│   ├── au/
│   ├── de/
│   ├── ch/
│   ├── in/
│   └── ae/
│
├── styles/
└── content/
```

Adapt this structure if Astro's conventions suggest a better implementation, but preserve the separation of concerns.

---

# 28. IMPORTANT PRODUCT PRINCIPLES

Always prioritize:

```text
Correctness
>
User experience
>
Performance
>
SEO
>
Maintainability
>
Feature count
```

A calculator with incorrect math is worse than having no calculator.

A generator that produces an ugly invoice is worse than having fewer generator features.

A website with 20 excellent pages is better than one with 500 thin pages.

---

# 29. DO NOT OVERENGINEER

The MVP does NOT need:

- microservices
- Kubernetes
- Redis
- PostgreSQL
- authentication
- API servers
- AI agents
- payment infrastructure
- queues
- background workers

The first product should be deployable as a mostly static website.

Keep infrastructure cost close to zero while traffic is low.

---

# 30. DEFINITION OF DONE

Do not declare the project complete merely because it builds.

The MVP is complete only when:

- All eight calculators work.
- All four generators work.
- Invoice generation works.
- PDF/print output is professional.
- US/UK/Canada/Australia configurations work.
- Germany, Switzerland, India and UAE configurations work.
- Every country page has official sources, a verification date and the right e-invoicing disclosure; India's CGST/SGST/IGST split adds up on the printed sheet.
- Consent and advertising behaviour for the new markets is decided and verified rather than assumed.
- Financial calculations have automated tests.
- Critical flows have Playwright tests.
- Mobile UX is good.
- Accessibility is acceptable.
- SEO metadata exists.
- Sitemap works.
- robots.txt works.
- Legal pages exist.
- No obvious console errors exist.
- No TypeScript errors exist.
- Production build succeeds.
- Lighthouse performance is strong.
- Cloudflare deployment works.
- Search Console can discover the sitemap.

---

# 31. BUILD METHOD

Work incrementally.

Do NOT generate the entire application blindly in one pass.

For each major phase:

1. Inspect the existing repository.
2. Plan the implementation.
3. Implement.
4. Run typecheck.
5. Run lint.
6. Run unit tests.
7. Run E2E tests where applicable.
8. Fix failures.
9. Review the implementation for unnecessary complexity.
10. Continue to the next phase.

Never hide test failures.

Never disable tests merely to make the build pass.

Never replace real functionality with placeholders unless explicitly marked as temporary and tracked.

---

# 32. FIRST TASK

Before writing significant code:

1. Inspect the repository.
2. Determine whether this is an existing project or a new project.
3. Identify existing tooling and conventions.
4. Create/update the implementation plan.
5. Establish the project architecture.
6. Implement the foundation and design system first.

Then build the **Hourly Rate Calculator** as the first complete vertical slice.

The first vertical slice must include:

```text
SEO page
+
responsive UI
+
calculator logic
+
validation
+
financial precision
+
unit tests
+
accessible result display
+
related-tool structure
```

Once that vertical slice is proven, use the same architecture to build the remaining calculators and generators.

Do not change the core product direction unless a concrete technical or business constraint makes it necessary.

The final result should feel like a real, trustworthy SaaS-quality business utility platform—not a collection of AI-generated calculator pages.
