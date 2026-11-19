import { useEffect, useState } from 'preact/hooks';

import { isCurrencyCode, type CurrencyCode } from '@/lib/formatting/currency';

/**
 * The currency a calculator writes amounts in.
 *
 * It is remembered with the inputs, in a key of its own, so a visitor who
 * works in EUR does not come back to a form full of EUR numbers labelled USD.
 * The value never converts anything; it only changes the words and symbols.
 */
export function useCurrency(storageKey: string): [CurrencyCode, (next: CurrencyCode) => void] {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const key = `soloyolo:currency:${storageKey}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored && isCurrencyCode(stored)) setCurrency(stored);
    } catch {
      /* storage unavailable */
    }
    // Once per mount: the key belongs to this calculator.
  }, []);

  function update(next: CurrencyCode) {
    setCurrency(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      /* storage unavailable */
    }
  }

  return [currency, update];
}
