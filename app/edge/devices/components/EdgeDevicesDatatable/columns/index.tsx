import { useMemo } from 'react';

import { name } from './name';
import { heartbeat } from './heartbeat';

export function useColumns() {
  return useMemo(
    () => [
      name,
        heartbeat,
    ],
    []
  );
}
