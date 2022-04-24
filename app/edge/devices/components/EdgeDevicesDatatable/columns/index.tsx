import { useMemo } from 'react';

import { name } from './name';
import { heartbeat } from './heartbeat';
import { edgeGroup } from './edgeGroup';
import { group } from './group';
import { actions } from './actions';

export function useColumns() {
  return useMemo(() => [name, heartbeat, edgeGroup, group, actions], []);
}
