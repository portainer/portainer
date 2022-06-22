const plugin = require('tailwindcss/plugin');

const NUMBER_OF_SHADES = 11;
const SHADES_ARRAY = Array.from({ length: NUMBER_OF_SHADES }, (_, i) => i + 1);
const COLORS = [
  'gray',
  'pr-blue',
  'error',
  'warning',
  'success',
  'gray-blue',
  'gray-cool',
  'gray-modern',
  'gray-neutral',
  'gray-iron',
  'gray-true',
  'gray-warm',
  'moss',
  'green-light',
  'green',
  'teal',
  'cyan',
  'blue-light',
  'blue',
  'blue-dark',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'orange-dark',
  'orange',
  'yellow',
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{html,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      white: 'var(--white)',
      black: 'var(--black)',

      ...Object.fromEntries(COLORS.flatMap((color) => SHADES_ARRAY.map((index) => [(`${color}${index}`, `var(--${color}${index})`)]))),

      'legacy-grey-3': 'var(--grey-3)',
      'legacy-blue-2': 'var(--blue-2)',
      'legacy-blue-9': 'var(--blue-9)',
    },
  },

  plugins: [
    plugin(({ addVariant }) => {
      addVariant('be', '[data-edition="BE"] &');
      addVariant('th-highcontrast', '[theme="highcontrast"] &');
      addVariant('th-dark', '[theme="dark"] &');
    }),
  ],
};
