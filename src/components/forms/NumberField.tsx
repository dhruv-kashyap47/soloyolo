import { useEffect, useRef } from 'preact/hooks';

import { caretAfterDigits, digitsBefore, formatGroupedInput } from '@/lib/formatting/number';
import { numberFieldClasses } from '@/components/forms/fieldClasses';

/**
 * The shared number field every calculator uses.
 *
 * One place owns the things that broke apart when each calculator hand-built
 * its own markup:
 *
 * - the class list is composed term by term (see `fieldClasses.ts`), so the
 *   field styles always apply and a three character currency mark gets its
 *   own wider inset;
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
  /** The locale the typed digits are grouped in, so INR reads in lakhs. */
  locale?: string;
  error?: string;
  /** Allow a decimal part (money); counts stay whole. */
  decimals?: boolean;
  /** The phone keyboard's action key. */
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
  onValue: (value: string) => void;
  onBlur: () => void;
  inputRef?: (element: HTMLInputElement | null) => void;
}

export default function NumberField(props: NumberFieldProps) {
  const { id, name, label, hint, hintId, errorId, value, placeholder, prefix, suffix, error } =
    props;
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<{ digits: number; afterSeparator: boolean } | null>(null);
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  // Restore the caret after regrouping: a comma added before the caret must
  // not move the visitor's place in the number. A caret that sat just after a
  // decimal point or comma stays after that separator, so typing "1,200.50"
  // does not insert the 5 before the point.
  useEffect(() => {
    const element = inputRef.current;
    const pending = pendingCaret.current;
    pendingCaret.current = null;
    if (!element || !pending) return;
    let position = caretAfterDigits(element.value, pending.digits);
    if (pending.afterSeparator && /[.,]/.test(element.value.charAt(position))) {
      position += 1;
    }
    element.setSelectionRange(position, position);
  });

  function handleInput(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const caret = element.selectionStart ?? element.value.length;
    pendingCaret.current = {
      digits: digitsBefore(element.value, caret),
      afterSeparator: /[.,]$/.test(element.value.slice(0, caret)),
    };
    const formatted = formatGroupedInput(element.value, {
      decimals: props.decimals,
      locale: props.locale,
    });
    // When the formatter drops a character (a trailing comma after a group,
    // for example), the state keeps the old string and Preact would leave the
    // raw text in the DOM. Write the formatted text back explicitly.
    if (formatted !== element.value) element.value = formatted;
    props.onValue(formatted);
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
          enterKeyHint={props.enterKeyHint ?? 'done'}
          autocomplete="off"
          spellcheck={false}
          class={numberFieldClasses({
            hasPrefix: Boolean(prefix),
            hasSuffix: Boolean(suffix),
            prefix,
          })}
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
