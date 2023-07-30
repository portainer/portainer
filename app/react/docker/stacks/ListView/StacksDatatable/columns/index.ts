import _ from 'lodash';

import { StackType } from '@/react/common/stacks/types';

import { columnHelper } from './helper';
import { name } from './name';
import { imageNotificationColumn } from './image-notification';
import { control } from './control';

export function useColumns(isImageNotificationEnabled: boolean) {
  return _.compact([
    name,
    columnHelper.accessor(
      (item) => (item.Type === StackType.DockerCompose ? 'Compose' : 'Swarm'),
      {
        id: 'type',
        header: 'Type',
      }
    ),
    isImageNotificationEnabled && imageNotificationColumn,
    control,
  ]);
}
