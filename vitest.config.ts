import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    css: true,
    // .claude/worktrees holds agent worktrees (full repo copies).
    exclude: ['node_modules', 'dist', 'build', 'e2e', '.claude/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'html', 'lcov'],
      // Count every source file, not just the ones a test happens to import
      // (the previous setup reported 87% by ignoring untested files).
      include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
      exclude: ['src/sw.ts', '**/*.test.{ts,tsx}', '**/*.d.ts'],
      // Ratchet: set just below the measured coverage (2026-10-02, release 2.0.0:
      // 70.2% lines, 69.5% statements, 59.7% functions, 63.2% branches; it started
      // at about 45/45/37/37). Raise these as coverage grows; never lower them to
      // make a change pass.
      thresholds: {
        lines: 69,
        statements: 69,
        functions: 59,
        branches: 62,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'virtual:pwa-register/react': path.resolve(import.meta.dirname, './test/stubs/pwa-register-react.ts'),
    },
  },
});
