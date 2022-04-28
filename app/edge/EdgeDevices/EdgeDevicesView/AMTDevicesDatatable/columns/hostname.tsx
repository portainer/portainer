import { Column } from 'react-table';

import { Device } from '@/portainer/hostmanagement/open-amt/model';

export const hostname: Column<Device> = {
  Header: 'Hostname',
  accessor: (row) => row.hostname || '-',
  id: 'hostname',
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
};
