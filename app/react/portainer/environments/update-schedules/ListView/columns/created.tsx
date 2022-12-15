import { Column } from 'react-table';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { EdgeUpdateListItemResponse } from '../../queries/list';

export const created: Column<EdgeUpdateListItemResponse> = {
  Header: 'Created',
  accessor: (row) => isoDateFromTimestamp(row.created),
  disableFilters: true,
  Filter: () => null,
  canHide: false,
};
