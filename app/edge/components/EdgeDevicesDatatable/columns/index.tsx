import { useMemo } from 'react';

import { name } from './name';
import { state } from './state';

export function useColumns() {
  return useMemo(
    () => [
      name,
      state,
    ],
    []
  );
}
