import { createColumnHelper } from '@tanstack/react-table';
import { truncate } from 'lodash';

import { Environment } from '@/react/portainer/environments/types';

export type DecoratedEnvironment = Environment & {
  Tags: string[];
  Group: string;
};

const columHelper = createColumnHelper<DecoratedEnvironment>();

export const columns = [
  columHelper.accessor('Name', {
    header: 'Name',
    id: 'Name',
    cell: ({ getValue }) => (
      <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
    ),
  }),
  columHelper.accessor('Group', {
    header: 'Group',
    id: 'Group',
    cell: ({ getValue }) => (
      <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
    ),
  }),
  columHelper.accessor((row) => row.Tags.join(','), {
    header: 'Tags',
    id: 'tags',
    enableSorting: false,
    cell: ({ getValue }) => (
      <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
    ),
  }),
];
