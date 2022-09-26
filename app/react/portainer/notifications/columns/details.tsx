import { Column } from 'react-table';

import { ToastNotification } from '../types';

export const details: Column<ToastNotification> = {
  Header: 'Details',
  accessor: 'details',
  id: 'details',
  disableFilters: true,
  canHide: true,
};
