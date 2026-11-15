import { useEffect } from 'preact/hooks';

/**
 * Marks `<html data-calculator-ready>` once the island's state is live, and
 * clears it on unmount.
 *
 * The end-to-end tests and the accessibility scan wait for this flag: before
 * hydration a typed value would not reach the form state, and axe can read the
 * panel mid-fade. One place now owns the contract instead of every island
 * repeating the same effect.
 */
export function useIslandReady(): void {
  useEffect(() => {
    document.documentElement.dataset.calculatorReady = 'true';
    return () => {
      delete document.documentElement.dataset.calculatorReady;
    };
  }, []);
}
