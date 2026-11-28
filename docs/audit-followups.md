# Audit follow-ups — human-owned decisions

This file collects work that is intentionally **not** automated in the repo:
settings that live in GitHub/Cloudflare, legal or tax sign-off, and changes
that need an owner decision. Update the owner column when a task is taken.

## 1. GitHub repository settings

These cannot be applied from a file in the repository.

- [ ] Require the `CI` and `Security` checks on `main` before merge.
- [ ] Enable secret scanning **and push protection**.
- [ ] Enable Dependabot security updates (version updates are already configured
      in `.github/dependabot.yml`).
- [ ] Restrict force-pushes to `main`.
- [ ] Add required reviewers to the `production` environment so the manual
      **Deploy** workflow and the deploy job cannot run without a human.
- [ ] Limit who can create/approve deployments and who can edit workflow files.

Owner: _unassigned_ — target: before the next production deploy.

## 2. Ads/CMP go-live checklist (do not enable ads yet)

- [ ] Choose a Google-certified TCF 2.3 CMP for EEA/UK/CH personalised ads. The
      in-house analytics banner is **not** a certified CMP.
- [ ] Populate `config/third-party.json` only from a real
      `node scripts/capture-third-parties.mjs` capture; never transcribe
      origins from memory.
- [ ] Replace the placeholder in `public/ads.txt` with the real publisher id.
- [ ] Add the ad grant to the consent model as its own choice; the current model
      deliberately has no ad grant and keeps ad storage denied.
- [ ] Re-run `pnpm check:csp`, the network tests and the staging consent harness
      (`STAGING_URL=… ADS_CONSENT_E2E=1`).
- [ ] Confirm the CSP allows only the captured ad/CMP origins, and document any
      style allowance the ad stack requires.

Owner: _unassigned_ — blocked on the business decision to monetise.

## 3. Tax-rule sign-off

An accountant should confirm these two implemented rules against the current
law for the markets they cover. Both are enforced by tests.

- **India — CGST/SGST vs IGST:** the split must match the supplier GSTIN’s
  first two digits and the place-of-supply code. Code:
  `src/lib/generators/validation.ts` (search “India chooses CGST”); country
  data: `src/lib/countries/in.ts`. Tests:
  `tests/unit/generatorValidation.test.ts` → “requires the Indian split to
  match the GSTIN state and place of supply”; `tests/unit/countries.test.ts` →
  “gives India a non-registered example and both GST directions”.
- **Germany — reverse charge:** an EU reverse-charge invoice prints both
  USt-IdNr. values, so the supplier label must be `VAT ID` and the value must
  match the DE VAT format. Code: `src/lib/countries/de.ts`
  (`supplierTaxIdLabel`), `src/lib/generators/validation.ts` (search “A
  treatment that prints both VAT IDs”). Tests:
  `tests/unit/generatorValidation.test.ts` → “requires the USt-IdNr. label on a
  German reverse-charge invoice”.

**Canada $500 tier:** the claim that a buyer address is required over $500 was
checked against `tax_research.md`. The CRA tier at CAD 500 requires the buyer’s
legal or trading **name**, a description and payment terms; it does not add an
address requirement. No code change was made.

Owner: _unassigned accountant_ — target: before relying on either rule for a
customer invoice.

## 4. Cloudflare account id in git history

`docs/production.md` used to print the Cloudflare account id next to the name of
the secret that stores it. It has been redacted from the current tree. It is an
identifier, not a credential, so there is nothing to rotate.

- [ ] Decide whether to rewrite history to remove the old value. This audit
      deliberately does **not** rewrite history.
- [ ] If the repository was ever public, confirm with Cloudflare that the
      account id is not treated as sensitive in your threat model.

Owner: _repository owner_.

## 5. Monitoring and incident gaps

- [ ] Uptime failure currently alerts only through a red GitHub Actions run.
      Add a notification channel (Slack, email or PagerDuty) to the `Uptime`
      workflow.
- [ ] Add deployment-failure notifications for the Pages deploy jobs.
- [ ] Add CSP report collection (see the `PUBLIC_CSP_REPORT_URL` section in
      `docs/runbook.md`) and route reports to an owner.
- [ ] Add the on-call/contact placeholder in `docs/runbook.md` to the incident
      checklist.
- [ ] Decide whether browser error monitoring is needed; the site currently has
      no first-party error endpoint.

Owner: _unassigned operations owner_.

## 6. Deferred dependency upgrades

- [ ] TypeScript 7 — major upgrade; run typecheck, lint, unit and e2e in a
      dedicated change.
- [ ] `@types/node` 26 — major; align with the Node version used in CI.
- [ ] `vitest` / `@vitest/coverage-v8` 5.1.2 — patch update. They are pinned
      exactly (`5.1.1`) in `package.json`; if the pin was deliberate, record the
      reason, otherwise update both together.

Owner: _unassigned dependencies owner_.

## 7. Local storage and privacy

- [ ] Document a retention expectation for the local business profile and saved
      client names (they stay until the visitor clears site data).
- [ ] Decide whether to add a single “Clear all local data” control beyond the
      existing profile clear button. Do not implement it as part of this audit.
- [ ] Re-check the privacy copy whenever the analytics or ads model changes.

Owner: _unassigned privacy owner_.

## 8. Formatting drift

`pnpm format:check` is **not** a CI gate. `prettier-plugin-tailwindcss` can
rewrite class strings in `.astro` files (a past regression is recorded in
`task.md`), so those need a visual regression pass before any mass format.

This audit formatted **84** non-Astro, non-TSX files (Markdown, TypeScript,
YAML and `.mjs` scripts except the archive) in one dedicated commit, then ran
the full unit and e2e suites. Remaining drift is intentional:

- 16 `.astro` files and 10 `.tsx` files — skipped because of Tailwind class
  rewriting risk; format only with a visual/screenshot pass.
- 9 `scripts/archive/*` files — deliberately unmaintained historical probes.
- `pnpm-lock.yaml` — generated, not hand formatted.

- [ ] Decide whether to adopt a formatting gate for non-Astro files only.
- [ ] If `.astro` formatting is ever adopted, require the full e2e screenshot
      comparison in the same change.

Owner: _unassigned frontend owner_.

## 9. Documentation image compression (completed)

The PNG evidence under `docs/` was compressed in place with lossless oxipng
(`-o max`, safe metadata stripped). Filenames and pixel dimensions are unchanged,
so links and documentation keep working.

- Before: 13,399,033 bytes across 27 tracked PNGs.
- After: 11,295,131 bytes.
- Saved: 2,103,902 bytes (about 15.7%).
- No file was skipped for visible degradation; oxipng is lossless and only
  removes safe metadata.
- PNGs outside `docs/` (site assets) were not touched.
