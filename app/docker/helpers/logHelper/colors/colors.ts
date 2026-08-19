// original code comes from https://www.npmjs.com/package/x256
// only picking the used parts as there is no type definition
// package is unmaintained and repository doesn't exist anymore

// colors scraped from
// http://www.calmar.ws/vim/256-xterm-24bit-rgb-color-chart.html
// %s/ *\d\+ \+#\([^ ]\+\)/\1\r/g

import rawColors from './rawColors.json';

export type RGBColor = [number, number, number];
export type TextColor = string | undefined;

function hexToRGB(hex: string): RGBColor {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

export const colors = rawColors.map(hexToRGB);

export const FOREGROUND_COLORS_BY_ANSI: {
  [k: string]: RGBColor;
} = {
  black: colors[0],
  red: colors[1],
  green: colors[2],
  yellow: colors[3],
  blue: colors[4],
  magenta: colors[5],
  cyan: colors[6],
  white: colors[7],
  brightBlack: colors[8],
  brightRed: colors[9],
  brightGreen: colors[10],
  brightYellow: colors[11],
  brightBlue: colors[12],
  brightMagenta: colors[13],
  brightCyan: colors[14],
  brightWhite: colors[15],
};

export const BACKGROUND_COLORS_BY_ANSI: {
  [k: string]: RGBColor;
} = {
  bgBlack: colors[0],
  bgRed: colors[1],
  bgGreen: colors[2],
  bgYellow: colors[3],
  bgBlue: colors[4],
  bgMagenta: colors[5],
  bgCyan: colors[6],
  bgWhite: colors[7],
  bgBrightBlack: colors[8],
  bgBrightRed: colors[9],
  bgBrightGreen: colors[10],
  bgBrightYellow: colors[11],
  bgBrightBlue: colors[12],
  bgBrightMagenta: colors[13],
  bgBrightCyan: colors[14],
  bgBrightWhite: colors[15],
};
