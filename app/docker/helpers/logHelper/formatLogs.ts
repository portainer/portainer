import tokenize from '@nxmix/tokenize-ansi';
import { FontWeight } from 'xterm';

import {
  colors,
  BACKGROUND_COLORS_BY_ANSI,
  FOREGROUND_COLORS_BY_ANSI,
  RGBColor,
} from './colors';
import { formatJSONLine } from './formatJSONLogs';
import { formatZerologLogs, ZerologRegex } from './formatZerologLogs';
import { Token, Span, TIMESTAMP_LENGTH, FormattedLine } from './types';

type FormatOptions = {
  stripHeaders?: boolean;
  withTimestamps?: boolean;
  splitter?: string;
};

const defaultOptions: FormatOptions = {
  splitter: '\n',
};

export function formatLogs(
  rawLogs: string,
  {
    stripHeaders,
    withTimestamps,
    splitter = '\n',
  }: FormatOptions = defaultOptions
) {
  let logs = rawLogs;
  if (stripHeaders) {
    logs = stripHeadersFunc(logs);
  }
  // if JSON logs come serialized 2 times, parse them once to unwrap them
  // for example when retrieving Edge Agent logs on Nomad
  if (logs.startsWith('"')) {
    try {
      logs = JSON.parse(logs);
    } catch (error) {
      // noop, throw error away if logs cannot be parsed
    }
  }

  const tokens: Token[][] = tokenize(logs);
  const formattedLogs: FormattedLine[] = [];

  let fgColor: string | undefined;
  let bgColor: string | undefined;
  let fontWeight: FontWeight | undefined;
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
      fontWeight = undefined;
    } else if (type === 'bold') {
      fontWeight = 'bold';
    } else if (type === 'normal') {
      fontWeight = 'normal';
    } else if (type === 'text') {
      const tokenLines = (token[1] as string).split(splitter);

      tokenLines.forEach((tokenLine, idx) => {
        if (idx && line) {
          formattedLogs.push({ line, spans });
          line = '';
          spans = [];
        }

        const text = stripEscapeCodes(tokenLine);
        try {
          if (
            (!withTimestamps && text.startsWith('{')) ||
            (withTimestamps && text.substring(TIMESTAMP_LENGTH).startsWith('{'))
          ) {
            const lines = formatJSONLine(text, withTimestamps);
            formattedLogs.push(...lines);
          } else if (
            (!withTimestamps && ZerologRegex.test(text)) ||
            (withTimestamps &&
              ZerologRegex.test(text.substring(TIMESTAMP_LENGTH)))
          ) {
            const lines = formatZerologLogs(text, withTimestamps);
            formattedLogs.push(...lines);
          } else {
            spans.push({ fgColor, bgColor, text, fontWeight });
            line += text;
          }
        } catch (error) {
          // in case parsing fails for whatever reason, push the raw logs and continue
          spans.push({ fgColor, bgColor, text, fontWeight });
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

function stripHeadersFunc(logs: string) {
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
