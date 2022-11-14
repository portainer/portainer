import { useMemo } from 'react';

import { taskStatus } from './taskStatus';
import { taskName } from './taskName';
import { taskGroup } from './taskGroup';
import { allocationID } from './allocationID';
import { started } from './started';
import { actions } from './actions';

export function useColumns() {
  return useMemo(
    () => [taskStatus, taskName, taskGroup, allocationID, actions, started],
    []
  );
}
