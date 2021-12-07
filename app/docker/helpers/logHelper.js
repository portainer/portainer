import tokenize from '@nxmix/tokenize-ansi';
import x256 from 'x256';

const FOREGROUND_COLORS_BY_ANSI = {
  black: x256.colors[0],
  red: x256.colors[1],
  green: x256.colors[2],
  yellow: x256.colors[3],
  blue: x256.colors[4],
  magenta: x256.colors[5],
  cyan: x256.colors[6],
  white: x256.colors[7],
  brightBlack: x256.colors[8],
  brightRed: x256.colors[9],
  brightGreen: x256.colors[10],
  brightYellow: x256.colors[11],
  brightBlue: x256.colors[12],
  brightMagenta: x256.colors[13],
  brightCyan: x256.colors[14],
  brightWhite: x256.colors[15],
};

const BACKGROUND_COLORS_BY_ANSI = {
  bgBlack: x256.colors[0],
  bgRed: x256.colors[1],
  bgGreen: x256.colors[2],
  bgYellow: x256.colors[3],
  bgBlue: x256.colors[4],
  bgMagenta: x256.colors[5],
  bgCyan: x256.colors[6],
  bgWhite: x256.colors[7],
  bgBrightBlack: x256.colors[8],
  bgBrightRed: x256.colors[9],
  bgBrightGreen: x256.colors[10],
  bgBrightYellow: x256.colors[11],
  bgBrightBlue: x256.colors[12],
  bgBrightMagenta: x256.colors[13],
  bgBrightCyan: x256.colors[14],
  bgBrightWhite: x256.colors[15],
};

angular.module('portainer.docker').factory('LogHelper', [
  function LogHelperFactory() {
    'use strict';
    var helper = {};

    function stripHeaders(logs) {
      logs = logs.substring(8);
      logs = logs.replace(/\r?\n(.{8})/g, '\n');

      return logs;
    }

    function stripEscapeCodes(logs) {
      return logs.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    }

    function cssColorFromRgb(rgb) {
      const [r, g, b] = rgb;

      return `rgb(${r}, ${g}, ${b})`;
    }

    function extendedColorForToken(token) {
      const colorMode = token[1];

      if (colorMode === 2) {
        return cssColorFromRgb(token.slice(2));
      }

      if (colorMode === 5 && x256.colors[token[2]]) {
        return cssColorFromRgb(x256.colors[token[2]]);
      }

      return '';
    }

    // Return an array with each log including a line and styled spans for each entry.
    // If the skipHeaders param is specified, it will strip the 8 first characters of each line.
    helper.formatLogs = function (logs, skipHeaders) {
      if (skipHeaders) {
        logs = stripHeaders(logs);
      }

      const tokens = tokenize(logs);
      const formattedLogs = [];

      let foregroundColor = null;
      let backgroundColor = null;
      let line = '';
      let spans = [];

      for (const token of tokens) {
        const type = token[0];

        if (FOREGROUND_COLORS_BY_ANSI[type]) {
          foregroundColor = cssColorFromRgb(FOREGROUND_COLORS_BY_ANSI[type]);
        } else if (type === 'moreColor') {
          foregroundColor = extendedColorForToken(token);
        } else if (type === 'fgDefault') {
          foregroundColor = null;
        } else if (BACKGROUND_COLORS_BY_ANSI[type]) {
          backgroundColor = cssColorFromRgb(BACKGROUND_COLORS_BY_ANSI[type]);
        } else if (type === 'bgMoreColor') {
          backgroundColor = extendedColorForToken(token);
        } else if (type === 'bgDefault') {
          backgroundColor = null;
        } else if (type === 'reset') {
          foregroundColor = null;
          backgroundColor = null;
        } else if (type === 'text') {
          const tokenLines = token[1].split('\n');

          for (let i = 0; i < tokenLines.length; i++) {
            if (i !== 0) {
              formattedLogs.push({ line, spans });

              line = '';
              spans = [];
            }

            const text = stripEscapeCodes(tokenLines[i]);

            line += text;
            spans.push({ foregroundColor, backgroundColor, text });
          }
        }
      }

      if (line) {
        formattedLogs.push({ line, spans });
      }

      return formattedLogs;
    };

    return helper;
  },
]);
