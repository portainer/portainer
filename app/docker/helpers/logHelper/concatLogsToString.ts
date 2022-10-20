import { NEW_LINE_BREAKER } from '@/constants';

import { FormattedLine } from './types';

type FormatFunc = (line: FormattedLine) => string;

export function concatLogsToString(
  logs: FormattedLine[],
  formatFunc: FormatFunc = (line) => line.line
) {
  return logs.reduce(
    (acc, formattedLine) => acc + formatFunc(formattedLine) + NEW_LINE_BREAKER,
    ''
  );
}
