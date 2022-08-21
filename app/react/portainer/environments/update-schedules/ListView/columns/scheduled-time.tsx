import { Column } from 'react-table';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { EdgeUpdateSchedule } from '../../types';

export const scheduledTime: Column<EdgeUpdateSchedule> = {
  Header: 'Scheduled Time & Date',
  accessor: (row) => isoDateFromTimestamp(row.time),
  disableFilters: true,
  Filter: () => null,
  canHide: false,
};
