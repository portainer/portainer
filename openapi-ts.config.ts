import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './dist/docs/openapi.yaml',
  output: {
    path: 'app/react/portainer/generated-api/portainer',
    clean: true,
    entryFile: false,
  },
  parser: {
    filters: {
      tags: {
        exclude: ['edge_agent'],
      },
      deprecated: false,
    },
  },
  plugins: [
    {
      enums: 'javascript',
      name: '@hey-api/typescript',
    },
    {
      name: '@hey-api/sdk',
      validator: true,
    },
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: '@/react/portainer/services/axios/configure-hey-api',
      baseUrl: 'api',
      throwOnError: true,
    },
    {
      name: 'zod',
      // Upstream bug: format: binary falls through to z.string() because
      // the formatNode switch has no 'binary' case. This resolver patches
      // it globally to match the TypeScript plugin's Blob | File output.
      // Remove once https://github.com/hey-api/openapi-ts/pull/3627 is
      // merged and released.
      '~resolvers': {
        string({ $, schema, symbols }) {
          if (schema.format === 'binary') {
            const { z } = symbols;
            return $(z)
              .attr('union')
              .call(
                $.array(
                  $(z).attr('instanceof').call($('Blob')),
                  $(z).attr('instanceof').call($('File'))
                )
              );
          }
        },
      },
    },
  ],
});
