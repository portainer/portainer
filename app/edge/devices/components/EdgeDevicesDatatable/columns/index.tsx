import { useMemo } from 'react';

import { name } from './name';
import { status } from './status';

export function useColumns() {
  return useMemo(
    () => [
      name,
      status,
    ],
    []
  );
}
