import tokenize from '@nxmix/tokenize-ansi';
import x256 from 'x256';
import { takeRight, without } from 'lodash';
import { format } from 'date-fns';

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

const TIMESTAMP_LENGTH = 31; // 30 for timestamp + 1 for trailing space

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
    // If the stripHeaders param is specified, it will strip the 8 first characters of each line.
    // withTimestamps param is needed to find the start of JSON for Zerolog logs parsing
    helper.formatLogs = function (logs, { stripHeaders: skipHeaders, withTimestamps }) {
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
            if ((!withTimestamps && text.startsWith('{')) || (withTimestamps && text.substring(TIMESTAMP_LENGTH).startsWith('{'))) {
              line += JSONToFormattedLine(text, spans, withTimestamps);
            } else {
              spans.push({ foregroundColor, backgroundColor, text });
              line += text;
            }
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

const JSONColors = {
  Grey: 'var(--text-log-viewer-color-json-grey)',
  Magenta: 'var(--text-log-viewer-color-json-magenta)',
  Yellow: 'var(--text-log-viewer-color-json-yellow)',
  Green: 'var(--text-log-viewer-color-json-green)',
  Red: 'var(--text-log-viewer-color-json-red)',
  Blue: 'var(--text-log-viewer-color-json-blue)',
};

const spaceSpan = { text: ' ' };

function logLevelToSpan(level) {
  switch (level) {
    case 'debug':
      return { foregroundColor: JSONColors.Grey, text: 'DBG', fontWeight: 'bold' };
    case 'info':
      return { foregroundColor: JSONColors.Green, text: 'INF', fontWeight: 'bold' };
    case 'warn':
      return { foregroundColor: JSONColors.Yellow, text: 'WRN', fontWeight: 'bold' };
    case 'error':
      return { foregroundColor: JSONColors.Red, text: 'ERR', fontWeight: 'bold' };
    default:
      return { text: level };
  }
}

function JSONToFormattedLine(rawText, spans, withTimestamps) {
  const text = withTimestamps ? rawText.substring(TIMESTAMP_LENGTH) : rawText;
  const json = JSON.parse(text);
  const { level, caller, message, time } = json;
  let line = '';

  if (withTimestamps) {
    const timestamp = rawText.substring(0, TIMESTAMP_LENGTH);
    spans.push({ text: timestamp });
    line += `${timestamp}`;
  }
  if (time) {
    const date = format(new Date(time * 1000), 'Y/MM/dd hh:mmaa');
    spans.push({ foregroundColor: JSONColors.Grey, text: date }, spaceSpan);
    line += `${date} `;
  }
  if (level) {
    const levelSpan = logLevelToSpan(level);
    spans.push(levelSpan, spaceSpan);
    line += `${levelSpan.text} `;
  }
  if (caller) {
    const trimmedCaller = takeRight(caller.split('/'), 2).join('/');
    spans.push({ foregroundColor: JSONColors.Magenta, text: trimmedCaller, fontWeight: 'bold' }, spaceSpan);
    spans.push({ foregroundColor: JSONColors.Blue, text: '>' }, spaceSpan);
    line += `${trimmedCaller} > `;
  }

  const keys = without(Object.keys(json), 'time', 'level', 'caller', 'message');
  if (message) {
    spans.push({ foregroundColor: JSONColors.Magenta, text: `${message}` }, spaceSpan);
    line += `${message} `;

    if (keys.length) {
      spans.push({ foregroundColor: JSONColors.Magenta, text: `|` }, spaceSpan);
      line += '| ';
    }
  }

  keys.forEach((key) => {
    const value = json[key];
    spans.push({ foregroundColor: JSONColors.Blue, text: `${key}=` });
    spans.push({ foregroundColor: key === 'error' ? JSONColors.Red : JSONColors.Magenta, text: value });
    spans.push(spaceSpan);
    line += `${key}=${value} `;
  });

  return line;
}
