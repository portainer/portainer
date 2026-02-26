import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  build: {
    // force tests to import svg as url
    // TODO consider removing when moving from webpack
    assetsInlineLimit: 0,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './app/setup-tests/setup-websocket.ts',
      './app/setup-tests/setup-rtl.ts',
      './app/setup-tests/setup-msw.ts',
      './app/setup-tests/stub-modules.ts',
      './app/setup-tests/setup.ts',
      './app/setup-tests/setup-codemirror.ts',
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
    server: {
      deps: {
        inline: [/@radix-ui/, /codemirror-json-schema/], // https://github.com/radix-ui/primitives/issues/2974#issuecomment-2186808459
      },
    },
    onConsoleLog(log) {
      return !/Can't perform a React state update on an unmounted component/.test(log);
    },
  },
  plugins: [svgr({ include: /\?c$/ }), tsconfigPaths()],
});
