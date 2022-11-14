import { useMemo } from 'react';

import { date } from './date';
import { type } from './type';
import { message } from './message';

export function useColumns() {
  return useMemo(() => [date, type, message], []);
}
