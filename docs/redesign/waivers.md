# Redesign waivers

One line each. Each is a decision, not a silent omission.

- CSS is 24.7KB gzip in one cached file, above the 12KB target, because seven choreographed demos and the light token set share one stylesheet; no page loads a second CSS file.
- Home JS is 49.6KB gzip, below the 51.5KB baseline and far below the +60KB cap; the demo controller itself is 2.6KB.
- Home TBT is 270ms at 4x CPU from one initial parse/render task; calculator INP is 48ms and LCP is 1.14s. Phase 2 confirms with real Lighthouse before any further weight is cut.
- The home rail ad is static, not sticky, because the brief allows no sticky ad except the existing mobile anchor.
- The stageshow `uneven gutters` line on the rate card, project chart, fee flow and reminder mail is a nested-column misread, not a floating window; the parent tile is the frame.
- The stageshow `uneven padding` line on the reminder's sent overlay is a centred confirmation, not a padded card.
- The stageshow `loose stack` line on the hero's action foot is a label and a button, not a title and caption; the 10px gap is the control row's own spacing.
- The hero's invoice and quote are paper documents inside an app window; the stageshow `uneven gutters` check reads them as floating cards.
- Calculator pages keep the existing eyebrow labels and long-form copy; the brief says not to redesign tool pages, only to fix convenience and apply tokens.
- Calculators do not print; they copy and share. Printing stays with the document generators.
- Generator drafts are not persisted; only the opt-in business profile and the reminder fields are remembered.
- The light "Day Ledger" theme ships as D-1 asked, but the product mocks stay dark inside it: the seven demos, the toolkit window and the large bento tiles are app screenshots, and inverting them would change what the page is showing. Dark remains the default; Auto follows the OS.
- The theme switch is a three-state toggle in the footer, not a floating control, because the header already carries search and the primary action.
- The consent card is not a certified CMP and no GDPR/TCF compliance is claimed; a Google-certified CMP is a launch follow-up.
