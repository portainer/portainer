import { Column } from 'react-table';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import { Profile } from '@/portainer/hostmanagement/fdo/model';

export const created: Column<Profile> = {
  Header: 'Created',
  accessor: 'dateCreated',
  id: 'created',
  Cell: ({ value }) => isoDateFromTimestamp(value),
  disableFilters: true,
  canHide: true,
  Filter: () => null,
};
