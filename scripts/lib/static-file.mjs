import { join, resolve, sep } from 'node:path';

/**
 * Resolve a request path against a static root without ever leaving it.
 *
 * The CSP smoke check runs a tiny HTTP server on `dist/`; a request such as
 * `/..%2f..%2fpackage.json` must not read a file outside the build. Decoding
 * happens before normalisation (the order the old check got wrong), backslashes
 * are treated as separators on every platform, a null byte is rejected and the
 * resolved path must still sit under the root.
 *
 * @param {string} root
 * @param {string} pathname
 * @returns {string[]} candidate files, in lookup order; empty means rejected
 */
export function staticFileCandidates(root, pathname) {
  if (typeof pathname !== 'string' || pathname === '') return [];

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return [];
  }
  if (decoded.includes('\0')) return [];

  const rootPath = resolve(root);
  const slashed = decoded.replace(/\\/g, '/');
  const relative = slashed.replace(/^\/+/, '');
  const base = resolve(rootPath, relative);

  if (base !== rootPath && !base.startsWith(`${rootPath}${sep}`)) return [];
  if (slashed.endsWith('/')) return [join(base, 'index.html')];
  return [base, join(base, 'index.html')];
}
