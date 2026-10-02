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
      // Ratchet: set just below the measured baseline (2026-10-02: 44.8% lines,
      // 44.5% statements, 36.8% functions, 37.1% branches). Raise these as
      // coverage grows; never lower them to make a change pass.
      thresholds: {
        lines: 44,
        statements: 44,
        functions: 36,
        branches: 36,
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
