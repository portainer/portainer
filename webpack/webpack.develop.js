const path = require('path');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common.js');

module.exports = webpackMerge(commonConfig, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(woff|woff2|eot|ttf|svg|ico|png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            // options: { limit: 25000 }
          }
        ]
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, '.tmp'),
    compress: true,
    port: 8999,
    proxy:{
      '/api': 'http://localhost:9000'
    },
    open: true,
  }
});
