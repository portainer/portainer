import { useMemo } from 'react';

import { created } from './created';
import { host } from './host';
import { image } from './image';
import { ip } from './ip';
import { name } from './name';
import { ownership } from './ownership';
import { ports } from './ports';
import { quickActions } from './quick-actions';
import { stack } from './stack';
import { state } from './state';

export function useColumns() {
  return useMemo(
    () => [
      name,
      state,
      quickActions,
      stack,
      image,
      created,
      ip,
      host,
      ports,
      ownership,
    ],
    []
  );
}
