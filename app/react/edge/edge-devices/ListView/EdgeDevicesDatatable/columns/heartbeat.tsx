import { CellProps, Column } from 'react-table';

import { Environment } from '@/react/portainer/environments/types';

import { EdgeIndicator } from '@@/EdgeIndicator';

export const heartbeat: Column<Environment> = {
  Header: 'Heartbeat',
  accessor: 'Status',
  id: 'status',
  Cell: StatusCell,
  disableFilters: true,
  canHide: true,
};

export function StatusCell({
  row: { original: environment },
}: CellProps<Environment>) {
  return <EdgeIndicator environment={environment} />;
}
