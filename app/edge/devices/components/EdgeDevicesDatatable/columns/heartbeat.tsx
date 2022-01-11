import { Column } from 'react-table';
import clsx from 'clsx';

import { Environment, EnvironmentStatus } from '@/portainer/environments/types';
import { DefaultFilter } from '@/portainer/components/datatables/components/Filter';

export const heartbeat: Column<Environment> = {
  Header: 'Heartbeat',
  accessor: (row) => (row.Status === EnvironmentStatus.Up ? 'up' : 'down'),
  id: 'status',
  Cell: StatusCell,
  Filter: DefaultFilter,
  canHide: true,
};

function StatusCell({ value: status }: { value: string }) {
  return (
    <span className={clsx('label', `label-${environmentStatusBadge(status)}`)}>
      {status}
    </span>
  );

  function environmentStatusBadge(status: string) {
    if (status === 'down') {
      return 'danger';
    }
    return 'success';
  }
}
