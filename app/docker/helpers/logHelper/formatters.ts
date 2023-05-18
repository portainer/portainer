import { format } from 'date-fns';
import { takeRight } from 'lodash';

import { Span, Level, Colors, JSONStackTrace, FormattedLine } from './types';

const spaceSpan: Span = { text: ' ' };

function logLevelToSpan(level: Level): Span {
  switch (level) {
    case 'debug':
    case 'DBG':
      return {
        fgColor: Colors.Grey,
        text: 'DBG',
        fontWeight: 'bold',
      };
    case 'info':
    case 'INF':
      return {
        fgColor: Colors.Green,
        text: 'INF',
        fontWeight: 'bold',
      };
    case 'warn':
    case 'WRN':
      return {
        fgColor: Colors.Yellow,
        text: 'WRN',
        fontWeight: 'bold',
      };
    case 'error':
    case 'ERR':
      return {
        fgColor: Colors.Red,
        text: 'ERR',
        fontWeight: 'bold',
      };
    default:
      return { text: level };
  }
}

export function formatTime(
  time: number | string | undefined,
  spans: Span[],
  line: string
) {
  let nl = line;
  if (time) {
    let date = '';
    if (typeof time === 'number') {
      // time is a number, so it is the number of seconds OR milliseconds since Unix Epoch (1970-01-01T00:00:00.000Z)
      // we need to know if time's unit is second or millisecond
      // 253402214400 is the numer of seconds between Unix Epoch and 9999-12-31T00:00:00.000Z
      // if time is greater than 253402214400, then time unit cannot be second, so it is millisecond
      const timestampInMilliseconds = time > 253402214400 ? time : time * 1000;
      date = format(new Date(timestampInMilliseconds), 'Y/MM/dd hh:mmaa');
    } else {
      date = time;
    }
    spans.push({ fgColor: Colors.Grey, text: date }, spaceSpan);
    nl += `${date} `;
  }
  return nl;
}

export function formatLevel(
  level: Level | undefined,
  spans: Span[],
  line: string
) {
  let nl = line;
  if (level) {
    const levelSpan = logLevelToSpan(level);
    spans.push(levelSpan, spaceSpan);
    nl += `${levelSpan.text} `;
  }
  return nl;
}

export function formatCaller(
  caller: string | undefined,
  spans: Span[],
  line: string
) {
  let nl = line;
  if (caller) {
    const trim = takeRight(caller.split('/'), 2).join('/');
    spans.push(
      { fgColor: Colors.Magenta, text: trim, fontWeight: 'bold' },
      spaceSpan
    );
    spans.push({ fgColor: Colors.Blue, text: '>' }, spaceSpan);
    nl += `${trim} > `;
  }
  return nl;
}

export function formatMessage(
  message: string,
  spans: Span[],
  line: string,
  hasKeys: boolean
) {
  let nl = line;
  if (message) {
    spans.push({ fgColor: Colors.Magenta, text: `${message}` }, spaceSpan);
    nl += `${message} `;

    if (hasKeys) {
      spans.push({ fgColor: Colors.Magenta, text: `|` }, spaceSpan);
      nl += '| ';
    }
  }
  return nl;
}

export function formatKeyValuePair(
  key: string,
  value: unknown,
  spans: Span[],
  line: string,
  isLastKey: boolean
) {
  let nl = line;

  const strValue = typeof value !== 'string' ? JSON.stringify(value) : value;

  spans.push(
    { fgColor: Colors.Blue, text: `${key}=` },
    {
      fgColor: key === 'error' || key === 'ERR' ? Colors.Red : Colors.Magenta,
      text: strValue,
    }
  );
  if (!isLastKey) spans.push(spaceSpan);
  nl += `${key}=${strValue}${!isLastKey ? ' ' : ''}`;

  return nl;
}

export function formatStackTrace(
  stackTrace: JSONStackTrace | undefined,
  lines: FormattedLine[]
) {
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
}
