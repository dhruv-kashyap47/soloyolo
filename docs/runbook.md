# Operations runbook — launch, monitoring, rollback

Last updated: 2026-11-28. Companion to [`docs/production.md`](production.md)
and Phase 7 in [`task.md`](../task.md).

## Monitoring (P7-09)

The site ships only the approved Google tag (`config/analytics.json`), and the
tag is not requested until a visitor explicitly accepts analytics. There is no
other browser monitoring SDK. Server-side checks remain the source of truth for
uptime. Analytics reporting covers consenting visitors only; treat a drop in
GA4 sessions alongside the consent acceptance rate, not as an outage signal.

| Check                      | Where                            | Frequency           | Failure means                                                     |
| -------------------------- | -------------------------------- | ------------------- | ----------------------------------------------------------------- |
| `scripts/uptime-probe.mjs` | GitHub Actions `Uptime` workflow | every 15 minutes    | a representative page, crawler file or security header is missing |
| CI `verify`                | GitHub Actions on every push/PR  | per change          | typecheck, lint, unit, build, e2e regression                      |
| Search Console             | manual dashboard                 | weekly at first     | indexing or manual-action notice                                  |
| AdSense reporting          | manual dashboard                 | weekly after launch | revenue/coverage anomaly, not a site outage                       |

The probe checks `/`, `/tools/`, the hourly-rate calculator, the invoice
generator, `/countries/`, `/privacy/`, `robots.txt`, `sitemap.xml` and
`ads.txt`, plus the CSP/HSTS/nosniff/referrer/permissions headers on `/`. It
retries once after 2 seconds and exits non-zero on failure, so a red workflow is
the alert. Enable GitHub notifications for the repository; no pager is required
for a static content site.

The probe is configured with the repository variable `PRODUCTION_URL`
(`https://soloyolotools.com`). The first manual run was green in 9 seconds on
2026-11-28; the workflow now runs every 15 minutes.

Run the probes locally:

```bash
PRODUCTION_URL=https://soloyolotools.com pnpm uptime
PRODUCTION_URL=https://soloyolotools.com pnpm smoke:production
```

What is deliberately not monitored: client-side JavaScript errors, Core Web
Vitals field data, and individual user sessions. The approved Google tag
receives consent-gated measurement only; there is no first-party endpoint for
those events (D-20, D-21).

## Rollback

Every deploy is a Pages deployment with an id. A rollback is instant and does
not require a rebuild.

1. Open Cloudflare dashboard → Workers & Pages → `soloyolo` → Deployments.
2. Identify the last known-good production deployment (date, commit).
3. **Rollback to this deployment**.
4. Run `PRODUCTION_URL=https://soloyolotools.com pnpm uptime`.
5. Load `/`, one calculator and one generator; confirm the tool works and the
   console is clean.
6. Record the incident: time, symptom, deployment id rolled back to, suspected
   commit, follow-up.

API path, when a token is available:

```
GET  /accounts/{account_id}/pages/projects/soloyolo/deployments
POST /accounts/{account_id}/pages/projects/soloyolo/deployments/{deployment_id}/rollback
```

A code fix after a rollback goes through the normal `main` → `verify` → `deploy`
path. Do not hot-edit `dist/`.

## Incident checklist

- **Site down / 5xx**: check the Pages project status and the latest deployment;
  roll back if the deploy correlates. If Pages is healthy, check the zone and
  DNS. The uptime workflow confirms which routes fail.
- **Wrong content or broken tool**: roll back first, diagnose second. The tool
  output is deterministic; a wrong figure is a launch-blocking bug (§18), not a
  cosmetic issue.
- **Ads serving without consent**: disable the ad client variable and redeploy
  immediately, then follow P7-20 and the CMP audit. Do not “fix” it by editing
  privacy text.
- **CSP violation after enabling ads**: the capture was incomplete. Turn ads off,
  re-run P7-14, and update only the captured origins.
- **Cloudflare beacon appears**: Cloudflare turns Web Analytics automatic setup
  on by default for proxied sites. The zone must keep the Configuration Rule
  **“Disable Web Analytics injection (D-22)”** (`http_config_settings` →
  `set_config` → `disable_rum: true`). If a new zone is added, recreate the rule
  before launch; the CSP will block the beacon but the request still counts as
  third-party and logs a console error.
- **Unexpected third-party request**: treat it as a supply-chain incident.
  `tests/e2e/network.spec.ts` and P6-11b–f define the contract. The only allowed
  third-party hosts are the approved Google tag origins in
  `config/analytics.json`; everything else must fail closed.
- **Google tag requested before consent**: a regression in
  `GoogleTag.astro` or the consent banner. Check that no `dataLayer` exists and
  no `gtm.js` request is made before _Accept analytics_; the e2e
  `analytics-consent.spec.ts` is the contract. Roll back the deploy if the tag
  is loading for declined visitors.
- **Search Console manual action**: do not change tools or claims in response;
  record the notice, review the affected URLs, and fix the content source.

## Post-launch checklist (P7-10)

Run after the first production deploy, in order. Record the date and result in
`task.md`.

### First hour

- [x] `https://soloyolotools.com/` returns 200 over HTTPS; `www` redirects to
      the apex.
- [x] CSP/HSTS/nosniff/referrer/permissions headers present on `/` and a tool
      page (`scripts/uptime-probe.mjs`).
- [x] `/sitemap.xml`, `/sitemap-index.xml` and `/robots.txt` use the production
      origin.
- [ ] `/404.html` is served for an unknown path and is `noindex`.
- [ ] One calculator, one generator, quote/reminder/receipt previews and a real
      print/PDF work on desktop and a phone.
- [ ] Theme toggle, mobile menu and Cmd/Ctrl+K palette work.
- [x] No console errors or unapproved third-party origins; only the approved
      Google tag hosts may appear (production browser smoke on `/`, calculator
      and generator).
- [x] `ads.txt` matches the publisher id, or still carries the documented
      placeholder while ads are off.

### First day

- [ ] Search Console domain verified; sitemap submitted and readable.
- [x] Uptime workflow green with `PRODUCTION_URL` set.
- [ ] Email Routing alias receives and forwards mail; the contact copy button
      and `mailto:` both work.
- [ ] Privacy, terms and disclaimer show the real operator/address and match
      shipped behaviour.
- [x] Cloudflare automatic Web Analytics injection is off; no Cloudflare beacon
      request (production smoke: only the approved Google tag hosts).
- [ ] A Pages rollback to the previous deployment was rehearsed (then rolled
      forward again).

### First week

- [ ] Search Console: pages discovered/indexed; no manual actions.
- [ ] Core Web Vitals field data appears, if any; no regression against the
      P7-18 lab threshold. The ad-free production baseline is 100/100/100/100,
      mobile LCP 1.07–1.36 s and CLS 0.
- [ ] 404 log review: add redirects for any real legacy hits.
- [ ] AdSense coverage/revenue reviewed once ads are live; no policy notice.
- [ ] Re-read the launch-blocking register below; every item is closed or
      explicitly accepted.

## Launch-blocking register

| ID   | Item                                              | Closes with | Status 2026-11-28                                                                                        |
| ---- | ------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| T-15 | Real contact address                              | P7-16       | Address, copy button and `mailto:` shipped; Email Routing alias live, one external delivery test pending |
| T-16 | Real AdSense client and slot ids + `ads.txt` line | P7-11       | Open — account approval                                                                                  |
| T-17 | Google-certified CMP (EEA/UK/CH)                  | P7-12       | Open — account configuration                                                                             |

Nothing in this repository can close T-16/T-17. They need the AdSense account,
the domain in Cloudflare, and the account-side CMP message. The code and test
harness are ready (P7-14 capture, allowlist, P6-11b–f).
