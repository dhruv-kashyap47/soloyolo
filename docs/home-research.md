# Home base redesign: codebase inventory and research brief

Prepared 2026-11-17. This document covers Phase 1 (understand) and Phase 2
(research) before any design decisions were made. Sources are linked inline;
figures are quoted as published, with the measurement window attached. Where a
claim could not be confirmed it is marked **unverified**.

## Phase 1: what is actually in the codebase

### Live tools (single registry: `src/lib/tools.ts`)

| #   | Tool                              | Kind       | Route                                             |
| --- | --------------------------------- | ---------- | ------------------------------------------------- |
| 1   | Hourly Rate Calculator            | calculator | `/calculators/hourly-rate-calculator/`            |
| 2   | Freelance Rate Calculator         | calculator | `/calculators/freelance-rate-calculator/`         |
| 3   | Project Profit Calculator         | calculator | `/calculators/project-profit-calculator/`         |
| 4   | Markup vs Margin Calculator       | calculator | `/calculators/markup-vs-margin-calculator/`       |
| 5   | Payment Processing Fee Calculator | calculator | `/calculators/payment-processing-fee-calculator/` |
| 6   | VAT / GST / Sales Tax Calculator  | calculator | `/calculators/vat-gst-sales-tax-calculator/`      |
| 7   | Retainer Pricing Calculator       | calculator | `/calculators/retainer-pricing-calculator/`       |
| 8   | Break-even Calculator             | calculator | `/calculators/break-even-calculator/`             |
| 9   | Invoice Generator                 | generator  | `/generators/invoice-generator/`                  |
| 10  | Quote / Estimate Generator        | generator  | `/generators/quote-generator/`                    |
| 11  | Receipt Generator                 | generator  | `/generators/receipt-generator/`                  |
| 12  | Payment Reminder Generator        | generator  | `/generators/payment-reminder-generator/`         |

Country invoice generators (8 markets): US, UK (VAT), CA (GST/HST), AU (Tax
Invoice), DE (Rechnung §19 UStG), CH (MWST/TVA), IN (GST), AE (FTA VAT), each
with a compliance guide.

Home-page features already present before this redesign: `QuickEstimator`
(live rate simulator), `TodayDashboard` (local profile, weekly-hour tracker,
tips, recents and pins), `CommandPalette` (Cmd/Ctrl+K, keys 1/2/3, `/`, pinning)
and two AdSense placeholders.

**Not present** (checked every route and data file): time tracking beyond the
manual +/- hour tracker, contracts/e-signatures, proposals beyond the quote
generator, CRM/client records, project management, scheduling, expense
capture, payment processing, portfolio sites. The new desk adds a real timer
and a local client list; it does not pretend the other categories exist.

### Tech stack and design system

- Astro 7 static MPA, Preact 11 islands, Tailwind 4 (Vite plugin), TypeScript,
  Zod 4, Decimal.js, Vitest, Playwright, `@astrojs/sitemap`.
- Self-hosted Outfit Variable + DM Mono (62 KB of fonts, preloaded).
- Tokens in `src/styles/global.css`: canvas `#0a0d14`, surface `#131824`,
  accent `#2b7fff`, 1280 px container, pill buttons, 1.25rem card radius.
- Motion: hero entrance, card reveal, result rise; `prefers-reduced-motion`
  honoured. Container query and `:has()` already present but barely used.

### Current ad setup

`AdSlot.astro` had four formats (`top`, `inarticle`, `sidebar`, `end`) with
fixed reserved heights, IntersectionObserver lazy push, and a consent gate in
`BaseLayout`. The home page used only two slots (`top` and `end`). The consent
banner stored a two-value string (`all` / `essential`), had no Consent Mode v2
signals, no granular choices and no ad/viewability analytics.
`public/ads.txt` still carries a placeholder publisher ID. No ad network IDs
are configured in `.env`, so placeholders render.

### Internal usage data

There is no analytics, tag manager, server log or telemetry in the repository
(a search for `analytics`, `gtag`, `plausible`, `dataLayer`, `sendBeacon` found
only prose about privacy). **Ranking tools by internal usage is not possible.**
Tools are therefore ranked by (a) existing registry order, which already puts
Hourly Rate and Invoice first, and (b) external demand evidence below.

### Performance bottlenecks before the redesign

- Three Preact islands: `QuickEstimator` was `client:load`, the other two
  `client:idle`. Home shipped 49 KB of script (Lighthouse transfer total).
- A 7 KB `moment.css` was linked on the home page while the matching script was
  never mounted, and its pinned-chapters host was an empty visual container.
- Two preloaded fonts and an oversized hero meant first paint was text-first
  but the simulator occupied a large part of the first screen.

Baseline Lighthouse (mobile simulated, home): Performance 100 / LCP 0.9 s /
CLS 0 / TBT 0 ms / 144 KB total. Desktop: Performance 100 / LCP 0.3 s.

## Phase 2A: tools independent professionals use, by region

Ranked by breadth of corroborating sources, then regional fit. "Evidence"
summarises the published claim; it is not a market-share measurement unless
the source says so.

| Rank | Tool                  | Category                           | Region                             | Evidence                                                                                                                                          | Source                                                                                                                                                                                                               | Date              | Verification                                           |
| ---- | --------------------- | ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------ |
| 1    | QuickBooks Online     | Accounting / tax                   | North America, Europe, AU          | "Safest default, largest accountant and integration network" in a 14-tool comparison; accountant requirement repeatedly cited as a reason to stay | [Rework](https://resources.rework.com/tools/erp-finance/best-accounting-software-2026)                                                                                                                               | 2026-08-25        | Verified as widely recommended; exact share unverified |
| 2    | Wave                  | Free invoicing + bookkeeping       | North America                      | Free Starter with unlimited invoices/bookkeeping; long-tenured users in agency survey; Pro adds bank feeds                                        | [Rework](https://resources.rework.com/tools/erp-finance/best-accounting-software-2026), [The Admin Bar](https://theadminbar.com/the-best-invoicing-accounting-software-for-agencies/)                                | 2026, n.d.        | Verified                                               |
| 3    | FreshBooks            | Invoicing + time + expenses        | North America, Europe              | "Best invoicing UX"; 500K+ small businesses claimed by vendor; time tracking and client billing built in                                          | [FreshBooks](https://www.freshbooks.com/), [Rework](https://resources.rework.com/tools/erp-finance/best-accounting-software-2026)                                                                                    | accessed 2026-11  | Verified vendor claim; ranking directional             |
| 4    | Xero                  | Accounting                         | UK, EU, AU                         | Unlimited users on every plan; strong AU/NZ footprint                                                                                             | [Rework](https://resources.rework.com/tools/erp-finance/best-accounting-software-2026)                                                                                                                               | 2026-08-25        | Verified                                               |
| 5    | Zoho Books / Invoice  | Accounting + invoicing             | Europe, South Asia, SE Asia        | Free under $50K revenue; deep native CRM/Books/Inventory stack; most-mentioned tool in agency thread                                              | [Rework](https://resources.rework.com/tools/erp-finance/best-accounting-software-2026), [The Admin Bar](https://theadminbar.com/the-best-invoicing-accounting-software-for-agencies/)                                | 2026, n.d.        | Verified                                               |
| 6    | Bonsai                | Proposals + contracts + invoicing  | North America                      | Bundles proposals, contracts, invoicing and bookkeeping from $15/mo                                                                               | [Rework](https://resources.rework.com/tools/erp-finance/best-accounting-software-2026)                                                                                                                               | 2026-08-25        | Verified                                               |
| 7    | HoneyBook             | Client CRM + templates + invoicing | North America                      | All-in-one client lifecycle, template library, automated invoicing                                                                                | [HoneyBook](https://www.honeybook.com/blog/honeybook-vs-zoho-books)                                                                                                                                                  | accessed 2026-11  | Verified vendor claim                                  |
| 8    | Toggl Track           | Time tracking                      | Global                             | Positioned against FreshBooks on flexible entries and reports                                                                                     | [Timely](https://www.timely.com/blog/freshbooks-vs-toggl-track/)                                                                                                                                                     | 2026              | Verified presence; popularity rank unverified          |
| 9    | Stripe                | Card payments                      | NA, EU, SEA, LATAM                 | 2.9% + 30¢ US domestic card; instant receipt, 2-day payout; strongest for productised services                                                    | [Wise](https://wise.com/us/blog/payoneer-vs-stripe), [GoHireHumans](https://www.gohirehumans.com/blog/best-freelance-platforms-escrow.html)                                                                          | 2026-10           | Verified                                               |
| 10   | PayPal                | Payments                           | Global                             | Most universally recognised; ~3.49% + $0.49 US checkout, higher on international/currency conversion                                              | [Jobbers](https://www.jobbers.io/the-global-freelance-payment-methods-report-2026-how-freelancers-get-paid-in-50-countries/), [GoHireHumans](https://www.gohirehumans.com/blog/best-freelance-platforms-escrow.html) | 2026-02 / 2026-10 | Verified                                               |
| 11   | Wise                  | Cross-border receiving             | North America, Europe, APAC        | Mid-market rate, free local bank details in major currencies, ~0.3-2% total cost                                                                  | [Jobbers](https://www.jobbers.io/the-global-freelance-payment-methods-report-2026-how-freelancers-get-paid-in-50-countries/)                                                                                         | 2026-02-14        | Verified                                               |
| 12   | Payoneer              | Marketplace payouts                | South Asia, SE Asia, LATAM, Africa | Direct payouts from Upwork/Fiverr; strong where PayPal/Wise coverage is thin                                                                      | [Jobbers](https://www.jobbers.io/the-global-freelance-payment-methods-report-2026-how-freelancers-get-paid-in-50-countries/)                                                                                         | 2026-02-14        | Verified                                               |
| 13   | UPI                   | Domestic payments                  | South Asia (India)                 | 55% of India e-commerce in 2024; ~84% of India's electronic transactions                                                                          | [PCMI / Worldpay 2025](https://paymentscmi.com/insights/top-global-payment-methods/)                                                                                                                                 | 2025              | Verified                                               |
| 14   | PIX                   | Domestic payments                  | Latin America (Brazil)             | ~40% of Brazil e-commerce volume                                                                                                                  | [PCMI / Worldpay 2025](https://paymentscmi.com/insights/top-global-payment-methods/)                                                                                                                                 | 2025              | Verified                                               |
| 15   | M-Pesa / mobile money | Domestic payments                  | Africa                             | >90% penetration in Kenya; expanded to several countries                                                                                          | [PCMI / Worldpay 2025](https://paymentscmi.com/insights/top-global-payment-methods/)                                                                                                                                 | 2025              | Verified                                               |
| 16   | Deel                  | Contractor payments                | Global                             | Mentioned as a global contractor platform in payment comparisons; no usage share located                                                          | [comparison](https://nathanojaokomo.com/blog/payoneer-alternatives)                                                                                                                                                  | 2026-06           | **Unverified** for market position                     |

### Regional differences that changed the design

- **Payments:** North America leans ACH/card/PayPal; Europe SEPA + Wise/PayPal;
  India UPI; Brazil PIX; Africa mobile money and Payoneer; Middle East bank
  transfer with growing Wise/PayPal. ([Jobbers 2026](https://www.jobbers.io/the-global-freelance-payment-methods-report-2026-how-freelancers-get-paid-in-50-countries/), [PCMI 2025](https://paymentscmi.com/insights/top-global-payment-methods/))
- **Tax and e-invoicing:** US has no federal e-invoice mandate; EU ViDA was
  adopted 2025-03-11 and intra-EU B2B e-invoicing becomes mandatory 2030-07-01;
  Germany has required receiving since 2025-01-01 with issuing phased in
  2027/2028; India GST e-invoicing is threshold-based; Mexico CFDI 4.0 and
  Brazil NF-e/NFS-e use clearance models; UAE e-invoicing starts 2027.
  ([EU factsheets](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108874/eInvoicing+Country+Factsheets+for+each+Member+State+and+other+countries), [e-invoice.app 2026](https://www.e-invoice.app/blog/global-e-invoicing-compliance-2026), [vatcalc tracker](https://www.vatcalc.com/global/live-vat-gst-transaction-e-invoicing-global-tracker/))
- **Devices/connection:** no credible global dataset was located in the search
  window. The decision to stay mobile-first and lightweight is therefore a
  design choice, **unverified** as a regional measurement.

## Phase 2B: competitors and best-in-class patterns

| Product            | What makes it convenient / sticky                                                                     | Decision for this home page                                                                  | Verification                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| FreshBooks         | Invoicing and time tracking kept next to each other; automatic reminders                              | Put "New invoice" and "Start timer" side by side as quick actions                            | Verified from vendor + Rework                                                                               |
| Bonsai / HoneyBook | Proposal, contract, invoice and client in one chain                                                   | Hero speaks the full chain "price it, send it, get paid"; local client list starts the chain | Verified vendor comparison                                                                                  |
| Wave / Zoho        | Free entry tier removes sign-up friction                                                              | Keep every tool free and accountless; say it twice, not ten times                            | Verified                                                                                                    |
| Toggl              | One-click timer                                                                                       | Real start/stop timer in the desk, persisted locally                                         | Verified product positioning                                                                                |
| Linear             | Keyboard-first command palette; minimal chrome                                                        | Cmd/Ctrl+K, `/`, and keys 1/2/3 kept and surfaced on the first screen                        | **Unverified** (product observation, no cited study)                                                        |
| Stripe             | Crisp, quiet UI; one primary action per surface                                                       | One accent, one primary tile, hairline borders, tabular figures                              | **Unverified** (product observation)                                                                        |
| Notion             | Progressive disclosure; flexible blocks                                                               | Six compact dashboard tiles instead of one long form; "Preferences" hidden until asked       | **Unverified** (product observation)                                                                        |
| Duolingo           | Streaks with milestone animation (+1.7% 7-day retention) and "freezes" (+0.38% DAU) to reduce anxiety | Week dots and a gentle streak with no guilt copy; no loss threats                            | Verified: [Duolingo research post](https://blog.duolingo.com/how-duolingo-streak-builds-habit/), 2022-01-31 |
| Spotify            | "Continue where you left off" from recents                                                            | Recents/pins surfaced as the first lower tile                                                | **Unverified** (product observation)                                                                        |

## Phase 2C: ad monetisation research

| Finding                                                                                                                                                    | Evidence                                                                                                                 | Source                                                                                                                                                      | Date             | Verification                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------- |
| The most viewable position is near the bottom of the first screen, not the very top; just below the top nav beats top-of-page                              | Google's own viewability guidance: "right above the fold" has the highest viewability; too many ATF ads clutter the page | [Google AdSense, Viewability best practices](https://support.google.com/adsense/answer/6219980)                                                             | accessed 2026-11 | Verified                          |
| An impression is viewable at 50% of pixels for 1 s (IAB criterion)                                                                                         | Google AdSense definition                                                                                                | [Google AdSense](https://support.google.com/adsense/answer/6253177)                                                                                         | accessed 2026-11 | Verified                          |
| Sticky/anchor formats deliver the highest viewability of any format                                                                                        | Industry guide, directional claim                                                                                        | [Clickdudes](https://www.clickdudes.com/blog/best-ad-formats-website-monetization-2025)                                                                     | 2025             | Directional                       |
| Business/finance audiences command premium CPMs                                                                                                            | Finance $18-45 and business $14-35 CPM ranges (creator/video data, used only as a directional signal for intent)         | [OutlierKit](https://outlierkit.com/resources/youtube-niches-guide/), [Notelm](https://notelm.ai/blog/youtube-cpm-rates-2026)                               | 2026             | Directional, not display-specific |
| Tier-1 geos pay multiples of emerging markets                                                                                                              | US $10.50-16.80 vs India $0.80-2.40 in a 2026 CPM panel                                                                  | [Stackmatix](https://www.stackmatix.com/blog/facebook-ads-cpm-by-country-2026)                                                                              | 2026             | Directional, other platform       |
| Core Web Vitals thresholds: LCP <2.5 s, INP <200 ms, CLS good at <0.05; ads must reserve space                                                             | Publisher playbook + Google guidance                                                                                     | [Publift](https://www.publift.com/blog/ultimate-guide-to-core-web-vitals-for-publishers), [web.dev](https://web.dev/articles/cwv-impact-ad-revenue)         | 2026             | Verified                          |
| 85%+ of Raptive sites pass INP with full ad layouts when space is reserved                                                                                 | Raptive help centre                                                                                                      | [Raptive](https://help.raptive.com/hc/en-us/articles/23144519795099-Core-Web-Vitals-and-Raptive-Ads)                                                        | accessed 2026-11 | Verified vendor claim             |
| EEA/UK/CH personalised ads need a Google-certified CMP with IAB TCF; TCF v2.3 required for new TC strings from 2026-03-01; Consent Mode v2 for Google tags | Google policy + CMP documentation                                                                                        | [Google AdSense](https://support.google.com/adsense/answer/13554116), [Cookiebot](https://www.cookiebot.com/en/google-certified-cmp-requirement-cookiebot/) | 2024 / 2026      | Verified                          |
| Premium networks now have lower entry bars: Raptive 25K monthly views (50% tier-1 traffic), Mediavine ~$5K annual ad revenue, Ezoic no pageview minimum    | Network requirement roundup                                                                                              | [PPC Land](https://ppc.land/is-your-site-finally-ready-the-new-math-behind-premium-ad-network-approvals/)                                                   | 2025-10          | Verified secondary reporting      |
| AdSense has no published numeric density limit; policy requires ads be distinguishable from content and not push content down                              | AdSense placement policy and FAQs                                                                                        | [Google AdSense](https://support.google.com/adsense/answer/1282097), [policy FAQ](https://support.google.com/adsense/answer/3394713)                        | accessed 2026-11 | Verified                          |

**Conclusion for this site:** the audience is high-intent business/finance, so
RPM is driven by viewability and session depth, not by raw slot count. We use
five slots with exact reserved geometry, put the highest-value one just above
the fold, add one sticky desktop rail and one dismissible mobile anchor, and
never displace the four primary actions. The in-house consent banner is a safe
gate, **not** a Google-certified CMP: swap in a certified TCF 2.3 CMP before
serving personalised ads in the EEA, UK or Switzerland.

## Phase 2D: UX principles applied

| Principle              | Source                                                                                    | Application in the new home page                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hick's Law             | [NN/g](https://www.nngroup.com/articles/progressive-disclosure/) (progressive disclosure) | Four quick actions on screen one; advanced settings behind "Preferences" and the palette                                                                                                |
| Fitts's Law            | [NN/g](https://www.nngroup.com/articles/fitts-law/)                                       | Large 96px+ squircle tiles, 44px minimum controls, short distance from h1 to actions                                                                                                    |
| Progressive disclosure | [NN/g](https://www.nngroup.com/articles/progressive-disclosure/)                          | Six dashboard tiles with secondary detail; no long onboarding form                                                                                                                      |
| F / Z scanning         | [NN/g visual design](https://www.nngroup.com/articles/principles-visual-design/)          | h1 and lede left; actions right; primary accent on the first tile; section heads align to the same left edge                                                                            |
| Gestalt proximity      | [NN/g proximity](https://www.nngroup.com/videos/proximity-gestalt/)                       | Hours controls live inside the "This week" tile; payment and compliance copy sit with the region selector                                                                               |
| 8-pt grid              | Modular spacing tokens `--space-1..8`                                                     | All gutters, padding and tile sizes are 8px multiples                                                                                                                                   |
| Hook Model             | [Duolingo habit research](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)    | Trigger: today card. Action: log time or create a document. Reward: visible progress and a saved result. Investment: pins, recents, saved rate, local clients. No fake urgency or guilt |

## Decisions carried into the build

1. Lead with a four-tile action bar, not a long marketing hero.
2. Make "Today" a real dashboard of local state with honest empty states.
3. Region selects currency, payment hint, compliance note, palette order and
   country-tile order, persisted locally.
4. Keep the simulator as a working tool in the toolkit, not a hero ornament.
5. Five reserved ad slots, consent-gated and config-driven; measure RPM,
   viewability, CTR, session length and return rate together.
6. One squircle radius family and an 8-pt grid across every surface and ad box.
