import { Column } from 'react-table';

import { Environment } from '@/react/portainer/environments/types';

export const columns: readonly Column<Environment>[] = [
  {
    Header: 'Name',
    accessor: (row) => row.Name,
    id: 'name',
    disableFilters: true,
    Filter: () => null,
    canHide: false,
    sortType: 'string',
  },
  {
    Header: 'Edge ID',
    accessor: (row) => row.EdgeID,
    id: 'edge-id',
    disableFilters: true,
    Filter: () => null,
    canHide: false,
    sortType: 'string',
  },
] as const;
