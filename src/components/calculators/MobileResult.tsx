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
export default function MobileResult({ label, value, detail }: Props) {
  return (
    <div class="mobile-result" role="status" aria-live="polite">
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
