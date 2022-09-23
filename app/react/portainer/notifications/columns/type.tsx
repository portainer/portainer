import { Column } from 'react-table';

import { ToastNotification } from '../types';

export const type: Column<ToastNotification> = {
  Header: 'Type',
  accessor: (row) => row.type.charAt(0).toUpperCase() + row.type.slice(1),
  id: 'type',
  disableFilters: true,
  canHide: true,
};
