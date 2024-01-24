import { StorybookConfig } from '@storybook/react-webpack5';

import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { Configuration } from 'webpack';
import postcss from 'postcss';

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    {
      name: '@storybook/addon-styling',
      options: {
        cssLoaderOptions: {
          importLoaders: 1,
          modules: {
            localIdentName: '[path][name]__[local]',
            auto: true,
            exportLocalsConvention: 'camelCaseOnly',
          },
        },
        postCss: {
          implementation: postcss,
        },
      },
    },
  ],
  webpackFinal: (config) => {
    const rules = config?.module?.rules || [];

    const imageRule = rules.find((rule) => {
      const test = (rule as { test: RegExp }).test;

      if (!test) {
        return false;
      }

      return test.test('.svg');
    }) as { [key: string]: any };

    imageRule.exclude = /\.svg$/;

    rules.unshift({
      test: /\.svg$/i,
      type: 'asset',
      resourceQuery: {
        not: [/c/],
      }, // exclude react component if *.svg?url
    });

    rules.unshift({
      test: /\.svg$/i,
      issuer: /\.(js|ts)(x)?$/,
      resourceQuery: /c/,
      // *.svg?c
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            icon: true,
          },
        },
      ],
    });
    return {
      ...config,
      resolve: {
        ...config.resolve,
        plugins: [
          ...(config.resolve?.plugins || []),
          new TsconfigPathsPlugin({
            extensions: config.resolve?.extensions,
          }),
        ],
      },
      module: {
        ...config.module,
        rules,
      },
    } satisfies Configuration;
  },
  staticDirs: ['./public'],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
};

export default config;
