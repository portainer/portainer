import { createColumnHelper } from '@tanstack/react-table';

import { isoDate } from '@/portainer/filters/filters';
import { createOwnershipColumn } from '@/react/docker/components/datatable/createOwnershipColumn';

import { buildNameColumn } from '@@/datatables/buildNameColumn';

import { ConfigViewModel } from '../../model';

const columnHelper = createColumnHelper<ConfigViewModel>();

export const columns = [
  buildNameColumn<ConfigViewModel>(
    'Name',
    'docker.configs.config',
    'docker-configs-name'
  ),
  columnHelper.accessor('CreatedAt', {
    header: 'Creation Date',
    cell: ({ getValue }) => {
      const date = getValue();
      return <time dateTime={date}>{isoDate(date)}</time>;
    },
  }),
  createOwnershipColumn<ConfigViewModel>(),
];
