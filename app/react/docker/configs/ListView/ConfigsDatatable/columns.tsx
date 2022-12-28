import { createColumnHelper } from '@tanstack/react-table';

import { isoDate } from '@/portainer/filters/filters';
import { createOwnershipColumn } from '@/react/docker/components/datatable-helpers/createOwnershipColumn';

import { buildNameColumn } from '@@/datatables/NameCell';

import { DockerConfig } from '../../types';

const columnHelper = createColumnHelper<DockerConfig>();

export const columns = [
  buildNameColumn<DockerConfig>('Name', 'Id', 'docker.configs.config'),
  columnHelper.accessor('CreatedAt', {
    header: 'Creation Date',
    cell: ({ getValue }) => {
      const date = getValue();
      return <time dateTime={date}>{isoDate(date)}</time>;
    },
  }),
  createOwnershipColumn<DockerConfig>(),
];
