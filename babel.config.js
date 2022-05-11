module.exports = {
  plugins: ['lodash', 'angularjs-annotate'],
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        corejs: '3',
        targets: { node: 'current' },
        modules: 'auto',
      },
    ],
  ],
  overrides: [
    {
      test: ['app/**/*.ts', 'app/**/*.tsx'],
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/preset-react',
          {
            runtime: 'automatic',
          },
        ],
        [
          '@babel/preset-env',
          {
            modules: 'auto',
            useBuiltIns: 'usage',
            corejs: '3',
          },
        ],
      ],
    },
  ],
};
