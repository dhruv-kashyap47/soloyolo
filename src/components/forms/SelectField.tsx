export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  hint?: string;
  hintId: string;
  errorId: string;
  value: string;
  options: readonly SelectOption[];
  error?: string;
  onValue: (value: string) => void;
  onBlur: () => void;
}

/**
 * The shared select.
 *
 * A native select is used on purpose: it is the one control every phone,
 * keyboard and screen reader already knows, and the option list stays
 * scrollable on a small screen instead of turning into a custom widget.
 */
export default function SelectField(props: SelectFieldProps) {
  const { id, name, label, hint, hintId, errorId, value, options, error, onValue, onBlur } = props;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div class="min-w-0">
      <label class="field-label" for={id}>
        {label}
      </label>

      <select
        id={id}
        name={name}
        class="field-input cursor-pointer appearance-none bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat pr-9"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='m3.5 5.5 3.5 3.5 3.5-3.5' stroke='%2382868d' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        }}
        value={value}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => onValue(event.currentTarget.value)}
        onBlur={onBlur}
      >
        {options.map((option) => (
          <option value={option.value}>{option.label}</option>
        ))}
      </select>

      {hint && (
        <p id={hintId} class="field-hint mt-1.5">
          {hint}
        </p>
      )}
      <p id={errorId} class="field-error" aria-live="polite">
        {error ?? ''}
      </p>
    </div>
  );
}
