const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const smp = new SpeedMeasurePlugin();

const devConfig = require('./webpack.develop.js');
// const prodConfig = require('./webpack.production.js');

module.exports = smp.wrap(devConfig);
