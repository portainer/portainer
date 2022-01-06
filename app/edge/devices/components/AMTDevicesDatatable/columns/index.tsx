import { useMemo } from 'react';

import { hostname } from './hostname';
import { status } from './status';
import { powerState } from './power-state';

export function useColumns() {
  return useMemo(
    () => [
      hostname,
        status,
        powerState,
    ],
    []
  );
}
