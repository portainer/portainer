import { useMemo } from 'react';

import { hostname } from './hostname';
import { status } from './status';
import { powerState } from './power-state';
import { actions } from './actions';

export function useColumns() {
  return useMemo(() => [hostname, status, powerState, actions], []);
}
