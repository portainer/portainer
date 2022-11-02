import {
  formatCaller,
  formatKeyValuePair,
  formatLevel,
  formatMessage,
  formatStackTrace,
  formatTime,
} from './formatters';
import {
  FormattedLine,
  JSONStackTrace,
  Level,
  Span,
  TIMESTAMP_LENGTH,
} from './types';

const dateRegex = /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}[AP]M) /; // "2022/02/01 04:30AM "
const levelRegex = /(\w{3}) /; // "INF " or "ERR "
const callerRegex = /(.+?.go:\d+) /; // "path/to/file.go:line "
const chevRegex = /> /; // "> "
const messageAndPairsRegex = /(.*)/; // include the rest of the string in a separate group

const keyRegex = /(\S+=)/g; // ""

export const ZerologRegex = concatRegex(
  dateRegex,
  levelRegex,
  callerRegex,
  chevRegex,
  messageAndPairsRegex
);

function concatRegex(...regs: RegExp[]) {
  const flags = Array.from(
    new Set(
      regs
        .map((r) => r.flags)
        .join('')
        .split('')
    )
  ).join('');
  const source = regs.map((r) => r.source).join('');
  return new RegExp(source, flags);
}

type Pair = {
  key: string;
  value: string;
};

export function formatZerologLogs(rawText: string, withTimestamps?: boolean) {
  const spans: Span[] = [];
  const lines: FormattedLine[] = [];
  let line = '';

  const text = withTimestamps ? rawText.substring(TIMESTAMP_LENGTH) : rawText;

  if (withTimestamps) {
    const timestamp = rawText.substring(0, TIMESTAMP_LENGTH);
    spans.push({ text: timestamp });
    line += `${timestamp} `;
  }

  const [, date, level, caller, messageAndPairs] =
    text.match(ZerologRegex) || [];

  const [message, pairs] = extractPairs(messageAndPairs);

  line += formatTime(date, spans, line);
  line += formatLevel(level as Level, spans, line);
  line += formatCaller(caller, spans, line);
  line += formatMessage(message, spans, line, !!pairs.length);

  let stackTrace: JSONStackTrace | undefined;
  const stackTraceIndex = pairs.findIndex((p) => p.key === 'stack_trace');

  if (stackTraceIndex !== -1) {
    stackTrace = JSON.parse(pairs[stackTraceIndex].value);
    pairs.splice(stackTraceIndex);
  }

  pairs.forEach(({ key, value }, idx) => {
    line += formatKeyValuePair(
      key,
      value,
      spans,
      line,
      idx === pairs.length - 1
    );
  });
  lines.push({ line, spans });

  formatStackTrace(stackTrace, lines);

  return lines;
}

function extractPairs(messageAndPairs: string): [string, Pair[]] {
  const pairs: Pair[] = [];
  let [message, rawPairs] = messageAndPairs.split('|');

  if (!messageAndPairs.includes('|') && !rawPairs) {
    rawPairs = message;
    message = '';
  }
  message = message.trim();
  rawPairs = rawPairs.trim();

  const matches = [...rawPairs.matchAll(keyRegex)];

  matches.forEach((m, idx) => {
    const rawKey = m[0];
    const key = rawKey.slice(0, -1);
    const start = m.index || 0;
    const end = idx !== matches.length - 1 ? matches[idx + 1].index : undefined;
    const value = (
      end
        ? rawPairs.slice(start + rawKey.length, end)
        : rawPairs.slice(start + rawKey.length)
    ).trim();
    pairs.push({ key, value });
  });

  return [message, pairs];
}
