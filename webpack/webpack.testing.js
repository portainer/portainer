const webpackMerge = require('webpack-merge');
const productionConfig = require('./webpack.production');

module.exports = webpackMerge(productionConfig, {
  optimization: { nodeEnv: 'testing' },
});
