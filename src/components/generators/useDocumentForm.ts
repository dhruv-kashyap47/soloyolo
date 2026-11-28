import { useCallback, useMemo, useRef, useState } from 'preact/hooks';

import type { DocumentDraft, DocumentKind, LineItemDraft } from '@/lib/generators/document';
import { canAddLineItem, emptyLineItem } from '@/lib/generators/document';
import { recordDocumentPrinted } from '@/lib/documents-log';
import {
  validateDocumentDraft,
  type DocumentErrors,
  type DocumentFieldKey,
  type DocumentValidation,
} from '@/lib/generators/validation';

/**
 * The state behind every generator form.
 *
 * The calculators use `useCalculatorForm`, which is built around a flat set
 * of numeric fields. A generator has a document behind it: parties, a set of
 * dates, and a list of line items that can be added and removed. This hook
 * owns that shape once, so the three document generators share it.
 */
export interface DocumentFormOptions {
  kind: DocumentKind;
  initialValues: DocumentDraft;
}

export function useDocumentForm({ kind, initialValues }: DocumentFormOptions) {
  const [values, setValues] = useState<DocumentDraft>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  /**
   * The counter for new line items. It lives in a ref rather than in a module
   * so the ids the server rendered and the ids the browser renders are the
   * same, and every label keeps pointing at its own field after hydration.
   */
  const lineCounter = useRef(0);

  const validation: DocumentValidation = useMemo(
    () => validateDocumentDraft(values, kind),
    [values, kind],
  );

  const errors: DocumentErrors = validation.errors;

  const setValue = useCallback(
    <K extends keyof DocumentDraft>(field: K, value: DocumentDraft[K]) => {
      setValues((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const setItemValue = useCallback(
    <K extends keyof LineItemDraft>(id: string, field: K, value: LineItemDraft[K]) => {
      setValues((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      }));
    },
    [],
  );

  const markTouched = useCallback((field: string) => {
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  /**
   * An error only shows once the visitor has left the field or tried to
   * submit, so a half typed number never shouts at anyone.
   */
  const errorFor = useCallback(
    (field: DocumentFieldKey): string | undefined => {
      if (submitted || touched[field]) return errors[field];
      return undefined;
    },
    [errors, submitted, touched],
  );

  const addItem = useCallback(
    (taxPercent = '') => {
      if (!canAddLineItem(values.items)) return;

      lineCounter.current += 1;
      const id = `line-${lineCounter.current}`;

      setValues((current) => {
        // The form can change between the click and the update, so guard the
        // reducer too: the button is disabled at the limit, but a stale event
        // must not grow the list past it.
        if (!canAddLineItem(current.items)) return current;
        return { ...current, items: [...current.items, emptyLineItem(id, taxPercent)] };
      });
    },
    [values.items.length],
  );

  const removeItem = useCallback((id: string) => {
    setValues((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setTouched({});
    setSubmitted(false);
  }, [initialValues]);

  /**
   * Prints the document, or reports what still needs fixing.
   *
   * Both print buttons go through here: the one in the form and the one in
   * the preview toolbar. A document with a missing business name would print
   * the words "Your business name" onto the customer's invoice, so nothing
   * reaches the printer until the form is whole.
   */
  const submit = useCallback(() => {
    setSubmitted(true);

    if (validation.ok) {
      // Printing is the save action in this no-backend app, so a print is
      // what the home desk counts as a document made.
      recordDocumentPrinted(kind);
      window.print();
      return;
    }

    window.requestAnimationFrame(() => summaryRef.current?.focus());
  }, [validation.ok, kind]);

  /**
   * Submits the form.
   *
   * When something is wrong the focus moves to the error summary rather than
   * to the first field: a visitor who pressed a button expects to be told
   * what happened, and the summary lists every problem at once.
   */
  const handleSubmit = useCallback(
    (event: Event) => {
      event.preventDefault();
      submit();
    },
    [submit],
  );

  return {
    values,
    setValues,
    setValue,
    setItemValue,
    markTouched,
    errorFor,
    validation,
    errors,
    submitted,
    summaryRef,
    addItem,
    canAddItem: canAddLineItem(values.items),
    removeItem,
    reset,
    submit,
    handleSubmit,
  };
}
