import { Column } from 'react-table';

import { isoDate } from '@/portainer/filters/filters';

import { ToastNotification } from '../types';

export const time: Column<ToastNotification> = {
  Header: 'Time',
  accessor: (row) => (row.timeStamp ? isoDate(row.timeStamp) : '-'),
  id: 'time',
  disableFilters: true,
  canHide: true,
};
