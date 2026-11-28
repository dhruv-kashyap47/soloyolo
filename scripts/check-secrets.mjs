#!/usr/bin/env node
/**
 * A small, dependency-free secret scanner for this repository.
 *
 * It is deliberately narrow: it looks for the credential shapes that must
 * never be committed (private keys, cloud access keys, provider tokens) and
 * for literal assignments of high-entropy secrets. It is not a replacement for
 * a dedicated scanner with an entropy engine and a git-history database
 * (gitleaks, TruffleHog, GitHub secret scanning); it is the check that runs on
 * every developer machine before a commit and in CI on every push.
 *
 * Usage:
 *   node scripts/check-secrets.mjs           # every tracked file
 *   node scripts/check-secrets.mjs --staged  # files staged in git
 *   node scripts/check-secrets.mjs --all     # every tracked file (explicit)
 *
 * Findings print a redacted excerpt only. The process exits 1 when anything is
 * found, so a pre-commit hook or CI job fails closed.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.pdf',
  '.zip',
  '.gz',
  '.mp4',
  '.webm',
]);

const SKIP_FILES = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']);

/**
 * High-signal credential patterns. Each has a label and a regular expression
 * that matches the credential itself, not the word "secret" in prose.
 */
const PATTERNS = [
  {
    label: 'private key block',
    re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/,
  },
  { label: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: 'AWS secret access key', re: /\baws_secret_access_key\s*[:=]\s*\S{20,}/i },
  { label: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { label: 'GitHub fine-grained token', re: /\bgithub_pat_[A-Za-z0-9_]{50,}\b/ },
  { label: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { label: 'Stripe live secret key', re: /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/ },
  { label: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: 'npm token', re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  {
    label: 'JSON Web Token',
    re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    label: 'literal secret assignment',
    // e.g. API_KEY = "9f2..." but not process.env, placeholders or examples.
    re: /\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|password|passwd)\b\s*[:=]\s*['"`]([^'"`\n]{16,})['"`]/i,
  },
];

/** Values that look like a credential but are documentation or a variable. */
const PLACEHOLDER = /(?:\$\{|process\.env|import\.meta|example|placeholder|your[-_]|changeme|dummy|sample|xxx|<[^>]+>|test[-_]?only)/i;

function gitFiles(args) {
  return execFileSync('git', args, { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

function trackedFiles() {
  return gitFiles(['ls-files', '-z']);
}

function stagedFiles() {
  return gitFiles(['diff', '--cached', '--name-only', '--diff-filter=ACM', '-z']);
}

function isScannable(file) {
  if (SKIP_FILES.has(path.basename(file))) return false;
  return !SKIP_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function redact(value) {
  const trimmed = value.trim();
  if (trimmed.length <= 8) return '***';
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-2)} (${trimmed.length} chars)`;
}

function scan(files) {
  const findings = [];
  for (const file of files) {
    if (!isScannable(file)) continue;

    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      // A marked false positive stays explicit instead of weakening a pattern.
      if (line.includes('audit-allow-secret')) return;
      const seenOnLine = new Set();
      for (const { label, re } of PATTERNS) {
        const match = re.exec(line);
        if (!match) continue;
        const captured = match[1] ?? match[0];
        if (PLACEHOLDER.test(captured) || PLACEHOLDER.test(line)) continue;
        // A specific provider pattern and the generic assignment pattern can
        // both hit the same value; report the first (most specific) one only.
        if (seenOnLine.has(captured.trim())) continue;
        seenOnLine.add(captured.trim());
        findings.push({
          file,
          line: index + 1,
          label,
          excerpt: redact(captured),
        });
      }
    });
  }
  return findings;
}

const staged = process.argv.includes('--staged');
const files = staged ? stagedFiles() : trackedFiles();
const findings = scan(files);

if (findings.length === 0) {
  console.log(`secrets: no credential patterns in ${files.length} file(s)`);
  process.exit(0);
}

console.error(`secrets: ${findings.length} possible credential(s) found:`);
for (const finding of findings) {
  console.error(`- ${finding.file}:${finding.line} [${finding.label}] ${finding.excerpt}`);
}
console.error('\nRemove the value, move it to an environment variable or secret store, and rotate it.');
console.error('Do not rewrite git history without a human decision.');
process.exit(1);
