export interface TextFieldProps {
  id: string;
  name: string;
  label: string;
  hint?: string;
  hintId: string;
  errorId: string;
  value: string;
  placeholder?: string;
  error?: string;
  /** The input type. `date` gives the visitor the native date picker. */
  type?: 'text' | 'email' | 'tel' | 'url' | 'date';
  /** A multi-line box, for an address or a note. */
  multiline?: boolean;
  rows?: number;
  autocomplete?: string;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  onValue: (value: string) => void;
  onBlur: () => void;
  inputRef?: (element: HTMLInputElement | HTMLTextAreaElement | null) => void;
}

/**
 * The shared text field.
 *
 * The same rules as the number field: a visible label, a hint tied by
 * `aria-describedby`, an error line with reserved space so the layout never
 * jumps, and `aria-invalid` when the value is wrong. A date field uses the
 * browser's own picker, because a calendar a visitor already knows is
 * faster than a date they have to type.
 */
export default function TextField(props: TextFieldProps) {
  const {
    id,
    name,
    label,
    hint,
    hintId,
    errorId,
    value,
    placeholder,
    error,
    type = 'text',
    multiline = false,
    rows = 3,
    autocomplete,
    inputMode,
  } = props;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  const shared = {
    id,
    name,
    class: 'field-input',
    value,
    placeholder,
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': describedBy || undefined,
    onInput: (event: Event) => props.onValue((event.currentTarget as HTMLInputElement).value),
    onBlur: props.onBlur,
  };

  return (
    <div class="min-w-0">
      <label class="field-label" for={id}>
        {label}
      </label>

      {multiline ? (
        <textarea
          {...shared}
          rows={rows}
          ref={(element) => props.inputRef?.(element)}
          class="field-input resize-y"
        />
      ) : (
        <input
          {...shared}
          // Preact types the input by its `type` attribute, so a field that
          // accepts several types is narrowed here. The runtime value is the
          // type the caller asked for.
          type={type as 'text'}
          inputMode={inputMode}
          autocomplete={autocomplete}
          spellcheck={type === 'text' ? false : undefined}
          ref={(element) => props.inputRef?.(element)}
        />
      )}

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
