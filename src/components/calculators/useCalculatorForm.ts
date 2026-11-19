import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

export type FormValidation<Field extends string, Input> =
  | { ok: true; input: Input }
  | { ok: false; errors: Partial<Record<Field, string>> };

export interface CalculatorFormOptions<
  Field extends string,
  Values extends Record<Field, string>,
  Input,
> {
  /** Field order, which is also the order used to focus the first invalid field. */
  fields: readonly Field[];
  initialValues: Values;
  validate: (values: Values) => FormValidation<Field, Input>;
  /** Called after a valid submit, usually to move focus to the result heading. */
  onValid?: () => void;
  /**
   * Remember the last valid inputs on this device. The key is namespaced per
   * calculator so one tool never fills another. Nothing is sent anywhere.
   */
  storageKey?: string;
}

/**
 * The form mechanics every calculator shares: values, touched and submitted
 * state, field errors that only appear after a blur or a submit, focus on the
 * first invalid field, and a reset back to the worked example.
 *
 * Three calculators now prove the shape is the same. Anything calculator
 * specific (the result panel, copy text, formatting) stays in the island.
 */
export function useCalculatorForm<
  Field extends string,
  Values extends Record<Field, string>,
  Input,
>(options: CalculatorFormOptions<Field, Values, Input>) {
  const [values, setValues] = useState<Values>(options.initialValues);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const ready = useRef(false);

  const inputRefs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});

  const storageId = options.storageKey ? `soloyolo:calculator:${options.storageKey}` : '';

  useEffect(() => {
    if (!storageId) {
      ready.current = true;
      return;
    }

    try {
      const raw = localStorage.getItem(storageId);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<Record<Field, string>>;
        const next = { ...options.initialValues } as Values;
        let any = false;
        for (const field of options.fields) {
          const value = stored[field];
          if (typeof value === 'string') {
            next[field] = value as Values[Field];
            any = true;
          }
        }
        if (any && options.validate(next).ok) setValues(next);
      }
    } catch {
      /* storage unavailable or malformed: the example values stay */
    }

    ready.current = true;
    // Once per mount: the key belongs to this calculator.
  }, []);

  useEffect(() => {
    if (!storageId || !ready.current) return;
    if (!options.validate(values).ok) return;
    try {
      localStorage.setItem(storageId, JSON.stringify(values));
    } catch {
      /* storage unavailable */
    }
  }, [values, storageId]);

  const validation = useMemo(() => options.validate(values), [options.validate, values]);
  const errors: Partial<Record<Field, string>> = validation.ok ? {} : validation.errors;

  function setValue(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function markTouched(field: Field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function fieldError(field: Field): string | undefined {
    if (validation.ok) return undefined;
    if (submitted || touched[field]) return errors[field];
    return undefined;
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    setSubmitted(true);

    if (validation.ok) {
      options.onValid?.();
      return;
    }

    for (const field of options.fields) {
      if (validation.errors[field]) {
        inputRefs.current[field]?.focus();
        break;
      }
    }
  }

  function reset() {
    replaceValues(options.initialValues);
  }

  /** Replaces every value at once, e.g. when a new example loads. */
  function replaceValues(next: Values) {
    setValues(next);
    setTouched({});
    setSubmitted(false);
  }

  return {
    values,
    validation,
    errors,
    submitted,
    fieldError,
    setValue,
    markTouched,
    handleSubmit,
    reset,
    replaceValues,
    inputRefs,
  };
}

