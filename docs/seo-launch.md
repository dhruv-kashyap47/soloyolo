# SEO launch and monitoring

This is the post-deployment checklist for soloyolotools.com. The code-side
contract is covered by `tests/e2e/seo.spec.ts` and `tests/e2e/audit.spec.ts`;
this file covers the steps that happen after the build is live.

## Before deploying

1. Set `PUBLIC_SITE_URL` to the canonical origin (`https://soloyolotools.com`).
   Every canonical, sitemap entry, Open Graph URL and JSON-LD `@id` follows it.
2. If advertising is enabled, set `PUBLIC_ADSENSE_CLIENT`. Without consent the
   ad library must not load; with essential-only consent no ad script should run.
3. Run the release gate:

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   pnpm build
   pnpm test:e2e
   ```

4. Confirm the built HTML still has one `<h1>` per page, unique titles and
   descriptions, canonical URLs ending in `/`, and no `noindex` outside `/404/`.
5. Confirm `/robots.txt` allows crawling and points at
   `https://soloyolotools.com/sitemap.xml` (and the `/sitemap-index.xml` alias).
6. Confirm `/sitemap.xml` lists the 39 indexable pages and not the 404.
7. Confirm every page has exactly one Google tag (`GTM-NJMCB9BQ`), that
   production responses do not carry `X-Robots-Tag: noindex`, and that
   `https://soloyolo.pages.dev/` does.

## Deploy

1. Deploy the static `dist/` output to Cloudflare Pages.
2. Check the redirects in `public/_redirects` after deployment:
   - `/home` and `/home/` → `/`
   - `/privacy-policy/` → `/privacy/`
   - `/uk/vat-invoice/` → `/uk/vat-invoice-generator/`
   - the other documented legacy paths.
3. Request a non-existent path and confirm the custom 404 page returns a 404
   status and carries `noindex, nofollow`.

## Search Console

1. Verify the domain property for `soloyolotools.com`.
2. Submit `https://soloyolotools.com/sitemap.xml` (the index alias is also
   available at `/sitemap-index.xml`).
3. Inspect and request indexing for the priority pages:
   - `/`
   - `/calculators/`
   - `/generators/`
   - `/countries/`
   - the eight calculator pages
   - the four generator pages
   - the fifteen country invoice pages
4. Check **Pages** after the first crawl:
   - no important page is excluded by `noindex`;
   - no canonical points at a different URL;
   - no duplicate title or description warnings.
5. Submit the same sitemap to Bing Webmaster Tools.

## Rich results and social previews

1. Validate the JSON-LD on a calculator, a country page, the homepage and a
   generator with the Rich Results Test.
   Expected types:
   - `Organization` and `WebSite` sitewide;
   - `WebApplication` on the 27 tool and country pages;
   - `CollectionPage` with `ItemList` on `/calculators/`, `/generators/`,
     `/tools/`, `/countries/` and `/resources/`;
   - `BreadcrumbList` on every page with breadcrumbs;
   - `FAQPage` on every page with a visible FAQ;
   - `AboutPage` on `/about/`;
   - `ContactPage` on `/contact/`;
   - `HowTo` on the four generator pages.
2. Check social previews on the 17 core pages that use a custom card:
   - `/` → `/og/home.jpg`
   - `/tools/` → `/og/tools.jpg`
   - `/calculators/` → `/og/calculators.jpg`
   - `/generators/` → `/og/generators.jpg`
   - `/countries/` → `/og/countries.jpg`
   - the eight calculator pages → `/og/<tool>.jpg`
   - the four generator pages → `/og/<tool>.jpg`
3. Regenerate the cards after a visible title or descriptor change:

   ```bash
   pnpm og:generate
   ```

   Country, legal and informational pages keep the shared `/og.jpg`.

## Monitoring

Review monthly:

- **Coverage**: new exclusions, soft 404s, redirect errors.
- **Queries**: impressions and clicks by cluster (rate, project profit, margin,
  retainer, break-even, fees, tax, invoice, quote, receipt, reminder, country).
- **Core Web Vitals**: especially the homepage and the calculator pages.
- **Links**: 404s from external sites, and internal links that no longer resolve.
- **Metadata regression**: any title or description that becomes duplicated or
  missing.
- **Country sources**: re-check the verified dates on the country pages and the
  e-invoicing page. Tax rules change; a stale rate must not stay live.

## AI crawlers and answer engines

`/robots.txt` allows the public site to every crawler and names Googlebot,
Bingbot, Google-Extended, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
anthropic-ai, PerplexityBot, Perplexity-User, Applebot-Extended, Amazonbot and
the other common search/social crawlers explicitly. Nothing is blocked, so an
answer engine can fetch the static HTML, the FAQs, the worked examples and the
official-source pages. Important facts stay in server-rendered HTML; the
calculators add interactivity on top rather than hiding the explanations behind
JavaScript.

## Content rules to keep

- No income-tax or tax-set-aside calculator is shipped. The VAT/GST page
  explains that it handles indirect tax only. Do not add income-tax keywords to
  it without building and reviewing a real estimator.
- Do not create thin `[country] freelancer calculator` pages. Country pages
  exist only where there is real localized invoice or tax functionality.
- Do not add a public `/search/` page or `SearchAction` schema unless a real
  search URL is shipped. The command palette is client-side and has no URL.
- FAQ content and `FAQPage` markup must stay identical. Do not add an FAQ answer
  only to the JSON-LD.
- Keep the 17 core OG cards as the only custom social images unless a page gets
  its own card and route entry in `scripts/generate-og.mjs`.
- Legal and informational pages may be indexed; only the 404 is `noindex`.
