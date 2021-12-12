const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const smp = new SpeedMeasurePlugin();
const merge = require('webpack-merge');
// const webpackDevelop = require('./webpack.develop.js');
const prodConfig = require('./webpack.production.js');

module.exports = smp.wrap(
  merge(prodConfig, {
    plugins: [new BundleAnalyzerPlugin()],
  })
);
