import {CellProps, Column} from 'react-table';
import clsx from 'clsx';

import { Environment, EnvironmentStatus } from '@/portainer/environments/types';

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
  if (environment.EdgeID) {
    return (
        <span className="label label-default"><s>associated</s></span>
    )
  }

  return (
    <i className={clsx('fa', 'fa-heartbeat', environmentStatusLabel(environment.Status))} aria-hidden="true"/>
  )

  function environmentStatusLabel(status: EnvironmentStatus) {
    if (status === EnvironmentStatus.Up) {
      return 'green-icon';
    }
    return 'orange-icon';
  }
}
