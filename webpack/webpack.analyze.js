import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';
import webpackConfig from './webpack.production.js';
// const webpackConfig = require('./webpack.develop.js');

export default merge(webpackConfig, {
  plugins: [new BundleAnalyzerPlugin()],
});
