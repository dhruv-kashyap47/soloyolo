import { useEffect, useRef } from 'preact/hooks';

import { caretAfterDigits, digitsBefore, formatGroupedInput } from '@/lib/formatting/number';

/**
 * The field's class list.
 *
 * It is built here rather than in a template literal inside the JSX: the
 * Tailwind class sorter rewrites `class` template literals and joins the
 * parts, which silently produced `field-inputfield-input--prefix` and pushed
 * every line item field past the edge of a phone.
 */
function fieldClasses(hasPrefix: boolean, hasSuffix: boolean): string {
  return [
    'field-input',
    hasPrefix ? 'field-input--prefix' : '',
    hasSuffix ? 'field-input--suffix' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * The shared number field every calculator uses.
 *
 * One place owns the things that broke apart when each calculator hand-built
 * its own markup:
 *
 * - the class list is composed term by term, so the field styles (width,
 *   border, padding, focus ring) always apply;
 * - the input is `width: 100%` with `min-width: 0`, so it can never grow past
 *   its grid column and the focus ring always stays in the column's gutter;
 * - a currency prefix or unit suffix gets its own reserved inset, so the
 *   symbol and the number never touch;
 * - the typed value is grouped with locale thousands separators while the
 *   caret keeps its place.
 */
export interface NumberFieldProps {
  id: string;
  name: string;
  label: string;
  /** A short line under the field. Omit it where the label says enough. */
  hint?: string;
  hintId: string;
  errorId: string;
  value: string;
  placeholder: string;
  /** Currency symbol drawn inside the field, before the number. */
  prefix?: string;
  /** Unit drawn inside the field, after the number. */
  suffix?: string;
  error?: string;
  /** Allow a decimal part (money); counts stay whole. */
  decimals?: boolean;
  onValue: (value: string) => void;
  onBlur: () => void;
  inputRef?: (element: HTMLInputElement | null) => void;
}

export default function NumberField(props: NumberFieldProps) {
  const { id, name, label, hint, hintId, errorId, value, placeholder, prefix, suffix, error } =
    props;
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  // Restore the caret after regrouping: a comma added before the caret must
  // not move the visitor's place in the number.
  useEffect(() => {
    const element = inputRef.current;
    const digits = pendingCaret.current;
    pendingCaret.current = null;
    if (!element || digits === null) return;
    const position = caretAfterDigits(element.value, digits);
    element.setSelectionRange(position, position);
  });

  function handleInput(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const caret = element.selectionStart ?? element.value.length;
    pendingCaret.current = digitsBefore(element.value, caret);
    props.onValue(formatGroupedInput(element.value, { decimals: props.decimals }));
  }

  return (
    <div class="min-w-0">
      <label class="field-label" for={id}>
        {label}
      </label>
      <div class="relative">
        {prefix && (
          <span aria-hidden="true" class="field-prefix">
            {prefix}
          </span>
        )}
        <input
          ref={(element) => {
            inputRef.current = element;
            props.inputRef?.(element);
          }}
          id={id}
          name={name}
          type="text"
          inputMode={props.decimals ? 'decimal' : 'numeric'}
          autocomplete="off"
          spellcheck={false}
          class={fieldClasses(Boolean(prefix), Boolean(suffix))}
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          onInput={handleInput}
          onBlur={props.onBlur}
        />
        {suffix && (
          <span aria-hidden="true" class="field-suffix">
            {suffix}
          </span>
        )}
      </div>
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
