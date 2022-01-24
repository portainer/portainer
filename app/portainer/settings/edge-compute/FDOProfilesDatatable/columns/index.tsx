import { useMemo } from 'react';

import { created } from './created';
import { name } from './name';

export function useColumns() {
  return useMemo(() => [name, created], []);
}
