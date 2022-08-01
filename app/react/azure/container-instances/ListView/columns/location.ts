import { Column } from 'react-table';

import { ContainerGroup } from '@/react/azure/types';

export const location: Column<ContainerGroup> = {
  Header: 'Location',
  accessor: (container) => container.location,
  id: 'location',
  disableFilters: true,
  Filter: () => null,
  canHide: true,
  sortType: 'string',
};
