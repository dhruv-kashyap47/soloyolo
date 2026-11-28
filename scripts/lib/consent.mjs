/**
 * Shared CMP button handling for the P7-14 capture and the P6-11b–f harness.
 *
 * The Google-certified CMP is an iframe (sometimes nested), so every frame is
 * searched. Accessible names are matched loosely because the message wording
 * is configured account-side; the caller records which label was clicked.
 */
export const ACCEPT_PATTERN =
  /^(accept all|accept analytics|consent|agree|allow all|i agree|yes, i agree)$/i;
export const REJECT_PATTERN =
  /^(reject all|do not consent|decline|essential only|disagree|no, thanks)$/i;

export async function clickConsent(page, direction) {
  const pattern = direction === 'reject' ? REJECT_PATTERN : ACCEPT_PATTERN;
  for (const frame of page.frames()) {
    const candidate = frame.getByRole('button', { name: pattern }).first();
    try {
      if ((await candidate.count()) > 0 && (await candidate.isVisible())) {
        const label = (await candidate.textContent())?.trim();
        await candidate.click({ timeout: 5_000 });
        return { clicked: true, label, frame: frame.url() };
      }
    } catch {
      /* frame detached, cross-origin or no match: try the next one */
    }
  }
  return { clicked: false, label: null, frame: null };
}
