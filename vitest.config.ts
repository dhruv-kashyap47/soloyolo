import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/calculators/**/*.ts', 'src/lib/generators/**/*.ts'],
      reporter: ['text', 'json-summary'],
      // P6-01: every calculator and generator module keeps at least 90% of
      // its branches covered, so a new untested rule fails the gate instead
      // of quietly lowering the average.
      thresholds: {
        perFile: true,
        branches: 90,
      },
    },
  },
});
