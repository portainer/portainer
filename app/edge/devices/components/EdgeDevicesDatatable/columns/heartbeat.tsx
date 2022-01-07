import { Column } from 'react-table';
import {Environment, EnvironmentStatus} from "Portainer/environments/types";
import { DefaultFilter } from 'Portainer/components/datatables/components/Filter';
import clsx from "clsx";

export const heartbeat: Column<Environment> = {
  Header: 'Heartbeat',
  accessor: (row) => row.Status || '-',
  id: 'status',
  Cell: StatusCell,
  Filter: DefaultFilter,
  canHide: true,
};

function StatusCell({ value: status }: { value: EnvironmentStatus }) {
  return (
      <span className={clsx('label', `label-${environmentStatusBadge(status)}`)}>
      {status === EnvironmentStatus.Up ? 'up' : 'down'}
    </span>
  );

  // TODO mrydel use from component after home view is merged
  function environmentStatusBadge(status: EnvironmentStatus) {
    if (status === EnvironmentStatus.Down) {
      return 'danger';
    }
    return 'success';
  }
}