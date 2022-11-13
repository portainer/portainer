import { useMemo } from 'react';

import { name } from './name';
import { status } from './status';
import { created } from './created';
import { actions } from './actions';
import { namespace } from './namespace';

export function useColumns() {
  return useMemo(() => [name, status, namespace, actions, created], []);
}
