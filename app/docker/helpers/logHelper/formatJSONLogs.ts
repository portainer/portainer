import { takeRight, without } from 'lodash';
import { format } from 'date-fns';

import { FormattedLine, Span, TIMESTAMP_LENGTH } from './types';

const Colors = {
  Grey: 'var(--text-log-viewer-color-json-grey)',
  Magenta: 'var(--text-log-viewer-color-json-magenta)',
  Yellow: 'var(--text-log-viewer-color-json-yellow)',
  Green: 'var(--text-log-viewer-color-json-green)',
  Red: 'var(--text-log-viewer-color-json-red)',
  Blue: 'var(--text-log-viewer-color-json-blue)',
};

type Level = 'debug' | 'info' | 'warn' | 'error';

const spaceSpan = { text: ' ' };

const Levels: {
  [k in Level]: Span;
} = {
  debug: {
    fgColor: Colors.Grey,
    text: 'DBG',
    fontWeight: 'bold',
  },
  info: {
    fgColor: Colors.Green,
    text: 'INF',
    fontWeight: 'bold',
  },
  warn: {
    fgColor: Colors.Yellow,
    text: 'WRN',
    fontWeight: 'bold',
  },
  error: {
    fgColor: Colors.Red,
    text: 'ERR',
    fontWeight: 'bold',
  },
};

function removeKnownKeys(keys: string[]) {
  return without(keys, 'time', 'level', 'caller', 'message', 'stack_trace');
}

function logLevelToSpan(level: Level) {
  if (level in Levels) {
    return Levels[level];
  }
  return { text: level };
}

type JSONObject = {
  [k: string]: unknown;
  time: number;
  level: Level;
  caller: string;
  message: string;
  stack_trace?: {
    func: string;
    line: string;
    source: string;
  }[];
};

export function formatJSONLine(
  rawText: string,
  withTimestamps?: boolean
): FormattedLine[] {
  const spans: Span[] = [];
  const lines: FormattedLine[] = [];
  let line = '';

  let text = withTimestamps ? rawText.substring(TIMESTAMP_LENGTH) : rawText;
  if (text.startsWith('"{')) {
    text = text.slice(1);
  }
  if (text.endsWith('}"')) {
    text = text.slice(0, -1);
  }
  if (text.startsWith('{\\"')) {
    text = JSON.parse(`"${text}"`);
  }
  const json: JSONObject = JSON.parse(text);
  const { time, level, caller, message, stack_trace: stackTrace } = json;

  if (withTimestamps) {
    const timestamp = rawText.substring(0, TIMESTAMP_LENGTH);
    spans.push({ text: timestamp });
    line += `${timestamp}`;
  }
  if (time) {
    const date = format(new Date(time * 1000), 'Y/MM/dd hh:mmaa');
    spans.push({ fgColor: Colors.Grey, text: date }, spaceSpan);
    line += `${date} `;
  }
  if (level) {
    const levelSpan = logLevelToSpan(level);
    spans.push(levelSpan, spaceSpan);
    line += `${levelSpan.text} `;
  }
  if (caller) {
    const trim = takeRight(caller.split('/'), 2).join('/');
    spans.push(
      { fgColor: Colors.Magenta, text: trim, fontWeight: 'bold' },
      spaceSpan
    );
    spans.push({ fgColor: Colors.Blue, text: '>' }, spaceSpan);
    line += `${trim} > `;
  }

  const keys = removeKnownKeys(Object.keys(json));
  if (message) {
    spans.push({ fgColor: Colors.Magenta, text: `${message}` }, spaceSpan);
    line += `${message} `;

    if (keys.length) {
      spans.push({ fgColor: Colors.Magenta, text: `|` }, spaceSpan);
      line += '| ';
    }
  }

  keys.forEach((key, idx) => {
    const value = json[key];
    const isNotLastKey = idx !== keys.length - 1;
    spans.push(
      { fgColor: Colors.Blue, text: `${key}=` },
      {
        fgColor: key === 'error' ? Colors.Red : Colors.Magenta,
        text: value as string,
      }
    );
    if (isNotLastKey) spans.push(spaceSpan);
    line += `${key}=${value}${isNotLastKey ? ' ' : ''}`;
  });

  lines.push({ line, spans });

  if (stackTrace) {
    stackTrace.forEach(({ func, line: lineNumber, source }) => {
      const line = `    at ${func} (${source}:${lineNumber})`;
      const spans: Span[] = [
        spaceSpan,
        spaceSpan,
        spaceSpan,
        spaceSpan,
        { text: 'at ', fgColor: Colors.Grey },
        { text: func, fgColor: Colors.Red },
        { text: `(${source}:${lineNumber})`, fgColor: Colors.Grey },
      ];
      lines.push({ line, spans });
    });
  }

  return lines;
}
