interface Props {
  label: string;
  value: string;
  detail?: string;
}

/**
 * The result next to the fields on a phone.
 *
 * On a wide screen the full result panel sits beside the form, so this is
 * hidden. On a phone it keeps the headline figure visible while the visitor
 * edits, with a link down to the full breakdown.
 */
/**
 * The result panel already owns the one polite live region for this tool. This
 * visible card is a second copy of the same figure, so it is deliberately not
 * a live region: doing both announced every keystroke twice on a phone.
 */
export default function MobileResult({ label, value, detail }: Props) {
  return (
    <div class="mobile-result">
      <div>
        <p class="mobile-result-label">{label}</p>
        <p class="mobile-result-value">{value}</p>
        {detail && <p class="mobile-result-detail">{detail}</p>}
      </div>
      <a class="mobile-result-link" href="#result-heading">
        Full result
      </a>
    </div>
  );
}
