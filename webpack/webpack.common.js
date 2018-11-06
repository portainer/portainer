const path = require('path');
const { ProvidePlugin, ContextReplacementPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');
const CleanTerminalPlugin = require('clean-terminal-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const npmPackage = require('../package.json');
const projectRoot = path.resolve(__dirname, '..');

module.exports = {
  entry: {
    main: './app/__module.js'
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(projectRoot, 'dist/public')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          'auto-ngtemplate-loader',
          {
            // enforce: 'pre',
            loader: 'eslint-loader'
          }
        ]
      },
      {
        test: /\.html$/,
        exclude: path.resolve(projectRoot, './app/index.html'),
        use: [
          {
            loader: 'ngtemplate-loader',
            options: {
              relativeTo: projectRoot
            }
          },
          { loader: 'html-loader' }
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg|)$/,
        use: [
          {
            loader: 'url-loader',
            options: { limit: 25000 }
          }
        ]
      },
      {
        test: /\.(ico|png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 25000
            }
          }
        ]
      },
      {
        test: /.xml$/,
        use: 'file-loader'
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader?sourceMap']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './app/index.html',
      templateParameters: {
        name: npmPackage.name,
        author: npmPackage.author
      },
      manifest: './assets/ico/manifest.json'
    }),
    new WebpackBuildNotifierPlugin({
      title: 'Portainer build',
      logo: path.resolve('./assets/favicon-32x32.png'),
      suppressSuccess: true
    }),
    new CleanTerminalPlugin(),
    new ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
      sourceMap: true
    }),
    new CleanWebpackPlugin(['dist/public']),
    new ContextReplacementPlugin(/moment[\/\\]locale$/, /en/)
    // new BundleAnalyzerPlugin()
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          enforce: true
        }
      }
    }
  }
};
