/// <reference types="vitest" />
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./app/setup-tests/setup-msw.ts', './app/setup-tests/stub-modules.ts', './app/setup-tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'app/setup-tests/global-setup.js'],
    },
    bail: 2,
    include: ['./app/**/*.test.ts', './app/**/*.test.tsx'],
  },
  plugins: [svgr({ include: /\?c$/ }), tsconfigPaths()],
});
