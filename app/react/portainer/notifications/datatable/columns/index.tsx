import { useMemo } from 'react';

import { type } from './type';
import { title } from './title';
import { details } from './details';
import { time } from './time';

export function useColumns() {
  return useMemo(() => [type, title, details, time], []);
}
