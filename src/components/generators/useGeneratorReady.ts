import { useEffect } from 'preact/hooks';

/**
 * Marks `<html data-generator-ready>` once a generator island is live, and
 * clears it on unmount.
 *
 * The end-to-end tests wait for this flag: before hydration a typed value
 * would not reach the form state, and the preview would still be showing the
 * example rather than what the visitor typed.
 */
export function useGeneratorReady(): void {
  useEffect(() => {
    document.documentElement.dataset.generatorReady = 'true';
    return () => {
      delete document.documentElement.dataset.generatorReady;
    };
  }, []);
}
