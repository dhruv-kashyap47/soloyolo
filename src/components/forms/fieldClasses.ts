/**
 * The shared number field's class list.
 *
 * It lives in a plain module so the rule can be tested without a browser:
 * a one character currency mark (€, £, $) fits the normal inset, while a
 * three character mark (CHF, AED) needs a wider one so it never sits on the
 * number. The list is composed term by term because the Tailwind class sorter
 * rewrites template literals inside a `class` attribute.
 */
export function numberFieldClasses(options: {
  hasPrefix: boolean;
  hasSuffix: boolean;
  prefix?: string;
}): string {
  const widePrefix = options.hasPrefix && (options.prefix?.length ?? 0) > 1;

  return [
    'field-input',
    options.hasPrefix ? 'field-input--prefix' : '',
    widePrefix ? 'field-input--prefix-wide' : '',
    options.hasSuffix ? 'field-input--suffix' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
