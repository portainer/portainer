import { createColumnHelper } from '@tanstack/react-table';

import { Environment } from '@/react/portainer/environments/types';

const columnHelper = createColumnHelper<Environment>();

export const columns = [
  columnHelper.accessor('Name', {
    header: 'Name',
    id: 'name',
  }),
  columnHelper.accessor('EdgeID', {
    header: 'Edge ID',
    id: 'edge-id',
  }),
];
