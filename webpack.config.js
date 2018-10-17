const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');
const CleanTerminalPlugin = require('clean-terminal-webpack-plugin');
const { ProvidePlugin } = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const npmPackage = require('./package.json');
module.exports = {
  entry: {
    vendors: './app/vendors.js',
    main: './app/__module.js',
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'dist/public')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'auto-ngtemplate-loader',
          {
            // enforce: 'pre',
            loader: 'eslint-loader'
          }
        ]
      },
      {
        test: /\.html$/,
        exclude: path.resolve(__dirname, './app/index.html'),
        use: [
          { loader: 'ngtemplate-loader', options: { relativeTo: __dirname } },
          { loader: 'html-loader' }
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader'
          }
        ]
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader?sourceMap']
      }
    ]
  },
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      template: './app/index.html',
      templateParameters: {
        name: npmPackage.name,
        author: npmPackage.author
      }
    }),
    new WebpackBuildNotifierPlugin({
      title: 'My Project Webpack Build',
      logo: path.resolve('./assets/favicon-32x32.png'),
      suppressSuccess: true
    }),
    new CleanTerminalPlugin(),
    new ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
      // angular: 'angular'
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ]
};
