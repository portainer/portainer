import _ from 'lodash';
import { useMemo } from 'react';

import { createOwnershipColumn } from '@/react/docker/components/datatable/createOwnershipColumn';
import { ContainerListViewModel } from '@/react/docker/containers/types';

import { created } from './created';
import { host } from './host';
import { image } from './image';
import { ip } from './ip';
import { name } from './name';
import { ports } from './ports';
import { quickActions } from './quick-actions';
import { stack } from './stack';
import { state } from './state';
import { gpus } from './gpus';

export function useColumns(
  isHostColumnVisible: boolean,
  isGPUsColumnVisible: boolean | undefined
) {
  return useMemo(
    () =>
      _.compact([
        name,
        state,
        quickActions,
        stack,
        image,
        created,
        ip,
        isHostColumnVisible && host,
        isGPUsColumnVisible && gpus,
        ports,
        createOwnershipColumn<ContainerListViewModel>(),
      ]),
    [isHostColumnVisible, isGPUsColumnVisible]
  );
}
