# Security policy

## Supported versions

This repository publishes a single static site from `main`. Only the current
`main` branch and the most recent production deployment are supported; older
deployments are rolled back to, not patched.

## Reporting a vulnerability

Please report suspected vulnerabilities privately, by email, to
**foundersoffice@soloyolotools.com**. Do not open a public issue for a
security problem.

Include, where you can:

- the affected URL or file and the version or commit;
- what you expected and what happened;
- a minimal reproduction (a screenshot or a curl command is fine);
- whether the issue exposes other visitors' data. This site has no accounts,
  no server-side storage of visitor data and no database, so most reports
  concern the static bundle, its headers or a supply-chain dependency.

We aim to acknowledge a report within 3 working days and to ship a fix or a
mitigation within 30 days for a confirmed high-severity issue. We will credit
you in the release notes if you want.

## Scope

In scope:

- the production site and its generated headers, CSP and redirects;
- the Preact/Astro bundle and the service worker (there is none today);
- the build scripts, CI workflows and dependency graph;
- any secret or personal data accidentally committed to this repository.

Out of scope:

- volumetric denial of service (report it to Cloudflare, which fronts the
  site, and to us for visibility);
- findings that require a compromised browser, extension or local machine;
- missing headers on a preview deployment that are present in production;
- automated scanner output without a demonstrated impact.

## Security controls in this repository

- **Static output.** The site is built to static HTML and served by Cloudflare
  Pages. There is no application server, database, session or account.
- **No visitor data leaves the browser.** Calculators, generators, the saved
  business profile and the document log use `localStorage` only. Analytics is
  the approved Google Tag Manager container, consent-gated through Consent
  Mode v2.
- **Strict CSP.** `scripts/build-headers.mjs` hashes every inline script and
  emits a policy with no `unsafe-inline` in `script-src`. Third-party ad/CMP
  origins are an explicit, captured allowlist in `config/third-party.json`
  (empty until a real capture, so ads fail closed).
- **Headers.** HSTS (preload), `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `frame-ancestors 'none'` and `X-Frame-Options: DENY`
  are generated into `dist/_headers`.
- **Dependency and secret scanning.** CI runs `pnpm audit --audit-level high`
  and `node scripts/check-secrets.mjs`. The same secret scan runs in the
  pre-commit hook.
- **Least privilege in CI.** Workflow tokens are read-only by default; only
  the deploy job receives `deployments: write`, and it consumes repository
  secrets through the `production` environment.

## Infrastructure-level controls

These are configured in Cloudflare and GitHub, not in this repository:

- TLS termination and HSTS at the edge; Cloudflare DDoS protection and WAF;
- a rate-limiting rule on `/` if scraping becomes material (the site is fully
  static, so this is an edge concern);
- branch protection requiring the CI and Security checks before merge;
- secret scanning and push protection enabled on the GitHub repository;
- alerting for the uptime workflow and for Cloudflare deployment failures.

## Rotating a secret

Secrets are never committed. If one is exposed in a log, an artifact or a
commit, a human must rotate it in the provider first, then remove it from the
working tree, then decide with the repository owner whether the history needs
rewriting. Removing a credential from the latest commit does not revoke it.
