import _ from 'lodash';

import { StackType } from '@/react/common/stacks/types';
import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import { createOwnershipColumn } from '@/react/docker/components/datatable/createOwnershipColumn';

import { DecoratedStack } from '../types';

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
        enableHiding: false,
      }
    ),
    isImageNotificationEnabled && imageNotificationColumn,
    control,
    columnHelper.accessor('CreationDate', {
      id: 'creationDate',
      header: 'Created',
      enableHiding: false,
      cell: ({ getValue, row: { original: item } }) => {
        const value = getValue();
        if (!value) {
          return '-';
        }

        const by = item.CreatedBy ? `by ${item.CreatedBy}` : '';
        return `${isoDateFromTimestamp(value)} ${by}`.trim();
      },
    }),
    columnHelper.accessor('UpdateDate', {
      id: 'updateDate',
      header: 'Updated',
      cell: ({ getValue, row: { original: item } }) => {
        const value = getValue();
        if (!value) {
          return '-';
        }

        const by = item.UpdatedBy ? `by ${item.UpdatedBy}` : '';
        return `${isoDateFromTimestamp(value)} ${by}`.trim();
      },
    }),
    createOwnershipColumn<DecoratedStack>(false),
  ]);
}
