module.exports = ({ env }) => ({
  plugins: {
    // add vendor prefixes
    autoprefixer: { browsers: 'last 2 versions' },
    // minify the result
    cssnano: env === 'production' ? {} : false
  }
});
