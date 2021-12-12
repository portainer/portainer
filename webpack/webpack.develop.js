const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common.js');

module.exports = merge(commonConfig, {
  mode: 'development',
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(woff|woff2|eot|ttf|svg|ico|png|jpg|gif)$/,
        type: 'asset/resource',
      },
    ],
  },
});
