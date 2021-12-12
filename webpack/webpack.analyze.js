const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const smp = new SpeedMeasurePlugin();
const merge = require('webpack-merge');
const webpackConfig = require('./webpack.production.js');
// const webpackConfig = require('./webpack.develop.js');

module.exports = smp.wrap(
  merge(webpackConfig, {
    plugins: [new BundleAnalyzerPlugin()],
  })
);
