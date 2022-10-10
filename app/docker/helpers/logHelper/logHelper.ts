import tokenize from '@nxmix/tokenize-ansi';

import {
  colors,
  BACKGROUND_COLORS_BY_ANSI,
  FOREGROUND_COLORS_BY_ANSI,
  RGBColor,
} from './colors';
import { formatJSONLine } from './formatJSONLogs';
import { Token, Span, TIMESTAMP_LENGTH, FormattedLine } from './types';

type FormatOptions = {
  stripHeaders?: boolean;
  withTimestamps?: boolean;
};

export function formatLogs(
  rawLogs: string,
  { stripHeaders: skipHeaders, withTimestamps }: FormatOptions
) {
  let logs = rawLogs;
  if (skipHeaders) {
    logs = stripHeaders(logs);
  }

  const tokens: Token[][] = tokenize(logs);
  const formattedLogs: FormattedLine[] = [];

  let fgColor: string | undefined;
  let bgColor: string | undefined;
  let line = '';
  let spans: Span[] = [];

  tokens.forEach((token) => {
    const [type] = token;

    const fgAnsi = FOREGROUND_COLORS_BY_ANSI[type];
    const bgAnsi = BACKGROUND_COLORS_BY_ANSI[type];

    if (fgAnsi) {
      fgColor = cssColorFromRgb(fgAnsi);
    } else if (type === 'moreColor') {
      fgColor = extendedColorForToken(token);
    } else if (type === 'fgDefault') {
      fgColor = undefined;
    } else if (bgAnsi) {
      bgColor = cssColorFromRgb(bgAnsi);
    } else if (type === 'bgMoreColor') {
      bgColor = extendedColorForToken(token);
    } else if (type === 'bgDefault') {
      bgColor = undefined;
    } else if (type === 'reset') {
      fgColor = undefined;
      bgColor = undefined;
    } else if (type === 'text') {
      const tokenLines = (token[1] as string).split('\n');

      tokenLines.forEach((tokenLine, idx) => {
        if (idx) {
          formattedLogs.push({ line, spans });
          line = '';
          spans = [];
        }

        const text = stripEscapeCodes(tokenLine);
        if (
          (!withTimestamps && text.startsWith('{')) ||
          (withTimestamps && text.substring(TIMESTAMP_LENGTH).startsWith('{'))
        ) {
          const lines = formatJSONLine(text, withTimestamps);
          formattedLogs.push(...lines);
        } else {
          spans.push({ fgColor, bgColor, text });
          line += text;
        }
      });
    }
  });
  if (line) {
    formattedLogs.push({ line, spans });
  }
  return formattedLogs;
}

function stripHeaders(logs: string) {
  return logs.substring(8).replace(/\r?\n(.{8})/g, '\n');
}

function stripEscapeCodes(logs: string) {
  return logs.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
}

function cssColorFromRgb(rgb: RGBColor) {
  const [r, g, b] = rgb;

  return `rgb(${r}, ${g}, ${b})`;
}

// assuming types based on original JS implementation
// there is not much type definitions for the tokenize library
function extendedColorForToken(token: Token[]) {
  const [, colorMode, colorRef] = token as [undefined, number, number];

  if (colorMode === 2) {
    return cssColorFromRgb(token.slice(2) as RGBColor);
  }

  if (colorMode === 5 && colors[colorRef]) {
    return cssColorFromRgb(colors[colorRef]);
  }

  return '';
}
