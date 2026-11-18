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
    // The page wraps the island in a reserved-size shell. Marking it ready is
    // what swaps the hydration-pending hint for the live form, and it lets the
    // early-input bridge replay anything typed before hydration finished.
    const shell = document.querySelector<HTMLElement>('[data-generator-shell]');
    if (shell) {
      shell.dataset.ready = 'true';
      shell.dispatchEvent(new CustomEvent('soloyolo:generator-ready'));
    }
    return () => {
      delete document.documentElement.dataset.generatorReady;
      if (shell) {
        delete shell.dataset.ready;
        shell.dispatchEvent(new CustomEvent('soloyolo:generator-unready'));
      }
    };
  }, []);
}
