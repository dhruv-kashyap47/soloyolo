import { describe, expect, it } from 'vitest';
import { join, resolve, sep } from 'node:path';

import { staticFileCandidates } from '../../scripts/lib/static-file.mjs';

const ROOT = resolve('dist');

describe('staticFileCandidates', () => {
  it('resolves a page and a directory index under the root', () => {
    expect(staticFileCandidates(ROOT, '/tools/')).toEqual([join(ROOT, 'tools', 'index.html')]);
    expect(staticFileCandidates(ROOT, '/robots.txt')).toEqual([
      join(ROOT, 'robots.txt'),
      join(ROOT, 'robots.txt', 'index.html'),
    ]);
  });

  it('resolves the site root to its index', () => {
    expect(staticFileCandidates(ROOT, '/')).toEqual([join(ROOT, 'index.html')]);
  });

  it('rejects a decoded traversal that escapes the root', () => {
    expect(staticFileCandidates(ROOT, '/../package.json')).toEqual([]);
    expect(staticFileCandidates(ROOT, '/..%2f..%2fpackage.json')).toEqual([]);
    expect(staticFileCandidates(ROOT, '/%2e%2e%2f%2e%2e%2fpackage.json')).toEqual([]);
    expect(staticFileCandidates(ROOT, '/..%5c..%5cpackage.json')).toEqual([]);
  });

  it('never escapes the root for a drive-letter or POSIX absolute path', () => {
    // On Windows a drive-letter path resolves outside the root and is
    // rejected; on POSIX it is a relative name and stays inside. Either way no
    // candidate may leave the build directory.
    for (const pathname of ['C:/Windows/win.ini', '/etc/passwd']) {
      for (const candidate of staticFileCandidates(ROOT, pathname)) {
        expect(candidate === ROOT || candidate.startsWith(`${ROOT}${sep}`)).toBe(true);
      }
    }
  });

  it('rejects a null byte and malformed percent encoding', () => {
    expect(staticFileCandidates(ROOT, '/index.html%00.txt')).toEqual([]);
    expect(staticFileCandidates(ROOT, '/%E0%A4%A')).toEqual([]);
  });

  it('normalises a backslash inside the root instead of escaping it', () => {
    expect(staticFileCandidates(ROOT, '/tools\\robots.txt')).toEqual([
      join(ROOT, 'tools', 'robots.txt'),
      join(ROOT, 'tools', 'robots.txt', 'index.html'),
    ]);
  });
});
