import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './app/setup-tests/setup-msw.ts',
      './app/setup-tests/stub-modules.ts',
      './app/setup-tests/setup.ts',
      './app/setup-tests/setup-codemirror.ts',
      './app/setup-tests/setup-rtl.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'app/setup-tests/global-setup.js'],
    },
    bail: 2,
    include: ['./app/**/*.test.ts', './app/**/*.test.tsx'],
    env: {
      PORTAINER_EDITION: 'CE',
    },
    deps: {
      inline: [/@radix-ui/, /codemirror-json-schema/], // https://github.com/radix-ui/primitives/issues/2974#issuecomment-2186808459
    },
  },
  plugins: [svgr({ include: /\?c$/ }), tsconfigPaths()],
});
