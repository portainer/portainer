import { useMemo } from 'react';
import _ from 'lodash';

import { actions } from './actions';
import { node } from './node';
import { slot } from './slot';
import { status } from './status';
import { task } from './task';
import { updated } from './updated';

export function useColumns(isSlotColumnsVisible = true) {
  return useMemo(
    () =>
      _.compact([
        status,
        task,
        actions,
        isSlotColumnsVisible && slot,
        node,
        updated,
      ]),
    [isSlotColumnsVisible]
  );
}
