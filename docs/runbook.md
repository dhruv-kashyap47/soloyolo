# Operations runbook — launch, monitoring, rollback

Last updated: 2026-11-28. Companion to [`docs/production.md`](production.md)
and Phase 7 in [`task.md`](../task.md).

## Monitoring (P7-09)

The site ships no browser monitoring SDK. Checks are server-side only.

| Check                      | Where                            | Frequency           | Failure means                                                     |
| -------------------------- | -------------------------------- | ------------------- | ----------------------------------------------------------------- |
| `scripts/uptime-probe.mjs` | GitHub Actions `Uptime` workflow | every 15 minutes    | a representative page, crawler file or security header is missing |
| CI `verify`                | GitHub Actions on every push/PR  | per change          | typecheck, lint, unit, build, e2e regression                      |
| Search Console             | manual dashboard                 | weekly at first     | indexing or manual-action notice                                  |
| AdSense reporting          | manual dashboard                 | weekly after launch | revenue/coverage anomaly, not a site outage                       |

The probe checks `/`, `/tools/`, the hourly-rate calculator, the invoice
generator, `/countries/`, `/privacy/`, `robots.txt`, `sitemap-index.xml` and
`ads.txt`, plus the CSP/HSTS/nosniff/referrer/permissions headers on `/`. It
retries once after 2 seconds and exits non-zero on failure, so a red workflow is
the alert. Enable GitHub notifications for the repository; no pager is required
for a static content site.

Configure the probe with the repository variable `PRODUCTION_URL`. Until it is
set, the workflow skips instead of failing.

Run it locally:

```bash
PRODUCTION_URL=https://soloyolotools.com pnpm uptime
```

What is deliberately not monitored: client-side JavaScript errors, Core Web
Vitals field data, and individual user sessions. There is no endpoint that
receives them (D-20, D-21).

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
- **Unexpected third-party request**: treat it as a supply-chain incident.
  `tests/e2e/network.spec.ts` (ad-free build) and P6-11b–f (ad build) define the
  contract; the build must fail closed.
- **Search Console manual action**: do not change tools or claims in response;
  record the notice, review the affected URLs, and fix the content source.

## Post-launch checklist (P7-10)

Run after the first production deploy, in order. Record the date and result in
`task.md`.

### First hour

- [ ] `https://soloyolotools.com/` returns 200 over HTTPS; `www` redirects to
      the apex.
- [ ] CSP/HSTS/nosniff/referrer/permissions headers present on `/` and a tool
      page (`scripts/uptime-probe.mjs`).
- [ ] `/sitemap-index.xml` and `/robots.txt` use the production origin.
- [ ] `/404.html` is served for an unknown path and is `noindex`.
- [ ] One calculator, one generator, quote/reminder/receipt previews and a real
      print/PDF work on desktop and a phone.
- [ ] Theme toggle, mobile menu and Cmd/Ctrl+K palette work.
- [ ] No console errors or third-party origins on the ad-free build.
- [ ] `ads.txt` matches the publisher id, or still carries the documented
      placeholder while ads are off.

### First day

- [ ] Search Console domain verified; sitemap submitted and readable.
- [ ] Uptime workflow green with `PRODUCTION_URL` set.
- [ ] Email Routing alias receives and forwards mail; the contact copy button
      and `mailto:` both work.
- [ ] Privacy, terms and disclaimer show the real operator/address and match
      shipped behaviour.
- [ ] Cloudflare automatic Web Analytics injection is off; no beacon request.
- [ ] A Pages rollback to the previous deployment was rehearsed (then rolled
      forward again).

### First week

- [ ] Search Console: pages discovered/indexed; no manual actions.
- [ ] Core Web Vitals field data appears, if any; no regression against the
      P7-18 lab threshold.
- [ ] 404 log review: add redirects for any real legacy hits.
- [ ] AdSense coverage/revenue reviewed once ads are live; no policy notice.
- [ ] Re-read the launch-blocking register below; every item is closed or
      explicitly accepted.

## Launch-blocking register

| ID   | Item                                              | Closes with | Status 2026-11-28                                                                       |
| ---- | ------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| T-15 | Real contact address                              | P7-16       | Address, copy button and `mailto:` shipped; the Email Routing alias waits on the domain |
| T-16 | Real AdSense client and slot ids + `ads.txt` line | P7-11       | Open — account approval                                                                 |
| T-17 | Google-certified CMP (EEA/UK/CH)                  | P7-12       | Open — account configuration                                                            |

Nothing in this repository can close T-16/T-17. They need the AdSense account,
the domain in Cloudflare, and the account-side CMP message. The code and test
harness are ready (P7-14 capture, allowlist, P6-11b–f).
