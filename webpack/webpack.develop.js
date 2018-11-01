const path = require('path');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common.js');

module.exports = webpackMerge(commonConfig, {
  // devtool: 'cheap-module-source-map',
  mode: 'development',
  devServer: {
    contentBase: path.join(__dirname, '.tmp'),
    compress: true,
    port: 90000
  }
});
