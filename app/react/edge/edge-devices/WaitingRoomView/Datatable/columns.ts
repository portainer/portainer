import { CellProps, Column } from 'react-table';

import { WaitingRoomEnvironment } from '../types';

export const columns: readonly Column<WaitingRoomEnvironment>[] = [
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
  {
    Header: 'Edge Groups',
    accessor: (row) => row.EdgeGroups || [],
    Cell: ({ value }: CellProps<WaitingRoomEnvironment, string[]>) =>
      value.join(', ') || '-',
    id: 'edge-groups',
    disableFilters: true,
    Filter: () => null,
    canHide: false,
    sortType: 'string',
  },
  {
    Header: 'Group',
    accessor: (row) => row.Group || '-',
    id: 'group',
    disableFilters: true,
    Filter: () => null,
    canHide: false,
    sortType: 'string',
  },
  {
    Header: 'Tags',
    accessor: (row) => row.Tags || [],
    Cell: ({ value }: CellProps<WaitingRoomEnvironment, string[]>) =>
      value.join(', ') || '-',
    id: 'tags',
    disableFilters: true,
    Filter: () => null,
    canHide: false,
    sortType: 'string',
  },
] as const;
