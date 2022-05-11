module.exports = ({ env }) => ({
  plugins: [
    // add vendor prefixes
    require('autoprefixer'),
    // minify the result
    env !== 'development' && require('cssnano'),
    require('tailwindcss'),
  ],
});
