import { Column } from 'react-table';

import { EdgeUpdateListItemResponse } from '../../queries/list';

export const scheduledTime: Column<EdgeUpdateListItemResponse> = {
  Header: 'Scheduled Time & Date',
  accessor: (row) => row.scheduledTime,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
};
