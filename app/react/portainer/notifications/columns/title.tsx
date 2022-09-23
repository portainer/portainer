import { Column } from 'react-table';

import { ToastNotification } from '../types';

export const title: Column<ToastNotification> = {
  Header: 'Title',
  accessor: 'title',
  id: 'title',
  disableFilters: true,
  canHide: true,
};
