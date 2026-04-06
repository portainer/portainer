import { createColumnHelper } from '@tanstack/react-table';
import { truncate } from 'lodash';

import i18n from '@/i18n';
import { Environment } from '@/react/portainer/environments/types';

export type DecoratedEnvironment = Environment & {
  Tags: string[];
  Group: string;
};

const columHelper = createColumnHelper<DecoratedEnvironment>();

export const columns = [
  columHelper.accessor('Name', {
    header: () => i18n.t('edge.components.columns.name'),
    id: 'Name',
    cell: ({ getValue }) => (
      <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
    ),
  }),
  columHelper.accessor('Group', {
    header: () => i18n.t('edge.components.columns.group'),
    id: 'Group',
    cell: ({ getValue }) => (
      <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
    ),
  }),
  columHelper.accessor((row) => row.Tags.join(','), {
    header: () => i18n.t('edge.components.columns.tags'),
    id: 'tags',
    enableSorting: false,
    cell: ({ getValue }) => (
      <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
    ),
  }),
];
