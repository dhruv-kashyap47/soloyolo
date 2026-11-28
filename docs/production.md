# Production — Cloudflare Pages, headers, and launch runbook

Companion to [Phase 7 in `task.md`](../task.md). This file is the production
contract: what ships, how it is built, which values are still account-side, and
the exact order for turning ads and the CMP on.

Last updated: 2026-11-28.

## Live production

- **URL:** <https://soloyolotools.com> (apex) and `www` (301 to apex).
- **First deployment:** `391c7dea-0a5d-4ca2-acea-93a701a679e7`,
  2026-11-28T07:24:08Z, production, commit `ba205de`.
- **Certificate and domain:** both Pages custom domains are `active`.
- **Uptime probe:** green on 9 routes; `Uptime` workflow manually verified.
- **Production browser smoke:** `/`, the hourly-rate calculator, the invoice
  generator, `/contact/` and `/privacy/` load with 200, the production
  canonical, 0 unapproved third-party origins and 0 CSP violations. The only
  third-party hosts are the approved consent-gated Google tag hosts in
  `config/analytics.json`.
- **Email:** `foundersoffice@soloyolotools.com` forwards to the verified
  `foundersoffice+soloyolotools@proton.me`.
- **Lighthouse, ad-free production:** 100/100/100/100 on five routes; mobile
  median of 3 with LCP 1.07–1.36 s, TBT ≤ 19 ms and CLS 0; desktop LCP
  0.40–0.49 s; transfer 146–222 KB. This is the pre-ad baseline; P7-18 sets the
  ad-enabled threshold.

Cloudflare serves the static build from its global edge network. There is no
geo restriction and no per-country deployment; the eight market guides and the
international fallback are content, not separate hosts.

## Analytics and the approved Google tag

`GTM-NJMCB9BQ` is loaded once by `src/components/analytics/GoogleTag.astro` in
`BaseLayout`, immediately after `<head>`. It is the official Tag Manager
container snippet (including the `gtm.start` push), not a bare `gtag.js`
include: the container is what initialises the GA4 destination
`G-XTBSGSTR60`.

Consent Mode v2 is sent in the head with `ad_storage`, `ad_user_data`,
`ad_personalization` and `analytics_storage` denied. The in-house banner sends
the matching update only when the visitor chooses _Accept all_ or
_Anonymous measurement_; _Essential only_ leaves all storage denied.

Approved runtime origins are kept in `config/analytics.json`:

- `https://www.googletagmanager.com` — container and `gtag/js` loader
  (`script-src`; also allowed for connect/image beacons).
- `https://www.google-analytics.com` and `https://*.google-analytics.com` —
  GA4 `/g/collect` (`connect-src` and `img-src`).

`scripts/check-no-beacon.mjs` still fails the build on any other measurement
SDK or a direct `gtag/js` include. The network tests allow only these hosts and
still fail on every unapproved origin.

The generated `_headers` also detaches `X-Robots-Tag` on the apex and `www`
hosts and sets `index, follow`:

```
https://soloyolotools.com/*
  ! X-Robots-Tag
  X-Robots-Tag: index, follow
https://www.soloyolotools.com/*
  ! X-Robots-Tag
  X-Robots-Tag: index, follow
```

A copied `https://:project.pages.dev/*` noindex rule therefore cannot leak onto
the public domain. Preview deployments may keep their own host-scoped noindex.

## Status snapshot

| Task                 | Status      | What exists                                                                                                                                                               | What is still needed                                |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| P7-01 Pages project  | Done        | Project `soloyolo`, `wrangler.jsonc`, pinned build command, `dist` output, deploy job, active zone, apex/`www` custom domains                                             | Nothing                                             |
| P7-02 site URL       | Done        | `PUBLIC_SITE_URL` drives canonical/OG/sitemap; post-build check; live canonical verified                                                                                  | Nothing                                             |
| P7-03 headers        | Partial     | `_headers` generated per build: CSP with inline-script hashes, approved Google tag hosts, HSTS, nosniff, referrer, permissions, COOP, frame denial, immutable asset cache | CSP ad/CMP origins wait for P7-14                   |
| P7-04 redirects      | Done        | `public/_redirects` + directory output                                                                                                                                    | Verify on the live domain                           |
| P7-05 CI             | Done        | PR checks + deploy job + manual Deploy workflow + uptime; `main` protected; secrets and variables set                                                                     | Nothing                                             |
| P7-06 measurement    | Done        | Approved consent-gated GTM container; unapproved SDK/beacon build check; local-only event buffer; zone `disable_rum` rule stops Cloudflare's automatic beacon             | Keep `PUBLIC_CWA_TOKEN` empty                       |
| P7-07 consent        | Blocked     | In-house banner sends Consent Mode v2 updates for analytics and ads                                                                                                       | Google CMP configured in AdSense                    |
| P7-08 Search Console | Blocked     | Steps below; the zone is active                                                                                                                                           | The Google account and the DNS TXT verification     |
| P7-09 monitoring     | Done        | `scripts/uptime-probe.mjs`, `.github/workflows/uptime.yml`; `PRODUCTION_URL` set and the workflow green                                                                   | Nothing                                             |
| P7-10 post-launch    | In progress | Checklist below; first-hour and first-day server checks passed                                                                                                            | Remaining manual items in `docs/runbook.md`         |
| P7-11…P7-14 ads      | Partial     | Allowlist contract, capture script, P6-11b–f harness                                                                                                                      | AdSense approval, publisher/slot ids, real capture  |
| P7-15 privacy        | Partial     | Analytics disclosure and consent-gated cookie wording added                                                                                                               | Ad/CMP wording still changes with P7-07/P7-11/P7-12 |
| P7-16 contact        | Done        | Real address, copy button, `mailto:`; Email Routing enabled; `foundersoffice@soloyolotools.com` forwards to the verified `foundersoffice+soloyolotools@proton.me`         | Send one external test message                      |
| P7-17 legal          | Blocked     | —                                                                                                                                                                         | Qualified human review                              |
| P7-18 Lighthouse     | Prepared    | `LIGHTHOUSE_URL`, `LIGHTHOUSE_MOBILE_RUNS`, `LIGHTHOUSE_MIN_PERF`                                                                                                         | Measure the ad-enabled build, record the threshold  |
| P7-19 Quebec         | Blocked     | No Quebec claim anywhere                                                                                                                                                  | Verify CMP targeting                                |
| P7-20 staging        | Blocked     | —                                                                                                                                                                         | Manual regional consent verification                |
| P7-21 CWA            | Deferred    | Off; no beacon in the build                                                                                                                                               | Optional gate below                                 |
| P7-22 density        | Post-launch | —                                                                                                                                                                         | New plan §21 decision                               |

## Environments and variables

| Variable                          | Where                          | Value / rule                                          |
| --------------------------------- | ------------------------------ | ----------------------------------------------------- |
| `PUBLIC_SITE_URL`                 | GitHub variable + local `.env` | `https://soloyolotools.com` (no trailing slash)       |
| `PUBLIC_ADSENSE_CLIENT`           | GitHub variable                | `ca-pub-…` when approved; empty today                 |
| `PUBLIC_ADSENSE_SLOT_LEADERBOARD` | GitHub variable                | one responsive unit id                                |
| `PUBLIC_ADSENSE_SLOT_INFEED`      | GitHub variable                | one responsive unit id                                |
| `PUBLIC_ADSENSE_SLOT_SIDEBAR`     | GitHub variable                | one responsive unit id                                |
| `PUBLIC_ADSENSE_SLOT_ANCHOR`      | GitHub variable                | one responsive unit id                                |
| `PUBLIC_ADSENSE_SLOT_END`         | GitHub variable                | one responsive unit id                                |
| `DEPLOY_ENABLED`                  | GitHub variable                | `true` only when the deploy job should run            |
| `PRODUCTION_URL`                  | GitHub variable                | `https://soloyolotools.com` for the uptime probe      |
| `CLOUDFLARE_API_TOKEN`            | GitHub secret                  | Pages:Edit for the one account                        |
| `CLOUDFLARE_ACCOUNT_ID`           | GitHub secret                  | `c50c0cc04ad6e0bfea4db65b2b615b69`                    |
| `PUBLIC_CWA_TOKEN`                | nowhere                        | stays empty; Cloudflare automatic injection stays off |

No secret is read by the browser. Ad ids are public by design; they are stored
as repository variables, not secrets.

## Deploy

The Pages project is `soloyolo`; the production branch is `main`; the build is
`pnpm build`; the output directory is `dist`. A direct-upload Pages project is
used, so GitHub Actions is the single deploy path (do not also connect the Git
integration, or a push deploys twice).

1. Create the project once (dashboard or API) with build command `pnpm build`,
   output `dist`, production branch `main`, Node 24, pnpm 11.15.0.
2. Create a custom API token at
   <https://dash.cloudflare.com/profile/api-tokens> with **Account →
   Cloudflare Pages → Edit** and no other permission. The Cloudflare MCP OAuth
   session cannot mint tokens; this one step must be done in the dashboard.
   Store it as the `CLOUDFLARE_API_TOKEN` repository secret. The
   `CLOUDFLARE_ACCOUNT_ID` secret is already set to
   `c50c0cc04ad6e0bfea4db65b2b615b69`. The token must be **Edit**, not Read:
   Read lists projects but returns 403 on
   `POST /pages/projects/soloyolo/upload-token`, which is the write that starts
   a deployment.
3. Add `PUBLIC_SITE_URL` (set), the ad variables (empty until approved), and
   `DEPLOY_ENABLED=true` (after the token exists) as repository variables.
   `PRODUCTION_URL` is set when the domain is live, not before, so the uptime
   cron does not fail on a pending zone.
4. Push to `main`. `verify` must pass before `deploy`; the deploy job runs
   `pnpm build`, `node scripts/check-production-build.mjs`, then
   `wrangler pages deploy dist --project-name=soloyolo --branch=main`.
   For a redeploy without the full suite, run the **Deploy** workflow:
   `gh workflow run Deploy --ref main`.
5. The zone `soloyolotools.com` is **active** on
   `newt.ns.cloudflare.com` / `sloan.ns.cloudflare.com` (activated 2026-11-28).
   The apex and `www` CNAME records point at `soloyolo.pages.dev` (proxied),
   both are attached as Pages custom domains, and a zone Page Rule redirects
   `www` to the apex with a 301. Do not launch on `*.pages.dev`.

Local equivalent:

```bash
PUBLIC_SITE_URL=https://soloyolotools.com pnpm build
node scripts/check-production-build.mjs
node scripts/uptime-probe.mjs   # only after PRODUCTION_URL points at the deploy
```

Manual rollback: Pages → project `soloyolo` → Deployments → select the last good
deployment → **Rollback to this deployment**. API equivalent:
`POST /accounts/{account_id}/pages/projects/soloyolo/deployments/{id}/rollback`.
Record the deployment id and the reason in the incident note.

## Headers and CSP (P7-03)

`pnpm build` ends in `scripts/postbuild.mjs`, which writes `dist/_headers`.
The CSP has no `'unsafe-inline'` in `script-src`: every inline script is hashed
from the built HTML, and external bundles are allowed by `'self'`.

```
script-src 'self' 'sha256-…' https://www.googletagmanager.com …captured ad/CMP origins
style-src 'self' 'unsafe-inline' …captured ad/CMP origins
img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com …captured ad/CMP origins
connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com …captured ad/CMP origins
frame-src …captured ad/CMP origins, or 'none' while the list is empty
frame-ancestors 'none'; form-action 'self'; object-src 'none'
```

The Google tag origins come from `config/analytics.json`. The ad/CMP origins
come only from `config/third-party.json`, which is empty today, so an
accidentally enabled ad tag is blocked rather than silently allowed. After
P7-14, the same ad/CMP list feeds the CSP and the P6-11b–f harness.

All responses also get:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` denying camera, microphone, geolocation, payment, USB …
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- `X-Frame-Options: DENY`

Zone-level transport settings: **Always Use HTTPS on**, **Minimum TLS 1.2**,
**SSL/TLS Full (strict)**. Email Obfuscation is off because it rewrites the
visible `mailto:` address into a `/cdn-cgi/l/email-protection` link and breaks
the contact copy button.

`/_astro/*` and `/fonts/*` are immutable for a year. HTML is not served with a
long cache, so a rollback is immediate.

Verify after the first deploy:

```bash
curl -sI https://soloyolotools.com/ | grep -iE 'content-security-policy|strict-transport|x-content-type|referrer-policy|permissions-policy'
curl -sI https://soloyolotools.com/_astro/ | grep -i cache-control
curl -sI https://soloyolotools.com/about | grep -i location   # expect /about/
```

If a CSP change is needed, change `scripts/lib/csp.mjs` (or the captured
allowlist), rebuild, and check the browser console for violations before
deploying. Never add a bare wildcard to make an ad script work.

Zone features that inject their own script stay **off**: Rocket Loader, Email
Obfuscation and automatic Web Analytics. They would be blocked by the CSP, and
the last one is outside D-20/D-22 measurement policy.

Cloudflare enables Web Analytics automatic setup by default for proxied sites.
On this zone it was still injecting `static.cloudflareinsights.com` even though
the RUM setting was off, so the CSP logged a violation and the beacon counted
as a third-party request. The fix is a zone Configuration Rule:

```
phase: http_config_settings
action: set_config
action_parameters: { "disable_rum": true }
expression: "true"
```

The rule is named **“Disable Web Analytics injection (D-22)”**
(`770e3f71b13b46f187266cc7630091f9`). Keep it in place; verify with
`pnpm smoke:production` or the P6-11f check that no `cloudflareinsights.com`
request appears.

## Redirects and trailing slashes (P7-04)

Astro uses `trailingSlash: 'always'` with directory output. Cloudflare Pages
serves `/about/index.html` for `/about` and redirects to `/about/`.
`public/_redirects` holds permanent legacy guesses (`/privacy-policy/`,
`/terms-of-service/`, `/about.html`, old country spellings). The unknown-path
response is the static `/404.html`, which is `noindex`.

`www` → apex is a zone-level redirect rule, not a Pages rule. Add it when the
domain is in the account:

```
https://www.soloyolotools.com/*  →  https://soloyolotools.com/$1  301
```

## Search Console (P7-08)

1. Add a **Domain property** for `soloyolotools.com`.
2. Verify with the DNS TXT record (Cloudflare DNS), not a meta tag, so preview
   deployments do not need a token.
3. Submit `https://soloyolotools.com/sitemap.xml` (and optionally the
   `/sitemap-index.xml` alias).
4. Confirm `robots.txt` points at the same sitemap and that the sitemap contains
   only the production origin (`check-production-build.mjs` enforces this).
5. Do not add a verification meta tag. The only client script is the approved,
   consent-gated Google tag in `config/analytics.json`; any other measurement
   SDK fails `pnpm check:no-beacon`.

## Email routing (P7-16)

The public address stays `foundersoffice@proton.me`. For a distinguishable
route, Cloudflare Email Routing is enabled on the active zone:

- Destination: `foundersoffice+soloyolotools@proton.me` (verified 2026-11-28).
- Custom address: `foundersoffice@soloyolotools.com` forwards to that
  destination.

The recipient sees `foundersoffice@soloyolotools.com` in the To line, so the
message is distinguishable from other mail. The remaining check is one external
test message confirming delivery and reply-to.

## Ads and the Google CMP (P7-11 … P7-15, P7-20)

The ad-free build is policy-safe today. Turning ads on is one ordered change;
do not split it across commits.

### 1. Account-side setup

- AdSense site approved for `soloyolotools.com`; publisher id in the form
  `ca-pub-…`; `public/ads.txt` line uses the matching `pub-…` id.
- Create a responsive display unit for each active slot type (leaderboard,
  infeed, sidebar, anchor, end). The task text says “four slot ids”; the current
  config has five placement types, so create one for every type that remains
  enabled on the home and tool pages.
- AdSense → **Privacy & messaging** → GDPR message: Google-certified CMP,
  opt-in for EEA/UK/CH. Configure US state messaging where AdSense supports it
  (opt-out). Leave Canada on the CMP default (today: no message) and make no
  Quebec claim (P7-19).
- Confirm the CMP's server-side geolocation; there is no custom geo code.

### 2. Build and capture

```bash
PUBLIC_SITE_URL=https://staging.soloyolotools.com \
PUBLIC_ADSENSE_CLIENT=ca-pub-… \
PUBLIC_ADSENSE_SLOT_LEADERBOARD=… \
PUBLIC_ADSENSE_SLOT_INFEED=… \
PUBLIC_ADSENSE_SLOT_SIDEBAR=… \
PUBLIC_ADSENSE_SLOT_ANCHOR=… \
PUBLIC_ADSENSE_SLOT_END=… \
pnpm build

# deploy the staging build, then:
CAPTURE_BASE_URL=https://staging.soloyolotools.com pnpm capture:third-parties
CAPTURE_BASE_URL=https://staging.soloyolotools.com CAPTURE_CONSENT=accept \
  pnpm capture:third-parties
```

The report lands in `.tmp-audit/third-party-capture-*.json`. Classify the cold
origins (including the AdSense/Publisher tag that deploys the CMP) into `cmp`
and the post-consent origins into `adStack` in `config/third-party.json`, with
`capturedOn` set to the capture date. Never type an origin from memory.

### 3. Tag-as-bootstrap and consent

D-25 says the AdSense/Publisher tag is the CMP loader: it loads for every
visitor and the CMP gates every ad request. The current code is the opposite —
it loads AdSense only after the in-house banner’s “Accept all”. The switch
touches three files and must land together with the privacy rewrite:

- `src/components/layout/BaseLayout.astro` — inject the AdSense tag for every
  visitor when `PUBLIC_ADSENSE_CLIENT` is set (no local-consent gate, no
  slot-present check); keep it async/deferred so it never blocks paint.
- `src/components/ads/AdSlot.astro` — push each slot without waiting for the
  local `soloyolo-consent` value; the Google CMP, not our banner, decides
  whether the request may run. Do not show the mobile anchor until a consent
  signal exists.
- `src/components/ads/ConsentBanner.astro` / `BaseLayout` — stop rendering the
  in-house banner when the Google CMP is live, so two dialogs never compete.

Then update `src/pages/privacy/index.astro` in the same commit (P7-15): the
consent tool loads for every visitor and decides whether to ask; where consent
is required no advertising request happens before the choice; measurement is
the approved consent-gated Google tag plus AdSense reporting; invoice and tax
data never leave the browser; do not mention CWA while the flag is off; keep the
no-Quebec-claim boundary.

### 4. Prove it before launch

```bash
STAGING_URL=https://staging.soloyolotools.com \
ADS_CONSENT_E2E=1 \
pnpm test:e2e --project=desktop-chromium tests/e2e/network-consent.spec.ts
```

P6-11b–f must be green: cold load = site + CMP only; reject = site + CMP and no
ad origin; accept = site + CMP + ad stack; blocked CMP = no ad origin; no
Cloudflare beacon in any state. P7-20 repeats the same states on real devices
from EEA/UK/CH, US/AU and an undetermined region; that check cannot be
automated locally.

### 5. Ad-enabled Lighthouse (P7-18)

After ads are live on the production-equivalent build:

```bash
LIGHTHOUSE_URL=https://staging.soloyolotools.com \
LIGHTHOUSE_MOBILE_RUNS=5 \
LIGHTHOUSE_MIN_PERF=<median from the first five runs> \
pnpm perf:lighthouse
```

Record the median and the chosen threshold in `docs/phase-6-audit.md` and set
`LIGHTHOUSE_MIN_PERF` in CI. Do not use a 100/100 gate; D-24 asks for a
threshold that reflects the ad-enabled median.

## Optional Cloudflare Web Analytics (P7-21)

Not part of launch. It may only be enabled when research A passes, the beacon is
inserted after the consent check, its origin is added to the allowlist and CSP,
a CWA variant of P6-11d passes, and the privacy text changes in the same commit.
Until all five are true, the flag stays empty and the build check rejects the
beacon.
