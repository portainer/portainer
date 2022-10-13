import { without } from 'lodash';

import { FormattedLine, Span, JSONLogs, TIMESTAMP_LENGTH } from './types';
import {
  formatCaller,
  formatKeyValuePair,
  formatLevel,
  formatMessage,
  formatStackTrace,
  formatTime,
} from './formatters';

function removeKnownKeys(keys: string[]) {
  return without(keys, 'time', 'level', 'caller', 'message', 'stack_trace');
}

function normalizeText(text: string) {
  let res = text;
  if (text.startsWith('"{')) {
    res = text.slice(1);
  }
  if (text.endsWith('}"')) {
    res = text.slice(0, -1);
  }
  if (text.startsWith('{\\"')) {
    res = JSON.parse(`"${text}"`);
  }
  return res;
}

export function formatJSONLine(
  rawText: string,
  withTimestamps?: boolean
): FormattedLine[] {
  const spans: Span[] = [];
  const lines: FormattedLine[] = [];
  let line = '';

  let text = withTimestamps ? rawText.substring(TIMESTAMP_LENGTH) : rawText;
  text = normalizeText(text);

  const json: JSONLogs = JSON.parse(text);
  const { time, level, caller, message, stack_trace: stackTrace } = json;
  const keys = removeKnownKeys(Object.keys(json));

  if (withTimestamps) {
    const timestamp = rawText.substring(0, TIMESTAMP_LENGTH);
    spans.push({ text: timestamp });
    line += `${timestamp}`;
  }
  line += formatTime(time, spans, line);
  line += formatLevel(level, spans, line);
  line += formatCaller(caller, spans, line);
  line += formatMessage(message, spans, line, !!keys.length);

  keys.forEach((key, idx) => {
    line += formatKeyValuePair(
      key,
      json[key],
      spans,
      line,
      idx === keys.length - 1
    );
  });

  lines.push({ line, spans });
  formatStackTrace(stackTrace, lines);

  return lines;
}
