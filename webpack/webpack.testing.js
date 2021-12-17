const { merge } = require('webpack-merge');
const productionConfig = require('./webpack.production');

module.exports = merge(productionConfig, {
  optimization: { nodeEnv: 'testing' },
});
