import { useMemo } from 'react';

import { name } from './name';
import { location } from './location';
import { ports } from './ports';
import { ownership } from './ownership';

export function useColumns() {
  return useMemo(() => [name, location, ports, ownership], []);
}
