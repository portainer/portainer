const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  stories: ['../app/**/*.stories.mdx', '../app/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    {
      name: '@storybook/addon-postcss',
      options: {
        cssLoaderOptions: {
          importLoaders: 1,
          modules: {
            localIdentName: '[path][name]__[local]',
            auto: true,
            exportLocalsConvention: 'camelCaseOnly',
          },
        },
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
  ],
  webpackFinal: (config) => {
    config.resolve.plugins = [
      ...(config.resolve.plugins || []),
      new TsconfigPathsPlugin({
        extensions: config.resolve.extensions,
      }),
    ];

    const svgRule = config.module.rules.find((rule) => rule.test && typeof rule.test.test === 'function' && rule.test.test('.svg'));
    svgRule.test = new RegExp(svgRule.test.source.replace('svg|', ''));

    config.module.rules.unshift({
      test: /\.svg$/i,
      type: 'asset',
      resourceQuery: { not: [/c/] }, // exclude react component if *.svg?url
    });

    config.module.rules.unshift({
      test: /\.svg$/i,
      issuer: /\.(js|ts)(x)?$/,
      resourceQuery: /c/, // *.svg?c
      use: [{ loader: '@svgr/webpack', options: { icon: true } }],
    });

    return config;
  },
  core: {
    builder: 'webpack5',
  },
  staticDirs: ['./public'],
};
