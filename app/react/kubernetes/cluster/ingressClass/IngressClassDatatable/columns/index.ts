import { useMemo } from 'react';

import { availability } from './availability';
import { type } from './type';
import { name } from './name';

export function useColumns() {
  return useMemo(() => [name, type, availability], []);
}
